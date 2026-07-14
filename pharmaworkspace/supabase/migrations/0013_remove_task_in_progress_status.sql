-- 0013_remove_task_in_progress_status.sql
-- Remove legacy `in_progress` from task_status enum.
-- Mapping rule: `in_progress` -> `todo`.

DO $$
DECLARE
  has_legacy_label boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typname = 'task_status'
      AND e.enumlabel = 'in_progress'
  ) INTO has_legacy_label;

  IF has_legacy_label THEN
    CREATE TYPE public.task_status_v2 AS ENUM ('todo', 'done', 'cancelled');

    -- Trigger depends on `status`; drop it during column swap.
    DROP TRIGGER IF EXISTS task_completion_trigger ON public.tasks;

    UPDATE public.tasks
    SET status = 'todo'::public.task_status
    WHERE status::text = 'in_progress';

    ALTER TABLE public.tasks
      RENAME COLUMN status TO status_legacy;

    ALTER TABLE public.tasks
      ADD COLUMN status public.task_status_v2 NOT NULL DEFAULT 'todo';

    UPDATE public.tasks
    SET status = status_legacy::text::public.task_status_v2;

    ALTER TABLE public.tasks
      DROP COLUMN status_legacy;

    ALTER TYPE public.task_status RENAME TO task_status_legacy;
    ALTER TYPE public.task_status_v2 RENAME TO task_status;
    DROP TYPE public.task_status_legacy;

    CREATE TRIGGER task_completion_trigger
      BEFORE UPDATE ON public.tasks
      FOR EACH ROW EXECUTE FUNCTION public.handle_task_completed();
  ELSE
    RAISE NOTICE '0013: task_status already normalized, skipping';
  END IF;
END;
$$;
