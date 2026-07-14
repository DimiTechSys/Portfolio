-- Align notifications RLS with pharmacy-scoped collaborative writes.
-- This allows app clients to create notifications for teammates in the same pharmacy.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select
ON public.notifications
FOR SELECT
USING (
  pharmacy_id = get_pharmacy_id()
);

DROP POLICY IF EXISTS notifications_insert ON public.notifications;
CREATE POLICY notifications_insert
ON public.notifications
FOR INSERT
WITH CHECK (
  pharmacy_id = get_pharmacy_id()
  AND get_user_role() IN ('titulaire', 'adjoint', 'preparateur')
);

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update
ON public.notifications
FOR UPDATE
USING (
  user_id = auth.uid()
  AND pharmacy_id = get_pharmacy_id()
)
WITH CHECK (
  user_id = auth.uid()
  AND pharmacy_id = get_pharmacy_id()
);
