-- 0059_status_state_machine.sql
-- G6 : machine à états de statut (prescriptions / orders / rentals).
--
-- Décisions produit (validées par le titulaire, 2026-06-13) :
--  1. Réouverture AUTORISÉE (served→to_serve/on_hold, received→sent/draft,
--     returned→active), MAIS nettoyage des timestamps terminaux au retour :
--       - orders   : received→(autre) ⇒ received_at = NULL
--       - rentals  : returned→(autre) ⇒ returned_at = NULL
--     Pour prescriptions, execution_date est la « Échéance » SAISIE PAR
--     L'UTILISATEUR (champ datetime-local « Échéance » du formulaire ;
--     le quick-process « Traiter » ne l'écrit jamais), PAS le timestamp de
--     « servie ». => on ne le touche PAS sur served→(autre). Documenté ici.
--  2. expired (prescriptions) = CRON AUTO + blocage manuel : interdit en
--     écriture par un end-user (le trigger RAISE), sauf via bypass cron.
--  3. overdue (rentals) = MATÉRIALISÉ PAR CRON + blocage manuel : interdit en
--     écriture par un end-user (RAISE), sauf via bypass cron.
--  4. draft (orders) conservé : draft→sent/received autorisés. Aucune migration
--     d'enum.
--
-- Bypass : les fonctions cron (SECURITY DEFINER) posent
--   SET LOCAL "app.status_bypass" = 'on';
-- avant leurs UPDATE. Les triggers vérifient
--   coalesce(current_setting('app.status_bypass', true), '') = 'on'
-- et, si actif, laissent passer les transitions vers expired/overdue.
--
-- Idempotent : CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS ... CREATE.
-- Leçon G5 : aucune fonction cron exécutable par anon/authenticated.

-- ════════════════════════════════════════════════════════════════════════════
-- 1. Triggers de transition (BEFORE UPDATE OF status)
-- ════════════════════════════════════════════════════════════════════════════

-- Prescriptions : bloque l'écriture manuelle de 'expired' (cron-only).
-- execution_date n'est PAS nettoyé (cf. note décision 1 : c'est l'échéance
-- utilisateur, pas un timestamp « servie »).
CREATE OR REPLACE FUNCTION public.enforce_prescription_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'expired'
     AND coalesce(current_setting('app.status_bypass', true), '') <> 'on' THEN
    RAISE EXCEPTION 'PRESCRIPTION_EXPIRED_AUTOMATIC_ONLY';
  END IF;
  RETURN NEW;
END;
$$;

-- Orders : aucune transition bloquée (réouverture OK). Nettoie received_at
-- quand on quitte 'received'.
CREATE OR REPLACE FUNCTION public.enforce_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'received' AND NEW.status <> 'received' THEN
    NEW.received_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Rentals : bloque l'écriture manuelle de 'overdue' (cron-only). Nettoie
-- returned_at quand on quitte 'returned'.
CREATE OR REPLACE FUNCTION public.enforce_rental_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'overdue'
     AND coalesce(current_setting('app.status_bypass', true), '') <> 'on' THEN
    RAISE EXCEPTION 'RENTAL_OVERDUE_AUTOMATIC_ONLY';
  END IF;
  IF OLD.status = 'returned' AND NEW.status <> 'returned' THEN
    NEW.returned_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prescription_status_transition ON public.prescriptions;
CREATE TRIGGER trg_prescription_status_transition
  BEFORE UPDATE OF status ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_prescription_status_transition();

DROP TRIGGER IF EXISTS trg_order_status_transition ON public.orders;
CREATE TRIGGER trg_order_status_transition
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_order_status_transition();

DROP TRIGGER IF EXISTS trg_rental_status_transition ON public.rentals;
CREATE TRIGGER trg_rental_status_transition
  BEFORE UPDATE OF status ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_rental_status_transition();

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Fonctions cron (SECURITY DEFINER, bypass des triggers)
-- ════════════════════════════════════════════════════════════════════════════

-- Passe to_serve/on_hold → expired quand expiry_date < aujourd'hui.
CREATE OR REPLACE FUNCTION public.expire_prescriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL "app.status_bypass" = 'on';

  UPDATE public.prescriptions
  SET status = 'expired'
  WHERE status IN ('to_serve', 'on_hold')
    AND expiry_date IS NOT NULL
    AND expiry_date < now()::date;
END;
$$;

-- Matérialise active⇄overdue selon expected_return.
--   active  → overdue  quand expected_return < aujourd'hui
--   overdue → active   quand expected_return >= aujourd'hui (prolongations)
CREATE OR REPLACE FUNCTION public.materialize_overdue_rentals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL "app.status_bypass" = 'on';

  UPDATE public.rentals
  SET status = 'overdue'
  WHERE status = 'active'
    AND expected_return < now()::date;

  UPDATE public.rentals
  SET status = 'active'
  WHERE status = 'overdue'
    AND expected_return >= now()::date;
END;
$$;

-- Droits (leçon G5) : réservées au cron / service_role.
REVOKE ALL ON FUNCTION public.expire_prescriptions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_prescriptions() FROM anon;
REVOKE ALL ON FUNCTION public.expire_prescriptions() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.expire_prescriptions() TO service_role;

REVOKE ALL ON FUNCTION public.materialize_overdue_rentals() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.materialize_overdue_rentals() FROM anon;
REVOKE ALL ON FUNCTION public.materialize_overdue_rentals() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.materialize_overdue_rentals() TO service_role;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. Planification pg_cron (mirror de 0032 : skip si pg_cron absent)
-- ════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE '0059: pg_cron non activé — fonctions créées, cron.schedule ignoré.';
    RETURN;
  END IF;

  SELECT jobid
  INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'expire-prescriptions-daily';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'expire-prescriptions-daily',
    '0 2 * * *',
    'SELECT public.expire_prescriptions();'
  );

  SELECT jobid
  INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'materialize-overdue-rentals-daily';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'materialize-overdue-rentals-daily',
    '5 2 * * *',
    'SELECT public.materialize_overdue_rentals();'
  );
END;
$$;
