-- Ruptures officine : référentiel ANSM (drug_shortages), plus de table medications.

ALTER TABLE public.drug_shortages
  ADD COLUMN IF NOT EXISTS cip13 text;

CREATE INDEX IF NOT EXISTS drug_shortages_cip13_idx
  ON public.drug_shortages (cip13)
  WHERE cip13 IS NOT NULL;

COMMENT ON COLUMN public.drug_shortages.cip13 IS
  'Code CIP13 (boîte) pour la levée au scanner ; peut être renseigné à l’import.';

ALTER TABLE public.shortages
  DROP CONSTRAINT IF EXISTS shortages_medication_id_fkey;

ALTER TABLE public.shortages
  DROP COLUMN IF EXISTS medication_id;

ALTER TABLE public.shortages
  ADD COLUMN IF NOT EXISTS drug_shortage_id uuid
  REFERENCES public.drug_shortages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS shortages_drug_shortage_id_idx
  ON public.shortages (drug_shortage_id);

COMMENT ON COLUMN public.shortages.drug_shortage_id IS
  'Entrée ANSM choisie au signalement ; levée par scan du CIP13 associé.';

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medications_select ON public.medications;
DROP TABLE IF EXISTS public.medications;

ALTER TABLE public.drug_shortages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS drug_shortages_select ON public.drug_shortages;
CREATE POLICY drug_shortages_select
  ON public.drug_shortages
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
