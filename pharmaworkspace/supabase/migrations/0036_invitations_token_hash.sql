-- P1-08 — Stocker un hash SHA-256 du token d'invitation
--
-- Sécurité défensive : tant que le token clair vit en base, une fuite SQL
-- (backup mal protégé, leak admin) compromet toutes les invitations non
-- acceptées encore valides. En stockant SHA-256(token), même une dump
-- complète de `invitations` n'expose plus de tokens utilisables.
--
-- Phase de transition : la colonne `token` clair reste en place pour ne pas
-- casser les invitations en cours (mails déjà envoyés). Une migration
-- ultérieure droppera `token` une fois toutes les invitations expirées
-- (`expires_at + 7d ≈ 30 jours après merge`).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS token_hash text;

-- Backfill : calcule le hash pour les invitations historiques.
-- Idempotent : ne recalcule pas les rows déjà hashées (cas re-run).
UPDATE public.invitations
SET token_hash = encode(digest(token::text, 'sha256'), 'hex')
WHERE token_hash IS NULL AND token IS NOT NULL;

CREATE INDEX IF NOT EXISTS invitations_token_hash_idx
  ON public.invitations (token_hash);
