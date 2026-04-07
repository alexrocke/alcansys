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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify webhook secret if configured
    const webhookSecret = req.headers.get("x-webhook-secret");
    const configuredSecret = Deno.env.get("WEBHOOK_SECRET");
    if (configuredSecret && webhookSecret !== configuredSecret) {
      console.warn("Webhook rejected: invalid or missing x-webhook-secret header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("Webhook received:", JSON.stringify(payload).slice(0, 500));

    // Extract instance info from UAZAP payload
    const instanceName = payload.instanceName || payload.instance_name || payload.instance || null;
    const phoneReceiver = payload.to || payload.phone || payload.number || null;
    const phoneSender = payload.from || payload.sender || null;

    // Find matching relay configs by instance_name OR phone_number
    let query = supabase
      .from("webhook_relay_configs")
      .select("*")
      .eq("ativo", true);

    const { data: allConfigs, error: configError } = await query;
    if (configError) {
      console.error("Error fetching relay configs:", configError);
      throw configError;
    }

    // Match by instance_name or phone_number
    const matchedConfigs = (allConfigs || []).filter((config) => {
      if (config.instance_name && instanceName && config.instance_name === instanceName) {
        return true;
      }
      if (config.phone_number) {
        const normalizedConfigPhone = config.phone_number.replace(/\D/g, "");
        if (phoneReceiver && phoneReceiver.replace(/\D/g, "").includes(normalizedConfigPhone)) {
          return true;
        }
        if (phoneSender && phoneSender.replace(/\D/g, "").includes(normalizedConfigPhone)) {
          return true;
        }
      }
      return false;
    });

    console.log(`Found ${matchedConfigs.length} matching relay config(s) for instance=${instanceName}, phone=${phoneReceiver || phoneSender}`);

    // Relay to all matched endpoints
    const relayResults = await Promise.allSettled(
      matchedConfigs.map(async (config) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Add relay secret if configured
        if (config.relay_secret) {
          headers["x-relay-secret"] = config.relay_secret;
        }

        // Add custom headers
        if (config.relay_headers && typeof config.relay_headers === "object") {
          Object.entries(config.relay_headers as Record<string, string>).forEach(([k, v]) => {
            headers[k] = v;
          });
        }

        console.log(`Relaying to ${config.relay_url} (config: ${config.descricao || config.id})`);

        const response = await fetch(config.relay_url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const status = response.status;
        const body = await response.text().catch(() => "");
        console.log(`Relay response from ${config.relay_url}: ${status} - ${body.slice(0, 200)}`);

        return { config_id: config.id, status, ok: response.ok };
      })
    );

    // Also store the message locally if it's an incoming message
    if (payload.event === "messages.upsert" || payload.message || payload.text) {
      // Try to find the whatsapp_instance by instance_name
      if (instanceName) {
        const { data: instance } = await supabase
          .from("whatsapp_instances")
          .select("id, company_id, channel_id")
          .eq("instance_name", instanceName)
          .maybeSingle();

        if (instance) {
          const messageContent = payload.message?.conversation || 
                                 payload.message?.extendedTextMessage?.text ||
                                 payload.text || 
                                 payload.body || 
                                 "";
          const senderPhone = phoneSender?.replace(/\D/g, "") || "";
          const senderName = payload.pushName || payload.senderName || senderPhone;

          if (messageContent) {
            // Find or create conversation
            let { data: conversation } = await supabase
              .from("conversations")
              .select("id")
              .eq("instance_id", instance.id)
              .eq("contato_telefone", senderPhone)
              .in("status", ["aberta", "em_atendimento", "aguardando"])
              .maybeSingle();

            if (!conversation) {
              const { data: newConv } = await supabase
                .from("conversations")
                .insert({
                  company_id: instance.company_id,
                  channel_id: instance.channel_id,
                  instance_id: instance.id,
                  contato_nome: senderName,
                  contato_telefone: senderPhone,
                  status: "aberta",
                  atendente_tipo: "ia",
                  ultima_mensagem: messageContent,
                  ultima_mensagem_at: new Date().toISOString(),
                })
                .select("id")
                .single();
              conversation = newConv;
            } else {
              await supabase
                .from("conversations")
                .update({
                  ultima_mensagem: messageContent,
                  ultima_mensagem_at: new Date().toISOString(),
                  mensagens_count: undefined, // Will use trigger if available
                })
                .eq("id", conversation.id);
            }

            if (conversation) {
              await supabase.from("messages").insert({
                company_id: instance.company_id,
                conversation_id: conversation.id,
                content: messageContent,
                direction: "incoming",
                sender_type: "humano",
              });
            }
          }

          // Update instance stats
          await supabase
            .from("whatsapp_instances")
            .update({
              messages_received: instance.id ? undefined : 0, // increment via trigger if available
              last_sync: new Date().toISOString(),
            })
            .eq("id", instance.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        relayed: matchedConfigs.length,
        results: relayResults.map((r) =>
          r.status === "fulfilled" ? r.value : { error: (r as PromiseRejectedResult).reason?.message }
        ),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
