-- P2-08 — Fix : autoriser supabase_auth_admin à lire profiles dans le hook
--
-- Sans GRANT SELECT ni policy RLS dédiée, le hook `custom_access_token_hook`
-- (qui tourne sous `supabase_auth_admin`) ne peut pas lire `public.profiles`.
-- Symptôme : `Error running hook URI: pg-functions://postgres/public/custom_access_token_hook`
-- à chaque verify OTP / login. Migration corrective de 0039.
--
-- Cf. exemple officiel :
--   https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
--
-- On limite strictement à SELECT (le hook n'a aucun besoin d'écriture). La
-- policy "auth_admin_select" autorise explicitement supabase_auth_admin à
-- bypass RLS pour son SELECT — utile si une future refactor active RLS
-- strict sur profiles.

GRANT SELECT ON TABLE public.profiles TO supabase_auth_admin;

DROP POLICY IF EXISTS "auth_admin_select_profiles" ON public.profiles;
CREATE POLICY "auth_admin_select_profiles"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO supabase_auth_admin
USING (true);
