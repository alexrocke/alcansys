import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getModelFromSettings(): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return "gpt-4o-mini";

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data } = await supabase
      .from("settings")
      .select("valor")
      .eq("chave", "configuracoes_gerais")
      .maybeSingle();

    if (data?.valor) {
      const valor = data.valor as any;
      if (valor.modeloIA) return valor.modeloIA;
    }
  } catch (e) {
    console.error("Failed to read model from settings:", e);
  }
  return "gpt-4o-mini";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
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

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { messages, context, type = "chat", clientId } = await req.json();

    let clientContext = "";
    if (type === "workflow" && clientId) {
      try {
        const { data: clientData } = await supabase
          .from("clients")
          .select("nome, email, telefone, area, plano, status")
          .eq("id", clientId)
          .maybeSingle();
        if (clientData) {
          clientContext = `\n\nDados do cliente atribuído:\n- Nome: ${clientData.nome}\n- Email: ${clientData.email || 'N/A'}\n- Telefone: ${clientData.telefone || 'N/A'}\n- Segmento: ${clientData.area || 'N/A'}\n- Plano: ${clientData.plano || 'N/A'}\n- Status: ${clientData.status}`;
        }
      } catch (e) {
        console.error("Failed to fetch client data:", e);
      }
    }

    const systemPrompt = buildSystemPrompt(type, context) + clientContext;
    const model = await getModelFromSettings();

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: allMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402 || response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Erro de autenticação com a OpenAI. Verifique sua API key e créditos." }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `OpenAI error [${response.status}]` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSystemPrompt(type: string, context?: any): string {
  const basePrompt = "Você é um assistente de IA da plataforma AlcanSys. Responda sempre em português brasileiro de forma profissional e objetiva.";

  switch (type) {
    case "workflow":
      return context?.prompt ||
        `${basePrompt} Você é um agente de atendimento automatizado via WhatsApp. Seja cordial, objetivo e resolva as dúvidas do cliente.`;
    case "leads":
      return `${basePrompt} Você é especialista em vendas e qualificação de leads. Analise os dados fornecidos e dê sugestões estratégicas para conversão. Seja direto e actionable.`;
    case "marketing":
      return `${basePrompt} Você é um copywriter especialista em marketing digital. Crie textos persuasivos, criativos e adaptados ao público-alvo. Use técnicas de copywriting como AIDA, PAS, etc.`;
    case "finance":
      return `${basePrompt} Você é um analista financeiro. Analise dados financeiros e forneça insights sobre receitas, despesas, margens e tendências. Seja preciso com números.`;
    case "tasks":
      return `${basePrompt} Você é um gerente de projetos. Ajude a organizar tarefas, priorizar atividades e sugerir melhorias no fluxo de trabalho.`;
    case "chat":
    default:
      return `${basePrompt} Ajude o usuário com qualquer dúvida sobre a plataforma, negócios, vendas, marketing ou gestão.`;
  }
}
