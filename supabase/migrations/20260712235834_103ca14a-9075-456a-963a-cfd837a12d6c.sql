CREATE TABLE public.project_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  categoria text NOT NULL CHECK (categoria IN ('dominio','supabase','resend','api','outro')),
  nome text NOT NULL,
  valor text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo','pendente')),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_integrations TO authenticated;
GRANT ALL ON public.project_integrations TO service_role;

ALTER TABLE public.project_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view project integrations"
  ON public.project_integrations FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "admins manage project integrations"
  ON public.project_integrations FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.user_has_company_role(auth.uid(), company_id, 'admin'::membership_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.user_has_company_role(auth.uid(), company_id, 'admin'::membership_role)
  );

CREATE INDEX idx_project_integrations_project ON public.project_integrations(project_id);
CREATE TRIGGER trg_project_integrations_updated
  BEFORE UPDATE ON public.project_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();