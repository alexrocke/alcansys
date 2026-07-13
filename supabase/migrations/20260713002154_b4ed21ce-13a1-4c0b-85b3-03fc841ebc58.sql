
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.check_project_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marcos atrasados
  INSERT INTO public.alerts (tipo, mensagem, company_id, project_id)
  SELECT 'tarefa_atrasada',
         'Marco atrasado: ' || m.titulo || ' (previsto para ' || m.data_prevista || ')',
         m.company_id, m.project_id
  FROM public.project_milestones m
  WHERE m.status <> 'concluido'
    AND m.data_prevista IS NOT NULL
    AND m.data_entrega IS NULL
    AND m.data_prevista < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.project_id = m.project_id
        AND a.mensagem LIKE 'Marco atrasado: ' || m.titulo || '%'
        AND a.created_at > now() - interval '7 days'
    );

  -- Garantia expirando
  INSERT INTO public.alerts (tipo, mensagem, company_id, project_id)
  SELECT 'importante',
         'Garantia do projeto vence em ' || (s.data_fim_garantia - CURRENT_DATE) || ' dias',
         s.company_id, s.project_id
  FROM public.project_support s
  WHERE s.data_fim_garantia IS NOT NULL
    AND s.data_fim_garantia >= CURRENT_DATE
    AND s.data_fim_garantia <= CURRENT_DATE + 30
    AND NOT EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.project_id = s.project_id
        AND a.mensagem LIKE 'Garantia do projeto vence%'
        AND a.created_at > now() - interval '7 days'
    );

  -- Horas de suporte ≥ 80%
  INSERT INTO public.alerts (tipo, mensagem, company_id, project_id)
  SELECT 'critico',
         'Horas de suporte consumidas: ' || ROUND((s.horas_consumidas / s.horas_contratadas) * 100) || '%',
         s.company_id, s.project_id
  FROM public.project_support s
  WHERE s.horas_contratadas > 0
    AND (s.horas_consumidas / s.horas_contratadas) >= 0.8
    AND NOT EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.project_id = s.project_id
        AND a.mensagem LIKE 'Horas de suporte consumidas%'
        AND a.created_at > now() - interval '7 days'
    );
END;
$$;

SELECT cron.schedule('project-alerts-daily', '0 8 * * *', $$SELECT public.check_project_alerts();$$);
