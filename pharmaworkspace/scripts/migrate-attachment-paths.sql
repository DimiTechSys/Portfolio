-- =====================================================================
-- P1-07 — Migration des colonnes "url publique Supabase" vers "path"
-- =====================================================================
--
-- Contexte : P1-05 a basculé les buckets `attachments`, `training-files`
-- et `prescriptions` en PRIVÉ. Les URL publiques stockées en DB ne
-- fonctionnent plus. P1-06 fait que l'app stocke désormais le PATH interne
-- du fichier (ex. `<pharmacy_id>/tasks/<id>/fichier.pdf`) et signe à la
-- volée côté client. Ce script convertit les rows historiques au nouveau
-- format.
--
-- À exécuter MANUELLEMENT via Supabase Dashboard > SQL Editor (preview
-- puis prod). NE PAS lancer depuis le code applicatif.
--
-- Idempotent : si une row a déjà un `path`, on la laisse intacte. Pour
-- les colonnes texte, on ne réécrit que si l'on détecte un préfixe
-- d'URL publique connu.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) tasks.attachments  (jsonb array of { url|path, name, type })
-- ---------------------------------------------------------------------
UPDATE public.tasks
SET attachments = (
  SELECT jsonb_agg(
    CASE
      WHEN elem ? 'path' THEN elem
      WHEN elem ? 'url' THEN jsonb_build_object(
        'path', regexp_replace(elem->>'url', '^.*/storage/v1/object/public/attachments/', ''),
        'name', COALESCE(elem->>'name', ''),
        'type', COALESCE(elem->>'type', 'document')
      )
      ELSE elem
    END
  )
  FROM jsonb_array_elements(attachments) elem
)
WHERE jsonb_typeof(attachments) = 'array'
  AND jsonb_array_length(attachments) > 0
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(attachments) elem
    WHERE NOT (elem ? 'path') AND (elem ? 'url')
  );

-- ---------------------------------------------------------------------
-- 2) orders.attachments  (jsonb array, même format)
-- ---------------------------------------------------------------------
UPDATE public.orders
SET attachments = (
  SELECT jsonb_agg(
    CASE
      WHEN elem ? 'path' THEN elem
      WHEN elem ? 'url' THEN jsonb_build_object(
        'path', regexp_replace(elem->>'url', '^.*/storage/v1/object/public/attachments/', ''),
        'name', COALESCE(elem->>'name', ''),
        'type', COALESCE(elem->>'type', 'document')
      )
      ELSE elem
    END
  )
  FROM jsonb_array_elements(attachments) elem
)
WHERE jsonb_typeof(attachments) = 'array'
  AND jsonb_array_length(attachments) > 0
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(attachments) elem
    WHERE NOT (elem ? 'path') AND (elem ? 'url')
  );

-- ---------------------------------------------------------------------
-- 3) tasks.audio_url  (text, bucket attachments)
-- ---------------------------------------------------------------------
UPDATE public.tasks
SET audio_url = regexp_replace(audio_url, '^.*/storage/v1/object/public/attachments/', '')
WHERE audio_url IS NOT NULL
  AND audio_url LIKE '%/storage/v1/object/public/attachments/%';

-- ---------------------------------------------------------------------
-- 4) profiles.avatar_url  (text, bucket attachments)
-- ---------------------------------------------------------------------
UPDATE public.profiles
SET avatar_url = regexp_replace(avatar_url, '^.*/storage/v1/object/public/attachments/', '')
WHERE avatar_url IS NOT NULL
  AND avatar_url LIKE '%/storage/v1/object/public/attachments/%';

-- ---------------------------------------------------------------------
-- 5) prescriptions.image_url  (text, bucket prescriptions)
-- ---------------------------------------------------------------------
UPDATE public.prescriptions
SET image_url = regexp_replace(image_url, '^.*/storage/v1/object/public/prescriptions/', '')
WHERE image_url IS NOT NULL
  AND image_url LIKE '%/storage/v1/object/public/prescriptions/%';

-- ---------------------------------------------------------------------
-- 6) training_resources.storage_path  (text, bucket training-files)
--
-- En théorie ce champ stockait déjà un path natif. Filet de sécurité
-- au cas où des rows historiques contiendraient une URL publique.
-- ---------------------------------------------------------------------
UPDATE public.training_resources
SET storage_path = regexp_replace(storage_path, '^.*/storage/v1/object/public/training-files/', '')
WHERE storage_path IS NOT NULL
  AND storage_path LIKE '%/storage/v1/object/public/training-files/%';

COMMIT;

-- ---------------------------------------------------------------------
-- Vérifications post-migration (à exécuter à part, pas dans la TX)
-- ---------------------------------------------------------------------
-- SELECT id, attachments FROM public.tasks
--   WHERE jsonb_typeof(attachments) = 'array'
--     AND EXISTS (SELECT 1 FROM jsonb_array_elements(attachments) e WHERE e ? 'url' AND NOT (e ? 'path'));
-- -> Doit retourner 0 row.
--
-- SELECT id, attachments FROM public.orders
--   WHERE jsonb_typeof(attachments) = 'array'
--     AND EXISTS (SELECT 1 FROM jsonb_array_elements(attachments) e WHERE e ? 'url' AND NOT (e ? 'path'));
-- -> Doit retourner 0 row.
--
-- SELECT id, audio_url FROM public.tasks WHERE audio_url LIKE '%/public/attachments/%';
-- SELECT id, avatar_url FROM public.profiles WHERE avatar_url LIKE '%/public/attachments/%';
-- SELECT id, image_url FROM public.prescriptions WHERE image_url LIKE '%/public/prescriptions/%';
-- SELECT id, storage_path FROM public.training_resources WHERE storage_path LIKE '%/public/training-files/%';
-- -> Doivent tous retourner 0 row.
