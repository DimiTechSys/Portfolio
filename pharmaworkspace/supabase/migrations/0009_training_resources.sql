-- 0009_training_resources.sql
-- Ressources « Qualité & proc » (formation interne).

CREATE TYPE public.training_resource_type AS ENUM ('video', 'memo');

CREATE TABLE public.training_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies (id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  type public.training_resource_type NOT NULL,
  url text,
  storage_path text,
  duration_minutes integer,
  is_published boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX training_resources_pharmacy_id_idx ON public.training_resources (pharmacy_id);

ALTER TABLE public.training_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY training_resources_select ON public.training_resources
FOR SELECT
USING (
  pharmacy_id = public.get_pharmacy_id()
  AND (
    is_published = true
    OR public.get_user_role() IN ('titulaire', 'adjoint')
  )
);

CREATE POLICY training_resources_insert ON public.training_resources
FOR INSERT
WITH CHECK (
  pharmacy_id = public.get_pharmacy_id()
  AND public.get_user_role() IN ('titulaire', 'adjoint')
  AND created_by = auth.uid()
);

CREATE POLICY training_resources_update ON public.training_resources
FOR UPDATE
USING (
  pharmacy_id = public.get_pharmacy_id()
  AND public.get_user_role() IN ('titulaire', 'adjoint')
)
WITH CHECK (pharmacy_id = public.get_pharmacy_id());

CREATE POLICY training_resources_delete ON public.training_resources
FOR DELETE
USING (
  pharmacy_id = public.get_pharmacy_id()
  AND public.get_user_role() IN ('titulaire', 'adjoint')
);

CREATE TRIGGER training_resources_updated_at
  BEFORE UPDATE ON public.training_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
