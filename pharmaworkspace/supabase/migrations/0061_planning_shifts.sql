-- 0061 — Rework planning : shifts réutilisables + affectations par date + demi-journées AM/PM
--
-- Contexte (revue du module planning, juin 2026) :
--   1. Demi-journées : leave_requests n'avait que half_day_start/half_day_end
--      (booléens) → impossible de distinguer une absence le matin vs l'après-midi.
--      On ajoute start_period / end_period ('full' | 'am' | 'pm').
--   2/4. Le titulaire ne pouvait pas définir la présence : weekly_schedules était
--      récurrente et JAMAIS écrite par l'app, et sans notion de rôle (ouverture /
--      fermeture / garde). On introduit :
--        - shift_templates : modèles réutilisables par officine (nom + heures +
--          pause + type), définis par le titulaire.
--        - shift_assignments : affectation d'un modèle à un collaborateur POUR
--          UNE DATE (donc semaine X ≠ semaine Y, plusieurs shifts/jour possibles
--          pour gérer une coupure).
--
-- weekly_schedules est conservée (non supprimée) mais n'est plus la source du
-- planning. Idempotente (rejouable).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Demi-journées matin / après-midi sur les congés
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS start_period text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS end_period text NOT NULL DEFAULT 'full';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leave_requests_start_period_check'
  ) THEN
    ALTER TABLE public.leave_requests
      ADD CONSTRAINT leave_requests_start_period_check
      CHECK (start_period = ANY (ARRAY['full'::text, 'am'::text, 'pm'::text]));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leave_requests_end_period_check'
  ) THEN
    ALTER TABLE public.leave_requests
      ADD CONSTRAINT leave_requests_end_period_check
      CHECK (end_period = ANY (ARRAY['full'::text, 'am'::text, 'pm'::text]));
  END IF;
END $$;

COMMENT ON COLUMN public.leave_requests.start_period IS
  'Période d''absence le jour de début : full (journée), am (matin), pm (après-midi). Remplace half_day_start.';
COMMENT ON COLUMN public.leave_requests.end_period IS
  'Période d''absence le jour de fin : full (journée), am (matin), pm (après-midi). Remplace half_day_end.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Modèles de shifts réutilisables (définis par le titulaire)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shift_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  pharmacy_id uuid NOT NULL,
  name text NOT NULL,
  -- type de shift : pilote la couleur + la sémantique métier
  kind text NOT NULL DEFAULT 'custom',
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  break_start time without time zone,
  break_end time without time zone,
  color text,
  archived_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT shift_templates_pkey PRIMARY KEY (id),
  -- end_time = start_time interdit ; end < start AUTORISÉ (shift de nuit / garde 20h→08h)
  CONSTRAINT shift_templates_time_check CHECK (end_time <> start_time),
  CONSTRAINT shift_templates_kind_check CHECK (
    kind = ANY (ARRAY['ouverture'::text, 'fermeture'::text, 'journee'::text, 'garde'::text, 'custom'::text])
  ),
  CONSTRAINT shift_templates_pharmacy_fkey FOREIGN KEY (pharmacy_id)
    REFERENCES public.pharmacies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS shift_templates_pharmacy_idx
  ON public.shift_templates (pharmacy_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Affectations de shift (un modèle → un collaborateur → une date)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shift_assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  pharmacy_id uuid NOT NULL,
  user_id uuid NOT NULL,
  template_id uuid NOT NULL,
  "date" date NOT NULL,
  note text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT shift_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT shift_assignments_pharmacy_fkey FOREIGN KEY (pharmacy_id)
    REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  CONSTRAINT shift_assignments_user_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT shift_assignments_template_fkey FOREIGN KEY (template_id)
    REFERENCES public.shift_templates(id) ON DELETE CASCADE
);

-- Plusieurs shifts/jour autorisés (coupure) mais pas deux fois le même modèle.
CREATE UNIQUE INDEX IF NOT EXISTS shift_assignments_unique_idx
  ON public.shift_assignments (user_id, "date", template_id);
CREATE INDEX IF NOT EXISTS shift_assignments_pharmacy_date_idx
  ON public.shift_assignments (pharmacy_id, "date");

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS — lecture par tous les membres de l'officine, écriture titulaire only
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shift_templates_select ON public.shift_templates;
CREATE POLICY shift_templates_select ON public.shift_templates
  FOR SELECT TO authenticated
  USING (pharmacy_id = (SELECT public.get_pharmacy_id()));

DROP POLICY IF EXISTS shift_templates_write ON public.shift_templates;
CREATE POLICY shift_templates_write ON public.shift_templates
  FOR ALL TO authenticated
  USING (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND (SELECT public.get_user_role()) = 'titulaire'::public.user_role
  )
  WITH CHECK (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND (SELECT public.get_user_role()) = 'titulaire'::public.user_role
  );

DROP POLICY IF EXISTS shift_assignments_select ON public.shift_assignments;
CREATE POLICY shift_assignments_select ON public.shift_assignments
  FOR SELECT TO authenticated
  USING (pharmacy_id = (SELECT public.get_pharmacy_id()));

DROP POLICY IF EXISTS shift_assignments_write ON public.shift_assignments;
CREATE POLICY shift_assignments_write ON public.shift_assignments
  FOR ALL TO authenticated
  USING (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND (SELECT public.get_user_role()) = 'titulaire'::public.user_role
  )
  WITH CHECK (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND (SELECT public.get_user_role()) = 'titulaire'::public.user_role
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Grants (cohérent avec 0058 : authenticated + service_role, pas anon)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shift_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shift_assignments TO authenticated;
GRANT ALL ON TABLE public.shift_templates TO service_role;
GRANT ALL ON TABLE public.shift_assignments TO service_role;
