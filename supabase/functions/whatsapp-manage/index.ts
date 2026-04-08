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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const whatsapiToken = Deno.env.get("WHATSAPI_TOKEN");
    const createInstanceUrl = Deno.env.get("WHATSAPI_CREATE_URL");

    if (!whatsapiToken || !createInstanceUrl) {
      return json({ error: "WhatsApi secrets not configured" }, 500);
    }

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization" }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return json({ error: "Token inválido" }, 401);
    }
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const validActions = ["get-or-create", "qrcode", "disconnect", "delete"];
    if (!action || !validActions.includes(action)) {
      return json({ error: "Ação inválida. Use: " + validActions.join(", ") }, 400);
    }

    // ── GET-OR-CREATE ──
    if (action === "get-or-create") {
      const { data: existing } = await adminClient
        .from("whatsapp_instances")
        .select("id, instance_name, device_name, server_url, status, is_connected, phone_number, webhook_url, last_connection_at, created_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        return json({ instance: existing, is_new: false });
      }

      // Create new instance via WhatsApi create-instance-url endpoint
      const instanceName = `whatsapi-${userId.substring(0, 8)}`;
      const createPayload = {
        token: whatsapiToken,
        name: instanceName,
        deviceName: "Alcansys",
        systemName: "Alcansys",
        system_name: "Alcansys",
        system: "Alcansys",
        profileName: "Alcansys",
        browser: "chrome",
        fingerprintProfile: "chrome",
      };

      console.log("Creating WhatsApi instance:", instanceName);
      const createRes = await fetch(createInstanceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });

      const createJson = await createRes.json();
      console.log("WhatsApi create response:", JSON.stringify(createJson).slice(0, 500));

      if (!createRes.ok) {
        const errMsg = createRes.status === 401 ? "Token da API inválido" :
          createRes.status === 403 ? "Saldo insuficiente na API" :
          `Erro ao criar instância [${createRes.status}]`;
        return json({ error: errMsg }, createRes.status >= 500 ? 502 : createRes.status);
      }

      const serverUrl = createJson.server_url;
      const instanceToken = createJson["Instance Token"] || createJson.instance_token;
      const generalToken = createJson.token;

      if (!serverUrl || !instanceToken) {
        console.error("Missing server_url or instance token in response:", createJson);
        return json({ error: "Resposta inválida da API WhatsApi" }, 502);
      }

      // Register webhook automatically
      const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook?user_id=${userId}`;
      try {
        const webhookRes = await fetch(`${serverUrl}/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": instanceToken,
          },
          body: JSON.stringify({
            url: webhookUrl,
            enabled: true,
            active: true,
            byApi: true,
            addUrlEvents: true,
            addUrlTypesMessages: true,
            excludeMessages: ["wasSentByApi", "isGroupYes"],
            events: [
              "connection", "messages", "messages_update", "presence",
              "call", "contacts", "groups", "labels", "chats",
              "chat_labels", "blocks", "leads", "history", "sender",
            ],
          }),
        });
        const webhookJson = await webhookRes.json().catch(() => ({}));
        console.log("Webhook registration:", webhookRes.status, JSON.stringify(webhookJson).slice(0, 200));
      } catch (e) {
        console.error("Webhook registration failed (continuing):", e);
      }

      // Save to database - find or create a default channel for this user's company
      // First get user's company
      const { data: membership } = await adminClient
        .from("memberships")
        .select("company_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      const companyId = membership?.company_id;
      if (!companyId) {
        return json({ error: "Usuário sem empresa vinculada" }, 400);
      }

      // Find or create default channel
      let { data: channel } = await adminClient
        .from("channels")
        .select("id")
        .eq("company_id", companyId)
        .eq("tipo", "whatsapp")
        .limit(1)
        .maybeSingle();

      if (!channel) {
        const { data: newChannel } = await adminClient
          .from("channels")
          .insert({
            company_id: companyId,
            nome: "WhatsApp Principal",
            tipo: "whatsapp",
            status: "active",
            ativo: true,
          })
          .select("id")
          .single();
        channel = newChannel;
      }

      const { data: newInstance, error: insertError } = await adminClient
        .from("whatsapp_instances")
        .insert({
          user_id: userId,
          company_id: companyId,
          channel_id: channel!.id,
          instance_name: instanceName,
          device_name: "Alcansys",
          server_url: serverUrl,
          webhook_url: webhookUrl,
          status: "disconnected",
          is_connected: false,
        })
        .select("id, instance_name, device_name, server_url, status, is_connected, phone_number, webhook_url, last_connection_at, created_at")
        .single();

      if (insertError) {
        console.error("DB insert error:", insertError);
        return json({ error: "Erro ao salvar instância" }, 500);
      }

      // Store sensitive tokens in separate secrets table
      await adminClient
        .from("whatsapp_instance_secrets")
        .insert({
          instance_id: newInstance!.id,
          token: generalToken || whatsapiToken,
          instance_token: instanceToken,
        });

      return json({ instance: newInstance, is_new: true });
    }

    // ── QRCODE ──
    if (action === "qrcode") {
      const { data: inst } = await adminClient
        .from("whatsapp_instances")
        .select("id, server_url, status, is_connected")
        .eq("user_id", userId)
        .maybeSingle();

      if (!inst) {
        return json({ error: "Instância não encontrada" }, 404);
      }

      // Get token from secrets table
      const { data: secrets } = await adminClient
        .from("whatsapp_instance_secrets")
        .select("instance_token")
        .eq("instance_id", inst.id)
        .single();

      const instToken = secrets?.instance_token;

      const qrRes = await fetch(`${inst.server_url}/instance/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": instToken || "",
        },
        body: "{}",
      });

      const qrJson = await qrRes.json();
      console.log("QR response status:", qrRes.status);

      const connected = qrJson?.connected === true || qrJson?.instance?.status === "connected";

      if (connected) {
        await adminClient
          .from("whatsapp_instances")
          .update({ status: "connected", is_connected: true, last_connection_at: new Date().toISOString() })
          .eq("id", inst.id);
        return json({ connected: true });
      }

      const qrcode = qrJson?.instance?.qrcode || qrJson?.qrcode || "";
      if (qrcode) {
        await adminClient
          .from("whatsapp_instances")
          .update({ status: "connecting", qr_code: qrcode })
          .eq("id", inst.id);
      }

      return json({ qrcode, connected: false });
    }

    // ── DISCONNECT ──
    if (action === "disconnect") {
      const { error } = await adminClient
        .from("whatsapp_instances")
        .update({ status: "disconnected", is_connected: false })
        .eq("user_id", userId);

      if (error) {
        return json({ error: "Erro ao desconectar" }, 500);
      }
      return json({ success: true });
    }

    // ── DELETE ──
    if (action === "delete") {
      const { data: inst } = await adminClient
        .from("whatsapp_instances")
        .select("id, server_url")
        .eq("user_id", userId)
        .maybeSingle();

      if (inst) {
        // Get token from secrets table
        const { data: secrets } = await adminClient
          .from("whatsapp_instance_secrets")
          .select("instance_token")
          .eq("instance_id", inst.id)
          .single();

        if (inst.server_url && secrets?.instance_token) {
          try {
            await fetch(`${inst.server_url}/instance`, {
              method: "DELETE",
              headers: { "token": secrets.instance_token },
            });
          } catch (e) {
            console.error("WhatsApi delete failed (continuing):", e);
          }
        }

        // Delete secrets first (FK), then instance
        await adminClient
          .from("whatsapp_instance_secrets")
          .delete()
          .eq("instance_id", inst.id);
      }

      await adminClient
        .from("whatsapp_instances")
        .delete()
        .eq("user_id", userId);

      return json({ deleted: true });
    }

    return json({ error: "Ação não implementada" }, 400);
  } catch (error: unknown) {
    console.error("whatsapp-manage error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: "Erro interno do servidor" }, 500);
  }
});
