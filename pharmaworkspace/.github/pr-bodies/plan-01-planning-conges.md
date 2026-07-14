## PLAN-01 — Planning de présence + demandes de congés

Nouveau module `/planning` : vue hebdomadaire de présence équipe, workflow de
demandes de congés (soumission → validation titulaire), emails Resend et
notifications in-app.

### Décisions produit (PROD-PLAN-01)
- Types : CP, RTT, maladie, formation, jour férié, sans solde, autre
- Validation : **titulaire seul** (adjoint consulte, ne valide pas)
- Visibilité : planning transparent pour toute l'équipe
- Vue par défaut : semaine glissante
- Pas de soldes congés en MVP

### Contenu
- **Migration `0053_planning_leave_requests.sql`** : tables `leave_requests` +
  `weekly_schedules`, RLS, extension `notifications_type_check`.
- **API** : `POST /api/planning/leave-requests` (soumission + email titulaire),
  `PATCH /api/planning/leave-requests/[id]` (approve/reject + email + audit).
- **UI** : `/planning` (grille desktop + liste mobile), `/planning/requests`
  (validation titulaire / historique collaborateur), formulaire de demande.
- **Emails** : templates Resend `leave-request-notification` + `leave-decision`.
- **Nav** : « Agenda » renommé « Calendrier », nouvel item « Planning ».
- **PostHog** : `leave_request_submitted`, `leave_request_approved`,
  `leave_request_rejected`.
- **Fix migration `0050`** : policy `notifications_insert` en comparaison
  `text` (évite SQLSTATE 55P04 sur `ALTER TYPE ADD VALUE` + cast enum dans la
  même transaction).

### Vérifications
- `npm run lint` ✅ (warnings préexistants uniquement)
- `npm run test` ✅ (61 tests, dont 5 nouveaux planning)
- `npm run build` ✅
- `supabase db push` ✅ (0050–0053 appliquées sur staging)

### Test plan
- [ ] Préparateur : soumettre une demande CP sur `/planning` → statut pending
- [ ] Titulaire : voir la demande dans `/planning/requests`, approuver/refuser
- [ ] Vérifier email Resend (titulaire à la soumission, collaborateur à la décision)
- [ ] Vérifier notification in-app + lien vers `/planning/requests`
- [ ] Grille planning : couleurs congé pending (jaune) / approuvé (rouge) / badge (vert)
- [ ] Journal d'audit : entrées `leave_request.approved` / `leave_request.rejected`

### Notes coordination
- Migration `0053` claimée dans `COORDINATION.md` §S5 (DIM).
