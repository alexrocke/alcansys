
-- =============================================
-- FASE 2: PROJECT TASKS - Checklist, Timeline, Progresso
-- =============================================

-- 1. Enum para prioridade de tarefas
CREATE TYPE public.task_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- 2. Enum para status de tarefas
CREATE TYPE public.task_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');

-- 3. Tabela project_tasks
CREATE TABLE public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  status task_status NOT NULL DEFAULT 'pendente',
  prioridade task_priority NOT NULL DEFAULT 'media',
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  data_inicio date,
  data_fim date,
  data_conclusao date,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- 4. Trigger updated_at
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS policies
CREATE POLICY "Admins and gestores can manage project tasks"
  ON public.project_tasks FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor'));

CREATE POLICY "Authenticated users can view project tasks"
  ON public.project_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Company members can view their project tasks"
  ON public.project_tasks FOR SELECT
  TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

-- 6. Índices
CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_company_id ON public.project_tasks(company_id);
CREATE INDEX idx_project_tasks_responsavel_id ON public.project_tasks(responsavel_id);
CREATE INDEX idx_project_tasks_status ON public.project_tasks(status);

-- 7. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_tasks;
