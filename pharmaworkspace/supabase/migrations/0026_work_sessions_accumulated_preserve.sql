-- Ne pas écraser le cumul à 0 quand les segments « mur » ont été supprimés (migration 0020).

UPDATE public.work_sessions ws
SET worked_minutes_accumulated = GREATEST(
  COALESCE(ws.worked_minutes_accumulated, 0),
  COALESCE(
    (
      SELECT SUM(s.minutes)::integer
      FROM public.work_session_segments s
      WHERE s.session_id = ws.id
    ),
    0
  )
)
WHERE ws.ended_at IS NOT NULL;
