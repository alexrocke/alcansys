import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { instance_id, phone, message } = body;

    if (!instance_id || !phone || !message) {
      return json({ error: "instance_id, phone, and message are required" }, 400);
    }
    if (typeof message !== "string" || message.length > 10000) {
      return json({ error: "Message too long (max 10000 chars)" }, 400);
    }
    if (typeof phone !== "string" || phone.length > 30) {
      return json({ error: "Invalid phone number" }, 400);
    }

    // Get instance details (non-sensitive fields)
    const { data: instance, error: instanceError } = await adminClient
      .from("whatsapp_instances")
      .select("instance_name, server_url, company_id, messages_sent")
      .eq("id", instance_id)
      .single();

    if (instanceError || !instance) return json({ error: "Instance not found" }, 404);

    // Get sensitive token from secrets table
    const { data: secrets } = await adminClient
      .from("whatsapp_instance_secrets")
      .select("instance_token")
      .eq("instance_id", instance_id)
      .single();

    if (instanceError || !instance) return json({ error: "Instance not found" }, 404);

    // Verify user access
    const { data: belongs } = await adminClient.rpc("user_belongs_to_company", {
      _user_id: user.id,
      _company_id: instance.company_id,
    });
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!belongs && !isAdmin) return json({ error: "Forbidden" }, 403);

    // Send via WhatsApi.my API
    const cleanPhone = phone.replace(/\D/g, "");
    const chatId = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

    const instanceToken = secrets?.instance_token || Deno.env.get("WHATSAPI_TOKEN")!;
    const serverUrl = instance.server_url;

    if (!serverUrl || !instanceToken) {
      return json({ error: "Instance not properly configured" }, 500);
    }

    const response = await fetch(`${serverUrl}/message/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": instanceToken,
      },
      body: JSON.stringify({ phone: chatId, message }),
    });

    const result = await response.json();
    console.log("WhatsApi send-text response:", JSON.stringify(result).slice(0, 300));

    if (!response.ok) {
      throw new Error(`WhatsApi send failed [${response.status}]`);
    }

    // Update message count
    await adminClient
      .from("whatsapp_instances")
      .update({ messages_sent: (instance.messages_sent || 0) + 1 })
      .eq("id", instance_id);

    return json({ success: true, result });
  } catch (error: unknown) {
    console.error("send-whatsapp error:", error);
    return json({ error: "Failed to send message" }, 500);
  }
});
