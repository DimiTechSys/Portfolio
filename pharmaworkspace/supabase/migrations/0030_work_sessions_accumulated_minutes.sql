-- Temps travaillé cumulé et début du segment en cours (reprise après pause le même jour).

ALTER TABLE public.work_sessions
  ADD COLUMN IF NOT EXISTS worked_minutes_accumulated integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_segment_started_at timestamptz;

COMMENT ON COLUMN public.work_sessions.worked_minutes_accumulated IS
  'Minutes travaillées sur les segments déjà clôturés.';
COMMENT ON COLUMN public.work_sessions.current_segment_started_at IS
  'Début du segment en cours (reprise après pause).';

UPDATE public.work_sessions
SET current_segment_started_at = started_at
WHERE current_segment_started_at IS NULL;
