-- Repair: UPDATE policies sur storage.objects pour permettre supabase.storage.move()
--
-- `storage.from('attachments').move(old, new)` (et idem training-files,
-- prescriptions) opère côté DB comme un UPDATE de `storage.objects.name`.
-- Sans policy UPDATE explicite avec USING + WITH CHECK couvrant les nouveaux
-- noms, l'API retourne 400 Bad Request — observé sur le flux de création
-- de tâche (move `<pharmacy>/temp/tasks/...` → `<pharmacy>/tasks/<task_id>/...`).
--
-- Idempotent : DROP IF EXISTS + CREATE.

-- attachments : autoriser le rename à l'intérieur du dossier de la pharmacie.
DROP POLICY IF EXISTS "attachments_update" ON storage.objects;
CREATE POLICY "attachments_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  bucket_id = 'attachments'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);

-- training-files : même besoin si on déplace un asset après upload.
DROP POLICY IF EXISTS "training_files_update" ON storage.objects;
CREATE POLICY "training_files_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'training-files'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  bucket_id = 'training-files'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);
