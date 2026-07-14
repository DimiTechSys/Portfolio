-- Repair drift on public.prescriptions
--
-- The `image_url` column was added to production via the Supabase Dashboard
-- SQL Editor and never tracked in versioned migrations (cf.
-- MIGRATIONS_GUARDRAILS §0/§7). Same root cause as `rentals.billing_type`
-- repaired by 0029. The recent preview Supabase project lacks this column,
-- so the P1-07 attachment-path migration script and every prescription
-- creation/OCR flow break with `column "image_url" does not exist`.
--
-- Idempotent: no-op on prod, adds the missing column on preview and any
-- fresh environment.

ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS image_url text;
