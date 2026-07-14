-- P2-16 — Audit log applicatif (traçabilité accès ordonnances, etc.)

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_pharmacy_created_idx
  ON public.audit_log(pharmacy_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_insert ON public.audit_log;
CREATE POLICY audit_log_insert
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND pharmacy_id = (SELECT public.get_pharmacy_id())
  );

DROP POLICY IF EXISTS audit_log_select_titulaire ON public.audit_log;
CREATE POLICY audit_log_select_titulaire
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND (SELECT public.get_user_role()) = 'titulaire'
  );
