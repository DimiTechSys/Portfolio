## Contexte (P2-16)

Traçabilité des accès aux données sensibles (ordonnances) pour conformité et support. Ticket documenté dans `TODO_MEHDI.md`, implémenté par Dim (migration `0048`).

## Changements livrés

### Base de données — `0048_audit_log.sql`
- Table `public.audit_log` (`action`, `target_type`, `target_id`, `metadata`, …)
- RLS : `INSERT` pour l'utilisateur authentifié de l'officine ; `SELECT` **titulaire uniquement**
- Index `(pharmacy_id, created_at DESC)`
- `user_id` → `profiles(id)` (jointure acteur dans l'UI)

### Backend client
- `src/lib/audit/log.ts` — `logAudit()` best-effort (ne bloque pas le flux)
- `src/lib/audit/actions.ts` — constantes d'actions
- Instrumentation dans `lib/queries/prescriptions.ts` :
  - `prescription.read` (ouverture drawer / `getPrescriptionById`)
  - `prescription.updated`
  - `prescription.deleted`

### UI admin (titulaire)
- Page `/admin/audit-log` + entrée nav « Journal d'audit »
- `AuditLogTable` : 100 dernières entrées, libellés FR

## Hors scope (volontaire / Mehdi)

- `GET /api/legal/export` et `DELETE /api/legal/erase` (P3-08 pas encore dans le repo)
- `ip_address` / `user_agent` (nécessiterait route serveur ou headers explicites)
- Pagination keyset du journal (100 lignes suffisent pour la bêta)
- Audit sur commandes / ruptures / autres entités

## Migration

```bash
npx supabase db push
# ou appliquer 0048_audit_log.sql sur staging
```

## Vérifications techniques

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test`
- [x] `npm run build`

## Test plan manuel

- [ ] Appliquer migration `0048` sur staging
- [ ] Compte **préparateur** : ouvrir une ordonnance → ligne `prescription.read` en base
- [ ] Compte **préparateur** : `/admin/audit-log` → redirection ou pas d'accès nav
- [ ] Compte **titulaire** : `/admin/audit-log` → tableau avec l'entrée ci-dessus
- [ ] Modifier puis supprimer une ordonnance → `prescription.updated` / `prescription.deleted`
