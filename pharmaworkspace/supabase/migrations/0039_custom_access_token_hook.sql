-- P2-08 — Custom Access Token Hook
--
-- Injecte `pharmacy_id` et `pharmacy_role` (issus de public.profiles) dans
-- `claims.app_metadata` à chaque émission de JWT (login, refresh). Le
-- middleware Next.js (`src/proxy.ts`) peut ensuite les lire depuis
-- `user.app_metadata` sans faire de query DB par navigation — ce qui
-- supprime le principal goulot d'étranglement Postgres à 200+ users.
--
-- Cf. https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
--
-- À activer manuellement après merge :
--   Dashboard Supabase → Authentication → Hooks → Custom Access Token Hook
--   → choisir `public.custom_access_token_hook` → Enable.
--
-- Naming : on utilise `pharmacy_role` côté JWT au lieu de `role` pour ne pas
-- écraser le claim standard `role: authenticated` du JWT Supabase.
--
-- Comportement new user (pas encore de row profiles) : aucune injection,
-- le middleware fallback sur sa query DB (couvre le créneau onboarding).

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  claims jsonb := event->'claims';
  user_id_uuid uuid := (event->>'user_id')::uuid;
  profile_pharmacy_id uuid;
  profile_role text;
BEGIN
  SELECT pharmacy_id, role::text
  INTO profile_pharmacy_id, profile_role
  FROM public.profiles
  WHERE id = user_id_uuid;

  -- Skip injection si aucun profile (ou onboarding pas commencé) : le
  -- middleware ira chercher l'état réel en DB. Sinon on ajoute les claims.
  IF profile_pharmacy_id IS NOT NULL OR profile_role IS NOT NULL THEN
    IF claims->'app_metadata' IS NULL THEN
      claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
    END IF;

    IF profile_pharmacy_id IS NOT NULL THEN
      claims := jsonb_set(
        claims,
        '{app_metadata, pharmacy_id}',
        to_jsonb(profile_pharmacy_id::text)
      );
    END IF;

    IF profile_role IS NOT NULL THEN
      claims := jsonb_set(
        claims,
        '{app_metadata, pharmacy_role}',
        to_jsonb(profile_role)
      );
    END IF;

    event := jsonb_set(event, '{claims}', claims);
  END IF;

  RETURN event;
END;
$$;

-- Le hook s'exécute sous le rôle supabase_auth_admin (donc bypass RLS pour
-- son SELECT sur profiles). Pas besoin de SECURITY DEFINER.
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;
