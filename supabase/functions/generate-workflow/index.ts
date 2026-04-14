import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt || prompt.length > 2000) {
      return new Response(JSON.stringify({ error: "Prompt inválido (máx. 2000 caracteres)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um gerador de workflows de automação para WhatsApp/atendimento.
Dado um prompt do usuário, gere um array de steps para um workflow.

Tipos de step disponíveis:
- "mensagem": Enviar texto. Config: { "texto": "..." }
- "ia": Processar com IA. Config: { "prompt": "...", "maxTokens": 500 }
- "aguardar": Esperar resposta do cliente. Config: { "timeoutMinutos": 30 }
- "condicao": If/else por palavra-chave. Config: { "palavraChave": "...", "acaoMatch": "continuar", "acaoNoMatch": "transferir" }
- "transferir": Encaminhar para humano. Config: { "departamento": "..." }
- "webhook": Chamar URL externa. Config: { "url": "", "metodo": "POST" }
- "delay": Aguardar antes de prosseguir. Config: { "minutos": 5 }

REGRAS:
- Gere entre 3 e 10 steps
- Cada step deve ter: id (UUID v4), tipo, nome (curto e descritivo), config
- Retorne APENAS o resultado via a tool "generate_steps", sem texto extra
- Os steps devem formar um fluxo lógico e coerente
- Use nomes em português`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_steps",
              description: "Retorna os steps do workflow gerado",
              parameters: {
                type: "object",
                properties: {
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        tipo: { type: "string", enum: ["mensagem", "ia", "aguardar", "condicao", "transferir", "webhook", "delay"] },
                        nome: { type: "string" },
                        config: { type: "object" },
                      },
                      required: ["id", "tipo", "nome", "config"],
                    },
                  },
                },
                required: ["steps"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_steps" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "Erro ao gerar workflow" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "IA não retornou steps válidos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const steps = parsed.steps || [];

    // Add positions
    const positionedSteps = steps.map((s: any, i: number) => ({
      ...s,
      position: { x: 50 + i * 270, y: 80 },
    }));

    return new Response(JSON.stringify({ steps: positionedSteps }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-workflow error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});