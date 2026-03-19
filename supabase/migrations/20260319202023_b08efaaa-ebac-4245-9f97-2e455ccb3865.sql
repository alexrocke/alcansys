-- Add prompt columns
ALTER TABLE public.workflow_templates ADD COLUMN IF NOT EXISTS prompt_template text;
ALTER TABLE public.client_automations ADD COLUMN IF NOT EXISTS prompt text;

-- Insert 8 pre-built workflow templates
INSERT INTO public.workflow_templates (nome, descricao, categoria, preco, icone, features, prompt_template, ativo) VALUES
(
  'Agente SDR',
  'Agente de pré-vendas inteligente que qualifica leads automaticamente, agenda reuniões e faz follow-up via WhatsApp.',
  'vendas',
  297,
  'UserCheck',
  '["Qualificação automática de leads", "Agendamento de reuniões", "Follow-up inteligente", "Integração com CRM"]',
  'Você é um agente SDR profissional. Sua função é qualificar leads que entram em contato via WhatsApp. Faça perguntas sobre o negócio do lead, identifique suas dores e necessidades, e quando qualificado, ofereça o agendamento de uma reunião com o time comercial. Seja cordial, objetivo e profissional. Nunca invente informações sobre a empresa.',
  true
),
(
  'Atendimento com IA 24h',
  'Assistente virtual inteligente que responde dúvidas, resolve problemas e encaminha para atendimento humano quando necessário.',
  'atendimento',
  397,
  'Bot',
  '["Respostas automáticas 24/7", "Entendimento de linguagem natural", "Handoff para humano", "Histórico de conversas"]',
  'Você é um assistente de atendimento ao cliente. Responda dúvidas sobre produtos e serviços da empresa com base nas informações fornecidas. Seja simpático, claro e resolva o problema do cliente. Se não souber a resposta ou o cliente pedir para falar com um humano, transfira o atendimento educadamente.',
  true
),
(
  'Follow-up Automático',
  'Sistema de follow-up que envia sequências personalizadas de mensagens para manter o engajamento com leads e clientes.',
  'vendas',
  197,
  'RefreshCw',
  '["Sequências de follow-up personalizadas", "Gatilhos por tempo e evento", "Templates de mensagem", "Relatórios de conversão"]',
  'Você é responsável por fazer follow-up com leads e clientes. Envie mensagens de acompanhamento de forma natural e personalizada. Pergunte sobre o interesse, tire dúvidas pendentes e incentive o próximo passo. Não seja invasivo, respeite o tempo do cliente.',
  true
),
(
  'Pesquisa de Satisfação (NPS)',
  'Coleta automática de feedback pós-atendimento com escala NPS e análise de sentimento.',
  'suporte',
  147,
  'Star',
  '["Envio automático pós-atendimento", "Escala NPS configurável", "Dashboard de resultados", "Alertas de detratores"]',
  'Você conduz pesquisas de satisfação. Após o atendimento, pergunte ao cliente de 0 a 10 qual a probabilidade de recomendar a empresa. Agradeça pela resposta. Se a nota for baixa (0-6), pergunte o que poderia melhorar. Se for alta (9-10), peça uma avaliação no Google.',
  true
),
(
  'Recuperação de Carrinho',
  'Detecta abandonos de carrinho e envia sequências de recuperação com ofertas personalizadas.',
  'marketing',
  247,
  'ShoppingCart',
  '["Detecção de abandono", "Sequência de recuperação", "Cupons automáticos", "Métricas de recuperação"]',
  'Você ajuda a recuperar vendas de carrinhos abandonados. Entre em contato com o cliente de forma amigável, lembre-o dos itens no carrinho e ofereça ajuda para finalizar a compra. Se necessário, ofereça um cupom de desconto conforme as regras da empresa.',
  true
),
(
  'Agendamento Inteligente',
  'Assistente de agendamento que gerencia marcações, confirmações e lembretes automaticamente.',
  'atendimento',
  197,
  'Calendar',
  '["Calendário integrado", "Confirmação automática", "Lembretes antes do horário", "Reagendamento por WhatsApp"]',
  'Você é um assistente de agendamento. Ajude o cliente a encontrar o melhor horário disponível, confirme o agendamento e envie lembretes. Permita reagendamento e cancelamento de forma simples. Seja organizado e claro com as informações de data, hora e local.',
  true
),
(
  'Cobrança Automática',
  'Sistema de cobrança que envia lembretes de vencimento, boletos e faz escalonamento automático.',
  'vendas',
  197,
  'DollarSign',
  '["Lembretes de vencimento", "Envio de boleto/PIX", "Escalonamento de cobrança", "Relatório de inadimplência"]',
  'Você é responsável pela cobrança de faturas. Envie lembretes amigáveis antes do vencimento e notificações após o vencimento. Ofereça opções de pagamento (boleto, PIX). Seja firme mas educado, e ofereça negociação para clientes com dificuldades.',
  true
),
(
  'Onboarding de Clientes',
  'Guia automatizado que acompanha novos clientes nos primeiros passos com tutoriais e checklist.',
  'suporte',
  247,
  'Rocket',
  '["Boas-vindas automatizadas", "Tutoriais em sequência", "Checklist de ativação", "Acompanhamento de progresso"]',
  'Você é um guia de onboarding. Dê boas-vindas ao novo cliente, apresente os primeiros passos para usar o produto/serviço, envie tutoriais em sequência e acompanhe o progresso. Pergunte se há dúvidas e ofereça suporte adicional quando necessário.',
  true
);