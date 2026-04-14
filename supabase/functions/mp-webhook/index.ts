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

    const rawBody = await req.text();
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.warn("MP webhook: invalid JSON body");
      return new Response("Bad Request", { status: 400 });
    }

    console.log("MP webhook received:", JSON.stringify(body).slice(0, 500));

    const { type, data, action } = body as { type?: string; data?: { id?: string | number }; action?: string };

    if (!type || !data?.id) {
      return new Response("OK", { status: 200 });
    }

    const validTypes = ["payment", "subscription_preapproval", "subscription_authorized_payment", "plan", "subscription", "invoice", "point_integration_wh"];
    if (!validTypes.includes(type)) {
      console.warn(`MP webhook: unexpected event type: ${type}`);
      return new Response("OK", { status: 200 });
    }

    const dataId = String(data.id);
    if (!/^\d{1,20}$/.test(dataId)) {
      console.warn(`MP webhook: invalid data.id format: ${dataId}`);
      return new Response("OK", { status: 200 });
    }

    const MP_TOKEN = Deno.env.get("MP_ACESS_TOKEN");
    if (!MP_TOKEN) {
      console.error("MP_ACESS_TOKEN not set");
      return new Response("OK", { status: 200 });
    }

    // Handle payment events
    if (type === "payment") {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { Authorization: `Bearer ${MP_TOKEN}` },
      });

      if (!mpRes.ok) {
        const errText = await mpRes.text();
        console.error(`Failed to fetch MP payment ${dataId}: ${mpRes.status} - ${errText.slice(0, 200)}`);
        return new Response("OK", { status: 200 });
      }

      const mpPayment = await mpRes.json();
      const extRef = mpPayment.external_reference;

      if (!extRef || typeof extRef !== "string" || !extRef.startsWith("pay_")) {
        console.warn(`MP webhook: unrecognized external_reference: ${extRef}`);
        return new Response("OK", { status: 200 });
      }

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
      const { data: updatedPayment, error: updateErr } = await supabaseAdmin
        .from("payments")
        .update({
          status: newStatus,
          mp_payment_id: dataId,
          paid_at: mpPayment.status === "approved" ? new Date().toISOString() : null,
          method: mpPayment.payment_method_id || null,
          metadata: mpPayment,
        })
        .eq("external_reference", extRef)
        .select()
        .single();

      if (updateErr) console.error("Error updating payment:", updateErr);

      // AUTO-PROVISION: If payment approved and has automation metadata, create client_automation
      if (newStatus === "approved" && updatedPayment) {
        const meta = updatedPayment.metadata as Record<string, unknown> | null;
        const automationMeta = meta?.automation_provision as Record<string, unknown> | undefined;

        if (automationMeta) {
          const templateIds: string[] = (automationMeta.template_ids as string[]) || [];
          const companyId = updatedPayment.company_id;
          const promptTemplate = (automationMeta.prompt_template as string) || null;

          console.log(`Auto-provisioning ${templateIds.length} automation(s) for company ${companyId}`);

          for (const templateId of templateIds) {
            // Check if automation already exists for this company+template
            const { data: existing } = await supabaseAdmin
              .from("client_automations")
              .select("id")
              .eq("company_id", companyId)
              .eq("template_id", templateId)
              .maybeSingle();

            if (!existing) {
              const { error: insertErr } = await supabaseAdmin
                .from("client_automations")
                .insert({
                  company_id: companyId,
                  template_id: templateId,
                  prompt: promptTemplate,
                  status: "configurando",
                  config: {
                    auto_provisioned: true,
                    payment_id: updatedPayment.id,
                    provisioned_at: new Date().toISOString(),
                  },
                });

              if (insertErr) {
                console.error(`Error provisioning automation for template ${templateId}:`, insertErr);
              } else {
                console.log(`Automation provisioned: template ${templateId} for company ${companyId}`);
              }
            } else {
              console.log(`Automation already exists for template ${templateId}, skipping`);
            }
          }

          // Create alert for the company
          await supabaseAdmin.from("alerts").insert({
            tipo: "informativo",
            mensagem: `Automação contratada com sucesso! Configure seu WhatsApp e prompts para ativar.`,
            company_id: companyId,
          });
        }
      }

      // Log
      await supabaseAdmin.from("payment_logs").insert({
        event_type: `payment.${mpPayment.status}`,
        mp_id: dataId,
        raw_data: mpPayment,
      });
    }

    // Handle subscription/preapproval events
    if (type === "subscription_preapproval" || type === "subscription_authorized_payment") {
      const endpoint = type === "subscription_preapproval"
        ? `https://api.mercadopago.com/preapproval/${dataId}`
        : `https://api.mercadopago.com/authorized_payments/${dataId}`;

      const mpRes = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${MP_TOKEN}` },
      });

      if (mpRes.ok) {
        const mpData = await mpRes.json();
        const extRef = mpData.external_reference;

        if (type === "subscription_preapproval" && extRef && typeof extRef === "string" && extRef.startsWith("sub_")) {
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
          mp_id: dataId,
          raw_data: mpData,
        });
      } else {
        const errText = await mpRes.text();
        console.error(`Failed to fetch MP ${type} ${dataId}: ${mpRes.status} - ${errText.slice(0, 200)}`);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("OK", { status: 200 });
  }
});
