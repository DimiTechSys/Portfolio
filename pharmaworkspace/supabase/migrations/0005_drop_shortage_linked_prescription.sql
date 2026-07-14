-- 0005_drop_shortage_linked_prescription.sql
-- Les ruptures ne sont plus liées à une ordonnance (voir 0001_init.sql).

ALTER TABLE public.shortages
  DROP COLUMN IF EXISTS linked_prescription_id;
