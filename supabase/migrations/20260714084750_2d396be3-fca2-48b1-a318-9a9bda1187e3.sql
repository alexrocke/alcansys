DROP POLICY IF EXISTS "Admins and financeiro can manage finances" ON public.finances;
DROP POLICY IF EXISTS "Admins and financeiro can view finances" ON public.finances;

CREATE POLICY "Admins and financeiro can view finances"
ON public.finances
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'financeiro'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
);

CREATE POLICY "Admins and financeiro can manage finances"
ON public.finances
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'financeiro'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'financeiro'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
);