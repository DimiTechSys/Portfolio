-- 0004_drop_handover_and_cash_registers.sql
-- Supprime fond de caisse, colonnes de transmission sur work_sessions, et l’enum associé.
-- Nettoie les notifications de type transmission avant tout changement de schéma.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
  ) THEN
    DELETE FROM public.notifications
    WHERE type::text = 'handover_note';
  END IF;
END $$;

-- Fond de caisse (voir 0003_cash_registers.sql) — CASCADE supprime aussi les politiques RLS
DROP TABLE IF EXISTS public.cash_registers CASCADE;

-- Transmission (voir 0001_init.sql)
ALTER TABLE public.work_sessions
  DROP COLUMN IF EXISTS handover_note,
  DROP COLUMN IF EXISTS handover_target;

DROP TYPE IF EXISTS public.handover_target;
