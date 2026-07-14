-- 0012_strict_enum_conformity.sql
-- Enforce strict enum conformity with application expectations.
-- This migration avoids direct enum-to-enum casts by replacing columns.

-- ============================================================================
-- 1) prescription_status: remove legacy `in_progress`
--    Target values: to_serve, served, expired, on_hold
-- ============================================================================

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
      AND t.typname = 'prescription_status'
      AND e.enumlabel = 'in_progress'
  ) INTO has_legacy_label;

  IF has_legacy_label THEN
    CREATE TYPE public.prescription_status_v2 AS ENUM (
      'to_serve',
      'served',
      'expired',
      'on_hold'
    );

    ALTER TABLE public.prescriptions
      RENAME COLUMN status TO status_legacy;

    ALTER TABLE public.prescriptions
      ADD COLUMN status public.prescription_status_v2 NOT NULL DEFAULT 'to_serve';

    UPDATE public.prescriptions
    SET status = CASE
      WHEN status_legacy::text = 'in_progress' THEN 'to_serve'::public.prescription_status_v2
      ELSE status_legacy::text::public.prescription_status_v2
    END;

    ALTER TABLE public.prescriptions
      DROP COLUMN status_legacy;

    ALTER TYPE public.prescription_status RENAME TO prescription_status_legacy;
    ALTER TYPE public.prescription_status_v2 RENAME TO prescription_status;
    DROP TYPE public.prescription_status_legacy;
  END IF;
END;
$$;

-- ============================================================================
-- 2) order_status: remove legacy `cancelled`
--    Target values: draft, sent, received
-- ============================================================================

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
      AND t.typname = 'order_status'
      AND e.enumlabel = 'cancelled'
  ) INTO has_legacy_label;

  IF has_legacy_label THEN
    CREATE TYPE public.order_status_v2 AS ENUM (
      'draft',
      'sent',
      'received'
    );

    ALTER TABLE public.orders
      RENAME COLUMN status TO status_legacy;

    ALTER TABLE public.orders
      ADD COLUMN status public.order_status_v2 NOT NULL DEFAULT 'draft';

    UPDATE public.orders
    SET status = CASE
      WHEN status_legacy::text = 'cancelled' THEN 'draft'::public.order_status_v2
      ELSE status_legacy::text::public.order_status_v2
    END;

    ALTER TABLE public.orders
      DROP COLUMN status_legacy;

    ALTER TYPE public.order_status RENAME TO order_status_legacy;
    ALTER TYPE public.order_status_v2 RENAME TO order_status;
    DROP TYPE public.order_status_legacy;
  END IF;
END;
$$;
