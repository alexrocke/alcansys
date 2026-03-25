
-- Tabela de presença de agentes
CREATE TABLE public.agent_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  last_seen_at timestamptz DEFAULT now(),
  status text DEFAULT 'online',
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.agent_presence ENABLE ROW LEVEL SECURITY;

-- Company members can view presence
CREATE POLICY "Company members can view agent presence"
ON public.agent_presence
FOR SELECT
TO authenticated
USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

-- Users can upsert their own presence
CREATE POLICY "Users can upsert own presence"
ON public.agent_presence
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can view all presence
CREATE POLICY "Admins can view all presence"
ON public.agent_presence
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add lock columns to conversations
ALTER TABLE public.conversations
  ADD COLUMN locked_by uuid REFERENCES auth.users(id),
  ADD COLUMN locked_at timestamptz;
