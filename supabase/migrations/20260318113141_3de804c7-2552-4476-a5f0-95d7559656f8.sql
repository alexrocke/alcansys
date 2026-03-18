
-- =============================================
-- FASE 1: MULTI-TENANCY - companies & memberships
-- =============================================

-- 1. Criar enum para roles de membership
CREATE TYPE public.membership_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');

-- 2. Criar tabela companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  plano text DEFAULT 'starter',
  ativo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 3. Criar tabela memberships
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 4. Adicionar company_id às tabelas existentes (nullable para não quebrar dados existentes)
ALTER TABLE public.projects ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.finances ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.automations ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.marketing_campaigns ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.alerts ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 5. Função helper: verificar se usuário pertence a uma empresa
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- 6. Função helper: verificar role do usuário na empresa
CREATE OR REPLACE FUNCTION public.user_has_company_role(_user_id uuid, _company_id uuid, _role membership_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id AND company_id = _company_id AND role = _role
  )
$$;

-- 7. Função helper: buscar companies do usuário
CREATE OR REPLACE FUNCTION public.get_user_company_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.memberships WHERE user_id = _user_id
$$;

-- 8. Trigger para updated_at nas novas tabelas
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. RLS para companies
CREATE POLICY "Users can view their companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.get_user_company_ids(auth.uid())));

CREATE POLICY "Alcansys admins can view all companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Alcansys admins can manage all companies"
  ON public.companies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. RLS para memberships
CREATE POLICY "Users can view memberships of their companies"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

CREATE POLICY "Alcansys admins can manage all memberships"
  ON public.memberships FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company owners can manage memberships"
  ON public.memberships FOR ALL
  TO authenticated
  USING (public.user_has_company_role(auth.uid(), company_id, 'owner'));

-- 11. Atualizar RLS das tabelas existentes para multi-tenancy
-- PROJECTS: adicionar policy para membros da empresa
CREATE POLICY "Company members can view their projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

-- CLIENTS
CREATE POLICY "Company members can view their clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

-- FINANCES
CREATE POLICY "Company members can view their finances"
  ON public.finances FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

-- AUTOMATIONS
CREATE POLICY "Company members can view their automations"
  ON public.automations FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

-- MARKETING
CREATE POLICY "Company members can view their campaigns"
  ON public.marketing_campaigns FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

-- DOCUMENTS
CREATE POLICY "Company members can view their documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

-- ALERTS
CREATE POLICY "Company members can view their alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

-- 12. Índices para performance
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_company_id ON public.memberships(company_id);
CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_finances_company_id ON public.finances(company_id);
CREATE INDEX idx_automations_company_id ON public.automations(company_id);
CREATE INDEX idx_marketing_campaigns_company_id ON public.marketing_campaigns(company_id);
CREATE INDEX idx_documents_company_id ON public.documents(company_id);
CREATE INDEX idx_alerts_company_id ON public.alerts(company_id);

-- 13. Habilitar Realtime para companies e memberships
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.memberships;
