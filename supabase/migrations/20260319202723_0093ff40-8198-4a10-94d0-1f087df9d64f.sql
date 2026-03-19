-- Enum for finance nature
CREATE TYPE public.finance_nature AS ENUM ('fixo', 'variavel');

-- Add natureza column to finances
ALTER TABLE public.finances ADD COLUMN natureza finance_nature NOT NULL DEFAULT 'variavel';

-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  preco numeric,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  categoria text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Company members can view their products" ON public.products FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids(auth.uid())));
CREATE POLICY "Gestores can manage products" ON public.products FOR ALL TO authenticated USING (has_role(auth.uid(), 'gestor'::app_role));