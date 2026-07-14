-- Onboarding titulaire : créer une officine + lier le profil (contourne RLS INSERT/SELECT).

CREATE OR REPLACE FUNCTION public.create_pharmacy_onboarding(
  p_name text,
  p_address text DEFAULT NULL,
  p_finess text DEFAULT NULL
)
RETURNS public.pharmacies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_row public.pharmacies%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF trim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'pharmacy name required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.pharmacy_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'profile already linked to a pharmacy';
  END IF;

  INSERT INTO public.pharmacies (name, address, finess)
  VALUES (trim(p_name), nullif(trim(coalesce(p_address, '')), ''), nullif(trim(coalesce(p_finess, '')), ''))
  RETURNING * INTO new_row;

  UPDATE public.profiles
  SET pharmacy_id = new_row.id, role = 'titulaire'
  WHERE id = uid;

  RETURN new_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_pharmacy_onboarding(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_pharmacy_onboarding(text, text, text) TO authenticated;

-- Filet de sécurité si la RPC n'est pas encore déployée : policies explicites.
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pharmacies_insert_onboarding ON public.pharmacies;
CREATE POLICY pharmacies_insert_onboarding
  ON public.pharmacies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.pharmacy_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS pharmacies_select_onboarding ON public.pharmacies;
CREATE POLICY pharmacies_select_onboarding
  ON public.pharmacies
  FOR SELECT
  TO authenticated
  USING (
    id = public.get_pharmacy_id()
    OR (
      auth.uid() IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid() AND p.pharmacy_id IS NOT NULL
      )
    )
  );
