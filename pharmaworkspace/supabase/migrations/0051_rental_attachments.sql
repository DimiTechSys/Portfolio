-- TECH-11 — Photos sur locations (table + RLS). Storage : bucket attachments privé (0031).

CREATE TABLE IF NOT EXISTS public.rental_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  original_filename text,
  captured_at timestamptz,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rental_attachments_rental_id_idx
  ON public.rental_attachments(rental_id);
CREATE INDEX IF NOT EXISTS rental_attachments_pharmacy_id_idx
  ON public.rental_attachments(pharmacy_id);

ALTER TABLE public.rental_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rental_attachments_select_own_pharmacy ON public.rental_attachments;
CREATE POLICY rental_attachments_select_own_pharmacy
  ON public.rental_attachments
  FOR SELECT
  USING (pharmacy_id = (SELECT public.get_pharmacy_id()));

DROP POLICY IF EXISTS rental_attachments_insert_own_pharmacy ON public.rental_attachments;
CREATE POLICY rental_attachments_insert_own_pharmacy
  ON public.rental_attachments
  FOR INSERT
  WITH CHECK (pharmacy_id = (SELECT public.get_pharmacy_id()));

DROP POLICY IF EXISTS rental_attachments_delete_own_pharmacy ON public.rental_attachments;
CREATE POLICY rental_attachments_delete_own_pharmacy
  ON public.rental_attachments
  FOR DELETE
  USING (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND (
      (SELECT public.get_user_role()) = 'titulaire'::public.user_role
      OR uploaded_by = auth.uid()
    )
  );
