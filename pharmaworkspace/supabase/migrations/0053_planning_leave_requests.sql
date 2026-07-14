-- PLAN-01 — Planning de présence + demandes de congés

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type text NOT NULL CHECK (leave_type IN (
    'cp',
    'rtt',
    'sick',
    'training',
    'public_holiday',
    'unpaid',
    'other'
  )),
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date >= start_date),
  half_day_start boolean NOT NULL DEFAULT false,
  half_day_end boolean NOT NULL DEFAULT false,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leave_requests_pharmacy_id_idx ON public.leave_requests(pharmacy_id);
CREATE INDEX IF NOT EXISTS leave_requests_requester_id_idx ON public.leave_requests(requester_id);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS leave_requests_dates_idx ON public.leave_requests(pharmacy_id, start_date, end_date);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leave_requests_select ON public.leave_requests;
CREATE POLICY leave_requests_select ON public.leave_requests FOR SELECT
  TO authenticated
  USING (pharmacy_id = (SELECT public.get_pharmacy_id()));

DROP POLICY IF EXISTS leave_requests_insert ON public.leave_requests;
CREATE POLICY leave_requests_insert ON public.leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND requester_id = auth.uid()
  );

-- MVP : titulaire seul valide ; le demandeur peut annuler sa demande pending.
DROP POLICY IF EXISTS leave_requests_update ON public.leave_requests;
CREATE POLICY leave_requests_update ON public.leave_requests FOR UPDATE
  TO authenticated
  USING (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND (
      (requester_id = auth.uid() AND status = 'pending')
      OR (auth.jwt() ->> 'role' = 'titulaire')
    )
  );

CREATE TABLE IF NOT EXISTS public.weekly_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time),
  break_start time,
  break_end time,
  active_from date NOT NULL,
  active_until date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weekly_schedules_pharmacy_user_idx
  ON public.weekly_schedules(pharmacy_id, user_id);

ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS weekly_schedules_select ON public.weekly_schedules;
CREATE POLICY weekly_schedules_select ON public.weekly_schedules FOR SELECT
  TO authenticated
  USING (pharmacy_id = (SELECT public.get_pharmacy_id()));

DROP POLICY IF EXISTS weekly_schedules_mutate ON public.weekly_schedules;
CREATE POLICY weekly_schedules_mutate ON public.weekly_schedules FOR ALL
  TO authenticated
  USING (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND auth.jwt() ->> 'role' IN ('titulaire', 'adjoint')
  )
  WITH CHECK (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND auth.jwt() ->> 'role' IN ('titulaire', 'adjoint')
  );

-- Types de notifications pour le module planning
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type = ANY (
      ARRAY[
        'task_assigned'::text,
        'shortage_reported'::text,
        'handover_note'::text,
        'task_overdue'::text,
        'rental_overdue'::text,
        'leave_request_submitted'::text,
        'leave_request_decided'::text
      ]
    )
  );
