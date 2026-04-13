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
    const UAZAP_API_TOKEN = Deno.env.get("UAZAP_API_TOKEN");
    if (!UAZAP_API_TOKEN) {
      throw new Error("UAZAP_API_TOKEN is not configured");
    }

    const UAZAP_API_URL = Deno.env.get("UAZAP_API_URL") || "https://ipazua.uazapi.com";

    // Validate auth
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, instance_name, instance_id, company_id } = body;

    // Validate action
    const validActions = ["create-instance", "connect-instance", "get-qrcode", "get-status", "restart", "set-webhook", "register-instance"];
    if (!action || !validActions.includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate input lengths
    if (instance_name && (typeof instance_name !== "string" || instance_name.length > 100)) {
      return new Response(JSON.stringify({ error: "Invalid instance_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user belongs to company
    if (company_id) {
      const { data: belongs } = await supabase.rpc("user_belongs_to_company", {
        _user_id: user.id,
        _company_id: company_id,
      });
      
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!belongs && !isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let result;

    switch (action) {
      case "create-instance": {
        if (!instance_name) {
          return new Response(JSON.stringify({ error: "instance_name is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const CREATE_URL = Deno.env.get("WHATSAPI_CREATE_URL");
        const WHATSAPI_TOKEN = Deno.env.get("WHATSAPI_TOKEN");
        if (!CREATE_URL || !WHATSAPI_TOKEN) {
          throw new Error("WHATSAPI_CREATE_URL or WHATSAPI_TOKEN not configured");
        }
        const response = await fetch(CREATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: WHATSAPI_TOKEN,
            name: instance_name,
            deviceName: "Scalefy",
            systemName: "Scalefy",
            system_name: "Scalefy",
            system: "Scalefy",
            profileName: "Scalefy",
            browser: "chrome",
            fingerprintProfile: "chrome",
          }),
        });
        result = await response.json();
        console.log("UAZAP create-instance response:", JSON.stringify(result).slice(0, 500));
        if (!response.ok) {
          throw new Error(`UAZAP create-instance failed [${response.status}]: ${JSON.stringify(result)}`);
        }
        break;
      }

      case "connect-instance": {
        const instanceToken = body.instance_token || UAZAP_API_TOKEN;
        const targetInstance = instance_id || instance_name;
        if (!targetInstance) {
          return new Response(JSON.stringify({ error: "instance_id or instance_name is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const response = await fetch(`${UAZAP_API_URL}/instance/connect`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": instanceToken,
          },
          body: JSON.stringify({ instanceName: targetInstance }),
        });
        result = await response.json();
        console.log("UAZAP connect-instance response:", JSON.stringify(result));
        if (!response.ok) {
          throw new Error(`UAZAP connect failed [${response.status}]: ${JSON.stringify(result)}`);
        }
        break;
      }

      case "get-qrcode": {
        const instanceToken = body.instance_token || UAZAP_API_TOKEN;
        if (!instance_id) {
          return new Response(JSON.stringify({ error: "instance_id is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const response = await fetch(`${UAZAP_API_URL}/instance/qrcode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": instanceToken,
          },
          body: JSON.stringify({ instanceName: instance_id }),
        });
        result = await response.json();
        console.log("UAZAP get-qrcode response:", JSON.stringify(result));
        if (!response.ok) {
          throw new Error(`UAZAP get-qrcode failed [${response.status}]: ${JSON.stringify(result)}`);
        }
        break;
      }

      case "get-status": {
        const instanceToken = body.instance_token || UAZAP_API_TOKEN;
        if (!instance_id) {
          return new Response(JSON.stringify({ error: "instance_id is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const response = await fetch(`${UAZAP_API_URL}/instance/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": instanceToken,
          },
          body: JSON.stringify({ instanceName: instance_id }),
        });
        result = await response.json();
        console.log("UAZAP get-status response:", JSON.stringify(result));
        if (!response.ok) {
          throw new Error(`UAZAP get-status failed [${response.status}]: ${JSON.stringify(result)}`);
        }
        break;
      }

      case "restart": {
        const instanceToken = body.instance_token || UAZAP_API_TOKEN;
        if (!instance_id) {
          return new Response(JSON.stringify({ error: "instance_id is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const response = await fetch(`${UAZAP_API_URL}/instance/restart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": instanceToken,
          },
          body: JSON.stringify({ instanceName: instance_id }),
        });
        result = await response.json();
        if (!response.ok) {
          throw new Error(`UAZAP restart failed [${response.status}]: ${JSON.stringify(result)}`);
        }
        break;
      }

      case "register-instance": {
        if (!instance_name || !company_id) {
          return new Response(JSON.stringify({ error: "instance_name and company_id are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let channelId = body.channel_id as string | undefined;

        if (!channelId) {
          const { data: channel } = await supabase
            .from("channels")
            .select("id")
            .eq("company_id", company_id)
            .eq("tipo", "whatsapp")
            .limit(1)
            .maybeSingle();

          channelId = channel?.id;

          if (!channelId) {
            const { data: newChannel, error: channelError } = await supabase
              .from("channels")
              .insert({
                company_id,
                nome: `WhatsApp - ${instance_name}`,
                tipo: "whatsapp",
                status: "connected",
                ativo: true,
              })
              .select("id")
              .single();

            if (channelError || !newChannel) {
              throw new Error(channelError?.message || "Failed to create channel");
            }

            channelId = newChannel.id;
          }
        }

        const { data: newInstance, error: instanceError } = await supabase
          .from("whatsapp_instances")
          .insert({
            company_id,
            channel_id: channelId,
            user_id: user.id,
            instance_name,
            uazap_instance_id: body.instance_id || instance_name,
            status: "connected",
            is_connected: true,
            phone_number: body.phone_number || null,
            last_connection_at: new Date().toISOString(),
          })
          .select("id, instance_name, phone_number, status, is_connected")
          .single();

        if (instanceError || !newInstance) {
          throw new Error(instanceError?.message || "Failed to create instance");
        }

        await supabase
          .from("whatsapp_instance_secrets")
          .upsert({
            instance_id: newInstance.id,
            token: Deno.env.get("WHATSAPI_TOKEN") || UAZAP_API_TOKEN,
            instance_token: body.instance_token || null,
          }, { onConflict: "instance_id" });

        result = { instance: newInstance };
        break;
      }

      case "set-webhook": {
        const instanceToken = body.instance_token || UAZAP_API_TOKEN;
        const webhookUrl = body.webhook_url;
        if (!webhookUrl) {
          return new Response(JSON.stringify({ error: "webhook_url is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Validate webhook_url is a valid URL
        try {
          new URL(webhookUrl);
        } catch {
          return new Response(JSON.stringify({ error: "Invalid webhook_url" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const response = await fetch(`${UAZAP_API_URL}/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": instanceToken,
          },
          body: JSON.stringify({
            webhookURL: webhookUrl,
            addUrlEvents: true,
            addUrlTypesMessages: true,
            events: ["messages"],
            exclude: ["wasSentByApi", "isGroupYes"],
          }),
        });
        result = await response.json();
        console.log("UAZAP set-webhook response:", JSON.stringify(result));
        if (!response.ok) {
          throw new Error(`UAZAP set-webhook failed [${response.status}]: ${JSON.stringify(result)}`);
        }
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("UAZAP proxy error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
