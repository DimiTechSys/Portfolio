-- 0010_training_files_storage_bucket.sql
-- Bucket Storage pour Qualité & proc (PDF, vidéos, etc.) — aligné avec src/lib/queries/training.ts

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('training-files', 'training-files', true, 524288000)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Lecture : bucket public → URLs /storage/v1/object/public/training-files/... accessibles.
DROP POLICY IF EXISTS "training_files_select" ON storage.objects;
CREATE POLICY "training_files_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-files');

-- Upload : uniquement titulaire / adjoint, sous-dossier = pharmacy_id du profil.
DROP POLICY IF EXISTS "training_files_insert" ON storage.objects;
CREATE POLICY "training_files_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'training-files'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
  AND public.get_user_role() IN ('titulaire', 'adjoint')
);

-- Suppression (suppression de ressource) : mêmes contraintes que l’upload.
DROP POLICY IF EXISTS "training_files_delete" ON storage.objects;
CREATE POLICY "training_files_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'training-files'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
  AND public.get_user_role() IN ('titulaire', 'adjoint')
);
