-- Lier chaque rupture au référentiel médicaments (nom au signalement, CIP13 à la levée).

ALTER TABLE public.shortages
  ADD COLUMN IF NOT EXISTS medication_id uuid REFERENCES public.medications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS shortages_medication_id_idx ON public.shortages (medication_id);

COMMENT ON COLUMN public.shortages.medication_id IS
  'Médicament du référentiel choisi au signalement ; la levée valide le CIP13 du même enregistrement.';
