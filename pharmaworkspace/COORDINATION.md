# COORDINATION — Dépendances Mehdi ↔ Dim

> Document de coordination entre `TODO_MEHDI.md` (Mehdi, incluant l'ancien scope BillyGoat001 / frontend commercial repris en solo depuis le 28/05/2026) et `TODO_DEV.md` (Dim).
> `TODO_DEV2.md` est archivé — voir le fichier pour le pointeur vers TODO_MEHDI.md.
> À relire chaque lundi matin pour le sync hebdo.
> Mis à jour : 29 mai 2026 (2 rôles actifs : Mehdi + Dim ; ancien rôle Billy / frontend commercial repris en solo par Mehdi depuis le 28/05/2026).

---

## 0. Workflow Git — branches `develop` (staging) vs `main` (prod)

**Modèle adopté le 21 mai 2026 pour isoler les déploiements prod des itérations dev.**

```
feat/p4-XX-…  ──PR──►  develop  ──PR──►  main
   (devs branchent)   (staging)         (prod)
                          │                 │
                          ▼                 ▼
                  Vercel Preview      Vercel Production
                  Env: STAGING        Env: PROD
                  Supabase staging    Supabase prod
```

### Règles
- **Devs (Dim)** : branche TOUJOURS depuis `develop`, PR cible TOUJOURS `develop`. Ne touche jamais `main`. _(Historique : règle s'appliquait aussi à BillyGoat001 du 25/05 au 28/05/2026 avant reprise solo par Mehdi.)_
- **MEHDI** : seul autorisé à merger `develop` → `main`. Le merge sur `main` déclenche le deploy Vercel prod automatiquement.
- **Branch protection** activée sur les 2 branches : PR + 1 approval (Mehdi) requis. Aucun push direct.
- **Cadence promotion `develop` → `main`** : à la discrétion de Mehdi. Typiquement une fois par semaine ou quand un batch cohérent est prêt.

---

## 0bis. Répartition des 2 rôles actifs (au 29/05/2026)

| Rôle | Qui | Scope | Fichiers/dossiers principaux |
|---|---|---|---|
| **MEHDI** | Mehdi (founder + ex-frontend commercial depuis 28/05/2026) | Commercial + Juridique + Architecture funnel + Reviews PR + CSM **+ scope frontend commercial repris en solo** | `legal/*`, contenus copywriting, décisions structurantes, kickoff pilotes, `TODO_MEHDI.md` tickets (P1-*, P3-*, P4-* sauf ceux Dim, TECH-*) ; **+ `src/app/(marketing)/*`, `src/components/marketing/*`, `src/app/api/stripe/*`, `src/lib/stripe/*`, `src/lib/analytics/posthog.ts`, `public/marketing/*`** |
| **DIM** (DimiTechSys) | Dev plein temps | Backend / Plateforme / Hardening | `src/lib/queries/*`, `src/features/*/services/*`, `src/contexts/*`, `src/components/{tasks,prescriptions,orders,shortages,rentals,admin,formation}/*`, migrations SQL backend, `src/app/api/*` (sauf marketing/stripe), `src/proxy.ts` middleware |

> 📝 **Rôle archivé** : `BILLY` (BillyGoat001 / Saytex1) — Dev 2 frontend commercial / paywall / analytics client. Actif du 25/05/2026 au 28/05/2026. Indisponibilité du collaborateur → scope repris en solo par Mehdi. PRs mergées avant départ : **P4-01, P4-02 (skeleton), P4-05, P4-06, P4-14** (cf. `git log` et `TODO_DEV2.md` archivé). Ticket restant à coder : **P4-13b** (trial intégré Stripe).

### Zones partagées (à coordonner)

- **`package.json`** : Mehdi et Dim y ajoutent des deps occasionnellement. Règle : qui pull `develop` en premier le matin, qui merge en premier sa PR ; l'autre rebase. Conflits triviaux à résoudre.
- **`src/components/providers/app-providers.tsx`** : PostHog initialisé par P4-06 (mergée). Mehdi maintient ce fichier ; si Dim doit y toucher, il coordonne avec Mehdi.
- **`.github/workflows/ci.yml`** : Dim l'a setup. Si Mehdi doit ajouter des tests E2E landing, il coordonne avec Dim.
- **`next.config.ts`** : Dim l'a wrappé Sentry. Si Mehdi doit ajouter `images.remotePatterns` pour Supabase, il édite directement (le fichier est petit et le diff trivial à reviewer).
- **Migrations SQL** : voir §S5 ci-dessous pour l'allocation des numéros.

### Workflow concret pour DEV
```bash
git checkout develop && git pull
git checkout -b feat/p2-XX-description
# ... code ...
npm run lint && npm run build
git commit && git push
# Ouvre PR sur GitHub : base=develop, head=feat/p2-XX-…
```

### Workflow concret pour MEHDI (promotion staging → prod)
```bash
git checkout develop && git pull
# Vérifie sur staging que tout fonctionne (https://staging.pharmaworkspace.fr ou preview Vercel)
gh pr create --base main --head develop --title "Release YYYY-MM-DD"
# Review du diff cumulé
gh pr merge --merge
# → Vercel déploie automatiquement en prod
```

### Si une hotfix prod est nécessaire (urgence)
- Branche `hotfix/...` depuis `main` directement, PR ciblant `main`.
- Après merge sur `main`, re-merger `main` → `develop` pour synchroniser.
- À utiliser uniquement pour les bugs prod critiques. Pas pour les features.

---

## 1. Bloqueurs durs (séquentiels — l'un attend l'autre)

### 🔴 B1 — Buckets privés → Signed URLs → Migration paths
**Chemin critique de Sprint 1.** Quand DEV merge P1-05, l'app perd l'affichage des pièces jointes. Mehdi DOIT enchaîner P1-06 dans la foulée.

```
DEV P1-05 (buckets privés, migration SQL)
       │
       ▼  ⚠️ affichage attachments cassé en prod
MEHDI P1-06 (refactor consommateurs → createSignedUrl)
       │
       ▼  affichage rétabli
MEHDI P1-07 (migration des paths existants)
```

**Règle** : DEV ne merge P1-05 que sur créneau coordonné (genre vendredi 17h) et Mehdi prend le relais immédiat. **Aucune autre PR ne se merge entre P1-05 et P1-06**, sinon main est cassée pour tout le monde.

---

### 🔴 B2 — Setup comptes externes (Mehdi) → Dev unblocked
DEV ne peut pas commencer ces tickets tant que Mehdi n'a pas fait le setup externe :

| Bloqueur Mehdi | Débloque ticket DEV |
|---|---|
| Créer compte Sentry, ajouter `NEXT_PUBLIC_SENTRY_DSN` dans `.env.local` | DEV P2-11 (intégration Sentry) |
| Ajouter `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans **GitHub repo → Settings → Secrets** | DEV P2-10 (CI build step) |
| Créer compte PostHog Cloud EU, ajouter `NEXT_PUBLIC_POSTHOG_KEY` dans `.env.local` + Vercel | DEV P4-06 (PostHog instrumentation) |
| Activer extension `pg_cron` côté Supabase Dashboard | DEV P2-05/P2-06 (cron notifs) |

**Action immédiate** : fais ces 4 setups le **premier jour**. Tout est gratuit, ~30 minutes cumulées. Sinon DEV est en attente.

---

### 🔴 B3 — Décisions Mehdi qui débloquent DEV

| Décision Mehdi | Débloque |
|---|---|
| Pricing final confirmé (39/79/129 € ou autre) | DEV P4-03 (page tarifs) |
| Texte définitif politique de confidentialité (P3-04) | DEV P4-04 (page sécurité publique) |
| Texte définitif page sécurité (Mehdi rédige, Dev intègre) | DEV P4-04 |
| Templates emails outbound finalisés (P4-11) | Aucun ticket DEV mais bloque l'envoi commercial |

---

### ✅ B4 — Dette lint (résolue le 21/05/2026)

Le 21/05 lors du ticket P1-02, on avait flagué 43 erreurs ESLint pré-existantes qui auraient cassé la CI P2-10. **Statut après les merges P1-01 / P1-03 / P2-14** : `npm run lint` retourne maintenant **0 erreur, 66 warnings**. La CI passera sans souci (exit code 0).

**Reste à faire** (non bloquant) : un nettoyage des 66 warnings à un moment opportun (unused imports, hooks deps, `<img>` → `<Image>`). C'est ~1h de boulot, peut se faire en chore ticket isolé quand un des deux a du temps. Pas urgent.

---

### ⚪ B5 — Livrables internes Mehdi pour ses tickets ex-Billy (archivé — section conservée pour historique)

> 📝 **Note 29/05/2026** : ce bloqueur a perdu sa raison d'être suite à la reprise du scope frontend commercial par Mehdi en solo. Plus de "Mehdi débloque Billy" : Mehdi débloque Mehdi. Section conservée pour rappel des livrables internes encore à finaliser avant les tickets restants.

| Livrable | Débloque ticket | Statut |
|---|---|---|
| **Pricing final tranché** (3 tiers + Early Adopter -40 %) | P4-03 page tarifs (à finir) | ✅ Tranché (23/47/77 € HT Early Adopter) |
| **Politique de confidentialité rédigée** (P3-04) | P4-04 page sécurité (à finir) | 🟡 En cours |
| **Compte Stripe créé** + 3 produits + 6 prices Early Adopter -40 % + Customer Portal + emails activés | P4-13b trial intégré (à coder) | 🟡 P4-13a en cours |
| **Copy landing définitif** (hero, modules, FAQ) | P4-02 polish final | 🟡 Skeleton mergé, copy à raffiner |
| **Visuels / logos** | P4-02, P4-03 polish visuel | 🟡 En cours |
| **Lien Loom 90 s de la démo** (P4-08) | Bouton "Voir la démo" du hero P4-02 | 🔴 À tourner |

---

### 🟡 B6 — Convention PostHog Mehdi ↔ Dim (P4-06 mergée)

**Contexte** : P4-06 mergée → init PostHog client (`src/lib/analytics/posthog.ts`) + events landing/signup en place. Mehdi a aussi câblé des events PostHog côté serveur via `src/lib/posthog-server.ts` (notamment `prescription_ocr_completed`, `invitation_accepted`).

**Risque résiduel** : Dim doit poser des events `first_*` (`first_task_created`, `first_ocr_done`, `first_shortage_resolved`) dans ses composants métier. Risque de duplication ou inconsistance de nommage avec ce qui existe déjà.

**Règle** : avant d'ajouter un nouvel event PostHog, vérifier qu'il n'existe pas déjà avec un nom similaire côté serveur ni côté client. Naming convention : `snake_case`, verbe au passé (ex. `signup_completed`, `prescription_ocr_completed`). Le catalogue d'events est dans `src/lib/analytics/events.ts` (P4-14 mergée) — Dim s'y réfère et l'enrichit pour ses events `first_*`.

---

### 🟢 B7 — Coordination cross-projet PharmaWorkspace ↔ baseflow-hotline (P4-14 ✅ ↔ P4-15)

**Contexte** : avec le pivot funnel self-serve, on a besoin de corréler les bookings hotline avec les utilisateurs PharmaWorkspace. Option B retenue : modifier les 2 projets pour tracker la source. Owners désormais unifiés sous Mehdi (le rôle Billy ex-frontend commercial est repris en solo depuis le 28/05/2026).

**Tickets concernés** :
- **P4-14 (MEHDI, ex-scope Billy, ✅ mergée PR #56)** — côté PharmaWorkspace : envoi des params `?source=pharmaworkspace&context=...&pw_user_id=...&visitor_email=...` dans les URLs vers hotline. Plus rien à faire côté PW.
- **P4-15 (MEHDI)** dans `TODO_MEHDI.md` — côté repo `baseflow-hotline` : réception des params, ajout colonne `source_context jsonb` à la table `bookings`, persistance.

**Statut au 29/05/2026** :
- ✅ P4-14 mergée (PR #56) — params envoyés depuis PharmaWorkspace.
- 🟡 P4-15 reste à faire — actuellement les params sont reçus et ignorés silencieusement côté hotline (rétrocompat OK mais tracking incomplet).

**Action immédiate Mehdi** : finir P4-15 sur le repo `baseflow-hotline`. Une fois mergée, test cross-projet 10 min — ouvrir hotline depuis un `<HotlineCTA />` sur staging.pharmaworkspace.fr, réserver, vérifier dans Supabase hotline que `source_context` est bien rempli avec le payload `{ context, pw_user_id, pw_pharmacy_id, ... }` attendu.

**Risque** : faible (changements additifs, rétrocompatibles).

---

### 🔴 B8 — Coordination Mehdi ↔ Dim sur le funnel self-serve + trial Stripe (P4-05 ✅ ↔ P2-01 ↔ P4-13b ↔ proxy.ts)

**Contexte** : le funnel self-serve avec CB obligatoire à la fin du wizard onboarding touche **2 territoires en cascade depuis la reprise solo Mehdi du scope ex-Billy** (28/05/2026). Si l'ordre des merges ou les contrats d'interface sont mal définis, on a des régressions silencieuses (utilisateurs bloqués sur une étape, redirections en boucle, comptes fantômes).

**Tickets concernés (statut au 31/05/2026)** :
- ✅ **P4-05 (MEHDI, ex-Billy, mergée PR #50/#52)** : `/signup` + table `pharmacy_acquisition` + `auth.user.user_metadata.acquisition_id`.
- 🟡 **P2-01 (MEHDI, ex-Dim/Billy — quasi livré sur `feat/p2-01-onboarding-wizard`)** : wizard 4 étapes (titulaire) + 2 étapes (invité avec `/onboarding/waiting`) + helper `getWizardStep()` + middleware wiring + Realtime push invité via migration `0048`. Tests E2E passés le 31/05/2026 (titulaire → Stripe → invité auto-redirect dashboard). Reste à merger.
- ✅ **P4-13b (MEHDI, mergée PR #61)** : migration `0042` Stripe + endpoint `/api/stripe/checkout-setup` + webhook + bloc redirect wire dans `src/proxy.ts` selon `subscription_status`.
- 🟡 **P4-13a (MEHDI)** : setup Stripe Dashboard + Customer Portal + emails Stripe + price IDs.
- ✅ **src/proxy.ts (MEHDI)** : middleware appelle `getWizardStep()` + lit `subscription_status` pour rediriger + branche `waiting` pour invités. Intégré sur `feat/p2-01-onboarding-wizard`.

**Contrats d'interface — figés pour la cascade restante** :

| # | Contrat | Owner | Consumer | Statut |
|---|---|---|---|---|
| 1 | `auth.user.user_metadata.acquisition_id: uuid` posé au `signInWithOtp` | Mehdi P4-05 | Dim P2-01 step 1 | ✅ Livré |
| 2 | `pharmacy_acquisition.pharmacy_id` est `UPDATE`'d au INSERT pharmacy | Mehdi P2-01 step 1 | Mehdi P4-14 tracking | ✅ Livré (branche `feat/p2-01-onboarding-wizard`) |
| 3 | Migration `0041_pharmacy_acquisition.sql` | Mehdi P4-05 | Mehdi P2-01 | ✅ Livré |
| 4 | Migration `0042_pharmacies_stripe_columns.sql` (colonnes + `subscription_status` enum) | Mehdi P4-13b | Mehdi P2-01 + `src/proxy.ts` | ✅ Mergée PR #61 |
| 5 | Endpoint `POST /api/stripe/checkout-setup` body `{ tier, billing }` → `{ checkout_url }` | Mehdi P4-13b | Mehdi P2-01 step 4 | ✅ Mergée PR #61 |
| 6 | Helper `getWizardStep(supabase, userId): WizardStep` (`'create' \| 'profile' \| 'invite' \| 'activate' \| 'waiting' \| 'done'`) exporté de `src/lib/onboarding/wizard-state.ts` | Mehdi (ex-Dim, P2-01) | Mehdi `src/proxy.ts` | ✅ Livré + wiré sur `feat/p2-01-onboarding-wizard`. Étendu avec branche `'waiting'` pour invités. |
| 7 | Endpoint `/api/onboarding/create-pharmacy` doit `INSERT ... subscription_status='incomplete'` | Mehdi P2-01 step 1 | Mehdi P4-13b (sinon middleware ne bloque pas) | ✅ Livré |
| 8 | `success_url` Stripe = `/onboarding/activate/success?session_id={CHECKOUT_SESSION_ID}` | Mehdi P4-13b | Mehdi P2-01 | ✅ Mergée PR #61 |

**Ordre de merge recommandé pour finir la cascade** :
1. **Mehdi P4-13a** (setup Stripe Dashboard + price IDs + Customer Portal + emails) — bloquant pour P4-13b. _En cours._
2. **Mehdi P4-13b** (migration 0042 + endpoint `/api/stripe/checkout-setup` + webhook + bloc proxy à wire) — bloquant pour Dim P2-01 step 4 (Dim peut mocker en attendant via `/dev/mock-stripe-success`).
3. **Dim P2-01** (wizard 4 étapes + helper `getWizardStep` + UPDATE pharmacy_acquisition + INSERT `subscription_status='incomplete'`).
4. **Mehdi `src/proxy.ts`** (wire `getWizardStep` + redirections selon `subscription_status`) — dernière étape, intègre tous les contrats.

**Test cross-tickets à faire après le merge final** :
- Crée un nouvel utilisateur via `/signup`.
- Vérifie : email OTP reçu → clic → atterrit sur `/onboarding/create`.
- Complète step 1 (pharmacie) → DB row `pharmacy_acquisition.pharmacy_id` updated + `pharmacies.subscription_status='incomplete'`.
- Complète step 2 (profil) + step 3 (invite) → atterrit sur `/onboarding/activate`.
- Sans saisir de CB, tente de naviguer vers `/` → middleware redirige sur `/onboarding/activate`.
- Saisis CB test `4242 4242 4242 4242` → callback success → DB `subscription_status='trialing'` + `trial_end` fixé → redirect `/`.
- Accès libre au dashboard.
- Manipule `trial_end` à J-5 → banner pré-prélèvement apparaît.
- (Avec Stripe Test Clock) avance la date au-delà de `trial_end` → DB `subscription_status='active'`.
- Va dans Customer Portal Stripe → annule → DB `subscription_status='canceled'` → next nav redirige sur `/billing/reactivate`.

**Risque** : élevé (5 tickets en cascade, plusieurs migrations, paiement, middleware critique). Mitigation : contrats figés au J0, test cross-tickets obligatoire avant fermeture du sprint Phase 4.

---

## 2. Bloqueurs souples (parallèle OK mais à flagger)

### 🟡 S1 — `next.config.ts` (DEV uniquement, mais auto-séquence)
**Deux tickets DEV touchent ce fichier** : P2-14 (headers sécurité) et P2-11 (Sentry `withSentryConfig`).
**Règle** : faire P2-14 **avant** P2-11 (P2-14 est simple, P2-11 wrappe la config). Sinon merge conflict garanti.

### 🟡 S2 — `package.json` (touchet par tous)
**Plusieurs tickets ajoutent des deps** : Mehdi P1-01 (`@upstash/ratelimit`, `@upstash/redis`), DEV P2-09 (script `typecheck`), DEV P2-11 (`@sentry/nextjs`), DEV P2-12 (`vitest` + co), DEV P2-13 (`@playwright/test`), DEV P4-06 (`posthog-js`).
**Règle** : qui pull `develop` en premier le matin, qui merge en premier sa PR sur `develop` ; les autres rebase. Conflits triviaux à résoudre (lignes adjacentes différentes).

### 🟡 S3 — `src/components/providers/app-providers.tsx`
**Deux tickets DEV touchent ce fichier** : P2-11 (Sentry init) et P4-06 (PostHog init).
**Règle** : DEV fait P2-11 d'abord, puis P4-06 dessus.

### 🟡 S4 — `.github/workflows/ci.yml`
**Trois tickets DEV touchent ce fichier** : P2-10 (création), P2-12 (ajout step test), P2-13 (ajout step e2e).
**Règle** : ordre P2-10 → P2-12 → P2-13. Si en parallèle : merge conflicts triviaux.

### 🟡 S5 — Numérotation des migrations Supabase
**Les 3 rôles peuvent créer des migrations**. Allocation à jour au 25 mai 2026 — **vérifiée contre `supabase/migrations/`** :

| N° | Pour | Migration | Statut |
|---|---|---|---|
| `0026` | — | `work_sessions_accumulated_preserve` | ✅ Mergée |
| `0027` | MEHDI | `repair_schema_drift` (notifications, prescription_items, drug_shortages) | ✅ Mergée |
| `0028` | DIM | `pharmacy_onboarding_rls` | ✅ Mergée |
| `0029` | — | `repair_rentals_billing_drift` | ✅ Mergée |
| `0030` | DIM | `work_sessions_accumulated_minutes` | ✅ Mergée |
| `0031` | DIM | `buckets_private_and_pharmacy_select` (P1-05) | ✅ Mergée |
| `0032` | DIM | `overdue_notifications_cron` (P2-05 + P2-06) | ✅ Mergée |
| `0033` | MEHDI | `repair_prescriptions_image_url` | ✅ Mergée |
| `0034` | MEHDI | `repair_prescriptions_bucket` | ✅ Mergée |
| `0035` | MEHDI | `repair_storage_update_policies` | ✅ Mergée |
| `0036` | MEHDI | `invitations_token_hash` (P1-08) | ✅ Mergée |
| `0037` | MEHDI | `drop_dead_handover_columns` | ✅ Mergée |
| `0038` | MEHDI | `rls_initplan_optim` (P2-07) | ✅ Mergée |
| `0039` | MEHDI | `custom_access_token_hook` (P2-08) | ✅ Mergée |
| `0040` | MEHDI | `auth_hook_profiles_grant` (follow-up P2-08) | ✅ Mergée |
| `0041` | **MEHDI** (ex-Billy) | `pharmacy_acquisition` (P4-05 — table consentements click-wrap + UTM source, ex-beta_signups supprimé) | ✅ Mergée PR #50/#52 |
| `0042` | **MEHDI** (ex-Billy) | `pharmacies.stripe_*` + `trial_end` + `current_period_end` + `subscription_status` enum + table `stripe_webhook_log` (P4-13b — trial intégré Stripe) | ✅ Mergée PR #61 |
| `0043` | **DIM** | Search indexes full-text (P2-03) | ✅ Mergée |
| `0044` | — | _(numéro historique — OCR = 0045)_ | — |
| `0045` | **DIM** | OCR : colonnes `prescriber_name`, `prescribed_date`, `expiry_date` (P2-02) | ✅ Mergée |
| `0046` | **MEHDI** (ex-Billy) | `pharmacy_acquisition_lifecycle` (P4-14 minimal) | ✅ Mergée PR #56 |
| `0047` | **DIM** | `feedback` in-app (P5-06) | ✅ Mergée |
| `0048` | **DIM** | Audit log applicatif (P2-16) | ✅ Mergée PR #62 |
| `0049` | **MEHDI** (ex-Billy) | `pharmacies_realtime` : ajoute `public.pharmacies` à la publication `supabase_realtime` (page `/onboarding/waiting` — push WS invité quand titulaire active Stripe — P2-01). **Collision initiale 0048** : PR #63 nommait le fichier `0048_pharmacies_realtime.sql` sans rebase sur develop post-PR #62 ; renommé en `0049_` via PR `fix/migration-0048-collision` (règle §2 — "celle mergée en premier garde, l'autre rebase et renomme"). | ✅ Mergée (post-rename) |
| `0050` | **DIM** | `user_role` : `student`, `shelver` + RLS `notifications_insert` (TECH-10) | ✅ Mergée PR #72 |
| `0051` | **DIM** | `rental_attachments` + photos locations (TECH-11) | ✅ Mergée PR #73 |
| `0052` | **DIM** | `pharmacy_geofencing` : coordonnées géocodées + config geofence sur `pharmacies`, colonnes position sur `work_sessions`, trigger `enforce_clockin_geofence` (BADGE-01) | ✅ Mergée PR #74 |
| `0053` | **DIM** | `planning_leave_requests` : tables `leave_requests` + `weekly_schedules`, types notif planning (PLAN-01) | ✅ Mergée PR #75 |
| `0054` | **DIM** | `chat_channels_messages` : salon Général + messages + read_states + Realtime (CHAT-01) | ✅ Mergée PR #76 |
| `0055` | **MEHDI** | `pharmacies_onboarding_dismissed` : colonne `onboarding_dismissed_at` sur `pharmacies` (ONBOARD-01) | ✅ Mergée PR #80 |
| `0056` | **MEHDI** | `security_hardening` : durcissement RLS audit 2026-06-13 (C1 trigger colonnes abonnement, H2 trigger role/pharmacy_id, H1 invitations_select, H3 pharmacies_select_onboarding, M1 get_user_role dans 3 policies, M3/G3 notifications, G4 CHECK clockin_accuracy_m, G5 REVOKE create_overdue_notifications, get_user_role search_path) | 🔧 Branche `security/remediation-2026-06-13` — à tester staging |
| `0057` | **MEHDI** | `seat_quota_rpc` (G7) : RPC unique `create_invitation_with_quota` (advisory lock + recompte + INSERT atomiques, SECURITY DEFINER, service_role only) — ferme la race TOCTOU quota sièges | 🔧 Branche `security/p2-deferred-2026-06-13` — à tester staging |
| `0058` | **MEHDI** | `grants_tighten_anon` (L2) : REVOKE des privilèges `anon` sur les 27 tables métier (`drug_shortages` conservée), `authenticated`/`service_role` intacts | 🔧 Branche `security/p2-deferred-2026-06-13` — à tester staging |
| `0059` | **MEHDI** | `status_state_machine` (G6) : triggers transitions prescriptions/orders/rentals (réouverture AUTORISÉE + nettoyage received_at/returned_at) + crons `expire_prescriptions` (expiry_date) & `materialize_overdue_rentals` (expected_return), blocage manuel de expired/overdue via flag bypass. Décisions produit : réouverture oui / expiration cron / overdue cron / draft conservé | 🔧 Branche `security/p2-deferred-2026-06-13` — à tester staging |
| `0060` | **MEHDI** | `missions_dismissed_per_user` : remplace `pharmacies.onboarding_dismissed_at` (0055) par `profiles.missions_dismissed_at` — refactor per-user du flag dismiss du widget de missions, chaque membre gère son confort sans impacter ses collègues (pattern Linear/Notion/Stripe) | 🔧 PR en cours |
| `0061` | **MEHDI** | `planning_shifts` : rework module planning — `shift_templates` (modèles réutilisables ouverture/fermeture/journée/garde, définis par le titulaire) + `shift_assignments` (affectation par date, semaine X≠Y, coupures possibles) + RLS (lecture membres, écriture titulaire) ; ajoute `leave_requests.start_period/end_period` ('full'/'am'/'pm') pour les demi-journées matin/après-midi | 🔧 PR en cours |
| `0062` | **MEHDI** | `list_pagination_indexes` : index composites `(pharmacy_id, created_at DESC, id DESC)` sur tasks/prescriptions/orders/rentals/shortages pour servir la pagination keyset par l'index (fin du tri en mémoire, latence de navigation) | 🔧 PR en cours |
| `0063` | **MEHDI** | `tasks_search` : colonne FTS générée `search_vec` (title A, description B) + index GIN `tasks_search_idx` sur `tasks`, pour la recherche serveur de la page /tasks (fin de la recherche client sur flux paginé) | 🔧 PR en cours |
| `0064` | **DIMITRI** | `subscription_tier_add_ep` : étend le CHECK de `pharmacies.subscription_tier` pour accepter `'ep'` (4ᵉ tier PRICING-V2, Enterprise/Pôle sur devis) en plus de po/otm/go | 🔧 Branche `feat/pricing-v2-4-tiers` |
| `0065`+ | À allouer au besoin | — | — |

**Note migrations hors-projet** : le ticket **P4-15 (MEHDI)** modifie aussi le schema **du projet `baseflow-hotline`** (table `bookings`, ajout colonne `source_context jsonb`). Ce n'est pas tracké dans cette table (autre repo, autre Supabase), mais Mehdi doit appliquer la migration via le SQL Editor Supabase de hotline. Cf. ticket P4-15 dans TODO_MEHDI.md.

**Règles** :
- Avant de créer une migration, vérifier ce tableau et le mettre à jour en éditant ce fichier dans la même PR.
- Si conflit (deux tickets veulent le même numéro), Mehdi tranche.
- **Tous les tickets de TODO_DEV.md et TODO_MEHDI.md qui mentionnent un numéro de migration antérieur ont été décalés de +1 suite à l'ajout de `0027_repair_schema_drift`** — utilise le tableau ci-dessus comme source de vérité.

---

## 3. Bloqueurs souples côté code

### 🟡 S6 — P2-08 Auth Hooks JWT (Mehdi) ↔ P2-01 onboarding polish (Dev)
**Mehdi P2-08** modifie comment `pharmacy_id` et `role` arrivent côté client (via JWT au lieu de query DB). Impact potentiel sur **DEV P2-01** (parcours onboarding) qui consomme ces valeurs.

**Recommandation** : Mehdi merge P2-08 **avant** que DEV attaque P2-01. Si DEV doit avancer en parallèle, qu'il utilise `useProfile()` comme aujourd'hui — Mehdi gère la migration de la source.

### 🟡 S7 — P2-07 RLS InitPlan (Mehdi) ↔ Toutes les migrations DEV
**Mehdi P2-07** réécrit massivement les policies RLS. Si DEV a une migration en cours qui touche une RLS (ex. P2-03 search ne devrait pas, mais P2-05/P2-06 cron créent un function `SECURITY DEFINER` qui interagit avec RLS), il faut sync.

**Recommandation** : DEV merge ses migrations P2-05/P2-06 **avant** que Mehdi attaque P2-07. Ou alors Mehdi fait P2-07 en premier en se contentant des policies actuelles. À voir selon l'ordre des sprints.

---

## 4. Pas de dépendance — peuvent tourner en parallèle sans coordination

Ces tickets sont totalement isolés, vous pouvez avancer en aveugle :

- **Mehdi** : P1-02, P1-03, P1-04, P1-08, tous les P3 (juridique en doc), P2-16 audit log, P4-13 Stripe.
- **Dev** : P2-09, P2-15, P2-14 (avant P2-11), P2-12, P2-13, P2-17, P2-03, P2-04, P4-01/P4-02 landing skeleton, P5-06 feedback in-app.

---

## 5. Timeline recommandée

### Semaine 1 — Setup + tickets isolés

**Lundi matin (Mehdi, 30 min cumulées)** :
- [ ] Compte Sentry → DSN dans `.env.local` + Vercel
- [ ] GitHub Secrets Supabase (URL + anon key)
- [ ] Compte PostHog Cloud EU → KEY dans `.env.local` + Vercel
- [ ] Compte Upstash → REST_URL + REST_TOKEN dans `.env.local` + Vercel
- [ ] Activer `pg_cron` côté Supabase Dashboard
- [ ] Pousser un commit avec **ce document COORDINATION.md** pour que DEV ait la même source.

**Reste de la semaine — en parallèle** :
- Mehdi : P1-02 (½j) → P1-03 (½j) → P1-01 (1j) → P1-04 démarré (2-3j)
- Dev : P2-09 (15min) → P2-15 (15min) → P2-14 (½j) → P2-10 CI (½j) → P2-11 Sentry (½j) → P2-12 Vitest (1j)

Aucun conflit attendu cette semaine.

### Semaine 2 — Approche du handoff B1

- Mehdi : finir P1-04 masquage patient.
- Dev : P2-05/P2-06 cron notifs (1j) → P2-17 work_sessions polling (½j) → préparer P1-05 (lire CLAUDE.md, écrire la migration en local, NE PAS MERGER ENCORE).

**Vendredi 17h cible** : Dev merge P1-05. Mehdi enchaîne P1-06 weekend.

### Semaine 3 — Conséquences du handoff + décisions

- Mehdi : P1-06 (fin S2/début S3), P1-07, P1-08, démarre P3 (juridique).
- Mehdi : finalise pricing → débloque DEV P4-03.
- Dev : P2-13 Playwright, P4-01/P4-02 landing skeleton.

### Semaine 4 — Workstreams parallèles séparés (état au 29/05/2026)

- Mehdi : P3 (politique conf, registre, DPA), P2-07 RLS optim, P2-08 Auth Hooks, **+ scope ex-Billy** (P4-03 tarifs et P4-04 sécurité à finir).
- Dim : P2-03 search.
- **Sync vendredi** : valider numérotation migrations 0030+, ordre P2-07 vs P2-08.

### Semaine 5-6 — Convergence vers bêta-ready (état au 29/05/2026)

- Mehdi : P2-16 audit log, **P4-13 Stripe trial intégré (seul ticket code restant du funnel)**, P3-08 endpoints RGPD, démarche les 50 prospects ABM avec PHARMA, P4-15 hotline source_context (repo séparé).
- Dim : P2-04 pagination, **P2-01 onboarding wizard 4 étapes (incl. consommation endpoint Stripe `/api/stripe/checkout-setup` de Mehdi P4-13b)**, P5-06 feedback in-app, P2-02 OCR extra fields.
- **Tickets P4-* du scope ex-Billy déjà mergés** : P4-01, P4-02, P4-05, P4-06, P4-14.
- **Sortie de Sprint 1 (fin S6)** : tous les bloqueurs P1 fermés, CI verte, Sentry actif, landing live, funnel self-serve + trial Stripe opérationnel. Lancement bêta possible.

---

## 6. Process de sync hebdo (30 min, lundi matin)

Chaque lundi, 30 min de standup à deux :

1. **Tickets clos** semaine dernière (chacun, 5 min).
2. **Tickets en cours** + bloqueurs (chacun, 5 min).
3. **Coordination cette semaine** :
   - Y a-t-il un handoff prévu (P1-05/P1-06 ce vendredi par ex.) ?
   - Y a-t-il une migration à numéroter ?
   - Y a-t-il un fichier sensible touché par les deux (next.config.ts, package.json) ?
4. **Décisions Mehdi** dues cette semaine ?
5. **Rebase main** : qui pull en premier, qui merge en premier.

Tient en 30 min si on est concis. Si ça déborde, c'est qu'il y a un vrai sujet à traiter en async.

---

## 7. Red flags — quand arrêter et se parler

DEV doit pinger Mehdi si :
- Claude Code propose de modifier un fichier de la blacklist (`/api/ocr/`, `/api/invite/**`, `src/proxy.ts`, etc.).
- Un ticket touche une migration existante (0001-0025).
- Un ticket nécessite un changement de schéma DB non listé dans son TODO.
- Le `npm run build` casse pour une raison non triviale (pas juste une typo).
- Une dépendance externe (Sentry, Upstash, PostHog) n'est pas accessible.

Mehdi doit pinger DEV si :
- Il a fini une décision (pricing, contenu politique) qui débloque un ticket DEV.
- Il merge une migration importante qui pourrait casser un ticket DEV en cours.
- Il modifie un fichier que DEV consomme (ex. `Attachment` type après P1-06).
- Il change la signature publique d'une feature (`features/<domain>/index.ts`).
