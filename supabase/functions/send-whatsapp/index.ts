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

  try {
    const UAZAP_API_URL = Deno.env.get("UAZAP_API_URL") || "https://free.uazapi.com";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { instance_id, phone, message } = await req.json();

    if (!instance_id || !phone || !message) {
      return new Response(JSON.stringify({ error: "instance_id, phone, and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get instance details
    const { data: instance, error: instanceError } = await supabase
      .from("whatsapp_instances")
      .select("instance_name, api_token, company_id")
      .eq("id", instance_id)
      .single();

    if (instanceError || !instance) {
      return new Response(JSON.stringify({ error: "Instance not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user access
    const { data: belongs } = await supabase.rpc("user_belongs_to_company", {
      _user_id: userId,
      _company_id: instance.company_id,
    });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!belongs && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via UAZAP API
    const instanceToken = instance.api_token || Deno.env.get("UAZAP_API_TOKEN")!;
    
    // Format phone: remove non-digits, ensure @s.whatsapp.net
    const cleanPhone = phone.replace(/\D/g, "");
    const chatId = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

    const response = await fetch(`${UAZAP_API_URL}/message/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": instanceToken,
      },
      body: JSON.stringify({
        phone: chatId,
        message: message,
      }),
    });

    const result = await response.json();
    console.log("UAZAP send-text response:", JSON.stringify(result));

    if (!response.ok) {
      throw new Error(`UAZAP send failed [${response.status}]: ${JSON.stringify(result)}`);
    }

    // Update message count
    await supabase
      .from("whatsapp_instances")
      .update({ messages_sent: instance.messages_sent + 1 || 1 })
      .eq("id", instance_id);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("send-whatsapp error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
