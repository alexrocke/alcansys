-- Restrict payments SELECT to admin/financeiro only
DROP POLICY IF EXISTS "Company members can view their payments" ON public.payments;

CREATE POLICY "Admin and financeiro can view company payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
  AND company_id IN (SELECT get_user_company_ids(auth.uid()))
);

-- Restrict subscriptions SELECT to admin/financeiro only
DROP POLICY IF EXISTS "Company members can view their subscriptions" ON public.subscriptions;

CREATE POLICY "Admin and financeiro can view company subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
  AND company_id IN (SELECT get_user_company_ids(auth.uid()))
);