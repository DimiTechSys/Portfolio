-- 0052_pharmacy_geofencing.sql
-- BADGE-01 — Geofencing du badgeage.
-- Ajoute les coordonnées géocodées + la config geofence sur pharmacies, les
-- coordonnées de pointage sur work_sessions, et un trigger qui refuse côté
-- serveur un clock-in hors zone (gardefou non contournable, même via appel
-- Supabase direct). Geofence OFF par défaut → rétrocompatible.

-- ── Config geofence sur la pharmacie ─────────────────────────────────
ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS address_latitude numeric(10, 7),
  ADD COLUMN IF NOT EXISTS address_longitude numeric(10, 7),
  ADD COLUMN IF NOT EXISTS address_geocoded_at timestamptz,
  ADD COLUMN IF NOT EXISTS clockin_geofence_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS clockin_geofence_radius_m integer NOT NULL DEFAULT 100
    CHECK (clockin_geofence_radius_m BETWEEN 25 AND 1000);

CREATE INDEX IF NOT EXISTS pharmacies_geofence_enabled_idx
  ON public.pharmacies(clockin_geofence_enabled)
  WHERE clockin_geofence_enabled = true;

-- ── Position de pointage stockée sur la session (audit) ──────────────
ALTER TABLE public.work_sessions
  ADD COLUMN IF NOT EXISTS clockin_latitude numeric(10, 7),
  ADD COLUMN IF NOT EXISTS clockin_longitude numeric(10, 7),
  ADD COLUMN IF NOT EXISTS clockin_accuracy_m numeric,
  ADD COLUMN IF NOT EXISTS clockin_distance_m numeric;

-- ── Distance Haversine (mètres) ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.geofence_distance_m(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) RETURNS double precision
LANGUAGE sql IMMUTABLE AS $$
  SELECT 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- ── Enforcement serveur du geofence au clock-in ──────────────────────
-- Ne s'applique QU'AU clock-in : un INSERT de session ouverte (ended_at NULL)
-- ou une réouverture (UPDATE ended_at: non-null → NULL). Les autres updates
-- (clôture, accumulation de minutes, tasks_completed) ne sont pas concernés.
CREATE OR REPLACE FUNCTION public.enforce_clockin_geofence()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

DROP TRIGGER IF EXISTS work_sessions_enforce_geofence ON public.work_sessions;
CREATE TRIGGER work_sessions_enforce_geofence
  BEFORE INSERT OR UPDATE ON public.work_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_clockin_geofence();
