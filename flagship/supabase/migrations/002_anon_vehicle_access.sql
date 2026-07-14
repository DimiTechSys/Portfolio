-- Allow local/dev app usage without explicit auth session.
-- Existing policies only allow `authenticated`, which blocks inserts from anon clients.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vehicles'
      AND policyname = 'anon_vehicle_full_access'
  ) THEN
    CREATE POLICY "anon_vehicle_full_access"
      ON vehicles
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vehicle_history'
      AND policyname = 'anon_vehicle_history_full_access'
  ) THEN
    CREATE POLICY "anon_vehicle_history_full_access"
      ON vehicle_history
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

