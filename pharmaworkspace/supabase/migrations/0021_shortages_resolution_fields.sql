-- Traçabilité structurée de la levée de rupture (audit qualité).

ALTER TABLE public.shortages
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution_cip13 text;

COMMENT ON COLUMN public.shortages.resolved_at IS 'Horodatage de la levée de rupture.';
COMMENT ON COLUMN public.shortages.resolution_cip13 IS 'CIP13 scanné ou saisi lors de la levée.';
COMMENT ON COLUMN public.shortages.resolved_by IS 'Utilisateur ayant levé la rupture.';
