
-- Junction table: which users can see which credentials
CREATE TABLE public.credential_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID NOT NULL REFERENCES public.company_credentials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(credential_id, user_id)
);

ALTER TABLE public.credential_access ENABLE ROW LEVEL SECURITY;

-- Only admins can manage access grants
CREATE POLICY "Admins can manage credential access"
  ON public.credential_access FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can see their own access entries
CREATE POLICY "Users can view own access"
  ON public.credential_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Now update company_credentials: add SELECT for granted users
CREATE POLICY "Granted users can view specific credentials"
  ON public.company_credentials FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT credential_id FROM public.credential_access
      WHERE user_id = auth.uid()
    )
  );

-- Disable realtime for security tables
ALTER PUBLICATION supabase_realtime SET TABLE
  conversations, messages, alerts, agent_presence;
