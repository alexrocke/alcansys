
CREATE TABLE public.webhook_relay_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  whatsapp_instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  phone_number text,
  instance_name text,
  relay_url text NOT NULL,
  relay_secret text,
  relay_headers jsonb DEFAULT '{}'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_relay_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage relay configs"
  ON public.webhook_relay_configs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company owners/admins can manage relay configs"
  ON public.webhook_relay_configs FOR ALL
  TO authenticated
  USING (
    user_has_company_role(auth.uid(), company_id, 'owner'::membership_role)
    OR user_has_company_role(auth.uid(), company_id, 'admin'::membership_role)
  );

CREATE POLICY "Company members can view relay configs"
  ON public.webhook_relay_configs FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT get_user_company_ids(auth.uid())));
