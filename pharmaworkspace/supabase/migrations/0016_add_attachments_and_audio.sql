-- 0016_add_attachments_and_audio.sql
-- Add attachments to orders and audio to tasks

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS audio_url text;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Storage Bucket for attachments (audio, order docs)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('attachments', 'attachments', true, 524288000)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Lecture : bucket public → URLs /storage/v1/object/public/attachments/... accessibles.
DROP POLICY IF EXISTS "attachments_select" ON storage.objects;
CREATE POLICY "attachments_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

-- Upload : tous les utilisateurs authentifiés peuvent upload dans leur dossier de pharmacie
DROP POLICY IF EXISTS "attachments_insert" ON storage.objects;
CREATE POLICY "attachments_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);

-- Suppression : mêmes contraintes que l'upload.
DROP POLICY IF EXISTS "attachments_delete" ON storage.objects;
CREATE POLICY "attachments_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);
