UPDATE landing_config
SET config = jsonb_build_object(
  'title', 'Soluções digitais para o seu negócio',
  'subtitle', 'Criamos sistemas, automações e landing pages que geram resultados reais para sua empresa.',
  'cards', jsonb_build_array(
    jsonb_build_object('icon', 'Code', 'title', 'Sistemas Personalizados', 'description', 'Desenvolvemos sistemas sob medida para o seu negócio, do zero ao deploy', 'subtitle', '100% customizado'),
    jsonb_build_object('icon', 'Zap', 'title', 'Automação com IA', 'description', 'Chatbots inteligentes, fluxos automatizados e integração com WhatsApp', 'subtitle', 'Resultados 24/7'),
    jsonb_build_object('icon', 'Globe', 'title', 'Landing Pages', 'description', 'Páginas de alta conversão para captar leads e vender seus serviços', 'subtitle', 'Design profissional'),
    jsonb_build_object('icon', 'MessageCircle', 'title', 'Atendimento WhatsApp', 'description', 'Múltiplas instâncias, chatbot IA e gestão centralizada de conversas', 'subtitle', 'Atendimento escalável')
  )
),
updated_at = now()
WHERE section = 'services';