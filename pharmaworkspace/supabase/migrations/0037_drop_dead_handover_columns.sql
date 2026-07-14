-- TECH-05 — Drop colonnes mortes héritées de `0017_rework_sessions` supprimé
--
-- Contexte : le 22/05/2026, on a supprimé `0017_rework_sessions.sql` parce
-- qu'il essayait de drop `work_sessions.tasks_completed`, colonne qui est
-- en fait toujours utilisée par le code (composant team-sessions-day-table,
-- ~10 refs dans lib/queries/sessions.ts). Mais 3 autres opérations de ce
-- fichier supprimé étaient légitimes : drop de colonnes vraiment mortes
-- (plus aucune référence dans le code, vérifié par grep le 23/05/2026).
--
-- Cette migration finit le job sans toucher à tasks_completed :
-- - tasks.completed_in_session (créée par 0001_init.sql ligne 70)
-- - work_sessions.handover_note (créée par 0001_init.sql ligne 59)
-- - work_sessions.handover_target (créée par 0001_init.sql ligne 60)
-- - enum public.handover_target (créé par 0001_init.sql ligne 18)
--
-- Idempotent : IF EXISTS partout. No-op sur tout env où les colonnes sont
-- déjà absentes.

ALTER TABLE public.tasks DROP COLUMN IF EXISTS completed_in_session;

ALTER TABLE public.work_sessions DROP COLUMN IF EXISTS handover_note;
ALTER TABLE public.work_sessions DROP COLUMN IF EXISTS handover_target;

-- DROP TYPE n'a pas de IF EXISTS direct sans risque (warning si dependances).
-- On wrap dans un DO block défensif : on drop seulement si plus rien ne
-- référence l'enum (les ALTER TABLE ci-dessus retirent la dernière référence).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'handover_target'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    DROP TYPE public.handover_target;
  END IF;
END $$;
