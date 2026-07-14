-- Renforce get_pharmacy_id et les policies work_sessions pour éviter les échecs RLS silencieux.

CREATE OR REPLACE FUNCTION public.get_pharmacy_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pharmacy_id FROM public.profiles WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "work_sessions_insert" ON public.work_sessions;
CREATE POLICY "work_sessions_insert" ON public.work_sessions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND pharmacy_id IS NOT NULL
    AND pharmacy_id = (
      SELECT p.pharmacy_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "work_sessions_update" ON public.work_sessions;
CREATE POLICY "work_sessions_update" ON public.work_sessions
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND pharmacy_id = (
      SELECT p.pharmacy_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND pharmacy_id = (
      SELECT p.pharmacy_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  );
