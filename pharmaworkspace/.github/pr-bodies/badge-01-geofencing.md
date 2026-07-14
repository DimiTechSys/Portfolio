## BADGE-01 — Geofencing du badgeage

Autorise le démarrage d'une session de travail uniquement si l'utilisateur est
physiquement dans un rayon configurable autour de l'adresse de l'officine.
**Garde-fou d'usage, pas une preuve juridique** (la position peut être falsifiée).

### Approche d'enforcement
Le badgeage est 100 % côté client (insert Supabase + RLS) — il n'y a **pas** de
route API de démarrage. Le contrôle serveur est donc posé via un **trigger
Postgres** `BEFORE INSERT/UPDATE` sur `work_sessions` (migration `0052`) :
impossible à contourner, même par un appel Supabase direct, et **zéro refonte**
du flux de badgeage (reopen/segments). Le client envoie sa position dans
l'insert ; le trigger calcule la distance Haversine et refuse hors zone (avec
tolérance sur l'imprécision GPS : `distance - accuracy <= rayon`).

### Contenu
- **Migration `0052_pharmacy_geofencing.sql`** :
  - `pharmacies` : `address_latitude/longitude`, `address_geocoded_at`,
    `clockin_geofence_enabled` (défaut `false` → rétrocompatible),
    `clockin_geofence_radius_m` (défaut 100, CHECK 25–1000).
  - `work_sessions` : `clockin_latitude/longitude/accuracy_m/distance_m` (audit).
  - Fonction `geofence_distance_m` (Haversine, alignée avec le TS) + trigger
    `enforce_clockin_geofence` (ne s'applique **qu'au** clock-in : insert ouvert
    ou réouverture ; ignore clôture/accumulation).
- **`src/lib/geofencing/`** : `haversine.ts`, `geocode.ts` (Nominatim OSM,
  User-Agent obligatoire), `permissions.ts` (wrapper `navigator.geolocation`).
  Tests Vitest sur Haversine.
- **Client** : `startSession(geo?)` attache la position (insert + reopen).
  Hook `useClockInGeofence` (4 états : dans la zone / proche / hors zone /
  permission) + `<GeofenceStatus>` + `<ClockInButton>`. Câblé dans le dashboard
  et le header mobile. Refus tracé dans le **journal d'audit** (P2-16).
- **Géocodage** : automatique à la création/màj de l'officine
  (`/api/onboarding/create-pharmacy`, best-effort), et manuel depuis les
  réglages.
- **Réglages titulaire** (`/admin/settings`) : carte « Geofencing du badgeage »
  — toggle, slider rayon 25–1000 m, « Géolocaliser l'adresse », « Tester ma
  position ».

### Vérifications
- `npm run lint` ✅ (0 erreur)
- `npm run typecheck` ✅
- `npm run test` ✅ (56 tests, dont 4 nouveaux sur Haversine)
- `npm run build` ✅

### À faire avant prod (cf. MIGRATIONS_GUARDRAILS)
- [ ] Tester la migration `0052` sur **staging** (`supabase db push`) avant prod.
- [ ] Test E2E manuel : titulaire active le geofence, employé tente un badge
      depuis l'autre bout de la ville → refusé (Chrome DevTools → Sensors pour
      simuler la position).

### Notes coordination
- Migration `0052` claimée dans `COORDINATION.md` §S5 (DIM).
- Géofencing **OFF par défaut** : aucun impact sur les officines existantes.
