-- P5-06 — In-app feedback (bugs, ideas, praise)

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid REFERENCES public.pharmacies(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('bug', 'idea', 'praise', 'other')),
  content text NOT NULL,
  page_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_pharmacy_id_idx ON public.feedback(pharmacy_id);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_insert ON public.feedback;
CREATE POLICY feedback_insert
  ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS feedback_select_own ON public.feedback;
CREATE POLICY feedback_select_own
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
