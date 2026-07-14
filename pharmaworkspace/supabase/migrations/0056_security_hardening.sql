-- 0056 — Durcissement sécurité (audit 2026-06-13)
-- Corrige : billing bypass (C1), élévation de privilèges via profiles (H2),
-- fuites cross-tenant RLS (H1/H3/M3/G3), incohérences de rôle JWT (M1),
-- contraintes d'intégrité (G4), exposition de fonction (G5), contrôle de rôle
-- manquant sur les UPDATE (L1) + durcissement search_path de get_user_role().
--
-- Toutes les instructions sont idempotentes.

-- ── Durcissement get_user_role() : SET search_path + noms qualifiés ──────────
-- Mirror de get_pharmacy_id() (mig. 0018). Empêche un détournement via un
-- schéma `profiles` injecté dans le search_path de l'appelant.
CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS public.user_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ── C1 : verrouillage des champs de facturation (billing bypass) ─────────────
-- Seul service_role (webhooks Stripe / routes serveur) peut muter les colonnes
-- d'abonnement. auth.role() = 'service_role' est le mécanisme Supabase : la clé
-- service_role pose le claim `role=service_role` dans le JWT, lu par auth.role().
CREATE OR REPLACE FUNCTION public.enforce_subscription_columns_service_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
     OR NEW.subscription_billing IS DISTINCT FROM OLD.subscription_billing
     OR NEW.trial_end IS DISTINCT FROM OLD.trial_end
     OR NEW.current_period_end IS DISTINCT FROM OLD.current_period_end
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
    RAISE EXCEPTION 'SUBSCRIPTION_COLUMNS_READONLY'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pharmacies_enforce_subscription_columns ON public.pharmacies;
CREATE TRIGGER pharmacies_enforce_subscription_columns
  BEFORE UPDATE ON public.pharmacies
  FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription_columns_service_role();

-- ── H2 : verrouillage du rôle et de l'officine sur profiles ──────────────────
-- Empêche un utilisateur de s'auto-promouvoir titulaire ou de migrer vers une
-- autre officine via un UPDATE direct. Seul service_role peut le faire.
CREATE OR REPLACE FUNCTION public.enforce_profile_role_pharmacy_service_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.pharmacy_id IS DISTINCT FROM OLD.pharmacy_id THEN
    RAISE EXCEPTION 'PROFILE_ROLE_PHARMACY_READONLY'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_role_pharmacy ON public.profiles;
CREATE TRIGGER profiles_enforce_role_pharmacy
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role_pharmacy_service_role();

-- ── H1 : invitations_select limité à l'officine + titulaire ──────────────────
-- Avant : USING (true) → fuite des invitations de toutes les officines.
DROP POLICY IF EXISTS "invitations_select" ON public.invitations;
CREATE POLICY "invitations_select" ON public.invitations FOR SELECT USING (
  (pharmacy_id = (SELECT public.get_pharmacy_id()))
  AND ((SELECT public.get_user_role()) = 'titulaire')
);

-- ── H3 : pharmacies_select_onboarding restreint à l'officine du membre ───────
-- Retire la branche NOT EXISTS (large) qui laissait un utilisateur sans
-- pharmacy_id lire TOUTES les pharmacies.
DROP POLICY IF EXISTS "pharmacies_select_onboarding" ON public.pharmacies;
CREATE POLICY "pharmacies_select_onboarding" ON public.pharmacies FOR SELECT TO authenticated USING (
  id = (SELECT public.get_pharmacy_id())
);

-- ── M1 : remplacer (auth.jwt() ->> 'role') par get_user_role() ───────────────
-- Le claim JWT `role` est posé par PostgREST (= 'authenticated'), pas le rôle
-- métier ; il ne valait jamais 'titulaire'/'adjoint' → branche morte.
DROP POLICY IF EXISTS "chat_messages_update" ON public.chat_messages;
CREATE POLICY "chat_messages_update" ON public.chat_messages FOR UPDATE TO authenticated USING (
  (pharmacy_id = (SELECT public.get_pharmacy_id()))
  AND (
    ((author_id = auth.uid()) AND (deleted_at IS NULL))
    OR ((SELECT public.get_user_role()) = 'titulaire')
  )
);

DROP POLICY IF EXISTS "leave_requests_update" ON public.leave_requests;
CREATE POLICY "leave_requests_update" ON public.leave_requests FOR UPDATE TO authenticated USING (
  (pharmacy_id = (SELECT public.get_pharmacy_id()))
  AND (
    ((requester_id = auth.uid()) AND (status = 'pending'))
    OR ((SELECT public.get_user_role()) = 'titulaire')
  )
);

DROP POLICY IF EXISTS "weekly_schedules_mutate" ON public.weekly_schedules;
CREATE POLICY "weekly_schedules_mutate" ON public.weekly_schedules TO authenticated USING (
  (pharmacy_id = (SELECT public.get_pharmacy_id()))
  AND ((SELECT public.get_user_role()) = ANY (ARRAY['titulaire'::public.user_role, 'adjoint'::public.user_role]))
) WITH CHECK (
  (pharmacy_id = (SELECT public.get_pharmacy_id()))
  AND ((SELECT public.get_user_role()) = ANY (ARRAY['titulaire'::public.user_role, 'adjoint'::public.user_role]))
);

-- ── M3 : notifications_insert — le destinataire doit appartenir à l'officine ─
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (
  (pharmacy_id = (SELECT public.get_pharmacy_id()))
  AND (((SELECT public.get_user_role())::text = ANY (ARRAY['titulaire'::text, 'adjoint'::text, 'preparateur'::text, 'student'::text, 'shelver'::text])))
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_id AND p.pharmacy_id = (SELECT public.get_pharmacy_id())
  )
);

-- ── G3 : notifications_select — destinataire ET officine ─────────────────────
-- Avant : seulement pharmacy_id → un membre voyait les notifs de ses collègues.
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (
  (user_id = auth.uid())
  AND (pharmacy_id = (SELECT public.get_pharmacy_id()))
);

-- ── G4 : contrainte de plausibilité sur la précision GPS du pointage ─────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'work_sessions_clockin_accuracy_m_check'
      AND conrelid = 'public.work_sessions'::regclass
  ) THEN
    ALTER TABLE public.work_sessions
      ADD CONSTRAINT work_sessions_clockin_accuracy_m_check
      CHECK (clockin_accuracy_m IS NULL OR (clockin_accuracy_m BETWEEN 0 AND 100));
  END IF;

  -- clockout_accuracy_m n'existe pas dans le schéma actuel ; on garde la garde
  -- défensive au cas où une migration future l'ajoute.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'work_sessions'
      AND column_name = 'clockout_accuracy_m'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'work_sessions_clockout_accuracy_m_check'
      AND conrelid = 'public.work_sessions'::regclass
  ) THEN
    ALTER TABLE public.work_sessions
      ADD CONSTRAINT work_sessions_clockout_accuracy_m_check
      CHECK (clockout_accuracy_m IS NULL OR (clockout_accuracy_m BETWEEN 0 AND 100));
  END IF;
END $$;

-- ── G5 : create_overdue_notifications() réservée au serveur (cron/service) ───
REVOKE EXECUTE ON FUNCTION public.create_overdue_notifications() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_overdue_notifications() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_overdue_notifications() FROM PUBLIC;

-- ── L1 : NON appliqué — décision « by design » ───────────────────────────────
-- L'audit suggérait d'aligner les UPDATE sur les DELETE (role-restricted). Écarté :
-- tasks/prescriptions/rentals/contacts sont des tables OPÉRATIONNELLES — cocher une
-- tâche, servir une ordonnance (to_serve→served), rendre une location sont des actions
-- quotidiennes de TOUT le personnel comptoir (préparateur/student/shelver = équivalents).
-- Restreindre l'UPDATE au titulaire/adjoint casserait ces flux. Le DELETE reste, lui,
-- role-restreint (anti-destruction). L'UPDATE ouvert à tout membre de l'officine est
-- donc INTENTIONNEL ; on ne touche pas à ces 4 policies.
