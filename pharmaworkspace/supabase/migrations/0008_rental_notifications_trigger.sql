-- Create location notifications in database (server-side) so all pharmacy members
-- get notified even when client-side RLS blocks cross-user inserts.

CREATE OR REPLACE FUNCTION public.notify_rental_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected_return_label text;
  daily_rate_label text;
  deposit_label text;
  notif_title text;
  notif_body text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    notif_title := 'Nouvelle location creee';
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('overdue', 'returned') THEN
    notif_title := CASE
      WHEN NEW.status = 'overdue' THEN 'Location en retard'
      ELSE 'Location retournee'
    END;
  ELSE
    RETURN NEW;
  END IF;

  expected_return_label := COALESCE(to_char(NEW.expected_return::date, 'DD/MM/YYYY'), '—');
  daily_rate_label := CASE
    WHEN NEW.daily_rate IS NULL THEN 'Non renseigne'
    ELSE to_char(NEW.daily_rate, 'FM999999990.00') || ' EUR/j'
  END;
  deposit_label := CASE
    WHEN NEW.deposit IS NULL THEN 'Aucune'
    ELSE to_char(NEW.deposit, 'FM999999990.00') || ' EUR'
  END;

  notif_body := concat(
    'Client: ', NEW.client_name,
    ' · Materiel: ', NEW.equipment,
    ' · Retour prevu: ', expected_return_label,
    ' · Facturation: ', daily_rate_label,
    ' · Caution: ', deposit_label
  );

  INSERT INTO public.notifications (pharmacy_id, user_id, type, title, body, metadata)
  SELECT
    NEW.pharmacy_id,
    p.id,
    'shortage_reported',
    notif_title,
    notif_body,
    jsonb_build_object(
      'domain', 'rental',
      'rental_id', NEW.id,
      'status', NEW.status,
      'expected_return', NEW.expected_return,
      'daily_rate', NEW.daily_rate,
      'deposit', NEW.deposit,
      'client_name', NEW.client_name,
      'equipment', NEW.equipment,
      'target_url', '/rentals'
    )
  FROM public.profiles p
  WHERE p.pharmacy_id = NEW.pharmacy_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_rental_event ON public.rentals;
CREATE TRIGGER trg_notify_rental_event
AFTER INSERT OR UPDATE ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.notify_rental_event();
