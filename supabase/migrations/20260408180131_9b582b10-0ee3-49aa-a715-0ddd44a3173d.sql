
-- Tabela principal de combos
CREATE TABLE public.automation_combos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  preco_original numeric NOT NULL DEFAULT 0,
  preco_combo numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  company_id uuid REFERENCES public.companies(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage combos" ON public.automation_combos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view active combos" ON public.automation_combos FOR SELECT TO authenticated USING (ativo = true);

CREATE TRIGGER update_automation_combos_updated_at BEFORE UPDATE ON public.automation_combos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de itens do combo (relacionamento N:N com workflow_templates)
CREATE TABLE public.automation_combo_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id uuid NOT NULL REFERENCES public.automation_combos(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(combo_id, template_id)
);

ALTER TABLE public.automation_combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage combo items" ON public.automation_combo_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view combo items" ON public.automation_combo_items FOR SELECT TO authenticated USING (true);
