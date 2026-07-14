-- 0031_buckets_private_and_pharmacy_select.sql
-- P1-05: buckets attachments et training-files en privé + filtre pharmacy_id sur SELECT.

UPDATE storage.buckets SET public = false WHERE id IN ('attachments', 'training-files');

-- Re-crée la policy SELECT pour attachments avec filtre pharmacy_id
DROP POLICY IF EXISTS "attachments_select" ON storage.objects;
CREATE POLICY "attachments_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);

-- Idem pour training-files
DROP POLICY IF EXISTS "training_files_select" ON storage.objects;
CREATE POLICY "training_files_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'training-files'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);
