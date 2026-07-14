-- Corrige les segments « journée entière » erronés et réaligne le cumul sur la somme des segments.

DELETE FROM public.work_session_segments s
USING public.work_sessions ws
WHERE s.session_id = ws.id
  AND ws.ended_at IS NOT NULL
  AND s.minutes >= GREATEST(
    1,
    FLOOR(EXTRACT(EPOCH FROM (ws.ended_at - ws.started_at)) / 60) * 0.85
  )
  AND ABS(EXTRACT(EPOCH FROM (s.segment_started_at - ws.started_at))) < 120;

UPDATE public.work_sessions ws
SET worked_minutes_accumulated = COALESCE(
  (
    SELECT SUM(s.minutes)::integer
    FROM public.work_session_segments s
    WHERE s.session_id = ws.id
  ),
  0
)
WHERE ws.ended_at IS NOT NULL;
