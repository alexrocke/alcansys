-- Atendimento com IA 24h
UPDATE public.workflow_templates SET config_schema = '{"steps":[
  {"id":"s1","tipo":"mensagem","nome":"Saudação","config":{"texto":"Olá! 👋 Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?"},"position":{"x":50,"y":80}},
  {"id":"s2","tipo":"aguardar","nome":"Aguardar Resposta","config":{"timeoutMinutos":30},"position":{"x":320,"y":80}},
  {"id":"s3","tipo":"ia","nome":"Processar com IA","config":{"prompt":"Analise a mensagem do cliente e forneça uma resposta útil e profissional. Se não souber responder, indique que vai transferir para um atendente humano.","maxTokens":500},"position":{"x":590,"y":80}},
  {"id":"s4","tipo":"condicao","nome":"Precisa de Humano?","config":{"palavraChave":"humano,atendente,pessoa,falar","acaoMatch":"transferir","acaoNoMatch":"continuar"},"position":{"x":860,"y":80}},
  {"id":"s5","tipo":"transferir","nome":"Transferir Atendente","config":{"departamento":"suporte"},"position":{"x":1130,"y":30}},
  {"id":"s6","tipo":"mensagem","nome":"Resposta Final","config":{"texto":"Espero ter ajudado! Se precisar de mais alguma coisa, estou por aqui. 😊"},"position":{"x":1130,"y":160}}
]}'::jsonb WHERE id = 'd53571b2-cfd2-44f8-97b2-c504d663e88e';

-- Agente SDR
UPDATE public.workflow_templates SET config_schema = '{"steps":[
  {"id":"s1","tipo":"mensagem","nome":"Abordagem Inicial","config":{"texto":"Olá! 👋 Vi que você demonstrou interesse em nossos serviços. Posso te ajudar a encontrar a melhor solução?"},"position":{"x":50,"y":80}},
  {"id":"s2","tipo":"aguardar","nome":"Aguardar Interesse","config":{"timeoutMinutos":60},"position":{"x":320,"y":80}},
  {"id":"s3","tipo":"ia","nome":"Qualificar Lead","config":{"prompt":"Analise a resposta do lead e faça perguntas de qualificação: qual o tamanho da empresa, qual o problema principal, qual o orçamento disponível. Seja consultivo e profissional.","maxTokens":500},"position":{"x":590,"y":80}},
  {"id":"s4","tipo":"aguardar","nome":"Aguardar Qualificação","config":{"timeoutMinutos":120},"position":{"x":860,"y":80}},
  {"id":"s5","tipo":"condicao","nome":"Lead Qualificado?","config":{"palavraChave":"sim,interesse,quero,preciso,orçamento","acaoMatch":"continuar","acaoNoMatch":"transferir"},"position":{"x":1130,"y":80}},
  {"id":"s6","tipo":"mensagem","nome":"Agendar Reunião","config":{"texto":"Ótimo! Vou encaminhar você para um de nossos especialistas que vai preparar uma proposta personalizada. Qual o melhor horário para uma conversa?"},"position":{"x":1400,"y":80}},
  {"id":"s7","tipo":"transferir","nome":"Passar para Vendas","config":{"departamento":"vendas"},"position":{"x":1670,"y":80}}
]}'::jsonb WHERE id = 'ee3ccb7e-d326-4949-ac0f-97f944866768';

-- Follow-up Automático
UPDATE public.workflow_templates SET config_schema = '{"steps":[
  {"id":"s1","tipo":"mensagem","nome":"Mensagem Inicial","config":{"texto":"Olá! Tudo bem? 😊 Estou entrando em contato para saber como está indo com nosso serviço. Tem alguma dúvida?"},"position":{"x":50,"y":80}},
  {"id":"s2","tipo":"aguardar","nome":"Aguardar Resposta","config":{"timeoutMinutos":1440},"position":{"x":320,"y":80}},
  {"id":"s3","tipo":"condicao","nome":"Respondeu?","config":{"palavraChave":"sim,não,ok,obrigado","acaoMatch":"continuar","acaoNoMatch":"transferir"},"position":{"x":590,"y":80}},
  {"id":"s4","tipo":"delay","nome":"Esperar 24h","config":{"minutos":1440},"position":{"x":860,"y":80}},
  {"id":"s5","tipo":"mensagem","nome":"Segundo Follow-up","config":{"texto":"Oi! Só passando para lembrar que estamos à disposição caso precise de ajuda. Tem algo em que possamos auxiliar?"},"position":{"x":1130,"y":80}},
  {"id":"s6","tipo":"delay","nome":"Esperar 48h","config":{"minutos":2880},"position":{"x":1400,"y":80}},
  {"id":"s7","tipo":"mensagem","nome":"Último Follow-up","config":{"texto":"Olá! Esta é nossa última tentativa de contato. Se precisar de algo no futuro, não hesite em nos chamar! 🙏"},"position":{"x":1670,"y":80}}
]}'::jsonb WHERE id = 'a7bdd693-76f2-4486-94cc-ebcb76c04889';

-- Pesquisa de Satisfação (NPS)
UPDATE public.workflow_templates SET config_schema = '{"steps":[
  {"id":"s1","tipo":"mensagem","nome":"Convite NPS","config":{"texto":"Olá! 📊 Gostaríamos da sua opinião sobre nosso atendimento. De 0 a 10, quanto você recomendaria nosso serviço para um amigo?"},"position":{"x":50,"y":80}},
  {"id":"s2","tipo":"aguardar","nome":"Aguardar Nota","config":{"timeoutMinutos":1440},"position":{"x":320,"y":80}},
  {"id":"s3","tipo":"ia","nome":"Analisar Feedback","config":{"prompt":"O cliente deu uma nota NPS. Analise a nota: se for 9-10 (promotor), agradeça efusivamente. Se for 7-8 (neutro), pergunte o que podemos melhorar. Se for 0-6 (detrator), peça desculpas e pergunte o que aconteceu.","maxTokens":300},"position":{"x":590,"y":80}},
  {"id":"s4","tipo":"aguardar","nome":"Aguardar Comentário","config":{"timeoutMinutos":1440},"position":{"x":860,"y":80}},
  {"id":"s5","tipo":"webhook","nome":"Salvar NPS","config":{"url":"","metodo":"POST"},"position":{"x":1130,"y":80}},
  {"id":"s6","tipo":"mensagem","nome":"Agradecimento","config":{"texto":"Muito obrigado pelo seu feedback! Ele é essencial para continuarmos melhorando. 💙"},"position":{"x":1400,"y":80}}
]}'::jsonb WHERE id = 'd1fda983-6aa1-4cf3-af4f-bb07e5e27540';

-- Recuperação de Carrinho
UPDATE public.workflow_templates SET config_schema = '{"steps":[
  {"id":"s1","tipo":"delay","nome":"Esperar 1h","config":{"minutos":60},"position":{"x":50,"y":80}},
  {"id":"s2","tipo":"mensagem","nome":"Lembrete Carrinho","config":{"texto":"Oi! 🛒 Notamos que você deixou alguns itens no carrinho. Precisa de ajuda para finalizar sua compra?"},"position":{"x":320,"y":80}},
  {"id":"s3","tipo":"aguardar","nome":"Aguardar Resposta","config":{"timeoutMinutos":1440},"position":{"x":590,"y":80}},
  {"id":"s4","tipo":"condicao","nome":"Quer Comprar?","config":{"palavraChave":"sim,quero,finalizar,comprar","acaoMatch":"continuar","acaoNoMatch":"transferir"},"position":{"x":860,"y":80}},
  {"id":"s5","tipo":"mensagem","nome":"Link de Compra","config":{"texto":"Ótimo! 🎉 Aqui está o link para finalizar sua compra com um desconto especial de 10%!"},"position":{"x":1130,"y":30}},
  {"id":"s6","tipo":"delay","nome":"Esperar 24h","config":{"minutos":1440},"position":{"x":1130,"y":160}},
  {"id":"s7","tipo":"mensagem","nome":"Última Chance","config":{"texto":"⏰ Última chance! Seu carrinho será esvaziado em breve. Não perca os itens que você selecionou!"},"position":{"x":1400,"y":160}}
]}'::jsonb WHERE id = '6db9a0dd-6c56-48bd-9eb9-00b87c2aa9fe';

-- Agendamento Inteligente
UPDATE public.workflow_templates SET config_schema = '{"steps":[
  {"id":"s1","tipo":"mensagem","nome":"Boas-vindas","config":{"texto":"Olá! 📅 Vou te ajudar a agendar seu atendimento. Qual serviço você precisa?"},"position":{"x":50,"y":80}},
  {"id":"s2","tipo":"aguardar","nome":"Aguardar Serviço","config":{"timeoutMinutos":30},"position":{"x":320,"y":80}},
  {"id":"s3","tipo":"ia","nome":"Identificar Serviço","config":{"prompt":"Identifique qual serviço o cliente deseja agendar e sugira os horários disponíveis. Seja claro e objetivo.","maxTokens":400},"position":{"x":590,"y":80}},
  {"id":"s4","tipo":"aguardar","nome":"Aguardar Horário","config":{"timeoutMinutos":30},"position":{"x":860,"y":80}},
  {"id":"s5","tipo":"webhook","nome":"Criar Agendamento","config":{"url":"","metodo":"POST"},"position":{"x":1130,"y":80}},
  {"id":"s6","tipo":"mensagem","nome":"Confirmação","config":{"texto":"✅ Agendamento confirmado! Você receberá um lembrete antes do horário. Até lá! 😊"},"position":{"x":1400,"y":80}}
]}'::jsonb WHERE id = 'fa5c48c9-d706-4425-bc15-872a98c6fb84';

-- Cobrança Automática
UPDATE public.workflow_templates SET config_schema = '{"steps":[
  {"id":"s1","tipo":"mensagem","nome":"Aviso de Vencimento","config":{"texto":"Olá! 💳 Informamos que sua fatura vence em breve. Deseja receber o boleto/pix atualizado?"},"position":{"x":50,"y":80}},
  {"id":"s2","tipo":"aguardar","nome":"Aguardar Resposta","config":{"timeoutMinutos":1440},"position":{"x":320,"y":80}},
  {"id":"s3","tipo":"condicao","nome":"Quer Pagar?","config":{"palavraChave":"sim,pix,boleto,pagar,enviar","acaoMatch":"continuar","acaoNoMatch":"transferir"},"position":{"x":590,"y":80}},
  {"id":"s4","tipo":"webhook","nome":"Gerar Cobrança","config":{"url":"","metodo":"POST"},"position":{"x":860,"y":80}},
  {"id":"s5","tipo":"mensagem","nome":"Enviar Cobrança","config":{"texto":"Aqui está sua cobrança atualizada! ✅ Após o pagamento, a confirmação será enviada automaticamente."},"position":{"x":1130,"y":80}},
  {"id":"s6","tipo":"delay","nome":"Esperar 3 dias","config":{"minutos":4320},"position":{"x":1400,"y":80}},
  {"id":"s7","tipo":"mensagem","nome":"Lembrete Atraso","config":{"texto":"⚠️ Notamos que sua fatura ainda está pendente. Precisa de ajuda ou tem alguma dúvida sobre o pagamento?"},"position":{"x":1670,"y":80}},
  {"id":"s8","tipo":"transferir","nome":"Escalar para Financeiro","config":{"departamento":"financeiro"},"position":{"x":1940,"y":80}}
]}'::jsonb WHERE id = '4c025b03-0a81-46ba-9365-4d6d258e1f83';

-- Onboarding de Clientes
UPDATE public.workflow_templates SET config_schema = '{"steps":[
  {"id":"s1","tipo":"mensagem","nome":"Boas-vindas","config":{"texto":"🎉 Bem-vindo(a) à nossa plataforma! Estou aqui para te guiar nos primeiros passos. Vamos começar?"},"position":{"x":50,"y":80}},
  {"id":"s2","tipo":"aguardar","nome":"Aguardar Confirmação","config":{"timeoutMinutos":60},"position":{"x":320,"y":80}},
  {"id":"s3","tipo":"ia","nome":"Guia Personalizado","config":{"prompt":"Guie o novo cliente pelos primeiros passos da plataforma. Pergunte sobre o segmento de atuação e personalize as dicas. Seja acolhedor e didático.","maxTokens":500},"position":{"x":590,"y":80}},
  {"id":"s4","tipo":"aguardar","nome":"Aguardar Setup","config":{"timeoutMinutos":1440},"position":{"x":860,"y":80}},
  {"id":"s5","tipo":"condicao","nome":"Completou Setup?","config":{"palavraChave":"pronto,feito,configurei,sim,ok","acaoMatch":"continuar","acaoNoMatch":"transferir"},"position":{"x":1130,"y":80}},
  {"id":"s6","tipo":"mensagem","nome":"Parabéns!","config":{"texto":"🚀 Excelente! Sua configuração está completa. Agora você pode aproveitar todos os recursos. Se precisar de ajuda, é só chamar!"},"position":{"x":1400,"y":80}},
  {"id":"s7","tipo":"transferir","nome":"Suporte Humano","config":{"departamento":"suporte"},"position":{"x":1400,"y":200}}
]}'::jsonb WHERE id = '33a8ce9b-3d82-4135-af35-7280091251c6';