
-- CLIENTS
DROP POLICY IF EXISTS "Admins and gestores can manage clients" ON public.clients;
CREATE POLICY "Admins can manage all clients" ON public.clients FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Gestores can manage clients in own company" ON public.clients FOR ALL
  USING (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id));

-- COMMISSIONS
DROP POLICY IF EXISTS "Gestores can manage commissions" ON public.commissions;
CREATE POLICY "Gestores can manage commissions in own company" ON public.commissions FOR ALL
  USING (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id));

-- PRODUCTS
DROP POLICY IF EXISTS "Gestores can manage products" ON public.products;
CREATE POLICY "Gestores can manage products in own company" ON public.products FOR ALL
  USING (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id));

-- SALESPEOPLE
DROP POLICY IF EXISTS "Gestores can manage salespeople" ON public.salespeople;
CREATE POLICY "Gestores can manage salespeople in own company" ON public.salespeople FOR ALL
  USING (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id));

-- DOCUMENTS
DROP POLICY IF EXISTS "Admins and gestores can manage documents" ON public.documents;
CREATE POLICY "Admins can manage all documents" ON public.documents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Gestores can manage documents in own company" ON public.documents FOR ALL
  USING (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id));

-- PROJECT_TASKS
DROP POLICY IF EXISTS "Admins and gestores can manage project tasks" ON public.project_tasks;
CREATE POLICY "Admins can manage all project tasks" ON public.project_tasks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Gestores can manage project tasks in own company" ON public.project_tasks FOR ALL
  USING (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id));

-- PROJECTS
DROP POLICY IF EXISTS "Admins and gestores can manage projects" ON public.projects;
CREATE POLICY "Admins can manage all projects" ON public.projects FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Gestores can manage projects in own company" ON public.projects FOR ALL
  USING (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (has_role(auth.uid(), 'gestor'::app_role) AND user_belongs_to_company(auth.uid(), company_id));

-- MARKETING CAMPAIGNS
DROP POLICY IF EXISTS "Admins and marketing can manage campaigns" ON public.marketing_campaigns;
CREATE POLICY "Admins can manage all campaigns" ON public.marketing_campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Marketing can manage campaigns in own company" ON public.marketing_campaigns FOR ALL
  USING (has_role(auth.uid(), 'marketing'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (has_role(auth.uid(), 'marketing'::app_role) AND user_belongs_to_company(auth.uid(), company_id));

-- CONTRACTED APPS
DROP POLICY IF EXISTS "Financeiro can manage contracted apps" ON public.contracted_apps;
CREATE POLICY "Financeiro can manage contracted apps in own company" ON public.contracted_apps FOR ALL
  USING (has_role(auth.uid(), 'financeiro'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (has_role(auth.uid(), 'financeiro'::app_role) AND user_belongs_to_company(auth.uid(), company_id));

-- FINANCES
DROP POLICY IF EXISTS "Admins and financeiro can manage finances" ON public.finances;
DROP POLICY IF EXISTS "Admins and financeiro can view finances" ON public.finances;
CREATE POLICY "Admins can manage all finances" ON public.finances FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Financeiro can manage finances in own company" ON public.finances FOR ALL
  USING (has_role(auth.uid(), 'financeiro'::app_role) AND user_belongs_to_company(auth.uid(), company_id))
  WITH CHECK (has_role(auth.uid(), 'financeiro'::app_role) AND user_belongs_to_company(auth.uid(), company_id));

-- SETTINGS: restringir SELECT a admins
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.settings;
CREATE POLICY "Admins can view settings" ON public.settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- AUTOMATION COMBO ITEMS: apenas de combos ativos
DROP POLICY IF EXISTS "Authenticated can view combo items" ON public.automation_combo_items;
CREATE POLICY "Authenticated can view active combo items" ON public.automation_combo_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_combos c
      WHERE c.id = automation_combo_items.combo_id AND c.ativo = true
    )
  );
