-- 0055 — ONBOARD-01 : dismiss manuel du widget de missions d'activation.
-- (0054 a été pris par CHAT-01 / chat_channels_messages.)

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.pharmacies.onboarding_dismissed_at IS
  'Set when the owner manually dismisses the onboarding missions widget. NULL = widget visible. Reactivatable from Settings > Display.';
