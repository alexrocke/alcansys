
CREATE TABLE public.project_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'outro',
  usuario TEXT, senha_encrypted TEXT, url TEXT, observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_credentials TO authenticated;
GRANT ALL ON public.project_credentials TO service_role;
ALTER TABLE public.project_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc_read" ON public.project_credentials FOR SELECT TO authenticated USING (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "pc_write" ON public.project_credentials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner'));
CREATE TRIGGER trg_pc_upd BEFORE UPDATE ON public.project_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL, descricao TEXT,
  data_prevista DATE, data_entrega DATE,
  status TEXT NOT NULL DEFAULT 'pendente', ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_milestones TO authenticated;
GRANT ALL ON public.project_milestones TO service_role;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_read" ON public.project_milestones FOR SELECT TO authenticated USING (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "pm_write" ON public.project_milestones FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner'));
CREATE TRIGGER trg_pm_upd BEFORE UPDATE ON public.project_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'contrato',
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  url_arquivo TEXT, data_assinatura DATE, valor NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'pendente', observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_contracts TO authenticated;
GRANT ALL ON public.project_contracts TO service_role;
ALTER TABLE public.project_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pctr_read" ON public.project_contracts FOR SELECT TO authenticated USING (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "pctr_write" ON public.project_contracts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner'));
CREATE TRIGGER trg_pctr_upd BEFORE UPDATE ON public.project_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL, data TIMESTAMPTZ NOT NULL DEFAULT now(),
  participantes TEXT[] DEFAULT '{}', ata TEXT, link_gravacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_meetings TO authenticated;
GRANT ALL ON public.project_meetings TO service_role;
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pmt_read" ON public.project_meetings FOR SELECT TO authenticated USING (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "pmt_write" ON public.project_meetings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner'));
CREATE TRIGGER trg_pmt_upd BEFORE UPDATE ON public.project_meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL, descricao TEXT,
  impacto TEXT NOT NULL DEFAULT 'medio', probabilidade TEXT NOT NULL DEFAULT 'media',
  mitigacao TEXT, responsavel_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_risks TO authenticated;
GRANT ALL ON public.project_risks TO service_role;
ALTER TABLE public.project_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr_read" ON public.project_risks FOR SELECT TO authenticated USING (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "pr_write" ON public.project_risks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner'));
CREATE TRIGGER trg_pr_upd BEFORE UPDATE ON public.project_risks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, cargo TEXT, email TEXT, telefone TEXT,
  papel TEXT NOT NULL DEFAULT 'outro', observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_stakeholders TO authenticated;
GRANT ALL ON public.project_stakeholders TO service_role;
ALTER TABLE public.project_stakeholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_read" ON public.project_stakeholders FOR SELECT TO authenticated USING (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "ps_write" ON public.project_stakeholders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner'));
CREATE TRIGGER trg_ps_upd BEFORE UPDATE ON public.project_stakeholders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'producao',
  url TEXT, branch TEXT, repo_url TEXT, deploy_provider TEXT, observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_environments TO authenticated;
GRANT ALL ON public.project_environments TO service_role;
ALTER TABLE public.project_environments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pe_read" ON public.project_environments FOR SELECT TO authenticated USING (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "pe_write" ON public.project_environments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner'));
CREATE TRIGGER trg_pe_upd BEFORE UPDATE ON public.project_environments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL, descricao TEXT,
  valor_alvo NUMERIC(14,2), valor_atual NUMERIC(14,2) DEFAULT 0,
  unidade TEXT DEFAULT '', prazo DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_kpis TO authenticated;
GRANT ALL ON public.project_kpis TO service_role;
ALTER TABLE public.project_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pk_read" ON public.project_kpis FOR SELECT TO authenticated USING (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "pk_write" ON public.project_kpis FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner'));
CREATE TRIGGER trg_pk_upd BEFORE UPDATE ON public.project_kpis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  data_inicio_garantia DATE, data_fim_garantia DATE,
  horas_contratadas NUMERIC(8,2) DEFAULT 0, horas_consumidas NUMERIC(8,2) DEFAULT 0,
  chamados_abertos INT DEFAULT 0, observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_support TO authenticated;
GRANT ALL ON public.project_support TO service_role;
ALTER TABLE public.project_support ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psup_read" ON public.project_support FOR SELECT TO authenticated USING (public.user_belongs_to_company(auth.uid(), company_id));
CREATE POLICY "psup_write" ON public.project_support FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.user_has_company_role(auth.uid(), company_id, 'manager') OR public.user_has_company_role(auth.uid(), company_id, 'owner'));
CREATE TRIGGER trg_psup_upd BEFORE UPDATE ON public.project_support FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);
