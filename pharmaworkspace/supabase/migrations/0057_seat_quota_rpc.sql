-- 0057 — G7 : quota de sièges atomique (RPC unique)
--
-- Ferme la race TOCTOU du check-then-insert. La tentative précédente (advisory
-- lock posé puis relâché côté supabase-js avant l'INSERT) ne fermait pas la
-- course : deux requêtes concurrentes passaient le recompte avant qu'aucune
-- n'insère. Ici tout se fait dans UNE transaction côté serveur :
--   1. pg_advisory_xact_lock(hashtext(pharmacy_id)) — sérialise par officine,
--      relâché AUTOMATIQUEMENT à la fin de la transaction (donc après l'INSERT) ;
--   2. recompte (membres actifs + invitations en attente non expirées) ;
--   3. si total >= limite → RAISE 'SEAT_LIMIT_REACHED' ;
--   4. INSERT de l'invitation, retourne la row.
--
-- p_limit est calculé côté JS (getMemberLimit / TIER_LIMITS = source de vérité
-- unique) et passé en paramètre : pas de duplication des limites en SQL.
-- p_token / p_token_hash sont fournis par l'appelant (le hash reste calculé en
-- JS via hashInvitationToken ; aucune crypto dans le SQL).
--
-- Idempotent (CREATE OR REPLACE). SECURITY DEFINER + REVOKE PUBLIC : réservée
-- au service_role (route serveur create-native, déjà titulaire-gated en amont).

CREATE OR REPLACE FUNCTION public.create_invitation_with_quota(
  p_pharmacy_id uuid,
  p_email text,
  p_role public.user_role,
  p_token uuid,
  p_token_hash text,
  p_limit double precision
)
RETURNS public.invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seat_count integer;
  new_row public.invitations%ROWTYPE;
BEGIN
  -- Verrou par officine, tenu jusqu'au COMMIT (donc englobe l'INSERT).
  PERFORM pg_advisory_xact_lock(hashtext(p_pharmacy_id::text));

  -- Recompte = membres actifs + invitations en attente non expirées.
  -- Doit rester aligné avec getMemberCountBreakdown() (src/lib/subscription.ts).
  SELECT
    (SELECT count(*) FROM public.profiles WHERE pharmacy_id = p_pharmacy_id)
    + (SELECT count(*) FROM public.invitations
        WHERE pharmacy_id = p_pharmacy_id
          AND accepted_at IS NULL
          AND expires_at > now())
  INTO seat_count;

  -- p_limit peut valoir 'Infinity' (tier go) : la comparaison reste correcte.
  IF seat_count >= p_limit THEN
    RAISE EXCEPTION 'SEAT_LIMIT_REACHED'
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.invitations (pharmacy_id, email, role, token, token_hash)
  VALUES (p_pharmacy_id, p_email, p_role, p_token, p_token_hash)
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

REVOKE ALL ON FUNCTION public.create_invitation_with_quota(uuid, text, public.user_role, uuid, text, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_invitation_with_quota(uuid, text, public.user_role, uuid, text, double precision) FROM anon;
REVOKE ALL ON FUNCTION public.create_invitation_with_quota(uuid, text, public.user_role, uuid, text, double precision) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_invitation_with_quota(uuid, text, public.user_role, uuid, text, double precision) TO service_role;
