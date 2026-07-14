## Contexte (P5-06)

Pendant la bêta, les retours arrivent souvent par WhatsApp / mail / oral → perte d'info et priorisation difficile.

Ce ticket ajoute un canal **in-app** : bouton permanent « Donner mon avis » → modale → stockage centralisé en base (`feedback`).

## Objectif métier

- Permettre un retour en ~10 secondes sans quitter l'app
- Catégoriser : bug / idée / compliment / autre
- Centraliser pour review hebdo (table `feedback`)

## Changements livrés

### Base de données
- Migration `0047_feedback.sql`
  - table `public.feedback` (`category`, `content`, `page_url`, `pharmacy_id`, `user_id`, `created_at`)
  - RLS : `INSERT` authentifié (`user_id = auth.uid()`), `SELECT` sur ses propres lignes
  - index `pharmacy_id`, `created_at`

### Backend client (queries)
- `src/lib/queries/feedback.ts` → `submitFeedback()`
  - récupère l'utilisateur courant
  - enregistre pharmacie + URL de page courante

### UI
- `src/components/shared/feedback-button.tsx`
  - bouton flottant bas-droite (au-dessus de la barre mobile)
  - modale : catégorie + message
  - validation minimale + toasts succès/erreur
- `src/app/(app)/layout.tsx` : visible sur **toutes les pages app** (pas marketing/auth/onboarding)

## Découpage commits

1. `0820193` — schéma + types
2. `f651d26` — query helper
3. `c0595c0` — bouton + intégration layout app

## Hors scope (volontaire)

- Pas de dashboard admin pour lire les feedbacks (review SQL / Supabase pour l'instant)
- Pas de notifications Slack/email sur nouveau feedback
- Pas de pièces jointes / screenshots

## Vérifications techniques

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test`
- [x] `npm run build`

## Test plan manuel (staging)

- [ ] Appliquer migration `0047` (`npx supabase db push` ou SQL Editor)
- [ ] Ouvrir `/tasks` → bouton « Donner mon avis » visible
- [ ] Envoyer un feedback « Bug » → toast succès
- [ ] Vérifier ligne dans `public.feedback` (category, content, page_url, pharmacy_id, user_id)
- [ ] Vérifier absence du bouton sur `/login` et pages marketing (`/tarifs`, etc.)
