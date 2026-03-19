-- Add 'vendedor' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendedor';

-- Create commission_status enum
CREATE TYPE public.commission_status AS ENUM ('pendente', 'aprovada', 'paga');

-- Create salespeople table
CREATE TABLE public.salespeople (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  email text,
  telefone text,
  meta_mensal numeric DEFAULT 0,
  percentual_comissao numeric DEFAULT 10,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.salespeople ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage salespeople" ON public.salespeople FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Gestores can manage salespeople" ON public.salespeople FOR ALL TO authenticated USING (has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Company members can view salespeople" ON public.salespeople FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids(auth.uid())));
CREATE POLICY "Vendedores can view own record" ON public.salespeople FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Create commissions table
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id uuid REFERENCES public.salespeople(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  descricao text NOT NULL,
  valor_venda numeric NOT NULL DEFAULT 0,
  percentual numeric NOT NULL DEFAULT 0,
  valor_comissao numeric NOT NULL DEFAULT 0,
  status public.commission_status NOT NULL DEFAULT 'pendente',
  data_venda date NOT NULL DEFAULT CURRENT_DATE,
  data_pagamento date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commissions" ON public.commissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Gestores can manage commissions" ON public.commissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "Company members can view commissions" ON public.commissions FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids(auth.uid())));
CREATE POLICY "Vendedores can view own commissions" ON public.commissions FOR SELECT TO authenticated USING (salesperson_id IN (SELECT id FROM public.salespeople WHERE user_id = auth.uid()));

-- Add salesperson_id to leads
ALTER TABLE public.leads ADD COLUMN salesperson_id uuid REFERENCES public.salespeople(id) ON DELETE SET NULL;

-- Triggers for updated_at
CREATE TRIGGER update_salespeople_updated_at BEFORE UPDATE ON public.salespeople FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();