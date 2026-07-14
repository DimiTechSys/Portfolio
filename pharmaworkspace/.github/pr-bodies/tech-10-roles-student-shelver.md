## Summary

- Migration `0050` : enum Postgres `user_role` étendu avec `student` et `shelver` ; policy `notifications_insert` alignée (mêmes droits que `preparateur`).
- `src/lib/auth/roles.ts` : rôles invitables, helpers permissions équivalent préparateur, nav membres.
- UI invitation (admin + onboarding) et liste équipe : 4 rôles invitables + libellés FR (`ROLE_LABELS`).
- Docs juridiques `legal/securite.md`, `privacy.md`, `dpa.md` (pas de bump `consent-versions`).

## Test plan

- [ ] `npx supabase db push` sur staging — migration `0050` OK
- [ ] Inviter un compte `student` → parcours invité → accès app comme préparateur
- [ ] JWT / `app_metadata.pharmacy_role` = `student` après login
- [ ] `/admin` : sélecteur rôle affiche Étudiant / Rayonniste ; badges liste équipe OK
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build`
