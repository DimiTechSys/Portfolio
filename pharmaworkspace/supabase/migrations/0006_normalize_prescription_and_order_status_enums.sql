-- 0006_normalize_prescription_and_order_status_enums.sql
-- Alignement avec l’app : prescription sans `in_progress`, commande sans `cancelled`.

-- ── prescription_status : supprimer `in_progress` ─────────────────────────────
CREATE TYPE public.prescription_status_new AS ENUM (
  'to_serve',
  'served',
  'expired',
  'on_hold'
);

UPDATE public.prescriptions
SET status = 'to_serve'
WHERE status::text = 'in_progress';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'prescription_items'
      AND column_name = 'status'
  ) THEN
    UPDATE public.prescription_items
    SET status = 'to_serve'
    WHERE status::text = 'in_progress';

    ALTER TABLE public.prescription_items
      ALTER COLUMN status TYPE public.prescription_status_new
      USING (status::text::public.prescription_status_new);
  END IF;
END $$;

ALTER TABLE public.prescriptions
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.prescriptions
  ALTER COLUMN status TYPE public.prescription_status_new
  USING (status::text::public.prescription_status_new);

ALTER TABLE public.prescriptions
  ALTER COLUMN status SET DEFAULT 'to_serve'::public.prescription_status_new;

DROP TYPE public.prescription_status;
ALTER TYPE public.prescription_status_new RENAME TO prescription_status;

-- ── order_status : supprimer `cancelled` ────────────────────────────────────
UPDATE public.orders
SET status = 'draft'
WHERE status::text = 'cancelled';

CREATE TYPE public.order_status_new AS ENUM (
  'draft',
  'sent',
  'received'
);

ALTER TABLE public.orders
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.orders
  ALTER COLUMN status TYPE public.order_status_new
  USING (status::text::public.order_status_new);

ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'draft'::public.order_status_new;

DROP TYPE public.order_status;
ALTER TYPE public.order_status_new RENAME TO order_status;
