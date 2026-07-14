-- 0003_cash_registers.sql
-- Add cash register table with daily uniqueness constraints.

CREATE TABLE IF NOT EXISTS public.cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  recorded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  entry_type text NOT NULL CHECK (entry_type IN ('opening', 'closing')),
  amount numeric(10, 2) NOT NULL CHECK (amount >= 0),
  note text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cash_registers_pharmacy_recorded_at_idx
  ON public.cash_registers (pharmacy_id, recorded_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS cash_registers_opening_once_per_day_idx
  ON public.cash_registers (
    pharmacy_id,
    ((recorded_at AT TIME ZONE 'Europe/Paris')::date)
  )
  WHERE entry_type = 'opening';

CREATE UNIQUE INDEX IF NOT EXISTS cash_registers_closing_once_per_day_idx
  ON public.cash_registers (
    pharmacy_id,
    ((recorded_at AT TIME ZONE 'Europe/Paris')::date)
  )
  WHERE entry_type = 'closing';

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cash_registers_select ON public.cash_registers;
DROP POLICY IF EXISTS cash_registers_insert ON public.cash_registers;
DROP POLICY IF EXISTS cash_registers_update ON public.cash_registers;
DROP POLICY IF EXISTS cash_registers_delete ON public.cash_registers;

CREATE POLICY cash_registers_select
ON public.cash_registers
FOR SELECT
USING (pharmacy_id = public.get_pharmacy_id());

CREATE POLICY cash_registers_insert
ON public.cash_registers
FOR INSERT
WITH CHECK (
  pharmacy_id = public.get_pharmacy_id()
  AND recorded_by = auth.uid()
  AND public.get_user_role() IN ('titulaire', 'adjoint')
);

CREATE POLICY cash_registers_update
ON public.cash_registers
FOR UPDATE
USING (
  pharmacy_id = public.get_pharmacy_id()
  AND public.get_user_role() IN ('titulaire', 'adjoint')
)
WITH CHECK (
  pharmacy_id = public.get_pharmacy_id()
  AND public.get_user_role() IN ('titulaire', 'adjoint')
);

CREATE POLICY cash_registers_delete
ON public.cash_registers
FOR DELETE
USING (
  pharmacy_id = public.get_pharmacy_id()
  AND public.get_user_role() = 'titulaire'
);
