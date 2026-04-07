
-- Fix: restrict webhook_relay_configs SELECT to admins/owners only
DROP POLICY IF EXISTS "Company members can view relay configs" ON public.webhook_relay_configs;

CREATE POLICY "Company admins can view relay configs"
  ON public.webhook_relay_configs
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR user_has_company_role(auth.uid(), company_id, 'owner'::membership_role)
    OR user_has_company_role(auth.uid(), company_id, 'admin'::membership_role)
  );

-- ============================================
-- CHECKOUT MERCADO PAGO - TABLES
-- ============================================

-- Payments table for one-time payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  mp_payment_id text,
  mp_preference_id text,
  status text NOT NULL DEFAULT 'pending',
  method text, -- pix, credit_card, boleto
  valor numeric NOT NULL,
  descricao text NOT NULL,
  payer_email text,
  payer_name text,
  pix_qr_code text,
  pix_qr_code_base64 text,
  boleto_url text,
  external_reference text,
  metadata jsonb DEFAULT '{}'::jsonb,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all payments"
  ON public.payments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company members can view their payments"
  ON public.payments FOR SELECT TO authenticated
  USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE INDEX idx_payments_company ON public.payments(company_id);
CREATE INDEX idx_payments_mp_id ON public.payments(mp_payment_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Subscriptions table for recurring payments
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mp_preapproval_id text,
  plan_name text NOT NULL,
  valor numeric NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly', -- monthly, yearly
  status text NOT NULL DEFAULT 'pending', -- pending, authorized, paused, cancelled
  payer_email text,
  payer_name text,
  init_point text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  external_reference text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Company members can view their subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE INDEX idx_subscriptions_company ON public.subscriptions(company_id);

-- Payment logs for webhook events
CREATE TABLE public.payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  mp_id text,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment logs"
  ON public.payment_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_payment_logs_payment ON public.payment_logs(payment_id);

-- Triggers for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
