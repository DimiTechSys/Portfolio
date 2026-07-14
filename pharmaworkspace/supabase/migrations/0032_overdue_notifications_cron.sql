-- 0032_overdue_notifications_cron.sql
-- P2-05 + P2-06 : notifications automatiques pour tâches et locations en retard.
-- Prérequis : extension pg_cron activée (Supabase Dashboard → Database → Extensions).

-- Étendre les types de notifications autorisés.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type = ANY (
      ARRAY[
        'task_assigned'::text,
        'shortage_reported'::text,
        'handover_note'::text,
        'task_overdue'::text,
        'rental_overdue'::text
      ]
    )
  );

CREATE OR REPLACE FUNCTION public.create_overdue_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tâches en retard (due_date passée, encore à faire, assignées)
  INSERT INTO public.notifications (pharmacy_id, user_id, type, title, body, metadata)
  SELECT
    t.pharmacy_id,
    t.assigned_to,
    'task_overdue',
    'Tâche en retard',
    'La tâche "' || t.title || '" a dépassé son échéance.',
    jsonb_build_object(
      'task_id', t.id,
      'target_url', '/tasks'
    )
  FROM public.tasks t
  WHERE t.due_date IS NOT NULL
    AND t.due_date < CURRENT_DATE
    AND t.status = 'todo'
    AND t.assigned_to IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.type = 'task_overdue'
        AND n.user_id = t.assigned_to
        AND n.metadata->>'task_id' = t.id::text
    );

  -- Locations en retard (titulaire + adjoint de l'officine)
  INSERT INTO public.notifications (pharmacy_id, user_id, type, title, body, metadata)
  SELECT DISTINCT
    r.pharmacy_id,
    p.id,
    'rental_overdue',
    'Location en retard',
    'La location "' || r.equipment || '" devait être rendue le '
      || to_char(r.expected_return, 'DD/MM/YYYY') || '.',
    jsonb_build_object(
      'domain', 'rental',
      'rental_id', r.id,
      'target_url', '/rentals'
    )
  FROM public.rentals r
  JOIN public.profiles p
    ON p.pharmacy_id = r.pharmacy_id
   AND p.role IN ('titulaire', 'adjoint')
  WHERE r.expected_return < CURRENT_DATE
    AND r.status = 'active'
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.type = 'rental_overdue'
        AND n.user_id = p.id
        AND n.metadata->>'rental_id' = r.id::text
    );
END;
$$;

-- Planification horaire (skip si pg_cron absent, ex. certains environnements locaux).
DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE '0032: pg_cron non activé — create_overdue_notifications() créée, cron.schedule ignoré.';
    RETURN;
  END IF;

  SELECT jobid
  INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'create-overdue-notifications-hourly';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'create-overdue-notifications-hourly',
    '0 * * * *',
    'SELECT public.create_overdue_notifications();'
  );
END;
$$;
