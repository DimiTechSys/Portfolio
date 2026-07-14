-- P2-02 — OCR extra fields on prescriptions

ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS prescriber_name text,
  ADD COLUMN IF NOT EXISTS prescribed_date date,
  ADD COLUMN IF NOT EXISTS expiry_date date;

CREATE INDEX IF NOT EXISTS prescriptions_expiry_date_idx
  ON public.prescriptions (expiry_date)
  WHERE expiry_date IS NOT NULL;
