-- Repair drift: bucket `prescriptions` + policies
--
-- Le bucket `prescriptions` et ses policies ont été créés via le Dashboard
-- Supabase sur prod, jamais via migration versionnée (cf. MIGRATIONS_GUARDRAILS
-- §0/§7). Le projet preview, set up from versioned migrations, n'a donc pas
-- ce bucket → toute création d'ordonnance avec image plante
-- "Bucket not found" en upload.
--
-- Idempotent : `ON CONFLICT (id) DO NOTHING` pour le bucket (ne pas écraser
-- la valeur `public` si déjà ajustée en prod), `DROP POLICY IF EXISTS` puis
-- `CREATE POLICY` pour les policies.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('prescriptions', 'prescriptions', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Lecture : un user de la pharmacy_id correspondant au préfixe du path.
DROP POLICY IF EXISTS "prescriptions_select" ON storage.objects;
CREATE POLICY "prescriptions_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);

-- Upload : même filtre que SELECT — un user uploade dans son dossier officine.
DROP POLICY IF EXISTS "prescriptions_insert" ON storage.objects;
CREATE POLICY "prescriptions_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);

-- Update : remplacement d'une image existante (rare mais possible).
DROP POLICY IF EXISTS "prescriptions_update" ON storage.objects;
CREATE POLICY "prescriptions_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);

-- Delete : nettoyage par les utilisateurs de la pharmacie.
DROP POLICY IF EXISTS "prescriptions_delete" ON storage.objects;
CREATE POLICY "prescriptions_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);
