
-- Create landing_config table
CREATE TABLE public.landing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  "order" integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add unique constraint on section
ALTER TABLE public.landing_config ADD CONSTRAINT landing_config_section_key UNIQUE (section);

-- Enable RLS
ALTER TABLE public.landing_config ENABLE ROW LEVEL SECURITY;

-- Public read (landing is public)
CREATE POLICY "Anyone can view landing config"
ON public.landing_config FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage landing config"
ON public.landing_config FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_landing_config_updated_at
  BEFORE UPDATE ON public.landing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed with current hardcoded data
INSERT INTO public.landing_config (section, config, "order", visible) VALUES
('hero', '{"title": "Sua empresa mais", "title_highlight": "inteligente", "subtitle": "Automação, gestão e marketing digital integrados em uma única plataforma. Escale resultados com tecnologia e IA.", "spline_url": "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode", "cta_primary": "Começar agora", "cta_secondary": "Ver serviços"}'::jsonb, 1, true),
('services', '{"title": "Soluções que transformam negócios", "subtitle": "Tecnologia de ponta para automatizar processos, gerenciar projetos e impulsionar vendas.", "cards": [{"icon": "Zap", "title": "Automação com IA", "description": "Chatbots inteligentes e fluxos automatizados", "subtitle": "WhatsApp integrado"}, {"icon": "FolderKanban", "title": "Gestão de Projetos", "description": "Organize tarefas e acompanhe prazos", "subtitle": "Dashboards em tempo real"}, {"icon": "TrendingUp", "title": "Marketing Digital", "description": "Campanhas otimizadas e geração de leads", "subtitle": "Análise de ROI"}, {"icon": "MessageCircle", "title": "Atendimento WhatsApp", "description": "Múltiplas instâncias e chatbot IA", "subtitle": "Gestão centralizada"}]}'::jsonb, 2, true),
('stats', '{"items": [{"icon": "Users", "value": "150+", "label": "Clientes ativos"}, {"icon": "Zap", "value": "500+", "label": "Automações rodando"}, {"icon": "BarChart3", "value": "320%", "label": "ROI médio"}]}'::jsonb, 3, true),
('cta', '{"title": "Pronto para transformar seu negócio?", "subtitle": "Comece gratuitamente e veja resultados em poucos dias.", "button_text": "Criar conta grátis"}'::jsonb, 4, true),
('footer', '{"email": "contato@alcansys.com.br", "whatsapp_url": "https://wa.me/5500000000000", "whatsapp_label": "WhatsApp"}'::jsonb, 5, true);
