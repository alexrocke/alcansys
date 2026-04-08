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
    const MP_TOKEN = Deno.env.get("MP_ACESS_TOKEN");
    if (!MP_TOKEN) {
      return new Response(JSON.stringify({ error: "MP token not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const body = await req.json();
    const { company_id, valor, descricao, method, payer_email, payer_name, invoice_id } = body;

    // Validate
    if (!company_id || !valor || !descricao || !method) {
      return new Response(JSON.stringify({ error: "Missing required fields: company_id, valor, descricao, method" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["pix", "credit_card", "boleto"].includes(method)) {
      return new Response(JSON.stringify({ error: "Invalid method. Use: pix, credit_card, boleto" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof valor !== "number" || valor <= 0) {
      return new Response(JSON.stringify({ error: "valor must be a positive number" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check membership
    const { data: belongs } = await supabase.rpc("user_belongs_to_company", {
      _user_id: userId, _company_id: company_id,
    });
    if (!belongs) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for DB writes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const externalRef = `pay_${crypto.randomUUID()}`;

    // Create MP payment
    const mpBody: Record<string, unknown> = {
      transaction_amount: valor,
      description: descricao,
      external_reference: externalRef,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
    };

    if (payer_email) {
      mpBody.payer = { email: payer_email, first_name: payer_name || "" };
    }

    if (method === "pix") {
      mpBody.payment_method_id = "pix";
    } else if (method === "boleto") {
      mpBody.payment_method_id = "bolbradesco";
    } else if (method === "credit_card") {
      // For credit card, we create a preference for checkout
      const prefResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MP_TOKEN}`,
        },
        body: JSON.stringify({
          items: [{
            title: descricao,
            quantity: 1,
            unit_price: valor,
            currency_id: "BRL",
          }],
          external_reference: externalRef,
          notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
          back_urls: {
            success: `${req.headers.get("origin") || "https://alcansys.lovable.app"}/financeiro`,
            failure: `${req.headers.get("origin") || "https://alcansys.lovable.app"}/financeiro`,
            pending: `${req.headers.get("origin") || "https://alcansys.lovable.app"}/financeiro`,
          },
          auto_return: "approved",
          payer: payer_email ? { email: payer_email, name: payer_name || "" } : undefined,
        }),
      });

      const prefData = await prefResponse.json();

      if (!prefResponse.ok) {
        console.error("MP preference error:", prefData);
        return new Response(JSON.stringify({ error: "Failed to create MP preference", details: prefData.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save to DB
      const { data: payment, error: dbErr } = await supabaseAdmin.from("payments").insert({
        company_id, valor, descricao, method, payer_email, payer_name,
        mp_preference_id: prefData.id,
        external_reference: externalRef,
        invoice_id: invoice_id || null,
        status: "pending",
        metadata: { init_point: prefData.init_point, sandbox_init_point: prefData.sandbox_init_point },
      }).select().single();

      if (dbErr) throw dbErr;

      return new Response(JSON.stringify({
        payment,
        init_point: prefData.init_point,
        sandbox_init_point: prefData.sandbox_init_point,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For PIX and Boleto - direct payment
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_TOKEN}`,
        "X-Idempotency-Key": externalRef,
      },
      body: JSON.stringify(mpBody),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP payment error:", mpData);
      return new Response(JSON.stringify({ error: "Failed to create payment", details: mpData.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract PIX/Boleto data
    const pixQr = mpData.point_of_interaction?.transaction_data?.qr_code || null;
    const pixQrBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null;
    const boletoUrl = mpData.transaction_details?.external_resource_url || null;

    // Save to DB
    const { data: payment, error: dbErr } = await supabaseAdmin.from("payments").insert({
      company_id, valor, descricao, method, payer_email, payer_name,
      mp_payment_id: String(mpData.id),
      external_reference: externalRef,
      invoice_id: invoice_id || null,
      status: mpData.status || "pending",
      pix_qr_code: pixQr,
      pix_qr_code_base64: pixQrBase64,
      boleto_url: boletoUrl,
      metadata: mpData,
    }).select().single();

    if (dbErr) throw dbErr;

    return new Response(JSON.stringify({ payment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
