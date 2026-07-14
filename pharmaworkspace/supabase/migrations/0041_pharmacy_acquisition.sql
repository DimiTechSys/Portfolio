-- 0041_pharmacy_acquisition.sql (Billy P4-05)
-- Funnel self-serve : signup + consentements click-wrap + UTM.
-- Déjà appliquée sur staging si db push bloquait sur "0041 not found locally".

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.pharmacy_acquisition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL,
  locale text NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),

  cgs_version text NOT NULL,
  cgs_hash text NOT NULL,
  cgs_accepted_at timestamptz NOT NULL,
  dpa_version text NOT NULL,
  dpa_hash text NOT NULL,
  dpa_accepted_at timestamptz NOT NULL,

  user_agent text,
  ip_address inet,

  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,

  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  pharmacy_id uuid REFERENCES public.pharmacies(id) ON DELETE SET NULL,
  abandoned boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS pharmacy_acquisition_email_idx ON public.pharmacy_acquisition(email);
CREATE INDEX IF NOT EXISTS pharmacy_acquisition_created_at_idx ON public.pharmacy_acquisition(created_at DESC);
CREATE INDEX IF NOT EXISTS pharmacy_acquisition_source_idx ON public.pharmacy_acquisition(source);
CREATE INDEX IF NOT EXISTS pharmacy_acquisition_pharmacy_id_idx
  ON public.pharmacy_acquisition(pharmacy_id)
  WHERE pharmacy_id IS NOT NULL;

ALTER TABLE public.pharmacy_acquisition ENABLE ROW LEVEL SECURITY;
