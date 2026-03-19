
-- Enums
CREATE TYPE public.quote_status AS ENUM ('pendente', 'em_analise', 'respondido', 'fechado');
CREATE TYPE public.invoice_status AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');
CREATE TYPE public.client_system_type AS ENUM ('landing_page', 'sistema', 'automacao', 'chatbot', 'outro');
CREATE TYPE public.client_system_status AS ENUM ('ativo', 'inativo', 'em_desenvolvimento');

-- Services catalog
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  categoria text,
  preco_base numeric,
  ativo boolean NOT NULL DEFAULT true,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active services" ON public.services FOR SELECT TO authenticated USING (ativo = true);
CREATE POLICY "Admins can manage services" ON public.services FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Quote requests
CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  nome_contato text NOT NULL,
  email text,
  telefone text,
  mensagem text,
  status public.quote_status NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view their quotes" ON public.quote_requests FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids(auth.uid())));
CREATE POLICY "Company members can insert quotes" ON public.quote_requests FOR INSERT TO authenticated WITH CHECK (company_id IN (SELECT get_user_company_ids(auth.uid())));
CREATE POLICY "Admins can manage all quotes" ON public.quote_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Invoices
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  valor numeric NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'pendente',
  data_vencimento date NOT NULL,
  data_pagamento date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view their invoices" ON public.invoices FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids(auth.uid())));
CREATE POLICY "Admins can manage all invoices" ON public.invoices FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Client systems
CREATE TABLE public.client_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo public.client_system_type NOT NULL DEFAULT 'sistema',
  url text,
  status public.client_system_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view their systems" ON public.client_systems FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids(auth.uid())));
CREATE POLICY "Admins can manage all systems" ON public.client_systems FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
