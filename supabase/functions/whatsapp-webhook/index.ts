import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

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

    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const body = await req.json().catch(() => ({}));

    console.log("Webhook received:", JSON.stringify(body).slice(0, 500), "user_id:", userId);

    // ── Per-user connection status updates (WhatsApi.my) ──
    if (userId) {
      const isConnected =
        body.event === "connection" ||
        body.status === "CONNECTED" ||
        body.connected === true;

      const isDisconnected =
        body.event === "disconnected" ||
        body.status === "DISCONNECTED" ||
        body.connected === false;

      if (isConnected) {
        await adminClient
          .from("whatsapp_instances")
          .update({
            status: "connected",
            is_connected: true,
            last_connection_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        console.log("Instance connected for user:", userId);
      } else if (isDisconnected) {
        await adminClient
          .from("whatsapp_instances")
          .update({ status: "disconnected", is_connected: false })
          .eq("user_id", userId);
        console.log("Instance disconnected for user:", userId);
      }
    }

    // ── Relay + message processing (company-level instances) ──
    const instanceName = body.instanceName || body.instance_name || body.instance || null;
    const phoneReceiver = body.to || body.phone || body.number || null;
    const phoneSender = body.from || body.sender || null;

    // Find matching relay configs
    const { data: allConfigs } = await adminClient
      .from("webhook_relay_configs")
      .select("*")
      .eq("ativo", true);

    const matchedConfigs = (allConfigs || []).filter((config) => {
      if (config.instance_name && instanceName && config.instance_name === instanceName) return true;
      if (config.phone_number) {
        const norm = config.phone_number.replace(/\D/g, "");
        if (phoneReceiver && phoneReceiver.replace(/\D/g, "").includes(norm)) return true;
        if (phoneSender && phoneSender.replace(/\D/g, "").includes(norm)) return true;
      }
      return false;
    });

    // Relay to matched endpoints
    const relayResults = await Promise.allSettled(
      matchedConfigs.map(async (config) => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (config.relay_secret) headers["x-relay-secret"] = config.relay_secret;
        if (config.relay_headers && typeof config.relay_headers === "object") {
          Object.entries(config.relay_headers as Record<string, string>).forEach(([k, v]) => {
            headers[k] = v;
          });
        }
        const response = await fetch(config.relay_url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        const text = await response.text().catch(() => "");
        return { config_id: config.id, status: response.status, ok: response.ok };
      })
    );

    // Store incoming messages locally
    if (body.event === "messages.upsert" || body.message || body.text) {
      if (instanceName) {
        const { data: instance } = await adminClient
          .from("whatsapp_instances")
          .select("id, company_id, channel_id")
          .eq("instance_name", instanceName)
          .maybeSingle();

        if (instance) {
          const messageContent =
            body.message?.conversation ||
            body.message?.extendedTextMessage?.text ||
            body.text ||
            body.body ||
            "";
          const senderPhone = phoneSender?.replace(/\D/g, "") || "";
          const senderName = body.pushName || body.senderName || senderPhone;

          if (messageContent) {
            let { data: conversation } = await adminClient
              .from("conversations")
              .select("id")
              .eq("instance_id", instance.id)
              .eq("contato_telefone", senderPhone)
              .in("status", ["aberta", "em_atendimento", "aguardando"])
              .maybeSingle();

            if (!conversation) {
              const { data: newConv } = await adminClient
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
              await adminClient
                .from("conversations")
                .update({
                  ultima_mensagem: messageContent,
                  ultima_mensagem_at: new Date().toISOString(),
                })
                .eq("id", conversation.id);
            }

            if (conversation) {
              await adminClient.from("messages").insert({
                company_id: instance.company_id,
                conversation_id: conversation.id,
                content: messageContent,
                direction: "incoming",
                sender_type: "humano",
              });
            }
          }

          await adminClient
            .from("whatsapp_instances")
            .update({ last_sync: new Date().toISOString() })
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
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
