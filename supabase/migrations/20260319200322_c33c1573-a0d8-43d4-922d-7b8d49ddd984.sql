
-- Create enum for workflow template categories
CREATE TYPE public.workflow_category AS ENUM ('atendimento', 'vendas', 'marketing', 'suporte');

-- Create enum for client automation status
CREATE TYPE public.client_automation_status AS ENUM ('ativa', 'inativa', 'configurando');

-- Create workflow_templates table
CREATE TABLE public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria workflow_category NOT NULL DEFAULT 'atendimento',
  icone TEXT DEFAULT 'Zap',
  preco NUMERIC DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  config_schema JSONB DEFAULT '{}'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_automations table
CREATE TABLE public.client_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  whatsapp_instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  config JSONB DEFAULT '{}'::jsonb,
  status client_automation_status NOT NULL DEFAULT 'configurando',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add uazap_instance_id to whatsapp_instances
ALTER TABLE public.whatsapp_instances ADD COLUMN uazap_instance_id TEXT;

-- Enable RLS
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_automations ENABLE ROW LEVEL SECURITY;

-- RLS for workflow_templates
CREATE POLICY "Admins can manage workflow templates"
  ON public.workflow_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active templates"
  ON public.workflow_templates FOR SELECT
  TO authenticated
  USING (ativo = true);

-- RLS for client_automations
CREATE POLICY "Admins can manage all client automations"
  ON public.client_automations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company members can view their automations"
  ON public.client_automations FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE POLICY "Company owners/admins can manage their automations"
  ON public.client_automations FOR ALL
  TO authenticated
  USING (
    user_has_company_role(auth.uid(), company_id, 'owner'::membership_role)
    OR user_has_company_role(auth.uid(), company_id, 'admin'::membership_role)
  );

-- Updated_at triggers
CREATE TRIGGER update_workflow_templates_updated_at
  BEFORE UPDATE ON public.workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_automations_updated_at
  BEFORE UPDATE ON public.client_automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
