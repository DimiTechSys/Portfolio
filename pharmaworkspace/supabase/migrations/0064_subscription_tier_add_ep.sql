-- 0064_subscription_tier_add_ep.sql
-- PRICING-V2 (cf. legal/internal/PRICING-2026-v2.md) : ajout du 4ᵉ tier `ep`
-- (Enterprise / Pôle / groupement, « sur devis »). Étend la contrainte CHECK
-- sur pharmacies.subscription_tier posée par 0042 pour accepter 'ep' en plus
-- de 'po' / 'otm' / 'go'.
--
-- `ep` n'a pas de price Stripe public (géré hors self-serve : invoice manuelle
-- / Stripe Quote). Il peut néanmoins être posé en DB pour une officine
-- groupement, d'où le besoin de l'autoriser dans la contrainte.
--
-- Idempotente : DROP CONSTRAINT IF EXISTS puis ADD (même pattern que 0042).

ALTER TABLE public.pharmacies
  DROP CONSTRAINT IF EXISTS pharmacies_subscription_tier_check;

ALTER TABLE public.pharmacies
  ADD CONSTRAINT pharmacies_subscription_tier_check
  CHECK (subscription_tier IS NULL OR subscription_tier IN ('po', 'otm', 'go', 'ep'));
