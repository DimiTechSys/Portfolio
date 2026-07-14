# TODO_DEV2 — ARCHIVÉ (29 mai 2026)

> ⚠️ **Ce fichier est archivé.** Le rôle "BillyGoat001 / Saytex1" (frontend commercial / paywall / analytics client) n'existe plus en tant qu'owner distinct au 29/05/2026. Mehdi a repris seul tout le scope de ce TODO et porte désormais à la fois `TODO_MEHDI.md` (commercial + juridique + plateforme) et l'ancien TODO_DEV2 (funnel + paywall + landing).

## Où sont passés les tickets

| Statut au 29/05/2026 | Où regarder |
|---|---|
| ✅ Mergés (P4-01, P4-02, P4-05, P4-06, P4-14) | `git log` — PRs #47, #48, #50, #52, #49, #56. Pas besoin de doc, le code est en place. |
| 🟡 À finir (P4-03, P4-04) | Migrés dans `TODO_MEHDI.md` sous `# COMMERCIAL & PRICING (Phase 4)` avec notes d'état "skeleton mergé, finir copy". |
| ⬜ À coder (P4-13 trial intégré Stripe) | Migré dans `TODO_MEHDI.md` sous `# COMMERCIAL & PRICING (Phase 4)`. C'est le seul ticket code bloquant restant du funnel. |

## Pour les anciennes références

Les commits, PRs et tickets de ce fichier conservent leur ID `P4-XX`. Quand un commit ou PR mentionne « TODO_DEV2.md » historiquement, considérer que le contenu canonique est désormais dans `TODO_MEHDI.md` à la même clé `P4-XX`.

`COORDINATION.md` mentionne encore les rôles "BILLY" et "DIM" historiques. Le contrat §B8 (cascade self-serve + Stripe trial) reste valide techniquement : Mehdi joue maintenant les deux rôles "côté Billy" et "côté plateforme intégration" en plus du sien, mais les contrats d'interface avec Dim restent identiques.

## Pour réactiver ce TODO

Si un futur dev frontend rejoint le projet, on peut soit :
- Restaurer ce fichier depuis git (`git log --diff-filter=D --name-only` puis `git checkout <commit>~1 -- TODO_DEV2.md`) et re-sync avec l'état actuel,
- Soit créer un nouveau `TODO_DEV3.md` adapté au nouveau scope.
