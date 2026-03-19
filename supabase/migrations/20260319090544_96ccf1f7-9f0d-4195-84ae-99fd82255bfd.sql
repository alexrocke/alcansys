-- PHASE 4: Leads & CRM + PHASE 5: Conversations

CREATE TYPE public.lead_status AS ENUM ('novo', 'contatado', 'qualificado', 'proposta', 'negociacao', 'ganho', 'perdido');
CREATE TYPE public.lead_origin AS ENUM ('site', 'whatsapp', 'indicacao', 'campanha', 'organico', 'outro');

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text,
  telefone text,
  empresa text,
  cargo text,
  status lead_status NOT NULL DEFAULT 'novo',
  origem lead_origin NOT NULL DEFAULT 'outro',
  valor_estimado numeric,
  tags text[] DEFAULT '{}',
  responsavel_id uuid REFERENCES public.profiles(id),
  notas text,
  data_conversao date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'nota',
  descricao text NOT NULL,
  autor_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their leads" ON public.leads FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids(auth.uid())));
CREATE POLICY "Company owners/admins can manage leads" ON public.leads FOR ALL TO authenticated USING (user_has_company_role(auth.uid(), company_id, 'owner') OR user_has_company_role(auth.uid(), company_id, 'admin') OR user_has_company_role(auth.uid(), company_id, 'manager'));
CREATE POLICY "Admins can manage all leads" ON public.leads FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Company members can view their contacts" ON public.contacts FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids(auth.uid())));
CREATE POLICY "Company owners/admins can manage contacts" ON public.contacts FOR ALL TO authenticated USING (user_has_company_role(auth.uid(), company_id, 'owner') OR user_has_company_role(auth.uid(), company_id, 'admin') OR user_has_company_role(auth.uid(), company_id, 'manager'));
CREATE POLICY "Admins can manage all contacts" ON public.contacts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_leads_company ON public.leads(company_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_contacts_lead ON public.contacts(lead_id);

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PHASE 5: Conversations
CREATE TYPE public.conversation_status AS ENUM ('aberta', 'em_atendimento', 'aguardando', 'resolvida', 'arquivada');
CREATE TYPE public.attendant_type AS ENUM ('ia', 'humano');
CREATE TYPE public.message_direction AS ENUM ('incoming', 'outgoing');

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES public.channels(id),
  lead_id uuid REFERENCES public.leads(id),
  instance_id uuid REFERENCES public.whatsapp_instances(id),
  contato_nome text NOT NULL,
  contato_telefone text,
  status conversation_status NOT NULL DEFAULT 'aberta',
  atendente_tipo attendant_type NOT NULL DEFAULT 'ia',
  atendente_id uuid REFERENCES public.profiles(id),
  ultima_mensagem text,
  ultima_mensagem_at timestamptz,
  mensagens_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  direction message_direction NOT NULL,
  content text NOT NULL,
  sender_type attendant_type,
  sender_id uuid REFERENCES public.profiles(id),
  metadata jsonb DEFAULT '{}',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their conversations" ON public.conversations FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids(auth.uid())));
CREATE POLICY "Company owners/admins can manage conversations" ON public.conversations FOR ALL TO authenticated USING (user_has_company_role(auth.uid(), company_id, 'owner') OR user_has_company_role(auth.uid(), company_id, 'admin') OR user_has_company_role(auth.uid(), company_id, 'manager'));
CREATE POLICY "Admins can manage all conversations" ON public.conversations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Company members can view their messages" ON public.messages FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids(auth.uid())));
CREATE POLICY "Company owners/admins can manage messages" ON public.messages FOR ALL TO authenticated USING (user_has_company_role(auth.uid(), company_id, 'owner') OR user_has_company_role(auth.uid(), company_id, 'admin') OR user_has_company_role(auth.uid(), company_id, 'manager'));
CREATE POLICY "Admins can manage all messages" ON public.messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_conversations_company ON public.conversations(company_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;