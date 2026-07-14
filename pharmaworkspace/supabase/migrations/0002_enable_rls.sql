-- 0002_enable_rls.sql
-- Reactivate RLS on pharmacies/profiles with onboarding-safe policies.

alter table public.rentals add column if not exists daily_rate numeric;

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pharmacies_select_member ON public.pharmacies;
DROP POLICY IF EXISTS pharmacies_insert_onboarding ON public.pharmacies;
DROP POLICY IF EXISTS pharmacies_update_titulaire ON public.pharmacies;

CREATE POLICY pharmacies_select_member
ON public.pharmacies
FOR SELECT
USING (id = public.get_pharmacy_id());

CREATE POLICY pharmacies_insert_onboarding
ON public.pharmacies
FOR INSERT
WITH CHECK (true);

CREATE POLICY pharmacies_update_titulaire
ON public.pharmacies
FOR UPDATE
USING (
  id = public.get_pharmacy_id()
  AND public.get_user_role() = 'titulaire'
)
WITH CHECK (
  id = public.get_pharmacy_id()
  AND public.get_user_role() = 'titulaire'
);

DROP POLICY IF EXISTS profiles_select_scoped ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self_or_titulaire ON public.profiles;

CREATE POLICY profiles_select_scoped
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR pharmacy_id = public.get_pharmacy_id()
);

CREATE POLICY profiles_insert_self
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_self_or_titulaire
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
  OR (
    pharmacy_id = public.get_pharmacy_id()
    AND public.get_user_role() = 'titulaire'
  )
)
WITH CHECK (
  id = auth.uid()
  OR (
    pharmacy_id = public.get_pharmacy_id()
    AND public.get_user_role() = 'titulaire'
  )
);

DROP POLICY IF EXISTS medications_select ON public.medications;
CREATE POLICY medications_select
ON public.medications
FOR SELECT
USING (auth.uid() IS NOT NULL);
