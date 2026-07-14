## Contexte (TECH-12)

Le business model repose sur 3 tiers (`po` / `otm` / `go` via `pharmacies.subscription_tier`). Aucune limite n’était appliquée à l’invitation de membres — risque de dépassement silencieux du tier Solo (3 utilisateurs).

## Changements livrés

### Helpers (`src/lib/subscription.ts`)
- `TIER_LIMITS` : po=3, otm=8, go=illimité
- `getMemberLimit`, `getCurrentMemberCount` (profiles + invitations pending non expirées)
- `canInviteMore`, `getInviteSlotsRemaining`, `getTierUsageLevel`

### API
- `POST /api/invitations/create-native` → **409** `tier_limit_reached` avant création d’invitation (vérif service role)

### UI
- **`/admin` (RH)** : bannière jaune (≥80 %) / rouge (100 %) + bouton « Mettre à niveau » → `POST /api/stripe/portal`
- **`InviteDialog`** : bouton grisé si limite atteinte
- **`/onboarding/invite`** : nombre de lignes email plafonné selon tier + refresh quota après envoi

### Tests
- Vitest `subscription-tier-limits.test.ts`

## Hors scope

- Playwright tier Solo (à ajouter si golden path team étendu)
- TECH-10 / TECH-11 (rôles student/shelver, photos locations)

## Vérifications techniques

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test`
- [x] `npm run build`

## Test plan manuel

- [ ] Officine tier `po` avec 3 membres+invitations pending → 4ᵉ invitation → 409 + message FR
- [ ] `/admin` : bannière jaune à 2/3, rouge à 3/3, bouton inviter grisé
- [ ] Portail Stripe s’ouvre depuis « Mettre à niveau »
- [ ] Onboarding invite Solo : max 2 champs invitables si titulaire seul
