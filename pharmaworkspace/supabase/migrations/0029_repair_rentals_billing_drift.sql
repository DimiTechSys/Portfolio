-- Repair drift on public.rentals
--
-- The enum `rental_billing_type` and the columns `billing_type`, `paid_units`,
-- `total_units` were added to production via the Supabase Dashboard SQL Editor
-- and never tracked in versioned migrations (cf. MIGRATIONS_GUARDRAILS §0/§7).
-- The recent preview Supabase project (vsyjdtnicyovmsvsfwcv), set up from
-- versioned migrations, therefore lacks them and breaks every rental write
-- ("Could not find the 'billing_type' column" — 22/05/2026).
--
-- This migration is idempotent: no-op on environments where the drift already
-- exists (prod), creates the missing schema on fresh environments (preview,
-- new dev, CI).

-- 1. Enum rental_billing_type (CREATE TYPE has no IF NOT EXISTS).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'rental_billing_type'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.rental_billing_type AS ENUM ('daily', 'weekly', 'monthly');
  END IF;
END $$;

-- 2. Columns on public.rentals.
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS billing_type public.rental_billing_type NOT NULL DEFAULT 'daily';

ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS paid_units integer NOT NULL DEFAULT 0;

ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS total_units integer NOT NULL DEFAULT 1;
