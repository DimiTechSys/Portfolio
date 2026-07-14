-- 0027_repair_schema_drift.sql
-- Recrée 3 tables qui existaient en prod depuis le début mais n'avaient
-- jamais été versionnées dans les migrations (drift documenté CLAUDE.md §10,
-- découvert au setup staging du 21 mai 2026).
--
-- Inclut aussi une normalisation préventive de l'enum task_status pour
-- compenser un bug latent de 0013 (sa branche IF référence une fonction
-- handle_task_completed() qui n'a jamais existé, ni en prod ni dans les
-- migrations — 0013 prenait toujours la branche ELSE sur prod parce que
-- l'enum avait été modifié manuellement avant que 0013 ne tourne).
--
-- Schéma extrait depuis prod via SQL Editor — IDENTIQUE à prod.
-- Migration entièrement idempotente : no-op sur prod (tables déjà créées
-- manuellement à l'époque), fonctionnelle sur staging et tout nouvel env.
--
-- Voir supabase/MIGRATIONS_GUARDRAILS.md §0 et §7 pour le contexte complet.

-- ============================================================
-- 1) drug_shortages — référentiel ANSM partagé (lecture pour tout user auth).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.drug_shortages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cis             text NOT NULL,
  medication_name text,
  type            text,
  started_at      date,
  ends_at         date,
  ansm_url        text,
  imported_at     timestamptz NOT NULL DEFAULT now(),
  cip13           text
);

CREATE INDEX IF NOT EXISTS drug_shortages_cip13_idx
  ON public.drug_shortages (cip13)
  WHERE cip13 IS NOT NULL;

ALTER TABLE public.drug_shortages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS drug_shortages_select ON public.drug_shortages;
CREATE POLICY drug_shortages_select
  ON public.drug_shortages
  FOR SELECT
  USING (auth.uid() IS NOT NULL);


-- ============================================================
-- 2) notifications — notifications applicatives, pharmacy-scope.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  read_at     timestamptz,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_type_check CHECK (
    type = ANY (ARRAY[
      'task_assigned'::text,
      'shortage_reported'::text,
      'handover_note'::text
    ])
  )
);

CREATE INDEX IF NOT EXISTS notifications_user_id_read_at_created_at_idx
  ON public.notifications (user_id, read_at, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select
  ON public.notifications
  FOR SELECT
  USING (pharmacy_id = get_pharmacy_id());

DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    pharmacy_id = get_pharmacy_id()
    AND get_user_role() = ANY (ARRAY[
      'titulaire'::user_role,
      'adjoint'::user_role,
      'preparateur'::user_role
    ])
  );

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid() AND pharmacy_id = get_pharmacy_id())
  WITH CHECK (user_id = auth.uid() AND pharmacy_id = get_pharmacy_id());

DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete
  ON public.notifications
  FOR DELETE
  USING (user_id = auth.uid() AND pharmacy_id = get_pharmacy_id());


-- ============================================================
-- 3) prescription_items — lignes d'ordonnance, pharmacy-scope.
--    Note: une ancienne colonne `substitute` (ordinal_position 8) a été
--    dropée en prod ; on ne la recrée pas pour rester aligné.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prescription_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid    NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  pharmacy_id     uuid    NOT NULL REFERENCES public.pharmacies(id)    ON DELETE CASCADE,
  medication_name text    NOT NULL,
  dosage          text,
  quantity        integer NOT NULL DEFAULT 1,
  status          text    NOT NULL DEFAULT 'to_serve'::text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prescription_items_select ON public.prescription_items;
CREATE POLICY prescription_items_select
  ON public.prescription_items
  FOR SELECT
  USING (pharmacy_id = get_pharmacy_id());

DROP POLICY IF EXISTS prescription_items_insert ON public.prescription_items;
CREATE POLICY prescription_items_insert
  ON public.prescription_items
  FOR INSERT
  WITH CHECK (pharmacy_id = get_pharmacy_id());

DROP POLICY IF EXISTS prescription_items_update ON public.prescription_items;
CREATE POLICY prescription_items_update
  ON public.prescription_items
  FOR UPDATE
  USING (pharmacy_id = get_pharmacy_id());

DROP POLICY IF EXISTS prescription_items_delete ON public.prescription_items;
CREATE POLICY prescription_items_delete
  ON public.prescription_items
  FOR DELETE
  USING (
    pharmacy_id = get_pharmacy_id()
    AND get_user_role() = ANY (ARRAY[
      'titulaire'::user_role,
      'adjoint'::user_role
    ])
  );


-- ============================================================
-- 4) Normalisation préventive de l'enum task_status.
--    Sur prod : l'enum a déjà été normalisé manuellement avant 0013, donc 0013
--    prend la branche ELSE. Ce bloc est no-op (branche IF false).
--    Sur staging et fresh env : on normalise ICI avant que 0013 ne tourne
--    (en pré-appliquant 0027 manuellement via SQL Editor — cf. §10b solution A),
--    pour que 0013 prenne la même branche ELSE et n'essaie pas de créer un
--    trigger dont la fonction n'a jamais existé.
-- ============================================================

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

  IF NOT has_legacy_label THEN
    RAISE NOTICE '0027: task_status already normalized, skipping enum swap.';
    RETURN;
  END IF;

  -- Même logique que 0013 IF branch, MINUS le CREATE TRIGGER cassé à la fin.
  CREATE TYPE public.task_status_v2 AS ENUM ('todo', 'done', 'cancelled');

  UPDATE public.tasks
    SET status = 'todo'::public.task_status
    WHERE status::text = 'in_progress';

  ALTER TABLE public.tasks RENAME COLUMN status TO status_legacy;
  ALTER TABLE public.tasks
    ADD COLUMN status public.task_status_v2 NOT NULL DEFAULT 'todo';
  UPDATE public.tasks
    SET status = status_legacy::text::public.task_status_v2;
  ALTER TABLE public.tasks DROP COLUMN status_legacy;

  ALTER TYPE public.task_status RENAME TO task_status_legacy;
  ALTER TYPE public.task_status_v2 RENAME TO task_status;
  DROP TYPE public.task_status_legacy;

  RAISE NOTICE '0027: task_status normalized (in_progress label removed).';
END;
$$;
