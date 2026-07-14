-- P2-03 — Full-text search (prescriptions + pharmacy shortages)

-- Denormalized medication names for FTS (prescription_items lives in a child table)
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS items_search_text text NOT NULL DEFAULT '';

UPDATE public.prescriptions p
SET items_search_text = COALESCE(sub.agg, '')
FROM (
  SELECT prescription_id, string_agg(medication_name, ' ' ORDER BY created_at) AS agg
  FROM public.prescription_items
  GROUP BY prescription_id
) sub
WHERE p.id = sub.prescription_id;

CREATE OR REPLACE FUNCTION public.sync_prescription_items_search_text()
RETURNS trigger
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS prescription_items_search_text_sync ON public.prescription_items;
CREATE TRIGGER prescription_items_search_text_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.prescription_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_prescription_items_search_text();

ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS search_vec tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(patient_ref, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(items_search_text, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(missing_products, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(notes, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS prescriptions_search_idx
  ON public.prescriptions USING GIN (search_vec);

ALTER TABLE public.shortages
  ADD COLUMN IF NOT EXISTS search_vec tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(product_name, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(substitute, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(notes, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS shortages_search_idx
  ON public.shortages USING GIN (search_vec);
