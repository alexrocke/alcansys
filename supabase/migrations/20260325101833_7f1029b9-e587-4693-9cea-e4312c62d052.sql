
-- Trigger: Novo lead criado → alerta
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.alerts (tipo, mensagem, company_id)
  VALUES ('critico', 'Novo lead: ' || NEW.nome || ' (' || COALESCE(NEW.empresa, 'sem empresa') || ')', NEW.company_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_lead
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_lead();

-- Trigger: Nova conversa WhatsApp → alerta
CREATE OR REPLACE FUNCTION public.notify_new_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.alerts (tipo, mensagem, company_id)
  VALUES ('informativo', 'Nova conversa de ' || NEW.contato_nome || COALESCE(' (' || NEW.contato_telefone || ')', ''), NEW.company_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_conversation
AFTER INSERT ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_conversation();

-- Trigger: Fatura criada → alerta
CREATE OR REPLACE FUNCTION public.notify_new_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.alerts (tipo, mensagem, company_id)
  VALUES ('importante', 'Nova fatura: R$ ' || NEW.valor || ' - ' || NEW.descricao || ' (vence em ' || NEW.data_vencimento || ')', NEW.company_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_invoice
AFTER INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_invoice();

-- Trigger: Tarefa concluída com atraso → alerta
CREATE OR REPLACE FUNCTION public.notify_task_overdue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'concluida' AND OLD.status != 'concluida' AND NEW.data_fim IS NOT NULL AND NEW.data_conclusao > NEW.data_fim THEN
    INSERT INTO public.alerts (tipo, mensagem, company_id, project_id)
    VALUES ('tarefa_atrasada', 'Tarefa concluída com atraso: ' || NEW.titulo, NEW.company_id, NEW.project_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_task_overdue
AFTER UPDATE ON public.project_tasks
FOR EACH ROW
EXECUTE FUNCTION public.notify_task_overdue();
