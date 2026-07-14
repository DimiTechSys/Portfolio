-- Segments de temps réellement badgés (chaque clôture enregistre une période ; les pauses sont exclues).

CREATE TABLE IF NOT EXISTS public.work_session_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.work_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  segment_started_at timestamptz NOT NULL,
  segment_ended_at timestamptz NOT NULL,
  minutes integer NOT NULL CHECK (minutes >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_session_segments_session_id_idx
  ON public.work_session_segments (session_id);

CREATE INDEX IF NOT EXISTS work_session_segments_user_day_idx
  ON public.work_session_segments (user_id, segment_started_at DESC);

CREATE INDEX IF NOT EXISTS work_session_segments_pharmacy_day_idx
  ON public.work_session_segments (pharmacy_id, segment_started_at DESC);

COMMENT ON TABLE public.work_session_segments IS
  'Périodes badgées : une ligne par clôture de session (pause = pas de ligne).';

ALTER TABLE public.work_session_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_session_segments_select" ON public.work_session_segments
  FOR SELECT USING (pharmacy_id = public.get_pharmacy_id());

CREATE POLICY "work_session_segments_insert" ON public.work_session_segments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND pharmacy_id = public.get_pharmacy_id()
  );
