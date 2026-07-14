-- 0060 — Per-user dismiss du widget de missions d'activation
--
-- Contexte : la PR ONBOARD-01 (PR #80, migration 0055) avait posé le flag
-- de dismiss sur `pharmacies.onboarding_dismissed_at` — une seule décision
-- pour TOUTE l'officine. Conséquence UX :
--   1. Seul le titulaire pouvait dismiss (et donc le bouton "Masquer" du
--      widget ne s'affichait que pour lui, mission-checklist.tsx:163).
--   2. Quand le titulaire dismissait, le widget disparaissait pour tous ses
--      membres aussi — même s'ils voulaient encore suivre leur progression.
--   3. Un préparateur qui en avait marre du widget ne pouvait rien faire :
--      pas de bouton, pas de réglage accessible.
--
-- Pattern SaaS standard pour les widgets de gamification (Linear, Notion,
-- Stripe) : la décision est par-utilisateur, pas par-tenant. Chacun gère son
-- confort visuel indépendamment de ses collègues.
--
-- Migration :
--   1. Ajoute `profiles.missions_dismissed_at` (nouvelle source de vérité)
--   2. Drop `pharmacies.onboarding_dismissed_at` (obsolète)
--
-- Pas de data migration (la colonne n'a été en prod que ~3 jours sur staging
-- test mode, pas de donnée pilote significative).
--
-- RLS : `profiles_update_self_or_titulaire` (déjà en place) autorise tout
-- user à UPDATE sa propre row → chaque membre pourra setter son propre
-- missions_dismissed_at. Pas de policy supplémentaire nécessaire.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS missions_dismissed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.missions_dismissed_at IS
  'Set when the user manually dismisses the onboarding missions widget. NULL = widget visible. Per-user (chaque user gère son propre confort). Reactivatable depuis /profile/preferences.';

ALTER TABLE public.pharmacies
  DROP COLUMN IF EXISTS onboarding_dismissed_at;
