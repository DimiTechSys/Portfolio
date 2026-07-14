-- 0042_pharmacies_stripe_columns.sql
-- Colonnes Stripe sur public.pharmacies pour le trial intégré (P4-13b).
-- Pivot 2 (mai 2026) : CB obligatoire à la 4ᵉ étape onboarding, trial 30j
-- auto-renouvelé par Stripe, plus de page paywall séparée. Le middleware
-- redirige selon subscription_status.
--
-- Contrats §B8 portés par cette migration :
--   #4 : colonnes + enum subscription_status (consommé par Dim getWizardStep + Mehdi proxy)
--   #7 : nouvelle pharmacie créée par Dim P2-01 step 1 doit setter subscription_status='incomplete'
--
-- Migration idempotente (ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS,
-- DROP / CREATE pour les CHECK constraints pour éviter le doublon).

-- ---------------------------------------------------------------------------
-- 1. Identifiants Stripe (Customer + Subscription)
-- ---------------------------------------------------------------------------

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Un Customer Stripe ne peut être lié qu'à UNE seule pharmacie de notre côté.
-- L'unicité est partielle : on autorise plusieurs rows à NULL (les pharmacies
-- créées avant cette migration ou en étape de wizard incomplete).
CREATE UNIQUE INDEX IF NOT EXISTS pharmacies_stripe_customer_id_uidx
  ON public.pharmacies(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pharmacies_stripe_subscription_id_uidx
  ON public.pharmacies(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. État abonnement (subscription_status)
-- ---------------------------------------------------------------------------
-- Reflète directement l'état Stripe :
--   NULL ou 'incomplete' : CB pas encore saisie → onboarding step 4 bloquant
--   'trialing'           : CB saisie, 30j gratuits en cours → accès produit OK
--   'active'             : prélèvement J+30 réussi, abonnement en cours → accès produit OK
--   'past_due'           : prélèvement échoué, Stripe en retry → accès produit OK avec banner alerte
--   'canceled'           : annulé par user via Customer Portal OU retries Stripe épuisés → accès bloqué
--   'unpaid'             : retries Stripe terminés sans succès → accès bloqué (équivalent à canceled)

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS subscription_status text;

ALTER TABLE public.pharmacies
  DROP CONSTRAINT IF EXISTS pharmacies_subscription_status_check;

ALTER TABLE public.pharmacies
  ADD CONSTRAINT pharmacies_subscription_status_check
  CHECK (subscription_status IS NULL OR subscription_status IN (
    'incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
  ));

-- ---------------------------------------------------------------------------
-- 3. Tier + billing interval (CHECK enums)
-- ---------------------------------------------------------------------------
-- Tier = PO (Petite officine, ≤3 pers), OTM (Officine taille moyenne, 4-8 pers),
-- GO (Grande officine, 9+ pers). Aligné avec les nicknames Stripe + price IDs.

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS subscription_tier text;

ALTER TABLE public.pharmacies
  DROP CONSTRAINT IF EXISTS pharmacies_subscription_tier_check;

ALTER TABLE public.pharmacies
  ADD CONSTRAINT pharmacies_subscription_tier_check
  CHECK (subscription_tier IS NULL OR subscription_tier IN ('po', 'otm', 'go'));

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS subscription_billing text;

ALTER TABLE public.pharmacies
  DROP CONSTRAINT IF EXISTS pharmacies_subscription_billing_check;

ALTER TABLE public.pharmacies
  ADD CONSTRAINT pharmacies_subscription_billing_check
  CHECK (subscription_billing IS NULL OR subscription_billing IN ('monthly', 'yearly'));

-- ---------------------------------------------------------------------------
-- 4. Dates du cycle d'abonnement
-- ---------------------------------------------------------------------------

-- Date où Stripe prélèvera la 1ère facture (= fin du trial). Copié depuis
-- l'event customer.subscription.created par le webhook.
ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS trial_end timestamptz;

-- Date du prochain prélèvement (post-trial). Utile pour afficher "prochain
-- prélèvement le X" en UI + pour les jobs cron J-5 pré-prélèvement éventuels.
ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- ---------------------------------------------------------------------------
-- 5. Index partiels pour les requêtes operationelles courantes
-- ---------------------------------------------------------------------------

-- Index sur les statuts qui demandent une action (CSM peut lister ces pharmas).
CREATE INDEX IF NOT EXISTS pharmacies_subscription_status_idx
  ON public.pharmacies(subscription_status)
  WHERE subscription_status IN ('incomplete', 'past_due', 'canceled', 'unpaid');

-- Index sur trial_end pour le banner pré-prélèvement (J-5) et stats "trials en cours".
CREATE INDEX IF NOT EXISTS pharmacies_trial_end_idx
  ON public.pharmacies(trial_end)
  WHERE subscription_status = 'trialing';

-- ---------------------------------------------------------------------------
-- 6. Table d'idempotence webhook
-- ---------------------------------------------------------------------------
-- Stripe peut retry un webhook plusieurs fois (au moins 3 retries sur 3 jours
-- en cas de 5xx). Pour éviter de retraiter le même event, on log chaque event
-- reçu (signature vérifiée) avec son stripe_event_id en UNIQUE. Le webhook
-- handler fait INSERT ... ON CONFLICT (stripe_event_id) DO NOTHING puis skip
-- si la row existait déjà.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  pharmacy_id uuid REFERENCES public.pharmacies(id) ON DELETE SET NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb
);

CREATE INDEX IF NOT EXISTS stripe_webhook_log_received_at_idx
  ON public.stripe_webhook_log(received_at DESC);

CREATE INDEX IF NOT EXISTS stripe_webhook_log_pharmacy_id_idx
  ON public.stripe_webhook_log(pharmacy_id)
  WHERE pharmacy_id IS NOT NULL;

-- RLS : activée sans aucune policy → seul service_role bypasse et peut accéder.
-- C'est intentionnel : le webhook handler utilise createServiceClient.
-- Aucun client authentifié n'a besoin de lire ces données.
ALTER TABLE public.stripe_webhook_log ENABLE ROW LEVEL SECURITY;
