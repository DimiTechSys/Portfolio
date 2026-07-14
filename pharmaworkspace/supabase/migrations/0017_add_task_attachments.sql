-- 0017_add_task_attachments.sql
-- Add attachments column to tasks table

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;
