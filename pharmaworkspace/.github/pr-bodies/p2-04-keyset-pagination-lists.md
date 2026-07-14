## Contexte (P2-04)

Le pilote **tasks** était déjà mergé (PR #54). Ce PR complète le ticket en étendant la pagination keyset aux trois autres listes métier.

## Changements livrés

### Queries (`lib/queries/`)
- Helper partagé `keyset-pagination.ts` (`applyKeysetCursor`, `sliceKeysetPage`)
- `getPrescriptionsPaginated`, `getOrdersPaginated`, `getShortagesPaginated` (curseur `created_at` + `id`, pages de 50)

### Features / hooks
- `usePrescriptions`, `useOrders`, `useShortages` → `useInfiniteQuery` + `hasNextPage` / `fetchNextPage`
- Option `disablePagination: true` pour **l’agenda** (besoin de la liste complète, comme avant)

### UI
- Composant `LoadMoreButton` réutilisable
- Bouton « Charger plus » sur : ordonnances, commandes (+ completed), ruptures (+ resolved)
- Recherche full-text inchangée (pas de pagination en mode recherche)

### Pages completed
- Ordonnances traitées : filtre serveur `status: 'served'` au lieu de filtrer en mémoire

## Hors scope

- Rentals, notifications, annuaire
- Pagination de la recherche full-text (reste limitée à 50 résultats)
- Refactor de `getTasks` / `tasks.ts` vers le helper partagé (déjà OK en l’état)

## Vérifications techniques

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test` (40)
- [x] `npm run build`

## Test plan manuel

- [ ] `/prescriptions` : 50 premières lignes, « Charger plus » sans doublons
- [ ] `/orders` et `/orders/completed` : idem
- [ ] `/shortages` et `/shortages/resolved` : idem
- [ ] Recherche ordonnances / ruptures : résultats sans bouton « Charger plus »
- [ ] `/agenda` (desktop) : toujours toutes les activités visibles
