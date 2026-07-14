## Contexte

P4-06 (init PostHog) est mergée. Il manquait les 3 events d’activation **first value** côté composants métier Dim, pour alimenter le funnel PostHog (cf. `TODO_DEV.md` / `COORDINATION.md` §B6).

## Changements livrés

### Helpers analytics
- `src/lib/analytics/events.ts` — catalogue `FIRST_MILESTONE_EVENTS`
- `src/lib/analytics/capture-first.ts` — `captureFirstMilestone()` : une émission par officine (`localStorage` + `pharmacy_id`)
- Tests Vitest `capture-first.test.ts`

### Instrumentation
| Event | Déclencheur |
|-------|-------------|
| `first_task_created` | 1ʳᵉ création de tâche (`task-drawer`) |
| `first_ocr_done` | 1ʳᵉ OCR réussi sur ordonnance (`prescription-form`) |
| `first_shortage_resolved` | 1ʳᵉ levée de rupture (`shortage-table`, scan rapide ou dialog) |

Les events existants (`task_created`, `shortage_resolved`, `prescription_ocr_completed` serveur) sont inchangés.

## Hors scope

- Pas de migration DB
- Pas de changement onboarding / Stripe (P2-01)
- Pas de refactor global `posthog-js` → `capture()` sur tous les composants

## Vérifications techniques

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test` (40 tests)
- [x] `npm run build`

## Test plan manuel (staging)

- [ ] Créer une tâche → vérifier `first_task_created` une seule fois dans PostHog EU (live events)
- [ ] Scanner une ordonnance (OCR OK) → `first_ocr_done` une fois
- [ ] Lever une rupture (scan CIP) → `first_shortage_resolved` une fois
- [ ] Répéter les actions → les `first_*` ne doivent **pas** se réémettre (même navigateur / même officine)
