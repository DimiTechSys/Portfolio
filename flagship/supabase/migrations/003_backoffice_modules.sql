-- Back-office modules: leads, appointments, trade-ins, tasks, vehicle publications
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  vehicle_id   UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  source       TEXT NOT NULL DEFAULT 'site'
               CHECK (source IN ('site', 'appel', 'whatsapp', 'email')),
  status       TEXT NOT NULL DEFAULT 'nouveau'
               CHECK (status IN ('nouveau', 'contacté', 'qualifié', 'rdv_planifié', 'converti', 'perdu')),
  assigned_to  TEXT,
  notes        TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS appointments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  lead_id      UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  vehicle_id   UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'planifié'
               CHECK (status IN ('planifié', 'confirmé', 'réalisé', 'no_show', 'annulé')),
  notes        TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS trade_ins (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  brand            TEXT NOT NULL,
  model            TEXT NOT NULL,
  year             INT,
  km               INT,
  estimated_value  NUMERIC(10,2),
  offered_value    NUMERIC(10,2),
  status           TEXT NOT NULL DEFAULT 'nouveau'
                   CHECK (status IN ('nouveau', 'expertise', 'offre_envoyée', 'négociation', 'acceptée', 'refusée')),
  notes            TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  title        TEXT NOT NULL,
  due_at       TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'todo'
               CHECK (status IN ('todo', 'in_progress', 'done')),
  priority     TEXT NOT NULL DEFAULT 'moyenne'
               CHECK (priority IN ('haute', 'moyenne', 'basse')),
  assigned_to  TEXT,
  related_type TEXT,
  related_id   UUID
);

CREATE TABLE IF NOT EXISTS vehicle_publications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  vehicle_id     UUID NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'brouillon'
                 CHECK (status IN ('brouillon', 'prêt', 'publié', 'retiré')),
  title          TEXT,
  slug           TEXT UNIQUE,
  published_at   TIMESTAMPTZ,
  unpublished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments(starts_at);
CREATE INDEX IF NOT EXISTS idx_trade_ins_status ON trade_ins(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_vehicle_publications_status ON vehicle_publications(status);

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS appointments_updated_at ON appointments;
CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trade_ins_updated_at ON trade_ins;
CREATE TRIGGER trade_ins_updated_at
  BEFORE UPDATE ON trade_ins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS vehicle_publications_updated_at ON vehicle_publications;
CREATE TRIGGER vehicle_publications_updated_at
  BEFORE UPDATE ON vehicle_publications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_publications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_full_access" ON leads;
CREATE POLICY "auth_full_access" ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_full_access" ON appointments;
CREATE POLICY "auth_full_access" ON appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_full_access" ON trade_ins;
CREATE POLICY "auth_full_access" ON trade_ins FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_full_access" ON tasks;
CREATE POLICY "auth_full_access" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_full_access" ON vehicle_publications;
CREATE POLICY "auth_full_access" ON vehicle_publications FOR ALL TO authenticated USING (true) WITH CHECK (true);
