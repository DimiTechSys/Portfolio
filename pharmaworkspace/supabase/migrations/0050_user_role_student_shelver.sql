-- TECH-10 — Étend user_role avec student (étudiant en pharmacie) et shelver (rayonniste).
-- Mêmes droits applicatifs que preparateur ; RLS notifications_insert alignée.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typname = 'user_role'
      AND e.enumlabel = 'student'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'student';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typname = 'user_role'
      AND e.enumlabel = 'shelver'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'shelver';
  END IF;
END;
$$;

-- Comparaison en text : évite SQLSTATE 55P04 (nouvelles valeurs enum invisibles
-- dans la même transaction que ALTER TYPE ... ADD VALUE).
DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert
ON public.notifications
FOR INSERT
WITH CHECK (
  pharmacy_id = (select public.get_pharmacy_id())
  AND (select public.get_user_role())::text = ANY (ARRAY[
    'titulaire',
    'adjoint',
    'preparateur',
    'student',
    'shelver'
  ])
);
