
-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Credential categories enum
CREATE TYPE public.credential_category AS ENUM ('rede_social', 'aplicativo', 'email', 'hospedagem', 'dominio', 'outro');

-- Contracted app status enum
CREATE TYPE public.contracted_app_status AS ENUM ('ativo', 'suspenso', 'cancelado');

-- =============================================
-- Table: company_credentials (ADMIN-ONLY ACCESS)
-- =============================================
CREATE TABLE public.company_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  categoria credential_category NOT NULL DEFAULT 'outro',
  nome TEXT NOT NULL,
  usuario TEXT,
  senha_encrypted TEXT,
  url TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_credentials ENABLE ROW LEVEL SECURITY;

-- ONLY admins can access credentials - maximum security
CREATE POLICY "Admins can manage all credentials"
  ON public.company_credentials FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- No other policies - non-admins have zero access

-- Trigger for updated_at
CREATE TRIGGER update_company_credentials_updated_at
  BEFORE UPDATE ON public.company_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Table: contracted_apps
-- =============================================
CREATE TABLE public.contracted_apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  valor_mensal NUMERIC NOT NULL DEFAULT 0,
  dia_vencimento INTEGER NOT NULL DEFAULT 1 CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  status contracted_app_status NOT NULL DEFAULT 'ativo',
  url TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contracted_apps ENABLE ROW LEVEL SECURITY;

-- Admin and financeiro full access
CREATE POLICY "Admins can manage contracted apps"
  ON public.contracted_apps FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Financeiro can manage contracted apps"
  ON public.contracted_apps FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'financeiro'::app_role))
  WITH CHECK (has_role(auth.uid(), 'financeiro'::app_role));

-- Company members can view their contracted apps
CREATE POLICY "Company members can view contracted apps"
  ON public.contracted_apps FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

-- Trigger for updated_at
CREATE TRIGGER update_contracted_apps_updated_at
  BEFORE UPDATE ON public.contracted_apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activity log triggers
CREATE TRIGGER log_company_credentials_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.company_credentials
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_contracted_apps_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.contracted_apps
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- Disable realtime for credentials (security)
ALTER PUBLICATION supabase_realtime SET TABLE
  conversations, messages, alerts, agent_presence;
