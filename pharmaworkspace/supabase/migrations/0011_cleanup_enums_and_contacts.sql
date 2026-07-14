-- 0011_cleanup_enums_and_contacts.sql
-- Production cleanup: narrow enums to match the app + annuaire `contacts` table.
-- Safe to run once on a DB that still has legacy enum labels; skips if already normalized.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) prescription_status — remove `in_progress`
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typname = 'prescription_status'
      AND e.enumlabel = 'in_progress'
  ) THEN
    BEGIN
      CREATE TYPE public.prescription_status_new AS ENUM (
        'to_serve',
        'served',
        'expired',
        'on_hold'
      );

      UPDATE public.prescriptions
      SET status = 'to_serve'::public.prescription_status
      WHERE status::text = 'in_progress';

      -- prescription_items: live DBs may use text OR enum for `status`
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'prescription_items'
          AND column_name = 'status'
          AND data_type IN ('text', 'character varying')
      ) THEN
        UPDATE public.prescription_items
        SET status = 'to_serve'
        WHERE status = 'in_progress';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'prescription_items'
          AND column_name = 'status'
          AND udt_name = 'prescription_status'
      ) THEN
        UPDATE public.prescription_items
        SET status = 'to_serve'::public.prescription_status
        WHERE status::text = 'in_progress';
        ALTER TABLE public.prescription_items ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE public.prescription_items
          ALTER COLUMN status TYPE public.prescription_status_new
          USING (status::text::public.prescription_status_new);
        ALTER TABLE public.prescription_items
          ALTER COLUMN status SET DEFAULT 'to_serve'::public.prescription_status_new;
      END IF;

      ALTER TABLE public.prescriptions ALTER COLUMN status DROP DEFAULT;
      ALTER TABLE public.prescriptions
        ALTER COLUMN status TYPE public.prescription_status_new
        USING (status::text::public.prescription_status_new);
      ALTER TABLE public.prescriptions
        ALTER COLUMN status SET DEFAULT 'to_serve'::public.prescription_status_new;

      DROP TYPE public.prescription_status;
      ALTER TYPE public.prescription_status_new RENAME TO prescription_status;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '0011: unable to normalize prescription_status, skipping (%).', SQLERRM;
      DROP TYPE IF EXISTS public.prescription_status_new;
    END;
  ELSE
    RAISE NOTICE '0011: prescription_status already normalized, skipping';
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) order_status — remove `cancelled`
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typname = 'order_status'
      AND e.enumlabel = 'cancelled'
  ) THEN
    BEGIN
      UPDATE public.orders
      SET status = 'draft'::public.order_status
      WHERE status::text = 'cancelled';

      CREATE TYPE public.order_status_new AS ENUM (
        'draft',
        'sent',
        'received'
      );

      ALTER TABLE public.orders ALTER COLUMN status DROP DEFAULT;
      ALTER TABLE public.orders
        ALTER COLUMN status TYPE public.order_status_new
        USING (status::text::public.order_status_new);
      ALTER TABLE public.orders
        ALTER COLUMN status SET DEFAULT 'draft'::public.order_status_new;

      DROP TYPE public.order_status;
      ALTER TYPE public.order_status_new RENAME TO order_status;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '0011: unable to normalize order_status, skipping (%).', SQLERRM;
      DROP TYPE IF EXISTS public.order_status_new;
    END;
  ELSE
    RAISE NOTICE '0011: order_status already normalized, skipping';
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) contacts (Annuaire) — align with src/types/index.ts Contact
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies (id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  name text NOT NULL,
  company text,
  role text,
  category text NOT NULL,
  phone text,
  email text,
  address text,
  website text,
  reference text,
  notes text,
  is_urgent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contacts_pharmacy_id_idx ON public.contacts (pharmacy_id);
CREATE INDEX IF NOT EXISTS contacts_pharmacy_category_idx ON public.contacts (pharmacy_id, category);

DROP TRIGGER IF EXISTS contacts_updated_at ON public.contacts;
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_select ON public.contacts;
CREATE POLICY contacts_select ON public.contacts
  FOR SELECT
  USING (pharmacy_id = public.get_pharmacy_id());

DROP POLICY IF EXISTS contacts_insert ON public.contacts;
CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT
  WITH CHECK (
    pharmacy_id = public.get_pharmacy_id()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS contacts_update ON public.contacts;
CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE
  USING (pharmacy_id = public.get_pharmacy_id())
  WITH CHECK (pharmacy_id = public.get_pharmacy_id());

DROP POLICY IF EXISTS contacts_delete ON public.contacts;
CREATE POLICY contacts_delete ON public.contacts
  FOR DELETE
  USING (
    pharmacy_id = public.get_pharmacy_id()
    AND public.get_user_role() = ANY (ARRAY['titulaire'::public.user_role, 'adjoint'::public.user_role])
  );
