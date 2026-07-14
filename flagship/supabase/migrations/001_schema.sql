-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────
-- VEHICLES
-- ───────────────────────────────────────────
CREATE TABLE vehicles (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  plate                TEXT NOT NULL UNIQUE,
  brand                TEXT NOT NULL,
  model                TEXT NOT NULL,
  year                 INT NOT NULL,
  type                 TEXT NOT NULL CHECK (type IN ('VO', 'VN')),
  km                   INT NOT NULL DEFAULT 0,
  fuel                 TEXT NOT NULL,
  gear                 TEXT NOT NULL,
  color_ext            TEXT,
  color_int            TEXT,
  power_hp             INT,
  doors                INT DEFAULT 5,
  price_sell           NUMERIC(10,2) NOT NULL,
  price_buy            NUMERIC(10,2),
  dpe                  TEXT CHECK (dpe IN ('A','B','C','D','E','F','G')),
  ct_status            TEXT DEFAULT 'Valide',
  ct_date              DATE,
  options              TEXT DEFAULT '',
  notes_internal       TEXT DEFAULT '',
  status               TEXT NOT NULL DEFAULT 'disponible'
                         CHECK (status IN ('disponible','réservé','vendu')),
  instagram_published  BOOLEAN DEFAULT FALSE,
  instagram_post_id    TEXT,
  photos               TEXT[] DEFAULT '{}'
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_brand  ON vehicles(brand);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ───────────────────────────────────────────
-- VEHICLE HISTORY
-- ───────────────────────────────────────────
CREATE TABLE vehicle_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  event       TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_vehicle_history_vehicle ON vehicle_history(vehicle_id);

-- ───────────────────────────────────────────
-- CLIENTS
-- ───────────────────────────────────────────
CREATE TABLE clients (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  email            TEXT,
  phone            TEXT,
  address          TEXT DEFAULT '',
  city             TEXT DEFAULT '',
  postal_code      TEXT DEFAULT '',
  notes            TEXT DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'prospect'
                     CHECK (status IN ('prospect','actif','fidèle','inactif'))
);

CREATE INDEX idx_clients_status ON clients(status);

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ───────────────────────────────────────────
-- DOCUMENTS (devis + factures)
-- ───────────────────────────────────────────
CREATE TABLE documents (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  type             TEXT NOT NULL CHECK (type IN ('devis','facture')),
  reference        TEXT NOT NULL UNIQUE,
  client_id        UUID NOT NULL REFERENCES clients(id),
  vehicle_id       UUID REFERENCES vehicles(id),
  status           TEXT NOT NULL DEFAULT 'brouillon'
                     CHECK (status IN ('brouillon','envoyé','en_attente','accepté','refusé','expiré','payé')),
  lines            JSONB NOT NULL DEFAULT '[]',
  amount_ht        NUMERIC(10,2) NOT NULL DEFAULT 0,
  tva_rate         NUMERIC(5,2)  NOT NULL DEFAULT 20,
  amount_ttc       NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_percent  INT DEFAULT 30,
  deposit_paid     BOOLEAN DEFAULT FALSE,
  notes            TEXT DEFAULT '',
  expires_at       TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,
  payment_link     TEXT
);

CREATE INDEX idx_documents_type   ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_client ON documents(client_id);

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate reference (DEV-XXXX / FAC-XXXX)
CREATE SEQUENCE devis_seq START 1;
CREATE SEQUENCE facture_seq START 1;

CREATE OR REPLACE FUNCTION generate_document_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    IF NEW.type = 'devis' THEN
      NEW.reference := 'DEV-' || LPAD(nextval('devis_seq')::TEXT, 4, '0');
    ELSE
      NEW.reference := 'FAC-' || LPAD(nextval('facture_seq')::TEXT, 4, '0');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_reference
  BEFORE INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION generate_document_reference();

-- ───────────────────────────────────────────
-- COMPETITORS & PRICE WATCH
-- ───────────────────────────────────────────
CREATE TABLE competitors (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  location     TEXT,
  distance_km  NUMERIC(5,1),
  url          TEXT
);

CREATE TABLE competitor_prices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  competitor_id  UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  brand          TEXT NOT NULL,
  model          TEXT NOT NULL,
  year           INT,
  km             INT,
  price          NUMERIC(10,2) NOT NULL,
  url            TEXT
);

-- ───────────────────────────────────────────
-- FINANCING PARTNERS
-- ───────────────────────────────────────────
CREATE TABLE financing_partners (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  rate_percent NUMERIC(5,2) NOT NULL,
  min_months   INT DEFAULT 12,
  max_months   INT DEFAULT 84
);

INSERT INTO financing_partners (name, rate_percent, min_months, max_months) VALUES
  ('BNP Paribas', 3.9, 12, 84),
  ('Sofinco', 4.2, 12, 72),
  ('La Centrale', 3.5, 24, 60);

-- ───────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────
ALTER TABLE vehicles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_partners ENABLE ROW LEVEL SECURITY;

-- Authenticated users have full access (single-tenant concession)
CREATE POLICY "auth_full_access" ON vehicles          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON vehicle_history   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON clients           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON documents         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON competitors       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON competitor_prices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_access" ON financing_partners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public read for shared vehicle links
CREATE POLICY "public_vehicle_read" ON vehicles
  FOR SELECT TO anon USING (status != 'vendu');

-- ───────────────────────────────────────────
-- SEED DATA
-- ───────────────────────────────────────────
INSERT INTO competitors (name, location, distance_km, url) VALUES
  ('AutoPlus Concessionnaire', 'Versailles', 8.2, NULL),
  ('OccasAuto 78', 'Saint-Germain-en-Laye', 12.4, NULL),
  ('PremiumCar Île-de-France', 'Massy', 18.0, NULL),
  ('ElectrAuto', 'Vélizy-Villacoublay', 6.5, NULL),
  ('PrestigeCar', 'Boulogne-Billancourt', 22.1, NULL),
  ('DrivePlus78', 'Poissy', 14.3, NULL);
