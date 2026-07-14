-- 0046_pharmacy_acquisition_lifecycle.sql (Billy P4-14 minimal — repris par DEV pendant absence Billy)
-- Étend `pharmacy_acquisition` (créée en 0041) avec 3 colonnes de cycle de vie :
--   * last_seen_at      → mis à jour à chaque ping /api/signup/start (re-essais inclus)
--                         pour identifier les hésitants qui re-soumettent l'email.
--   * funnel_step       → état courant dans le tunnel d'acquisition. Décorrelé
--                         de `abandoned boolean` existant (0041) : `funnel_step`
--                         est l'état positif courant, `abandoned` reste le flag
--                         binaire final settable par un job/webhook ultérieur.
--   * abandoned_reason  → rempli plus tard par P4-14 complet (webhooks Stripe).
--
-- Additif et idempotent — aucun backfill nécessaire.

ALTER TABLE public.pharmacy_acquisition
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS funnel_step text,
  ADD COLUMN IF NOT EXISTS abandoned_reason text;

-- Contrainte CHECK posée séparément (ALTER ADD COLUMN ne supporte pas IF NOT
-- EXISTS sur les contraintes ; on wrap dans un bloc défensif).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.check_constraints
     WHERE constraint_schema = 'public'
       AND constraint_name = 'pharmacy_acquisition_funnel_step_check'
  ) THEN
    ALTER TABLE public.pharmacy_acquisition
      ADD CONSTRAINT pharmacy_acquisition_funnel_step_check
      CHECK (
        funnel_step IS NULL
        OR funnel_step IN (
          'started',
          'otp_sent',
          'confirmed',
          'pharmacy_created',
          'trial_started'
        )
      );
  END IF;
END $$;

-- Index partiel sur funnel_step pour les requêtes analytics ciblées (ex.
-- "combien d'hésitants bloqués à `started` depuis > 24h").
CREATE INDEX IF NOT EXISTS pharmacy_acquisition_funnel_step_idx
  ON public.pharmacy_acquisition(funnel_step)
  WHERE funnel_step IS NOT NULL;
