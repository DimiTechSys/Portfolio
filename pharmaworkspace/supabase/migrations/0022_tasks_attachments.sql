-- Pièces jointes structurées sur les tâches (comme les commandes).

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.tasks.attachments IS
  'Liste JSON [{ url, name, type }] des fichiers uploadés.';
