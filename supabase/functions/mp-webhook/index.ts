import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("MP webhook received:", JSON.stringify(body));

    const { type, data, action } = body;

    if (!type || !data?.id) {
      return new Response("OK", { status: 200 });
    }

    const MP_TOKEN = Deno.env.get("MP_ACESS_TOKEN");
    if (!MP_TOKEN) {
      console.error("MP_ACESS_TOKEN not set");
      return new Response("OK", { status: 200 });
    }

    // Handle payment events
    if (type === "payment") {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: { Authorization: `Bearer ${MP_TOKEN}` },
      });

      if (!mpRes.ok) {
        console.error("Failed to fetch MP payment:", mpRes.status);
        return new Response("OK", { status: 200 });
      }

      const mpPayment = await mpRes.json();
      const extRef = mpPayment.external_reference;

      // Map MP status to our status
      const statusMap: Record<string, string> = {
        approved: "approved",
        pending: "pending",
        in_process: "pending",
        rejected: "rejected",
        cancelled: "cancelled",
        refunded: "refunded",
        charged_back: "charged_back",
      };

      const newStatus = statusMap[mpPayment.status] || mpPayment.status;

      // Update payment in DB
      const { error: updateErr } = await supabaseAdmin
        .from("payments")
        .update({
          status: newStatus,
          mp_payment_id: String(data.id),
          paid_at: mpPayment.status === "approved" ? new Date().toISOString() : null,
          method: mpPayment.payment_method_id || null,
          metadata: mpPayment,
        })
        .eq("external_reference", extRef);

      if (updateErr) console.error("Error updating payment:", updateErr);

      // Log
      await supabaseAdmin.from("payment_logs").insert({
        event_type: `payment.${mpPayment.status}`,
        mp_id: String(data.id),
        raw_data: mpPayment,
      });
    }

    // Handle subscription/preapproval events
    if (type === "subscription_preapproval" || type === "subscription_authorized_payment") {
      const endpoint = type === "subscription_preapproval"
        ? `https://api.mercadopago.com/preapproval/${data.id}`
        : `https://api.mercadopago.com/authorized_payments/${data.id}`;

      const mpRes = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${MP_TOKEN}` },
      });

      if (mpRes.ok) {
        const mpData = await mpRes.json();
        const extRef = mpData.external_reference;

        if (type === "subscription_preapproval") {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: mpData.status || "pending",
              metadata: mpData,
            })
            .eq("external_reference", extRef);
        }

        await supabaseAdmin.from("payment_logs").insert({
          event_type: `${type}.${action || mpData.status}`,
          mp_id: String(data.id),
          raw_data: mpData,
        });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("OK", { status: 200 });
  }
});
