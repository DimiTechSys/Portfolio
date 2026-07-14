


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."order_status" AS ENUM (
    'draft',
    'sent',
    'received'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."prescription_status" AS ENUM (
    'to_serve',
    'served',
    'expired',
    'on_hold'
);


ALTER TYPE "public"."prescription_status" OWNER TO "postgres";


CREATE TYPE "public"."rental_billing_type" AS ENUM (
    'daily',
    'weekly',
    'monthly'
);


ALTER TYPE "public"."rental_billing_type" OWNER TO "postgres";


CREATE TYPE "public"."rental_status" AS ENUM (
    'active',
    'returned',
    'overdue'
);


ALTER TYPE "public"."rental_status" OWNER TO "postgres";


CREATE TYPE "public"."shortage_status" AS ENUM (
    'open',
    'substitute_found',
    'resolved'
);


ALTER TYPE "public"."shortage_status" OWNER TO "postgres";


CREATE TYPE "public"."task_priority" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."task_priority" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'todo',
    'done',
    'cancelled'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."training_resource_type" AS ENUM (
    'video',
    'memo'
);


ALTER TYPE "public"."training_resource_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'titulaire',
    'adjoint',
    'preparateur',
    'student',
    'shelver'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_chat_channel"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.chat_channels (pharmacy_id, slug, name, is_default)
  VALUES (NEW.id, 'general', 'Général', true)
  ON CONFLICT (pharmacy_id, slug) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_chat_channel"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'preparateur'::"public"."user_role" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "token_hash" "text"
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_invitation_with_quota"("p_pharmacy_id" "uuid", "p_email" "text", "p_role" "public"."user_role", "p_token" "uuid", "p_token_hash" "text", "p_limit" double precision) RETURNS "public"."invitations"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."create_invitation_with_quota"("p_pharmacy_id" "uuid", "p_email" "text", "p_role" "public"."user_role", "p_token" "uuid", "p_token_hash" "text", "p_limit" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_overdue_notifications"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Tâches en retard (due_date passée, encore à faire, assignées)
  INSERT INTO public.notifications (pharmacy_id, user_id, type, title, body, metadata)
  SELECT
    t.pharmacy_id,
    t.assigned_to,
    'task_overdue',
    'Tâche en retard',
    'La tâche "' || t.title || '" a dépassé son échéance.',
    jsonb_build_object(
      'task_id', t.id,
      'target_url', '/tasks'
    )
  FROM public.tasks t
  WHERE t.due_date IS NOT NULL
    AND t.due_date < CURRENT_DATE
    AND t.status = 'todo'
    AND t.assigned_to IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.type = 'task_overdue'
        AND n.user_id = t.assigned_to
        AND n.metadata->>'task_id' = t.id::text
    );

  -- Locations en retard (titulaire + adjoint de l'officine)
  INSERT INTO public.notifications (pharmacy_id, user_id, type, title, body, metadata)
  SELECT DISTINCT
    r.pharmacy_id,
    p.id,
    'rental_overdue',
    'Location en retard',
    'La location "' || r.equipment || '" devait être rendue le '
      || to_char(r.expected_return, 'DD/MM/YYYY') || '.',
    jsonb_build_object(
      'domain', 'rental',
      'rental_id', r.id,
      'target_url', '/rentals'
    )
  FROM public.rentals r
  JOIN public.profiles p
    ON p.pharmacy_id = r.pharmacy_id
   AND p.role IN ('titulaire', 'adjoint')
  WHERE r.expected_return < CURRENT_DATE
    AND r.status = 'active'
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.type = 'rental_overdue'
        AND n.user_id = p.id
        AND n.metadata->>'rental_id' = r.id::text
    );
END;
$$;


ALTER FUNCTION "public"."create_overdue_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_clockin_geofence"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  is_clockin boolean := false;
  pharm public.pharmacies%ROWTYPE;
  dist double precision;
BEGIN
  IF TG_OP = 'INSERT' THEN
    is_clockin := (NEW.ended_at IS NULL);
  ELSIF TG_OP = 'UPDATE' THEN
    is_clockin := (NEW.ended_at IS NULL AND OLD.ended_at IS NOT NULL);
  END IF;

  IF NOT is_clockin THEN
    RETURN NEW;
  END IF;

  SELECT * INTO pharm FROM public.pharmacies WHERE id = NEW.pharmacy_id;

  -- Geofence désactivé ou officine non géocodée → aucun contrôle.
  IF pharm.clockin_geofence_enabled IS NOT TRUE
     OR pharm.address_latitude IS NULL
     OR pharm.address_longitude IS NULL THEN
    RETURN NEW;
  END IF;

  -- Geofence actif : la position est obligatoire.
  IF NEW.clockin_latitude IS NULL OR NEW.clockin_longitude IS NULL THEN
    RAISE EXCEPTION 'GEOFENCE_POSITION_REQUIRED'
      USING ERRCODE = 'check_violation';
  END IF;

  dist := public.geofence_distance_m(
    NEW.clockin_latitude, NEW.clockin_longitude,
    pharm.address_latitude, pharm.address_longitude
  );
  NEW.clockin_distance_m := round(dist);

  -- Tolérance sur l'imprécision GPS : (distance - accuracy) <= rayon.
  IF (dist - COALESCE(NEW.clockin_accuracy_m, 0)) > pharm.clockin_geofence_radius_m THEN
    RAISE EXCEPTION 'GEOFENCE_OUT_OF_ZONE distance=% radius=%',
      round(dist)::int, pharm.clockin_geofence_radius_m
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_clockin_geofence"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_order_status_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF OLD.status = 'received' AND NEW.status <> 'received' THEN
    NEW.received_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_order_status_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_prescription_status_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 'expired'
     AND coalesce(current_setting('app.status_bypass', true), '') <> 'on' THEN
    RAISE EXCEPTION 'PRESCRIPTION_EXPIRED_AUTOMATIC_ONLY';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_prescription_status_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_profile_role_pharmacy_service_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."enforce_profile_role_pharmacy_service_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_rental_status_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."enforce_rental_status_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_subscription_columns_service_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."enforce_subscription_columns_service_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_prescriptions"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."expire_prescriptions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."geofence_distance_m"("lat1" double precision, "lng1" double precision, "lat2" double precision, "lng2" double precision) RETURNS double precision
    LANGUAGE "sql" IMMUTABLE
    AS $$
  SELECT 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;


ALTER FUNCTION "public"."geofence_distance_m"("lat1" double precision, "lng1" double precision, "lat2" double precision, "lng2" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pharmacy_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT pharmacy_id FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_pharmacy_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."materialize_overdue_rentals"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."materialize_overdue_rentals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_rental_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  expected_return_label text;
  daily_rate_label text;
  deposit_label text;
  notif_title text;
  notif_body text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    notif_title := 'Nouvelle location creee';
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('overdue', 'returned') THEN
    notif_title := CASE
      WHEN NEW.status = 'overdue' THEN 'Location en retard'
      ELSE 'Location retournee'
    END;
  ELSE
    RETURN NEW;
  END IF;

  expected_return_label := COALESCE(to_char(NEW.expected_return::date, 'DD/MM/YYYY'), '—');
  daily_rate_label := CASE
    WHEN NEW.daily_rate IS NULL THEN 'Non renseigne'
    ELSE to_char(NEW.daily_rate, 'FM999999990.00') || ' EUR/j'
  END;
  deposit_label := CASE
    WHEN NEW.deposit IS NULL THEN 'Aucune'
    ELSE to_char(NEW.deposit, 'FM999999990.00') || ' EUR'
  END;

  notif_body := concat(
    'Client: ', NEW.client_name,
    ' · Materiel: ', NEW.equipment,
    ' · Retour prevu: ', expected_return_label,
    ' · Facturation: ', daily_rate_label,
    ' · Caution: ', deposit_label
  );

  INSERT INTO public.notifications (pharmacy_id, user_id, type, title, body, metadata)
  SELECT
    NEW.pharmacy_id,
    p.id,
    'shortage_reported',
    notif_title,
    notif_body,
    jsonb_build_object(
      'domain', 'rental',
      'rental_id', NEW.id,
      'status', NEW.status,
      'expected_return', NEW.expected_return,
      'daily_rate', NEW.daily_rate,
      'deposit', NEW.deposit,
      'client_name', NEW.client_name,
      'equipment', NEW.equipment,
      'target_url', '/rentals'
    )
  FROM public.profiles p
  WHERE p.pharmacy_id = NEW.pharmacy_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_rental_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_prescription_items_search_text"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.prescription_id, OLD.prescription_id);
  UPDATE public.prescriptions p
  SET items_search_text = COALESCE((
    SELECT string_agg(pi.medication_name, ' ' ORDER BY pi.created_at)
    FROM public.prescription_items pi
    WHERE pi.prescription_id = target_id
  ), '')
  WHERE p.id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."sync_prescription_items_search_text"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "author_id" "uuid",
    "body" "text" NOT NULL,
    "edited_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chat_messages_body_check" CHECK ((("length"("body") >= 1) AND ("length"("body") <= 4000)))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_read_states" (
    "user_id" "uuid" NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "last_read_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_read_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "company" "text",
    "role" "text",
    "category" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "address" "text",
    "website" "text",
    "reference" "text",
    "notes" "text",
    "is_urgent" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drug_shortages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cis" "text" NOT NULL,
    "medication_name" "text",
    "type" "text",
    "started_at" "date",
    "ends_at" "date",
    "ansm_url" "text",
    "imported_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cip13" "text"
);


ALTER TABLE "public"."drug_shortages" OWNER TO "postgres";


COMMENT ON COLUMN "public"."drug_shortages"."cip13" IS 'Code CIP13 (boîte) pour la levée au scanner ; peut être renseigné à l’import.';



CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid",
    "user_id" "uuid",
    "category" "text" NOT NULL,
    "content" "text" NOT NULL,
    "page_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "feedback_category_check" CHECK (("category" = ANY (ARRAY['bug'::"text", 'idea'::"text", 'praise'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "leave_type" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "half_day_start" boolean DEFAULT false NOT NULL,
    "half_day_end" boolean DEFAULT false NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "start_period" "text" DEFAULT 'full'::"text" NOT NULL,
    "end_period" "text" DEFAULT 'full'::"text" NOT NULL,
    CONSTRAINT "leave_requests_check" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "leave_requests_end_period_check" CHECK (("end_period" = ANY (ARRAY['full'::"text", 'am'::"text", 'pm'::"text"]))),
    CONSTRAINT "leave_requests_leave_type_check" CHECK (("leave_type" = ANY (ARRAY['cp'::"text", 'rtt'::"text", 'sick'::"text", 'training'::"text", 'public_holiday'::"text", 'unpaid'::"text", 'other'::"text"]))),
    CONSTRAINT "leave_requests_start_period_check" CHECK (("start_period" = ANY (ARRAY['full'::"text", 'am'::"text", 'pm'::"text"]))),
    CONSTRAINT "leave_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."leave_requests" OWNER TO "postgres";


COMMENT ON COLUMN "public"."leave_requests"."start_period" IS 'Période d''absence le jour de début : full (journée), am (matin), pm (après-midi). Remplace half_day_start.';



COMMENT ON COLUMN "public"."leave_requests"."end_period" IS 'Période d''absence le jour de fin : full (journée), am (matin), pm (après-midi). Remplace half_day_end.';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "read_at" timestamp with time zone,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['task_assigned'::"text", 'shortage_reported'::"text", 'handover_note'::"text", 'task_overdue'::"text", 'rental_overdue'::"text", 'leave_request_submitted'::"text", 'leave_request_decided'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "product_name" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric,
    "is_shortage" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "supplier_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "status" "public"."order_status" DEFAULT 'draft'::"public"."order_status" NOT NULL,
    "notes" "text",
    "ordered_at" timestamp with time zone,
    "received_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pharmacies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "finess" "text",
    "address" "text",
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "subscription_status" "text",
    "subscription_tier" "text",
    "subscription_billing" "text",
    "trial_end" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "address_latitude" numeric(10,7),
    "address_longitude" numeric(10,7),
    "address_geocoded_at" timestamp with time zone,
    "clockin_geofence_enabled" boolean DEFAULT false NOT NULL,
    "clockin_geofence_radius_m" integer DEFAULT 100 NOT NULL,
    CONSTRAINT "pharmacies_clockin_geofence_radius_m_check" CHECK ((("clockin_geofence_radius_m" >= 25) AND ("clockin_geofence_radius_m" <= 1000))),
    CONSTRAINT "pharmacies_subscription_billing_check" CHECK ((("subscription_billing" IS NULL) OR ("subscription_billing" = ANY (ARRAY['monthly'::"text", 'yearly'::"text"])))),
    CONSTRAINT "pharmacies_subscription_status_check" CHECK ((("subscription_status" IS NULL) OR ("subscription_status" = ANY (ARRAY['incomplete'::"text", 'trialing'::"text", 'active'::"text", 'past_due'::"text", 'canceled'::"text", 'unpaid'::"text"])))),
    CONSTRAINT "pharmacies_subscription_tier_check" CHECK ((("subscription_tier" IS NULL) OR ("subscription_tier" = ANY (ARRAY['po'::"text", 'otm'::"text", 'go'::"text", 'ep'::"text"]))))
);


ALTER TABLE "public"."pharmacies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pharmacy_acquisition" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "public"."citext" NOT NULL,
    "locale" "text" DEFAULT 'fr'::"text" NOT NULL,
    "cgs_version" "text" NOT NULL,
    "cgs_hash" "text" NOT NULL,
    "cgs_accepted_at" timestamp with time zone NOT NULL,
    "dpa_version" "text" NOT NULL,
    "dpa_hash" "text" NOT NULL,
    "dpa_accepted_at" timestamp with time zone NOT NULL,
    "user_agent" "text",
    "ip_address" "inet",
    "source" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "utm_term" "text",
    "utm_content" "text",
    "referrer" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confirmed_at" timestamp with time zone,
    "pharmacy_id" "uuid",
    "abandoned" boolean DEFAULT false NOT NULL,
    "last_seen_at" timestamp with time zone,
    "funnel_step" "text",
    "abandoned_reason" "text",
    CONSTRAINT "pharmacy_acquisition_funnel_step_check" CHECK ((("funnel_step" IS NULL) OR ("funnel_step" = ANY (ARRAY['started'::"text", 'otp_sent'::"text", 'confirmed'::"text", 'pharmacy_created'::"text", 'trial_started'::"text"])))),
    CONSTRAINT "pharmacy_acquisition_locale_check" CHECK (("locale" = ANY (ARRAY['fr'::"text", 'en'::"text"])))
);


ALTER TABLE "public"."pharmacy_acquisition" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescription_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."prescription_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescription_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "medication_name" "text" NOT NULL,
    "dosage" "text",
    "quantity" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'to_serve'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."prescription_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "patient_ref" "text",
    "status" "public"."prescription_status" DEFAULT 'to_serve'::"public"."prescription_status" NOT NULL,
    "priority" "public"."task_priority" DEFAULT 'medium'::"public"."task_priority" NOT NULL,
    "execution_date" "date",
    "missing_products" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "image_url" "text",
    "items_search_text" "text" DEFAULT ''::"text" NOT NULL,
    "search_vec" "tsvector" GENERATED ALWAYS AS (((("setweight"("to_tsvector"('"french"'::"regconfig", COALESCE("patient_ref", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"french"'::"regconfig", COALESCE("items_search_text", ''::"text")), 'A'::"char")) || "setweight"("to_tsvector"('"french"'::"regconfig", COALESCE("missing_products", ''::"text")), 'B'::"char")) || "setweight"("to_tsvector"('"french"'::"regconfig", COALESCE("notes", ''::"text")), 'C'::"char"))) STORED,
    "prescriber_name" "text",
    "prescribed_date" "date",
    "expiry_date" "date"
);


ALTER TABLE "public"."prescriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "pharmacy_id" "uuid",
    "role" "public"."user_role" DEFAULT 'preparateur'::"public"."user_role" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "display_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "missions_dismissed_at" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."missions_dismissed_at" IS 'Set when the user manually dismisses the onboarding missions widget. NULL = widget visible. Per-user (chaque user gère son propre confort). Reactivatable depuis /profile/preferences.';



CREATE TABLE IF NOT EXISTS "public"."rental_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rental_id" "uuid" NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "size_bytes" integer NOT NULL,
    "original_filename" "text",
    "captured_at" timestamp with time zone,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "rental_attachments_size_bytes_check" CHECK ((("size_bytes" > 0) AND ("size_bytes" <= 10485760)))
);


ALTER TABLE "public"."rental_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rentals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "client_name" "text" NOT NULL,
    "client_phone" "text",
    "equipment" "text" NOT NULL,
    "status" "public"."rental_status" DEFAULT 'active'::"public"."rental_status" NOT NULL,
    "started_at" "date" NOT NULL,
    "expected_return" "date" NOT NULL,
    "returned_at" "date",
    "deposit" numeric,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "daily_rate" numeric,
    "billing_type" "public"."rental_billing_type" DEFAULT 'daily'::"public"."rental_billing_type" NOT NULL,
    "paid_units" integer DEFAULT 0 NOT NULL,
    "total_units" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."rentals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shift_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "template_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shift_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shift_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "kind" "text" DEFAULT 'custom'::"text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "break_start" time without time zone,
    "break_end" time without time zone,
    "color" "text",
    "archived_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shift_templates_kind_check" CHECK (("kind" = ANY (ARRAY['ouverture'::"text", 'fermeture'::"text", 'journee'::"text", 'garde'::"text", 'custom'::"text"]))),
    CONSTRAINT "shift_templates_time_check" CHECK (("end_time" <> "start_time"))
);


ALTER TABLE "public"."shift_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shortages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "reported_by" "uuid" NOT NULL,
    "resolved_by" "uuid",
    "product_name" "text" NOT NULL,
    "status" "public"."shortage_status" DEFAULT 'open'::"public"."shortage_status" NOT NULL,
    "substitute" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolution_cip13" "text",
    "drug_shortage_id" "uuid",
    "search_vec" "tsvector" GENERATED ALWAYS AS ((("setweight"("to_tsvector"('"french"'::"regconfig", COALESCE("product_name", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"french"'::"regconfig", COALESCE("substitute", ''::"text")), 'B'::"char")) || "setweight"("to_tsvector"('"french"'::"regconfig", COALESCE("notes", ''::"text")), 'C'::"char"))) STORED
);


ALTER TABLE "public"."shortages" OWNER TO "postgres";


COMMENT ON COLUMN "public"."shortages"."resolved_by" IS 'Utilisateur ayant levé la rupture.';



COMMENT ON COLUMN "public"."shortages"."resolved_at" IS 'Horodatage de la levée de rupture.';



COMMENT ON COLUMN "public"."shortages"."resolution_cip13" IS 'CIP13 scanné ou saisi lors de la levée.';



COMMENT ON COLUMN "public"."shortages"."drug_shortage_id" IS 'Entrée ANSM choisie au signalement ; levée par scan du CIP13 associé.';



CREATE TABLE IF NOT EXISTS "public"."stripe_webhook_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stripe_event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "pharmacy_id" "uuid",
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payload" "jsonb"
);


ALTER TABLE "public"."stripe_webhook_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "contact_name" "text",
    "phone" "text",
    "email" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "public"."task_priority" DEFAULT 'medium'::"public"."task_priority" NOT NULL,
    "due_date" "date",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."task_status" DEFAULT 'todo'::"public"."task_status" NOT NULL,
    "audio_url" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "search_vec" "tsvector" GENERATED ALWAYS AS (("setweight"("to_tsvector"('"french"'::"regconfig", COALESCE("title", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"french"'::"regconfig", COALESCE("description", ''::"text")), 'B'::"char"))) STORED,
    CONSTRAINT "tasks_done_requires_assignee" CHECK ((("status" IS DISTINCT FROM 'done'::"public"."task_status") OR ("assigned_to" IS NOT NULL)))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tasks"."attachments" IS 'Liste JSON [{ url, name, type }] des fichiers uploadés.';



CREATE TABLE IF NOT EXISTS "public"."training_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "type" "public"."training_resource_type" NOT NULL,
    "url" "text",
    "storage_path" "text",
    "duration_minutes" integer,
    "is_published" boolean DEFAULT true NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."training_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "day_of_week" smallint NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "break_start" time without time zone,
    "break_end" time without time zone,
    "active_from" "date" NOT NULL,
    "active_until" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "weekly_schedules_check" CHECK (("end_time" > "start_time")),
    CONSTRAINT "weekly_schedules_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."weekly_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_session_segments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "segment_started_at" timestamp with time zone NOT NULL,
    "segment_ended_at" timestamp with time zone NOT NULL,
    "minutes" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "work_session_segments_minutes_check" CHECK (("minutes" >= 0))
);


ALTER TABLE "public"."work_session_segments" OWNER TO "postgres";


COMMENT ON TABLE "public"."work_session_segments" IS 'Périodes badgées : une ligne par clôture de session (pause = pas de ligne).';



CREATE TABLE IF NOT EXISTS "public"."work_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "tasks_completed" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "worked_minutes_accumulated" integer DEFAULT 0 NOT NULL,
    "current_segment_started_at" timestamp with time zone,
    "clockin_latitude" numeric(10,7),
    "clockin_longitude" numeric(10,7),
    "clockin_accuracy_m" numeric,
    "clockin_distance_m" numeric,
    CONSTRAINT "work_sessions_clockin_accuracy_m_check" CHECK ((("clockin_accuracy_m" IS NULL) OR (("clockin_accuracy_m" >= (0)::numeric) AND ("clockin_accuracy_m" <= (100)::numeric))))
);


ALTER TABLE "public"."work_sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."work_sessions"."worked_minutes_accumulated" IS 'Minutes travaillées sur les segments déjà clôturés.';



COMMENT ON COLUMN "public"."work_sessions"."current_segment_started_at" IS 'Début du segment en cours (reprise après pause).';



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_channels"
    ADD CONSTRAINT "chat_channels_pharmacy_id_slug_key" UNIQUE ("pharmacy_id", "slug");



ALTER TABLE ONLY "public"."chat_channels"
    ADD CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_read_states"
    ADD CONSTRAINT "chat_read_states_pkey" PRIMARY KEY ("user_id", "channel_id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drug_shortages"
    ADD CONSTRAINT "drug_shortages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pharmacies"
    ADD CONSTRAINT "pharmacies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pharmacy_acquisition"
    ADD CONSTRAINT "pharmacy_acquisition_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescription_comments"
    ADD CONSTRAINT "prescription_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescription_items"
    ADD CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rental_attachments"
    ADD CONSTRAINT "rental_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rentals"
    ADD CONSTRAINT "rentals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shift_assignments"
    ADD CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shift_templates"
    ADD CONSTRAINT "shift_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shortages"
    ADD CONSTRAINT "shortages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_webhook_log"
    ADD CONSTRAINT "stripe_webhook_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_webhook_log"
    ADD CONSTRAINT "stripe_webhook_log_stripe_event_id_key" UNIQUE ("stripe_event_id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_resources"
    ADD CONSTRAINT "training_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_schedules"
    ADD CONSTRAINT "weekly_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_session_segments"
    ADD CONSTRAINT "work_session_segments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_sessions"
    ADD CONSTRAINT "work_sessions_pkey" PRIMARY KEY ("id");



CREATE INDEX "audit_log_pharmacy_created_idx" ON "public"."audit_log" USING "btree" ("pharmacy_id", "created_at" DESC);



CREATE INDEX "chat_channels_pharmacy_idx" ON "public"."chat_channels" USING "btree" ("pharmacy_id");



CREATE INDEX "chat_messages_channel_created_idx" ON "public"."chat_messages" USING "btree" ("channel_id", "created_at" DESC);



CREATE INDEX "chat_messages_pharmacy_created_idx" ON "public"."chat_messages" USING "btree" ("pharmacy_id", "created_at" DESC);



CREATE INDEX "contacts_pharmacy_category_idx" ON "public"."contacts" USING "btree" ("pharmacy_id", "category");



CREATE INDEX "contacts_pharmacy_id_idx" ON "public"."contacts" USING "btree" ("pharmacy_id");



CREATE INDEX "drug_shortages_cip13_idx" ON "public"."drug_shortages" USING "btree" ("cip13") WHERE ("cip13" IS NOT NULL);



CREATE INDEX "feedback_created_at_idx" ON "public"."feedback" USING "btree" ("created_at" DESC);



CREATE INDEX "feedback_pharmacy_id_idx" ON "public"."feedback" USING "btree" ("pharmacy_id");



CREATE INDEX "invitations_token_hash_idx" ON "public"."invitations" USING "btree" ("token_hash");



CREATE INDEX "invitations_token_idx" ON "public"."invitations" USING "btree" ("token") WHERE ("accepted_at" IS NULL);



CREATE INDEX "leave_requests_dates_idx" ON "public"."leave_requests" USING "btree" ("pharmacy_id", "start_date", "end_date");



CREATE INDEX "leave_requests_pharmacy_id_idx" ON "public"."leave_requests" USING "btree" ("pharmacy_id");



CREATE INDEX "leave_requests_requester_id_idx" ON "public"."leave_requests" USING "btree" ("requester_id");



CREATE INDEX "leave_requests_status_idx" ON "public"."leave_requests" USING "btree" ("status");



CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "public"."notifications" USING "btree" ("user_id", "read_at", "created_at" DESC);



CREATE INDEX "order_items_order_id_idx" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "orders_pharmacy_created_id_idx" ON "public"."orders" USING "btree" ("pharmacy_id", "created_at" DESC, "id" DESC);

CREATE INDEX "orders_pharmacy_id_status_idx" ON "public"."orders" USING "btree" ("pharmacy_id", "status");



CREATE INDEX "pharmacies_geofence_enabled_idx" ON "public"."pharmacies" USING "btree" ("clockin_geofence_enabled") WHERE ("clockin_geofence_enabled" = true);



CREATE UNIQUE INDEX "pharmacies_stripe_customer_id_uidx" ON "public"."pharmacies" USING "btree" ("stripe_customer_id") WHERE ("stripe_customer_id" IS NOT NULL);



CREATE UNIQUE INDEX "pharmacies_stripe_subscription_id_uidx" ON "public"."pharmacies" USING "btree" ("stripe_subscription_id") WHERE ("stripe_subscription_id" IS NOT NULL);



CREATE INDEX "pharmacies_subscription_status_idx" ON "public"."pharmacies" USING "btree" ("subscription_status") WHERE ("subscription_status" = ANY (ARRAY['incomplete'::"text", 'past_due'::"text", 'canceled'::"text", 'unpaid'::"text"]));



CREATE INDEX "pharmacies_trial_end_idx" ON "public"."pharmacies" USING "btree" ("trial_end") WHERE ("subscription_status" = 'trialing'::"text");



CREATE INDEX "pharmacy_acquisition_created_at_idx" ON "public"."pharmacy_acquisition" USING "btree" ("created_at" DESC);



CREATE INDEX "pharmacy_acquisition_email_idx" ON "public"."pharmacy_acquisition" USING "btree" ("email");



CREATE INDEX "pharmacy_acquisition_funnel_step_idx" ON "public"."pharmacy_acquisition" USING "btree" ("funnel_step") WHERE ("funnel_step" IS NOT NULL);



CREATE INDEX "pharmacy_acquisition_pharmacy_id_idx" ON "public"."pharmacy_acquisition" USING "btree" ("pharmacy_id") WHERE ("pharmacy_id" IS NOT NULL);



CREATE INDEX "pharmacy_acquisition_source_idx" ON "public"."pharmacy_acquisition" USING "btree" ("source");



CREATE INDEX "prescription_comments_prescription_id_idx" ON "public"."prescription_comments" USING "btree" ("prescription_id");



CREATE INDEX "prescriptions_expiry_date_idx" ON "public"."prescriptions" USING "btree" ("expiry_date") WHERE ("expiry_date" IS NOT NULL);



CREATE INDEX "prescriptions_pharmacy_created_id_idx" ON "public"."prescriptions" USING "btree" ("pharmacy_id", "created_at" DESC, "id" DESC);

CREATE INDEX "prescriptions_pharmacy_id_status_idx" ON "public"."prescriptions" USING "btree" ("pharmacy_id", "status");



CREATE INDEX "prescriptions_search_idx" ON "public"."prescriptions" USING "gin" ("search_vec");



CREATE INDEX "rental_attachments_pharmacy_id_idx" ON "public"."rental_attachments" USING "btree" ("pharmacy_id");



CREATE INDEX "rental_attachments_rental_id_idx" ON "public"."rental_attachments" USING "btree" ("rental_id");



CREATE INDEX "rentals_expected_return_idx" ON "public"."rentals" USING "btree" ("expected_return") WHERE ("status" = 'active'::"public"."rental_status");



CREATE INDEX "rentals_pharmacy_created_id_idx" ON "public"."rentals" USING "btree" ("pharmacy_id", "created_at" DESC, "id" DESC);

CREATE INDEX "rentals_pharmacy_id_status_idx" ON "public"."rentals" USING "btree" ("pharmacy_id", "status");



CREATE INDEX "shift_assignments_pharmacy_date_idx" ON "public"."shift_assignments" USING "btree" ("pharmacy_id", "date");



CREATE UNIQUE INDEX "shift_assignments_unique_idx" ON "public"."shift_assignments" USING "btree" ("user_id", "date", "template_id");



CREATE INDEX "shift_templates_pharmacy_idx" ON "public"."shift_templates" USING "btree" ("pharmacy_id");



CREATE INDEX "shortages_drug_shortage_id_idx" ON "public"."shortages" USING "btree" ("drug_shortage_id");



CREATE INDEX "shortages_pharmacy_created_id_idx" ON "public"."shortages" USING "btree" ("pharmacy_id", "created_at" DESC, "id" DESC);

CREATE INDEX "shortages_pharmacy_id_status_idx" ON "public"."shortages" USING "btree" ("pharmacy_id", "status");



CREATE INDEX "shortages_search_idx" ON "public"."shortages" USING "gin" ("search_vec");



CREATE INDEX "stripe_webhook_log_pharmacy_id_idx" ON "public"."stripe_webhook_log" USING "btree" ("pharmacy_id") WHERE ("pharmacy_id" IS NOT NULL);



CREATE INDEX "stripe_webhook_log_received_at_idx" ON "public"."stripe_webhook_log" USING "btree" ("received_at" DESC);



CREATE INDEX "tasks_pharmacy_created_id_idx" ON "public"."tasks" USING "btree" ("pharmacy_id", "created_at" DESC, "id" DESC);

CREATE INDEX "tasks_search_idx" ON "public"."tasks" USING "gin" ("search_vec");

CREATE INDEX "tasks_assigned_to_idx" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "training_resources_pharmacy_id_idx" ON "public"."training_resources" USING "btree" ("pharmacy_id");



CREATE INDEX "weekly_schedules_pharmacy_user_idx" ON "public"."weekly_schedules" USING "btree" ("pharmacy_id", "user_id");



CREATE INDEX "work_session_segments_pharmacy_day_idx" ON "public"."work_session_segments" USING "btree" ("pharmacy_id", "segment_started_at" DESC);



CREATE INDEX "work_session_segments_session_id_idx" ON "public"."work_session_segments" USING "btree" ("session_id");



CREATE INDEX "work_session_segments_user_day_idx" ON "public"."work_session_segments" USING "btree" ("user_id", "segment_started_at" DESC);



CREATE INDEX "work_sessions_pharmacy_id_ended_at_idx" ON "public"."work_sessions" USING "btree" ("pharmacy_id", "ended_at") WHERE ("ended_at" IS NULL);



CREATE INDEX "work_sessions_user_id_started_at_idx" ON "public"."work_sessions" USING "btree" ("user_id", "started_at" DESC);



CREATE OR REPLACE TRIGGER "contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "pharmacies_create_default_channel" AFTER INSERT ON "public"."pharmacies" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_chat_channel"();



CREATE OR REPLACE TRIGGER "pharmacies_enforce_subscription_columns" BEFORE UPDATE ON "public"."pharmacies" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_subscription_columns_service_role"();



CREATE OR REPLACE TRIGGER "prescription_items_search_text_sync" AFTER INSERT OR DELETE OR UPDATE ON "public"."prescription_items" FOR EACH ROW EXECUTE FUNCTION "public"."sync_prescription_items_search_text"();



CREATE OR REPLACE TRIGGER "prescriptions_updated_at" BEFORE UPDATE ON "public"."prescriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_enforce_role_pharmacy" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_profile_role_pharmacy_service_role"();



CREATE OR REPLACE TRIGGER "rentals_updated_at" BEFORE UPDATE ON "public"."rentals" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "shortages_updated_at" BEFORE UPDATE ON "public"."shortages" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "training_resources_updated_at" BEFORE UPDATE ON "public"."training_resources" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trg_notify_rental_event" AFTER INSERT OR UPDATE ON "public"."rentals" FOR EACH ROW EXECUTE FUNCTION "public"."notify_rental_event"();



CREATE OR REPLACE TRIGGER "trg_order_status_transition" BEFORE UPDATE OF "status" ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_order_status_transition"();



CREATE OR REPLACE TRIGGER "trg_prescription_status_transition" BEFORE UPDATE OF "status" ON "public"."prescriptions" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_prescription_status_transition"();



CREATE OR REPLACE TRIGGER "trg_rental_status_transition" BEFORE UPDATE OF "status" ON "public"."rentals" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_rental_status_transition"();



CREATE OR REPLACE TRIGGER "work_sessions_enforce_geofence" BEFORE INSERT OR UPDATE ON "public"."work_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_clockin_geofence"();



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_channels"
    ADD CONSTRAINT "chat_channels_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_read_states"
    ADD CONSTRAINT "chat_read_states_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_read_states"
    ADD CONSTRAINT "chat_read_states_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_read_states"
    ADD CONSTRAINT "chat_read_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pharmacy_acquisition"
    ADD CONSTRAINT "pharmacy_acquisition_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."prescription_comments"
    ADD CONSTRAINT "prescription_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."prescription_comments"
    ADD CONSTRAINT "prescription_comments_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescription_comments"
    ADD CONSTRAINT "prescription_comments_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescription_items"
    ADD CONSTRAINT "prescription_items_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescription_items"
    ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rental_attachments"
    ADD CONSTRAINT "rental_attachments_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_attachments"
    ADD CONSTRAINT "rental_attachments_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rental_attachments"
    ADD CONSTRAINT "rental_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rentals"
    ADD CONSTRAINT "rentals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."rentals"
    ADD CONSTRAINT "rentals_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_assignments"
    ADD CONSTRAINT "shift_assignments_pharmacy_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_assignments"
    ADD CONSTRAINT "shift_assignments_template_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."shift_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_assignments"
    ADD CONSTRAINT "shift_assignments_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_templates"
    ADD CONSTRAINT "shift_templates_pharmacy_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shortages"
    ADD CONSTRAINT "shortages_drug_shortage_id_fkey" FOREIGN KEY ("drug_shortage_id") REFERENCES "public"."drug_shortages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shortages"
    ADD CONSTRAINT "shortages_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shortages"
    ADD CONSTRAINT "shortages_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."shortages"
    ADD CONSTRAINT "shortages_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stripe_webhook_log"
    ADD CONSTRAINT "stripe_webhook_log_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_resources"
    ADD CONSTRAINT "training_resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."training_resources"
    ADD CONSTRAINT "training_resources_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_schedules"
    ADD CONSTRAINT "weekly_schedules_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_schedules"
    ADD CONSTRAINT "weekly_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_session_segments"
    ADD CONSTRAINT "work_session_segments_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_session_segments"
    ADD CONSTRAINT "work_session_segments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."work_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_session_segments"
    ADD CONSTRAINT "work_session_segments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_sessions"
    ADD CONSTRAINT "work_sessions_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_sessions"
    ADD CONSTRAINT "work_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_log_insert" ON "public"."audit_log" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND ("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id"))));



CREATE POLICY "audit_log_select_titulaire" ON "public"."audit_log" FOR SELECT TO "authenticated" USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role")));



CREATE POLICY "auth_admin_select_profiles" ON "public"."profiles" FOR SELECT TO "supabase_auth_admin" USING (true);



ALTER TABLE "public"."chat_channels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_channels_select" ON "public"."chat_channels" FOR SELECT TO "authenticated" USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_messages_insert" ON "public"."chat_messages" FOR INSERT TO "authenticated" WITH CHECK ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND ("author_id" = "auth"."uid"())));



CREATE POLICY "chat_messages_select" ON "public"."chat_messages" FOR SELECT TO "authenticated" USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "chat_messages_update" ON "public"."chat_messages" FOR UPDATE TO "authenticated" USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND ((("author_id" = "auth"."uid"()) AND ("deleted_at" IS NULL)) OR (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role"))));



ALTER TABLE "public"."chat_read_states" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_read_states_mutate" ON "public"."chat_read_states" TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND ("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")))) WITH CHECK ((("user_id" = "auth"."uid"()) AND ("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id"))));



CREATE POLICY "chat_read_states_select" ON "public"."chat_read_states" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contacts_delete" ON "public"."contacts" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"]))));



CREATE POLICY "contacts_insert" ON "public"."contacts" FOR INSERT WITH CHECK ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "contacts_select" ON "public"."contacts" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "contacts_update" ON "public"."contacts" FOR UPDATE USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id"))) WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."drug_shortages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "drug_shortages_select" ON "public"."drug_shortages" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feedback_insert" ON "public"."feedback" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "feedback_select_own" ON "public"."feedback" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invitations_delete" ON "public"."invitations" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role")));



CREATE POLICY "invitations_insert" ON "public"."invitations" FOR INSERT WITH CHECK ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role")));



CREATE POLICY "invitations_select" ON "public"."invitations" FOR SELECT USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role")));



CREATE POLICY "invitations_update" ON "public"."invitations" FOR UPDATE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role")));



ALTER TABLE "public"."leave_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leave_requests_insert" ON "public"."leave_requests" FOR INSERT TO "authenticated" WITH CHECK ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND ("requester_id" = "auth"."uid"())));



CREATE POLICY "leave_requests_select" ON "public"."leave_requests" FOR SELECT TO "authenticated" USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "leave_requests_update" ON "public"."leave_requests" FOR UPDATE TO "authenticated" USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND ((("requester_id" = "auth"."uid"()) AND ("status" = 'pending'::"text")) OR (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role"))));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete" ON "public"."notifications" FOR DELETE USING ((("user_id" = "auth"."uid"()) AND ("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id"))));



CREATE POLICY "notifications_insert" ON "public"."notifications" FOR INSERT WITH CHECK ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND ((( SELECT "public"."get_user_role"() AS "get_user_role"))::"text" = ANY (ARRAY['titulaire'::"text", 'adjoint'::"text", 'preparateur'::"text", 'student'::"text", 'shelver'::"text"])) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "notifications"."user_id") AND ("p"."pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")))))));



CREATE POLICY "notifications_select" ON "public"."notifications" FOR SELECT USING ((("user_id" = "auth"."uid"()) AND ("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id"))));



CREATE POLICY "notifications_update" ON "public"."notifications" FOR UPDATE USING ((("user_id" = "auth"."uid"()) AND ("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")))) WITH CHECK ((("user_id" = "auth"."uid"()) AND ("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id"))));



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_delete" ON "public"."order_items" FOR DELETE USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "order_items_insert" ON "public"."order_items" FOR INSERT WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "order_items_select" ON "public"."order_items" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "order_items_update" ON "public"."order_items" FOR UPDATE USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_delete" ON "public"."orders" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"]))));



CREATE POLICY "orders_insert" ON "public"."orders" FOR INSERT WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "orders_select" ON "public"."orders" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "orders_update" ON "public"."orders" FOR UPDATE USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."pharmacies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pharmacies_insert_onboarding" ON "public"."pharmacies" FOR INSERT WITH CHECK (true);



CREATE POLICY "pharmacies_select_member" ON "public"."pharmacies" FOR SELECT USING (("id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "pharmacies_select_onboarding" ON "public"."pharmacies" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "pharmacies_update_titulaire" ON "public"."pharmacies" FOR UPDATE USING ((("id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role"))) WITH CHECK ((("id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role")));



ALTER TABLE "public"."pharmacy_acquisition" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prescription_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prescription_comments_delete" ON "public"."prescription_comments" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (("author_id" = "auth"."uid"()) OR (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role"))));



CREATE POLICY "prescription_comments_insert" ON "public"."prescription_comments" FOR INSERT WITH CHECK ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND ("author_id" = "auth"."uid"())));



CREATE POLICY "prescription_comments_select" ON "public"."prescription_comments" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."prescription_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prescription_items_delete" ON "public"."prescription_items" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"]))));



CREATE POLICY "prescription_items_insert" ON "public"."prescription_items" FOR INSERT WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "prescription_items_select" ON "public"."prescription_items" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "prescription_items_update" ON "public"."prescription_items" FOR UPDATE USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."prescriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prescriptions_delete" ON "public"."prescriptions" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"]))));



CREATE POLICY "prescriptions_insert" ON "public"."prescriptions" FOR INSERT WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "prescriptions_select" ON "public"."prescriptions" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "prescriptions_update" ON "public"."prescriptions" FOR UPDATE USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_self" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select_scoped" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR ("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id"))));



CREATE POLICY "profiles_update_self_or_titulaire" ON "public"."profiles" FOR UPDATE USING ((("id" = "auth"."uid"()) OR (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role")))) WITH CHECK ((("id" = "auth"."uid"()) OR (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role"))));



ALTER TABLE "public"."rental_attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rental_attachments_delete_own_pharmacy" ON "public"."rental_attachments" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND ((( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role") OR ("uploaded_by" = "auth"."uid"()))));



CREATE POLICY "rental_attachments_insert_own_pharmacy" ON "public"."rental_attachments" FOR INSERT WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "rental_attachments_select_own_pharmacy" ON "public"."rental_attachments" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."rentals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rentals_delete" ON "public"."rentals" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"]))));



CREATE POLICY "rentals_insert" ON "public"."rentals" FOR INSERT WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "rentals_select" ON "public"."rentals" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "rentals_update" ON "public"."rentals" FOR UPDATE USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."shift_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shift_assignments_select" ON "public"."shift_assignments" FOR SELECT TO "authenticated" USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "shift_assignments_write" ON "public"."shift_assignments" TO "authenticated" USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role"))) WITH CHECK ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role")));



ALTER TABLE "public"."shift_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shift_templates_select" ON "public"."shift_templates" FOR SELECT TO "authenticated" USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "shift_templates_write" ON "public"."shift_templates" TO "authenticated" USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role"))) WITH CHECK ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role")));



ALTER TABLE "public"."shortages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shortages_delete" ON "public"."shortages" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role")));



CREATE POLICY "shortages_insert" ON "public"."shortages" FOR INSERT WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "shortages_select" ON "public"."shortages" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "shortages_update" ON "public"."shortages" FOR UPDATE USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."stripe_webhook_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suppliers_delete" ON "public"."suppliers" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"]))));



CREATE POLICY "suppliers_insert" ON "public"."suppliers" FOR INSERT WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "suppliers_select" ON "public"."suppliers" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "suppliers_update" ON "public"."suppliers" FOR UPDATE USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_delete" ON "public"."tasks" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = 'titulaire'::"public"."user_role")));



CREATE POLICY "tasks_insert" ON "public"."tasks" FOR INSERT WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "tasks_select" ON "public"."tasks" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "tasks_update" ON "public"."tasks" FOR UPDATE USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id"))) WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."training_resources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "training_resources_delete" ON "public"."training_resources" FOR DELETE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"]))));



CREATE POLICY "training_resources_insert" ON "public"."training_resources" FOR INSERT WITH CHECK ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"])) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "training_resources_select" ON "public"."training_resources" FOR SELECT USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (("is_published" = true) OR (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"])))));



CREATE POLICY "training_resources_update" ON "public"."training_resources" FOR UPDATE USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"])))) WITH CHECK (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."weekly_schedules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "weekly_schedules_mutate" ON "public"."weekly_schedules" TO "authenticated" USING ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"])))) WITH CHECK ((("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")) AND (( SELECT "public"."get_user_role"() AS "get_user_role") = ANY (ARRAY['titulaire'::"public"."user_role", 'adjoint'::"public"."user_role"]))));



CREATE POLICY "weekly_schedules_select" ON "public"."weekly_schedules" FOR SELECT TO "authenticated" USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."work_session_segments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "work_session_segments_insert" ON "public"."work_session_segments" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id"))));



CREATE POLICY "work_session_segments_select" ON "public"."work_session_segments" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



ALTER TABLE "public"."work_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "work_sessions_delete" ON "public"."work_sessions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "work_sessions_insert" ON "public"."work_sessions" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("pharmacy_id" IS NOT NULL) AND ("pharmacy_id" = ( SELECT "p"."pharmacy_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "work_sessions_select" ON "public"."work_sessions" FOR SELECT USING (("pharmacy_id" = ( SELECT "public"."get_pharmacy_id"() AS "get_pharmacy_id")));



CREATE POLICY "work_sessions_update" ON "public"."work_sessions" FOR UPDATE USING ((("user_id" = "auth"."uid"()) AND ("pharmacy_id" = ( SELECT "p"."pharmacy_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))))) WITH CHECK ((("user_id" = "auth"."uid"()) AND ("pharmacy_id" = ( SELECT "p"."pharmacy_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."create_default_chat_channel"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_chat_channel"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_chat_channel"() TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_invitation_with_quota"("p_pharmacy_id" "uuid", "p_email" "text", "p_role" "public"."user_role", "p_token" "uuid", "p_token_hash" "text", "p_limit" double precision) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_invitation_with_quota"("p_pharmacy_id" "uuid", "p_email" "text", "p_role" "public"."user_role", "p_token" "uuid", "p_token_hash" "text", "p_limit" double precision) TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_overdue_notifications"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_overdue_notifications"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."enforce_clockin_geofence"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_clockin_geofence"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_clockin_geofence"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_order_status_transition"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_order_status_transition"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_order_status_transition"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_prescription_status_transition"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_prescription_status_transition"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_prescription_status_transition"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_profile_role_pharmacy_service_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_profile_role_pharmacy_service_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_profile_role_pharmacy_service_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_rental_status_transition"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_rental_status_transition"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_rental_status_transition"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_subscription_columns_service_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_subscription_columns_service_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_subscription_columns_service_role"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."expire_prescriptions"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."expire_prescriptions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."geofence_distance_m"("lat1" double precision, "lng1" double precision, "lat2" double precision, "lng2" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."geofence_distance_m"("lat1" double precision, "lng1" double precision, "lat2" double precision, "lng2" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."geofence_distance_m"("lat1" double precision, "lng1" double precision, "lat2" double precision, "lng2" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pharmacy_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pharmacy_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pharmacy_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."materialize_overdue_rentals"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."materialize_overdue_rentals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_rental_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_rental_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_rental_event"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_prescription_items_search_text"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_prescription_items_search_text"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_prescription_items_search_text"() TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."chat_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_channels" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_read_states" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_read_states" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."drug_shortages" TO "anon";
GRANT ALL ON TABLE "public"."drug_shortages" TO "authenticated";
GRANT ALL ON TABLE "public"."drug_shortages" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."leave_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_requests" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."pharmacies" TO "authenticated";
GRANT ALL ON TABLE "public"."pharmacies" TO "service_role";



GRANT ALL ON TABLE "public"."pharmacy_acquisition" TO "authenticated";
GRANT ALL ON TABLE "public"."pharmacy_acquisition" TO "service_role";



GRANT ALL ON TABLE "public"."prescription_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."prescription_comments" TO "service_role";



GRANT ALL ON TABLE "public"."prescription_items" TO "authenticated";
GRANT ALL ON TABLE "public"."prescription_items" TO "service_role";



GRANT ALL ON TABLE "public"."prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."prescriptions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."profiles" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."rental_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."rental_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."rentals" TO "authenticated";
GRANT ALL ON TABLE "public"."rentals" TO "service_role";



GRANT ALL ON TABLE "public"."shift_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."shift_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_templates" TO "service_role";



GRANT ALL ON TABLE "public"."shortages" TO "authenticated";
GRANT ALL ON TABLE "public"."shortages" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_webhook_log" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_webhook_log" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."training_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."training_resources" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."work_session_segments" TO "authenticated";
GRANT ALL ON TABLE "public"."work_session_segments" TO "service_role";



GRANT ALL ON TABLE "public"."work_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."work_sessions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







