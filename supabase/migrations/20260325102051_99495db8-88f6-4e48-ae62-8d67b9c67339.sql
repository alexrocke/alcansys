
-- Activity Logs table for audit trail
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company members can view their logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

-- Allow inserts from triggers (service role)
CREATE POLICY "System can insert logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_activity_logs_company_created ON public.activity_logs(company_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _action text;
  _entity_name text;
  _user_id uuid;
  _company_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'criou';
    _entity_name := COALESCE(NEW.nome, NEW.titulo, NEW.descricao, NEW.instance_name, '');
    _company_id := NEW.company_id;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'atualizou';
    _entity_name := COALESCE(NEW.nome, NEW.titulo, NEW.descricao, NEW.instance_name, '');
    _company_id := NEW.company_id;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'excluiu';
    _entity_name := COALESCE(OLD.nome, OLD.titulo, OLD.descricao, OLD.instance_name, '');
    _company_id := OLD.company_id;
  END IF;

  _user_id := auth.uid();

  INSERT INTO public.activity_logs (user_id, company_id, action, entity_type, entity_id, entity_name)
  VALUES (
    _user_id,
    _company_id,
    _action,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    _entity_name
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach triggers to main tables
CREATE TRIGGER trg_audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_audit_clients AFTER INSERT OR UPDATE OR DELETE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_audit_finances AFTER INSERT OR UPDATE OR DELETE ON public.finances FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_audit_leads AFTER INSERT OR UPDATE OR DELETE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_audit_documents AFTER INSERT OR UPDATE OR DELETE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.log_activity();
CREATE TRIGGER trg_audit_commissions AFTER INSERT OR UPDATE OR DELETE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- Email templates table (pre-configured for future use)
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nome text NOT NULL,
  assunto text NOT NULL,
  corpo_html text NOT NULL,
  variaveis jsonb DEFAULT '[]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
ON public.email_templates FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view active templates"
ON public.email_templates FOR SELECT
TO authenticated
USING (ativo = true);

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
