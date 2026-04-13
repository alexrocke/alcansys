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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, subject, html, template_slug, variables } = await req.json();

    // Check if RESEND_API_KEY is configured
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ 
        error: "Email not configured", 
        message: "RESEND_API_KEY não está configurada. Configure o secret para habilitar envio de emails." 
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailSubject = subject;
    let emailHtml = html;

    // If using a template, fetch it
    if (template_slug) {
      const { data: template, error: templateError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("slug", template_slug)
        .eq("ativo", true)
        .single();

      if (templateError || !template) {
        return new Response(JSON.stringify({ error: "Template not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      emailSubject = template.assunto;
      emailHtml = template.corpo_html;

      // Replace variables in template
      if (variables && typeof variables === "object") {
        for (const [key, value] of Object.entries(variables)) {
          emailHtml = emailHtml.replace(new RegExp(`{{${key}}}`, "g"), String(value));
          emailSubject = emailSubject.replace(new RegExp(`{{${key}}}`, "g"), String(value));
        }
      }
    }

    if (!to || !emailSubject || !emailHtml) {
      return new Response(JSON.stringify({ error: "to, subject, and html are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "Scalefy <noreply@scalefy.com>",
        to: Array.isArray(to) ? to : [to],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Resend error:", result);
      throw new Error(`Resend failed: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("send-email error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
