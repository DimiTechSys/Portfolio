# ROADMAP — PharmaWorkspace : du MVP à la Bêta Production

> Document de pilotage opérationnel — à mettre à jour chaque semaine.
> Créé le 18 mai 2026. Basé sur `BUSINESS_CONTEXT.md`, `CLAUDE.md`, l'audit scalabilité/RGPD du 18 mai 2026 (vérifié contre le code) et le form prospect (`form.txt`).
> **Légende des effort :** ½j = ½ jour-personne, 1j = 1 jour, 1s = 1 semaine. Owner = `DEV` (toi/dev principal), `DEV2` (le collaborateur de l'audit), `PHARMA` (partenaire pharmacien), `LEGAL` (DPO/avocat externe), `CSM` (toi en mode customer-success durant bêta).

---

## 0. Cadrage exécutif

### Objectif global
**Passer d'un MVP fonctionnel à une bêta privée commercialisable, en ~14–18 semaines, pour 5–10 officines pilotes.**

### Sortie de phase (Definition of Done global)
La bêta est lançable quand **toutes** ces cases sont cochées :

- [ ] Les 4 **bloqueurs critiques** Phase 1 sont résolus (OCR, buckets, auth route OCR, suppression logs sensibles).
- [ ] Un **DPA** (Data Processing Agreement — contrat de sous-traitance art. 28 RGPD) est rédigé et signable par chaque officine cliente.
- [ ] La **politique de confidentialité** + le **registre des traitements** (art. 30) sont publiés.
- [ ] La **landing page** est en ligne avec un funnel d'inscription bêta opérationnel.
- [ ] Au moins **3 officines pilotes** ont signé un accord de bêta privée.
- [ ] **Sentry** est branché et reçoit les erreurs en prod.
- [ ] **CI GitHub Actions** bloque les merges en cas de typecheck/lint/test cassé.
- [ ] Le golden path (login → invitation collègue → création tâche → scan ordonnance → levée rupture) passe sans bug bloquant.

### Hypothèses de travail
- Équipe au 29/05/2026 : Mehdi (founder + commercial + juridique + reviews + ex-Billy frontend commercial depuis le 28/05/2026) + Dim (dev backend plein temps) + partenaire pharmacien (commercial / accès terrain). Pas de DPO externe : Mehdi auto-désigné (voie DIY actée 23/05/2026). _Historique : BillyGoat001 (dev frontend commercial) a participé 25-28/05/2026 puis indisponibilité ; scope repris en solo par Mehdi._
- Budget cash disponible : **[À CONFIRMER]** — la roadmap chiffre les postes externes pour que tu valides le go/no-go.
- Mode commercial bêta : **gratuit pendant 3 mois** avec engagement de feedback, conversion en payant à -40 % "Early Adopter" à la sortie.

---

## 1. État des lieux (baseline)

### Ce qui est en place techniquement
**Stack** : Next.js 16.2 (App Router, Turbopack), React 19, Tailwind v4 + shadcn/ui, Supabase (Postgres + Auth OTP email + Storage + Realtime), TanStack Query v5, OpenAI GPT-4o-mini pour l'OCR. Déploiement Vercel.

**Modules fonctionnels** : Auth OTP, profils, onboarding pharmacie, dashboard avec note de transmission, tâches (kanban + liste + agenda), ordonnances avec OCR, commandes fournisseurs, locations matériel médical, ruptures avec scan CIP13 + BDPM/ANSM (20 744 médicaments, 1 031 ruptures synchronisées), annuaire, procédures/formation, agenda global, notifications Realtime, admin RH.

**Multi-tenant** : modèle shared-DB/shared-schema avec colonne `pharmacy_id`, RLS active sur toutes les tables métier + sur `pharmacies` et `profiles` depuis la migration `0002_enable_rls.sql`. Fonctions `get_pharmacy_id()` et `get_user_role()` côté Postgres.

**Sécurité applicative** : routes service-role (`/api/auth/callback`, `/api/invitations/create-native`, `/api/invite/complete`) toutes gated avec `getUser()` avant utilisation — *contrairement à ce que dit l'audit*.

### Ce qui n'est PAS en place
- **OCR `/api/ocr` non authentifié** + `console.log` du nom patient et des médicaments dans les logs Vercel (lignes 124, 152, 194, 204).
- **Buckets `attachments` et `training-files` publics** (`public: true`), policy SELECT sans filtre `pharmacy_id`.
- **Aucune pagination keyset** ni recherche full-text serveur (`tsvector` / `pg_trgm` absents).
- **Aucun test** (pas de Vitest, pas de Playwright).
- **Aucune CI** (pas de GitHub Actions, pas de `tsc --noEmit` câblé).
- **Aucun monitoring** (pas de Sentry, pas d'alerting quotas).
- **RLS performance** : policies utilisent `get_pharmacy_id()` direct au lieu de `(select get_pharmacy_id())` — anti-pattern Supabase officiel.
- **Middleware** : 1 query DB `SELECT profiles` par navigation → goulot d'étranglement à 200+ users.
- **Pas de MFA** (Multi-Factor Authentication — second facteur en plus du mot de passe / OTP), pas d'audit log applicatif, pas de Dependabot.
- **OCR provider US (OpenAI)** : transfert hors UE de données identifiantes patients = **bloqueur RGPD critique**.

### Ce qui n'est PAS en place côté business
- Pas de DPA, pas de politique de confidentialité, pas de registre art. 30.
- Pas de DPO désigné.
- Pas de landing page commerciale.
- Pas de Stripe / paiement.
- Pas de CRM léger pour piloter le pipeline pilotes.
- Pas de 1-pager ni démo vidéo Loom.

---

## 2. Vue d'ensemble — 6 phases sur 14–18 semaines

### Workstreams parallèles
Les phases ne sont pas séquentielles à 100 %. Trois **workstreams** (chantiers parallèles) tournent en même temps : **tech remédiation**, **juridique/conformité**, **commercial/GTM**. Le seul vrai goulot est la Phase 1 (bloqueurs) qui doit être terminée avant qu'aucune officine externe ne touche la bêta.

| Phase | Nom | Semaines | Sortie de phase |
|---|---|---|---|
| **P1** | Bloqueurs critiques sécurité & RGPD tech | S1 → S3 | OCR safe + buckets privés + logs nettoyés |
| **P2** | Hardening produit, tech & observabilité | S2 → S6 | CI + Sentry + recherche + perf RLS + onboarding poli |
| **P3** | Conformité RGPD documentaire + décision HDS | S2 → S6 | DPA + politique + registre + décision HDS tranchée |
| **P4** | Préparation commerciale (landing + GTM) | S4 → S7 | Landing live + 50 prospects ABM + Stripe en mode coupon |
| **P5** | Bêta privée | S6 → S14 | 10 pilotes onboardés + boucle d'itération produit |
| **P6** | Conversion payante & lancement public | S14 → S18 | 5–7 conversions payantes + lancement PharmagoraPlus |

### Chemin critique
```
P1 ──► P4 (landing) ──► P5 (bêta) ──► P6 (lancement public)
   │                       ▲
   └─ P2 (hardening) ──────┤
   └─ P3 (juridique) ──────┘
```
P2 et P3 ne bloquent pas le démarrage de P5 mais doivent être terminées avant le passage en **payant** (P6).

---

## 3. PHASE 1 — Bloqueurs critiques sécurité & RGPD tech (S1–S3)

**Objectif** : rendre la bêta acceptable d'un point de vue juridique/sécurité pour des données patients minimales. **Aucune officine externe ne se connecte tant que cette phase n'est pas terminée.**

**Owner principal** : DEV + DEV2 en binôme.
**Effort total estimé** : ~12 j-personnes.

### Tickets

- [ ] **P1-01 — Sécuriser `/api/ocr` avec auth + rate limit** — *Effort: 1j, Owner: DEV*
  - **Pourquoi** : la route est actuellement publique, n'importe qui peut OCR-er des images et faire exploser ta facture OpenAI.
  - **Quoi** : ajouter `const { data: { user } } = await supabase.auth.getUser()` en début de handler ; rejeter si pas d'user ; récupérer `pharmacy_id` du profil ; ajouter rate limit **10 OCR/min par `pharmacy_id`** via Upstash Redis (service de cache/rate-limit serverless, plan gratuit suffit).
  - **Acceptance** : `curl POST /api/ocr` sans cookie retourne 401 ; 11ᵉ requête en 1 min retourne 429.
  - **Fichiers** : `src/app/api/ocr/route.ts`.

- [ ] **P1-02 — Supprimer console.log du contenu OCR** — *Effort: ½j, Owner: DEV*
  - **Pourquoi** : `console.log('[OCR][OpenAI] raw content:', content)` ligne 194 expose noms patients + médicaments dans les logs Vercel (US, ~30 j de rétention).
  - **Quoi** : remplacer par `console.log('[OCR][OpenAI] ok', { items_count: result.items.length, has_patient: !!result.patient_name })`. Idem ligne 124 (Ollama) et 204 (error).
  - **Acceptance** : grep `console.log` dans `route.ts` ne contient plus `content`, `raw`, `parsed`, ni `patient_name` brut.
  - **Fichiers** : `src/app/api/ocr/route.ts`.

- [ ] **P1-03 — Supprimer console.log du token invitation** — *Effort: ½j, Owner: DEV*
  - **Pourquoi** : ligne 128 de `create-native/route.ts` log le token UUID + l'email destinataire → quelqu'un qui a accès aux logs s'octroie l'invitation.
  - **Quoi** : retirer le `console.log` ou ne logger que `{ inviteeEmailHash: sha256(email).slice(0,8), pharmacy_id, role }`.
  - **Acceptance** : aucun `console.log` n'expose `invitationToken` ni email brut.
  - **Fichiers** : `src/app/api/invitations/create-native/route.ts`, `src/app/api/auth/callback/route.ts`.

- [ ] **P1-04 — Masquer le nom patient AVANT envoi OCR** — *Effort: 2–3j, Owner: DEV*
  - **Pourquoi** : c'est le **levier qui te sort du périmètre HDS strict** pour la voie pragmatique. Si OpenAI ne reçoit jamais de nom patient identifiant, tu ne traites plus de "donnée de santé à caractère personnel" au sens RGPD côté OCR.
  - **Quoi (option A — manuel)** : UI qui demande à l'utilisateur de **cropper la zone médicaments** avant envoi (la zone patient n'est pas envoyée). Option B (auto) : Tesseract.js (OCR JavaScript dans le navigateur) en pré-passe pour détecter et flouter la zone "Nom : ..." avant upload.
  - **Acceptance** : tests manuels sur 5 ordonnances types → aucun nom patient n'apparaît dans la réponse OCR brute renvoyée par OpenAI. **À valider avec l'avocat** (P3-07).
  - **Fichiers** : `src/components/prescriptions/*` (composant scan), nouveau `src/lib/ocr/patient-mask.ts`.

- [ ] **P1-05 — Buckets `attachments` et `training-files` en privé** — *Effort: 1j, Owner: DEV2*
  - **Pourquoi** : `public: true` actuel = mémos vocaux patients et procédures qualité accessibles à toute URL devinée/leakée.
  - **Quoi** : migration `0026_buckets_private.sql` qui passe les deux buckets en `public = false` ; mettre à jour policy SELECT avec `split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())`.
  - **Acceptance** : URL `/storage/v1/object/public/attachments/...` retourne 400 ; les accès passent par `createSignedUrl(path, 3600)`.
  - **Fichiers** : `supabase/migrations/0026_buckets_private.sql`, `supabase.sql` (snapshot).

- [ ] **P1-06 — Refactor de `upload-attachment.ts` vers `createSignedUrl`** — *Effort: 1j, Owner: DEV2*
  - **Pourquoi** : conséquence de P1-05 — `getPublicUrl` ne marchera plus une fois les buckets privés.
  - **Quoi** : remplacer `getPublicUrl(path)` par `createSignedUrl(path, 3600)` (URL signée valide 1 h, renouvelée à l'affichage). Idem dans `prescriptions.service.ts` et `training.ts` et `audio-recorder.tsx`. Stocker le `path` plutôt que l'URL dans la colonne `attachments` jsonb pour pouvoir re-signer.
  - **Acceptance** : un fichier d'une autre pharmacie reste inaccessible même si on connaît l'URL signée expirée.
  - **Fichiers** : `src/lib/storage/upload-attachment.ts`, `src/features/prescriptions/services/prescriptions.service.ts`, `src/lib/queries/training.ts`, `src/components/shared/audio-recorder.tsx`.

- [ ] **P1-07 — Migration des chemins existants** — *Effort: 1j, Owner: DEV2*
  - **Pourquoi** : les anciens uploads ont peut-être déjà des chemins sans `pharmacy_id/` en préfixe → ils ne matcheront pas les nouvelles policies.
  - **Quoi** : script Node qui parcourt les rows `tasks.attachments`, `orders.attachments`, `prescriptions.*` ; pour chaque path non préfixé, fait un `move` Storage vers `{pharmacy_id}/...` et met à jour la jsonb.
  - **Acceptance** : `SELECT COUNT(*) FROM tasks WHERE attachments::text LIKE '%/storage/v1/object/public/%'` = 0.
  - **Fichiers** : `scripts/migrate-attachment-paths.ts` (nouveau).

- [ ] **P1-08 — Hash SHA-256 des tokens invitation** — *Effort: ½j, Owner: DEV2*
  - **Pourquoi** : ceinture-bretelles. Le token UUID v4 n'est pas devinable, mais en cas de fuite SQL (backup mal protégé, fuite d'admin), un token hashé reste inexploitable.
  - **Quoi** : stocker `sha256(token)` en base ; envoyer le clair uniquement dans le mail Supabase ; à la réception, hasher avant `eq('token_hash', sha256(received))`. Migration `0027_invitations_token_hash.sql`.
  - **Acceptance** : la colonne `invitations.token_hash` existe ; aucune route ne fait `eq('token', clearText)` après migration.
  - **Fichiers** : `supabase/migrations/0027_invitations_token_hash.sql`, `src/app/api/invite/complete/route.ts`, `src/app/api/invitations/create-native/route.ts`.

### Gate de sortie Phase 1
- [ ] Aucun `console.log` ne contient de PII (Personally Identifiable Information — donnée personnelle identifiante).
- [ ] `/api/ocr` rejette 401 sans auth.
- [ ] Les 3 buckets sont privés ; un test manuel "ouvrir l'URL publique d'un fichier" retourne 400.
- [ ] Une revue de code croisée DEV ↔ DEV2 a validé chaque ticket.

---

## 4. PHASE 2 — Hardening produit, tech & observabilité (S2–S6)

**Objectif** : durcir les fondations pour supporter 5–10 officines sans incident, et compléter le périmètre fonctionnel jugé indispensable par les form responses.

**Owner principal** : DEV (produit) + DEV2 (tech).
**Effort total estimé** : ~25 j-personnes.

### Tickets — produit & UX

- [ ] **P2-01 — Polir le flow onboarding création pharmacie + 3 invitations** — *Effort: 2j, Owner: DEV*
  - **Pourquoi** : le moment où 80 % des SaaS perdent leurs inscrits. Cible : titulaire crée pharmacie + invite 3 collègues en **< 5 min sans aide**.
  - **Quoi** : audit du parcours actuel `/onboarding/create` → `/onboarding/profile` → premier login. Ajouter un écran "Inviter votre équipe maintenant" avec 3 champs email + bouton "Plus tard". Stocker un flag `onboarding_completed_at` pour mesurer le funnel.
  - **Acceptance** : 3 testeurs externes (pas le partenaire) complètent l'onboarding en < 5 min en autonomie. Mesure via PostHog événements `signup`, `pharmacy_created`, `first_invite_sent`.
  - **Fichiers** : `src/app/(onboarding)/onboarding/create/page.tsx`, `src/app/(onboarding)/onboarding/profile/page.tsx`, nouveau `src/app/(onboarding)/onboarding/invite/page.tsx`.

- [ ] **P2-02 — OCR : compléter `prescriber_name`, `prescribed_date`, `expiry_date`** — *Effort: 2j, Owner: DEV*
  - **Pourquoi** : les 3 champs manquants identifiés dans `BUSINESS_CONTEXT.md`. Impact réel sur la valeur perçue (savoir si une ordonnance est expirée).
  - **Quoi** : étendre le prompt OCR pour extraire ces 3 champs + colonnes Postgres correspondantes via migration `0028`. Calculer un statut `is_expired` côté query.
  - **Acceptance** : sur 10 ordonnances test, les 3 champs sont remplis correctement dans ≥ 8 cas.
  - **Fichiers** : `src/app/api/ocr/route.ts`, `supabase/migrations/0028_prescriptions_additional_fields.sql`, `src/types/index.ts`.

- [ ] **P2-03 — Recherche full-text serveur (ordonnances + ruptures)** — *Effort: 3j, Owner: DEV*
  - **Pourquoi** : à 100+ items les hooks chargent tout → page qui rame. La recherche client-only ne tient pas.
  - **Quoi** : index GIN `tsvector` (Generalized Inverted Index sur vecteur de tokens — l'index Postgres natif pour la recherche full-text) sur `prescriptions(patient_ref, items_text)` et `shortages(product_name, notes)` ; nouvelle query `searchPrescriptions(pharmacyId, q)` qui fait `WHERE search_vec @@ plainto_tsquery('french', q)`. UI : champ de recherche debounced 300 ms dans les pages liste.
  - **Acceptance** : sur 500 prescriptions, recherche par patient retourne en < 200 ms p95.
  - **Fichiers** : `supabase/migrations/0029_search_indexes.sql`, `src/lib/queries/prescriptions.ts`, `src/lib/queries/drug-shortages.ts`, composants liste correspondants.

- [ ] **P2-04 — Pagination keyset (cursor) sur les listes** — *Effort: 2j, Owner: DEV*
  - **Pourquoi** : `LIMIT/OFFSET` se dégrade linéairement avec la profondeur. Le keyset (curseur sur `(created_at, id)`) reste O(log n).
  - **Quoi** : refactorer `getTasks`, `getPrescriptions`, `getOrders`, `getShortages` pour accepter `{ cursor?: { created_at, id }, limit: 50 }` ; retourner `{ items, nextCursor }`. UI : "Charger plus" en bas de liste.
  - **Acceptance** : les listes ne chargent plus que 50 items au mount, "Charger plus" récupère les 50 suivants en < 100 ms.
  - **Fichiers** : `src/lib/queries/tasks.ts`, `src/lib/queries/prescriptions.ts`, `src/lib/queries/orders.ts`, `src/lib/queries/drug-shortages.ts`.

- [ ] **P2-05 — Notification "tâche en retard"** — *Effort: 1j, Owner: DEV2*
  - **Pourquoi** : le système de notifications existe, le déclencheur manque. Sans ça les retards passent inaperçus.
  - **Quoi** : job `pg_cron` (extension Postgres pour scheduler des jobs SQL récurrents) horaire qui scanne `tasks WHERE due_date < now() AND status = 'todo' AND NOT EXISTS (SELECT 1 FROM notifications WHERE ... type = 'task_overdue')` et insère une notification.
  - **Acceptance** : créer une tâche avec due_date dans le passé → notification reçue dans l'heure.
  - **Fichiers** : `supabase/migrations/0030_task_overdue_cron.sql`.

- [ ] **P2-06 — Notification "location en retard"** — *Effort: ½j, Owner: DEV2*
  - **Quoi** : idem P2-05 sur `rentals WHERE expected_return_date < now() AND status = 'active'`.
  - **Fichiers** : `supabase/migrations/0031_rental_overdue_cron.sql`.

### Tickets — tech & observabilité

- [ ] **P2-07 — Optimisation RLS `(select get_pharmacy_id())`** — *Effort: 1j, Owner: DEV2*
  - **Pourquoi** : optimisation Supabase officielle. Force le planificateur Postgres à évaluer la fonction une seule fois par query (InitPlan) au lieu d'une fois par ligne.
  - **Quoi** : migration qui re-crée toutes les policies en remplaçant `get_pharmacy_id()` par `(select public.get_pharmacy_id())` et `get_user_role()` par `(select public.get_user_role())`.
  - **Acceptance** : `EXPLAIN ANALYZE` sur `SELECT * FROM tasks LIMIT 1000` montre un InitPlan unique en haut du plan.
  - **Fichiers** : `supabase/migrations/0032_rls_initplan_optim.sql`.

- [ ] **P2-08 — Auth Hooks JWT (claims `pharmacy_id` + `role`)** — *Effort: 2–3j, Owner: DEV2*
  - **Pourquoi** : supprime la query DB du middleware (1 query par navigation → 0). Capacité multipliée par ~3–5 sur le pool Postgres.
  - **Quoi** : créer un **Auth Hook** Supabase (fonction Edge qui s'exécute à l'émission du JWT et y injecte des claims custom — voir doc Supabase "custom_access_token_hook") qui ajoute `pharmacy_id` et `role` au JWT à chaque session. Modifier `src/proxy.ts` pour lire ces claims depuis le JWT au lieu de query la table `profiles`.
  - **Acceptance** : `tcpdump`/logs Supabase → 0 `SELECT` sur `profiles` à chaque navigation après login.
  - **Fichiers** : `supabase/functions/custom-access-token-hook/index.ts`, `src/proxy.ts`, `src/contexts/profile-context.tsx`.

- [ ] **P2-09 — Génération auto des types Supabase en CI** — *Effort: ½j, Owner: DEV2*
  - **Pourquoi** : `database.types.ts` est maintenu à la main → drift silencieux dès qu'une migration tourne.
  - **Quoi** : étape GitHub Actions qui exécute `supabase gen types typescript --linked > src/types/database.types.ts` et fait `git diff --exit-code` → CI rouge si le fichier n'est pas à jour.
  - **Acceptance** : pousser une migration sans regénérer les types → PR bloquée.
  - **Fichiers** : `.github/workflows/ci.yml`.

- [ ] **P2-10 — GitHub Actions : lint + typecheck + build** — *Effort: 1j, Owner: DEV2*
  - **Quoi** : workflow qui sur chaque PR exécute `npm ci`, `npm run lint`, `tsc --noEmit`, `npm run build`. Ajouter le script `typecheck` dans `package.json`.
  - **Acceptance** : une PR avec une erreur TS est bloquée par la CI.
  - **Fichiers** : `.github/workflows/ci.yml`, `package.json`.

- [ ] **P2-11 — Sentry intégration (front + API routes)** — *Effort: 1j, Owner: DEV2*
  - **Pourquoi** : sans monitoring, un bug pilote = un fantôme dans la machine.
  - **Quoi** : `npm i @sentry/nextjs`, init `sentry.client.config.ts` + `sentry.server.config.ts` + `sentry.edge.config.ts`. Plan gratuit Sentry (5 k erreurs/mois) suffit pour la bêta.
  - **Acceptance** : forcer un `throw new Error('sentry-test')` dans une route → l'erreur apparaît dans la console Sentry sous 30 s.
  - **Fichiers** : `sentry.*.config.ts`, `next.config.ts`.

- [ ] **P2-12 — Tests Vitest sur `lib/queries` et `features/*/services`** — *Effort: 2j, Owner: DEV2*
  - **Quoi** : `npm i -D vitest @vitest/coverage-v8`. Setup `vitest.config.ts`. Écrire ~10 tests sur les queries critiques (filtrage `pharmacy_id`, erreurs RLS). Couverture min 30 % sur ces deux dossiers.
  - **Acceptance** : `npm run test` passe en CI.
  - **Fichiers** : `vitest.config.ts`, `src/lib/queries/__tests__/*.test.ts`, `src/features/*/services/__tests__/*.test.ts`.

- [ ] **P2-13 — Playwright sur 3 golden paths** — *Effort: 2j, Owner: DEV2*
  - **Quoi** : `npm i -D @playwright/test`. Scénarios : (a) login OTP → dashboard ; (b) upload ordonnance → OCR → création prescription ; (c) scan CIP13 → détection rupture → levée. Lancés en CI sur PR principale.
  - **Acceptance** : les 3 tests passent localement et en CI.
  - **Fichiers** : `playwright.config.ts`, `e2e/*.spec.ts`.

- [ ] **P2-14 — Headers de sécurité (CSP, X-Frame-Options, Referrer-Policy)** — *Effort: ½j, Owner: DEV2*
  - **Pourquoi** : durcissement basique attendu par tout audit sécurité.
  - **Quoi** : ajouter `headers()` dans `next.config.ts` avec **CSP** (Content Security Policy — politique qui restreint d'où la page peut charger scripts/styles/images/fonts, contre les attaques XSS), `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
  - **Acceptance** : `curl -I https://app.pharmaworkspace.fr | grep -i content-security-policy` retourne la CSP.
  - **Fichiers** : `next.config.ts`.

- [ ] **P2-15 — Dependabot + `npm audit` en CI** — *Effort: ½j, Owner: DEV2*
  - **Quoi** : `.github/dependabot.yml` pour PR automatiques de mise à jour ; étape `npm audit --audit-level=high` dans la CI qui bloque sur vuln critique.
  - **Fichiers** : `.github/dependabot.yml`, `.github/workflows/ci.yml`.

- [ ] **P2-16 — Table `audit_log` applicatif** — *Effort: 2j, Owner: DEV2*
  - **Pourquoi** : conformité santé + traçabilité "qui a vu quelle ordonnance, quand ?".
  - **Quoi** : migration qui crée `audit_log (id, pharmacy_id, user_id, action, target_type, target_id, ip, user_agent, created_at)` avec policy SELECT lecture pour titulaire de la pharmacie uniquement. Helper `logAuditEvent()` dans `src/lib/audit/log.ts`, appelé sur les accès à `prescriptions` (read/update/delete) en priorité.
  - **Acceptance** : ouvrir une ordonnance → une ligne `audit_log` apparaît avec `action = 'prescription.read'`.
  - **Fichiers** : `supabase/migrations/0033_audit_log.sql`, `src/lib/audit/log.ts`.

- [ ] **P2-17 — Sortir `work_sessions` du Realtime vers polling** — *Effort: ½j, Owner: DEV2*
  - **Pourquoi** : 3 channels Realtime sur des événements rares (~2/jour/personne) = sur-engineering qui plafonne le plan Pro.
  - **Quoi** : retirer `.channel('work_sessions_*')` dans `session-context.tsx`, `dashboard/page.tsx`, `team-sessions-panel.tsx`. Remplacer par React Query `refetchInterval: 30_000`.
  - **Acceptance** : les compteurs sessions se mettent à jour sous 30 s ; ouvrir Network → 0 WebSocket `work_sessions`.
  - **Fichiers** : `src/contexts/session-context.tsx`, `src/app/(app)/dashboard/page.tsx`, `src/components/admin/team-sessions-panel.tsx`.

### Gate de sortie Phase 2
- [ ] CI verte sur la branche principale.
- [ ] `npm run typecheck`, `npm run test`, `npm run e2e` passent.
- [ ] Sentry reçoit des erreurs en staging.
- [ ] Time-to-first-contentful-page < 1,5 s sur dashboard rempli (500 tâches, 200 ordonnances).
- [ ] `BUSINESS_CONTEXT.md` mis à jour : les modules avec maturité 🟡 (OCR, notifications, procédures) passent 🟢.

---

## 5. PHASE 3 — Conformité RGPD documentaire + décision HDS (S2–S6) — Voie DIY

**Objectif** : produire les documents juridiques signables, désigner un DPO interne, trancher la voie HDS.

**Owner principal** : MEHDI (rédaction à partir des templates gratuits CNIL/CEPD).
**Effort total estimé** : ~6 j MEHDI. **Budget cash : 0 €** (voie DIY actée le 23/05/2026, voir TODO_MEHDI.md tickets P3-* pour les détails et templates).

### Tickets (détails complets dans TODO_MEHDI.md)

- [ ] **P3-01 — Auto-désignation DPO interne** — *Effort: 1h, Owner: MEHDI*
  - Mehdi se désigne lui-même DPO (légal en dessous de 250 personnes, art. 37 RGPD). Notification CNIL via formulaire en ligne gratuit. Publication contact `dpo@pharmaworkspace.fr` sur la landing.
  - **Livrable** : `legal/lettre-designation-dpo.md` + récépissé CNIL.

- [ ] **P3-03 — Registre des traitements (art. 30 RGPD)** — *Effort: ½j, Owner: MEHDI*
  - Tableur basé sur le modèle gratuit CNIL, listant les 8-10 traitements PharmaWorkspace (auth, ordonnances, tâches, ruptures, notifications, contacts, sessions, OCR).
  - **Livrable** : `legal/registre-traitements.xlsx`.

- [ ] **P3-04 — Politique de confidentialité publique** — *Effort: ½j, Owner: MEHDI*
  - Page `/privacy` rédigée à partir du modèle CNIL "Information des personnes". Couvre art. 13/14 RGPD.
  - **Livrable** : `legal/politique-confidentialite.md` (source) + page web sur la landing.

- [ ] **P3-05 — DPA template signable** — *Effort: 1j, Owner: MEHDI*
  - Modèle DPA basé sur les clauses contractuelles types CEPD (gratuit, version FR). Signature manuelle scannée pour les premiers pilotes ; PandaDoc free (3 docs/mois) si besoin.
  - **Livrable** : `legal/dpa-pharmaworkspace.docx` + `.pdf`.

- [ ] **P3-06 — Récupérer les DPA des sous-traitants** — *Effort: 1h, Owner: MEHDI*
  - Téléchargements gratuits depuis : Supabase, Vercel, Mistral, Upstash, Sentry, PostHog. Archivage `legal/sous-traitants/`.

- [ ] **P3-07 — Décision HDS documentée** — *Effort: 2h, Owner: MEHDI*
  - Doc 1-2 pages qui acte la voie A retenue : provider OCR EU (Mistral, fait via P1-04) + stockage Supabase Paris non-HDS toléré en bêta privée (≤ 30 officines + DPA explicite). Définit le seuil de bascule vers voie hybride (Scaleway HDS pour les ordonnances seules, ~50-100 €/mois si nécessaire plus tard).
  - **Livrable** : `legal/decision-hds.md`.

- [ ] **P3-08 — Endpoints droits RGPD (export + effacement)** — *Effort: 2j, Owner: MEHDI*
  - `GET /api/legal/export` retourne ZIP avec les données de l'utilisateur ; `DELETE /api/legal/erase` anonymise (préserve l'audit log).
  - **Fichiers** : `src/app/api/legal/export/route.ts`, `src/app/api/legal/erase/route.ts`.

- [ ] **P3-09 — Procédure incident (runbook 72h CNIL)** — *Effort: 1h, Owner: MEHDI*
  - Checklist 2 pages : détection, évaluation gravité, notification CNIL via https://notifications.cnil.fr, template mail utilisateur.
  - **Livrable** : `legal/runbook-incident.md`.

- [ ] **P3-10 — Durées de conservation par catégorie** — *Effort: ½j, Owner: MEHDI*
  - Code de la santé publique : 3 ans (ordonnance courante) à 10 ans (stupéfiants). À documenter dans le registre P3-03 + job `pg_cron` quotidien de purge.

### Gate de sortie Phase 3
- [ ] DPO désigné (Mehdi lui-même) et publié.
- [ ] Politique de confidentialité en ligne.
- [ ] DPA template signable disponible.
- [ ] Décision HDS tracée dans `legal/decision-hds.md`.
- [ ] Endpoints export/erase fonctionnels.

---

## 6. PHASE 4 — Préparation commerciale : landing, GTM, funnel self-serve (S4–S7)

> 🔄 **Pivot funnel — mai 2026 (révision 2).** On a fait deux pivots successifs :
>
> **Pivot 1 (sales-led → self-serve no-CB)** : abandon de Calendly + form long + Stripe coupon -100 % au profit d'un `/signup` léger + click-wrap CGS/DPA.
>
> **Pivot 2 (no-CB → CB obligatoire fin wizard, trial 30j auto)** : pattern Linear / Vercel Pro / Loom Business. La CB est demandée à la 4ᵉ étape du wizard onboarding via Stripe Checkout setup intent. €0 prélevés pendant 30 jours. Prélèvement automatique à J+30 au tarif Early Adopter -40 % à vie. Annulable à tout moment depuis le Stripe Customer Portal. **Plus de paywall séparé à J+30** — Stripe gère le trial→paid en auto-renouvellement. Conversion trial→paid attendue 60-70 % (vs 15-25 % en no-CB).
>
> **Funnel final — 8 étapes mesurées dans PostHog** :
> 1. **ENTRY** — landing pharmaworkspace.fr (warm direct / organic / hotline)
> 2. **SIGNUP** — `/signup` : email + OTP + click-wrap CGS/DPA (audit RGPD art. 7)
> 3. **ONBOARDING wizard step 1-3** — pharmacie / profil / équipe (Dim P2-01)
> 4. **CB ACTIVATION** — `/onboarding/activate` : Stripe Checkout setup intent, CB obligatoire, €0 prélevés, trial 30j (Mehdi P4-13b — ex-scope Billy ; endpoint consommé par Dim P2-01 step 4)
> 5. **PRODUIT** — accès libre 30 jours, checklist first-run sur dashboard, `<HotlineCTA />` visible partout
> 6. **PRÉ-PRÉLÈVEMENT J+25** — `<TrialBanner />` soft "Prochain prélèvement le [date] : [tier_price] HT" + email Stripe natif "trial ending" à J-7
> 7. **PRÉLÈVEMENT AUTO J+30** — Stripe facture automatiquement Early Adopter -40 % ; `subscription.status: trialing → active` ; webhook met à jour DB ; pas d'action utilisateur requise
> 8. **CLIENT PAYANT** — accès complet, NPS J+60, suivi cohort PostHog
>
> Conséquences : `beta_signups` supprimé, Calendly supprimé (remplacé par hotline.baseflow.fr), pas de Stripe coupon, **pas de page `/paywall` séparée**, Customer Portal Stripe pour annulation/update CB.

**Objectif** : avoir un funnel self-serve opérationnel + un pipeline de 20 prospects warm (hotline ou organic) qui peuvent démarrer un essai en autonomie.

**Owner principal** : MEHDI (landing + signup + paywall + tracking + DPA/CGS public + GTM + Stripe setup + hotline.baseflow.fr — incluant le scope frontend commercial ex-Billy depuis le 28/05/2026) + DIM (wizard onboarding + checklist first-run + HotlineCTA app header).
**Effort total estimé** : ~12 j Mehdi (dont scope ex-Billy déjà partiellement mergé : P4-01/02/05/06/14) + ~3 j Dim.

### Tickets — landing & site marketing

- [x] **P4-01 — Créer le route group `(marketing)` + layout public** — *Effort: ½j, Owner: MEHDI (ex-Billy), mergée PR #47*
  - **Quoi** : `src/app/(marketing)/layout.tsx` avec header simple (logo + lien login + CTA "Démarrer un essai gratuit 30 jours") et footer (CGS, privacy, contact). Pas de Sidebar app.
  - **Fichiers** : `src/app/(marketing)/layout.tsx`.

- [x] **P4-02 — Landing `/` (skeleton hero + value prop)** — *Effort: 2j, Owner: MEHDI (ex-Billy), mergée PR #48 (copy à raffiner)*
  - **Quoi** : sections dans l'ordre — Hero ("Remplacez le cahier de transmission, les post-it et les groupes WhatsApp par un seul espace partagé." + CTA primaire "Démarrer un essai gratuit 30 jours" → `/signup` + CTA secondaire `<HotlineCTA />`), Trust bar (Hébergé France · RGPD · BDPM/ANSM · 30 jours d'essai · Annulable à tout moment), Avant/Après visuel split-screen, 3 modules différenciants en grille (Transmission, OCR ordonnance, Ruptures CIP13), Témoignage pilote, Tarifs preview (Early Adopter -40 %), FAQ 8 entrées (incluant la rationale CB obligatoire), CTA final.
  - **Acceptance** : Lighthouse score ≥ 90 sur Performance + Accessibility.
  - **Fichiers** : `src/app/(marketing)/page.tsx`, composants dédiés `src/components/marketing/*`.

- [ ] **P4-03 — Page tarifs `/tarifs`** — *Effort: 1j, Owner: MEHDI (ex-Billy, à finir)*
  - **Quoi** : 3 tiers (Solo 23,40 €, Équipe 47,40 €, Grande équipe 77,40 € HT/mois en Early Adopter -40 % ; tarifs catalogue 39 / 79 / 129 €) ; bandeau "Early Adopter -40 % à vie pour les 20 premières officines" ; toggle mensuel/annuel ; FAQ tarifs incluant la rationale CB obligatoire à l'inscription (€0 prélevés pendant 30j).
  - **Fichiers** : `src/app/(marketing)/tarifs/page.tsx`.

- [ ] **P4-04 — Page sécurité & RGPD `/securite`** — *Effort: 1j, Owner: MEHDI (ex-Billy, à finir)*
  - **Quoi** : transparence sur stack (Supabase Paris, Vercel UE), DPO interne (Mehdi), CCT, DPA accepté en click-wrap au signup, droits RGPD, décision HDS voie A. C'est ton **argument de vente** auprès des titulaires les plus prudents.
  - **Fichiers** : `src/app/(marketing)/securite/page.tsx`.

- [x] **P4-05 — Page `/signup` self-serve (email + OTP + click-wrap CGS/DPA)** — *Effort: 2j, Owner: MEHDI (ex-Billy), mergée PR #50/#52*
  - **Pourquoi** : entrée directe du funnel self-serve, sans capture CB ni form long.
  - **Quoi** : email + sélecteur langue (fr/en) + 2 cases click-wrap CGS+DPA → magic link Supabase OTP → callback → onboarding wizard P2-01.
  - **Audit RGPD art. 7** : table `pharmacy_acquisition` stocke version + hash + horodatage + IP + UA des consentements.
  - **Acceptance** : flow complet local (signup → email → clic → onboarding 3 étapes → dashboard).
  - **Fichiers** : `supabase/migrations/0041_pharmacy_acquisition.sql`, `src/app/(marketing)/signup/page.tsx`, `src/components/marketing/signup-form.tsx`, `src/app/api/signup/start/route.ts`, modif `src/app/auth/callback/route.ts`.

- [x] **P4-06 — Instrumentation PostHog** — *Effort: ½j, Owner: MEHDI (ex-Billy), mergée PR #49*
  - **Quoi** : `npm i posthog-js` ; init avec un projet PostHog Cloud EU (gratuit jusqu'à 1M events/mois). Events détaillés dans P4-14 (funnel self-serve : landing_view, signup_email_submitted, signup_confirmed, pharmacy_created, onboarding_completed, hotline_cta_click, paywall_view, checkout_started, checkout_succeeded). Events app `first_*` posés par DIM dans les composants métier (cf. TODO_DEV.md ⏩ P4-06 note de réassignation).
  - **Acceptance** : dashboard PostHog reçoit les events en temps réel ; funnel landing → signup → activation visible.
  - **Fichiers** : `src/lib/analytics/posthog.ts`, intégration dans `app-providers.tsx`.

### Tickets — GTM & pipeline

- [ ] **P4-07 — 1-pager produit (PDF)** — *Effort: 1j, Owner: DEV + PHARMA*
  - **Quoi** : doc Word/PDF d'une page recto-verso : promesse, 5 modules clés, capture d'écran, conditions bêta, contact. À envoyer en pièce jointe lors des warm intros PHARMA.
  - **Livrable** : `marketing/pharmaworkspace-1pager.pdf`.

- [ ] **P4-08 — Démo Loom 90 s** — *Effort: 1j, Owner: DEV*
  - **Quoi** : enregistrement screencast 90 s qui montre dashboard → tâche → ordonnance scan → rupture. Hosting Loom gratuit, partageable par lien.
  - **Livrable** : lien Loom intégré dans la landing et dans les mails.

- [ ] **P4-09 — Liste 50 officines cibles (ABM)** — *Effort: 2j, Owner: PHARMA*
  - **Quoi** : avec ton partenaire, constituer un tableur Notion/Airtable avec : nom officine, ville, taille équipe, titulaire, email, téléphone, statut (cold/warm/hot/passed). Priorité ICP : urbain/semi-urbain 4–8 personnes.
  - **Acceptance** : tableau de 50 lignes, dont ≥ 30 "warm" (déjà touchées par le partenaire).
  - **Livrable** : Notion/Airtable workspace.

- [ ] **P4-10 — Pipeline CRM léger** — *Effort: ½j, Owner: DEV*
  - **Quoi** : template Notion ou Airtable avec colonnes : contact, statut, date dernier contact, prochaine action, owner, notes. Synchronisé avec P4-09.
  - **Livrable** : workspace partagé DEV + PHARMA.

- [ ] **P4-11 — Email séquence outbound (3 mails)** — *Effort: 1j, Owner: DEV + PHARMA*
  - **Quoi** : J0 (warm intro PHARMA, ton conversationnel), J+3 (relance avec 1-pager + Loom), J+10 (dernière relance "on garde votre place ?"). Templates dans Notion, envoyés manuellement (pas d'outil outbound type Lemlist au début).
  - **Livrable** : 3 templates dans le CRM.

- [ ] **P4-12 — Intégration hotline.baseflow.fr (outil booking maison)** — *Effort: ½j, Owner: MEHDI*
  - **Quoi** : composant `<HotlineCTA context="<emplacement>" />` réutilisable côté front (livré dans P4-02, déjà mergé) qui pointe vers `https://hotline.baseflow.fr/?context=<emplacement>`. Hotline.baseflow.fr est un repo séparé (Next.js 14 + Supabase + Google Calendar + Gmail SMTP) qui gère réservation + email confirmation + ICS. Pas de Calendly (coûteux + tracking limité).
  - **Emplacements** : `landing_hero`, `landing_faq`, `landing_cta_final`, `signup_page`, `app_header`, `paywall_j30`, `dashboard_first_run`.
  - **Cross-tracking P4-14 ↔ P4-15** : le `context` est forward en query string, lu côté hotline (ticket P4-15 dans `TODO_MEHDI.md`) et stocké dans `bookings.source_context`. Permet de mesurer combien d'appels viennent de chaque emplacement.
  - **Livrable** : composant exporté + lien live ; doc dans `COORDINATION.md` §B7.

- [x] **P4-14 — Funnel tracking PostHog cross-projet** — *Effort: 2j, Owner: MEHDI (ex-Billy), mergée PR #56*
  - **Quoi** : nomenclature events (snake_case strict), capture côté landing + signup + app + paywall, dashboard funnel 7 étapes (visit → signup_submitted → signup_confirmed → onboarding_completed → first_value → paywall_view → checkout_succeeded), corrélation `acquisition_id` ↔ `pharmacy_id` ↔ `bookings.source_context` côté hotline.
  - **Acceptance** : funnel visible dans PostHog EU, conversions calculées par cohorte semaine, `hotline_cta_click` corrélé avec bookings côté hotline (jointure manuelle au début, dashboard combiné plus tard).
  - **Fichiers** : `src/lib/analytics/events.ts` (catalogue typé), instrumentation dans tous les composants concernés.

- [ ] **P4-15 — Hotline source_context tracking (repo séparé baseflow-hotline)** — *Effort: ½j, Owner: MEHDI*
  - **Quoi** : modifier `app/api/book/route.ts` du repo `baseflow-hotline` pour accepter un `source_context` (Zod), `supabase-schema.sql` pour ajouter une colonne `source_context jsonb`, `BookingStepper.tsx` pour lire `?context=` de l'URL et le pousser dans le payload.
  - **Acceptance** : un booking via `https://hotline.baseflow.fr/?context=landing_hero` apparaît avec `source_context = {"context": "landing_hero", "utm_*": ..., "referrer": ...}` dans la table bookings.
  - **Détail complet** : `TODO_MEHDI.md` ticket P4-15.

### Tickets — pricing & Stripe

- [ ] **P4-13a — Setup Stripe (compte + produits + Customer Portal + emails trial ending)** — *Effort: 1h30, Owner: MEHDI*
  - **Pourquoi** : compte Stripe FR + KYC + 3 produits Solo/Équipe/Grande avec 6 prices Early Adopter -40 % à vie directement intégrés dans les prices (pas de coupon). Activer le Customer Portal Stripe (pour annulation + update CB) et les emails Stripe natifs (trial ending à J-7, facture, CB expiration). Récupère les 6 price IDs + clés pour les utiliser directement dans le code P4-13b (Mehdi seul fait les deux côtés depuis le 28/05/2026).
  - **Détail complet** : `TODO_MEHDI.md` ticket P4-13a.

- [ ] **P4-13b — Trial intégré Stripe (CB obligatoire fin onboarding, trial 30j auto)** — *Effort: 3j, Owner: MEHDI (ex-Billy)*
  - **Pourquoi** : pattern Linear / Vercel Pro / Loom Business. CB obligatoire à la 4ᵉ étape du wizard onboarding (Dim P2-01). Stripe gère le trial→paid en auto-renouvellement. Plus de page `/paywall` séparée.
  - **Quoi** : migration `0042_pharmacies_stripe_columns.sql` (colonnes `stripe_customer_id`, `stripe_subscription_id`, `subscription_status` ['incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'], `subscription_tier`, `subscription_billing`, `trial_end`, `current_period_end`, table `stripe_webhook_log` pour idempotence), endpoint `/api/stripe/checkout-setup` (mode subscription + trial 30j + `payment_method_collection: 'always'`), webhook `/api/stripe/webhook` (7 events Stripe + signature verify + idempotence), endpoint `/api/stripe/portal` (Customer Portal), pages `/onboarding/activate/success` et `/billing/reactivate`, composant `<TrialBanner />` (pré-prélèvement J-5 + alerte past_due), modif `src/proxy.ts` pour rediriger selon `subscription_status` (incomplete → /onboarding/activate, canceled/unpaid → /billing/reactivate).
  - **Acceptance** : flow complet test → compte créé `incomplete` → step 4 ouvre Stripe Checkout → CB 4242 → callback success → DB `trialing` → accès libre 30j → banner J-5 → prélèvement auto J+30 → DB `active`. Tests CB échouée (4000…0341) → `past_due`. Annulation Portal → `canceled` → middleware redirige reactivate.
  - **Détail complet** : `TODO_MEHDI.md` section "P4-13 — Trial intégré Stripe".
  - **Fichiers** : `src/app/api/stripe/checkout-setup/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/api/stripe/portal/route.ts`, `src/app/(app)/onboarding/activate/success/page.tsx`, `src/app/(app)/billing/reactivate/page.tsx`, `src/components/app/trial-banner.tsx`, `src/lib/subscription.ts`, `src/lib/stripe/server.ts`, `src/lib/stripe/price-ids.ts`, migration `0042_pharmacies_stripe_columns.sql`.

### Gate de sortie Phase 4
- [ ] Landing live sur `pharmaworkspace.fr` avec CTAs self-serve (pas de form bêta, pas de Calendly).
- [ ] `/signup` self-serve fonctionnel (OTP + click-wrap CGS/DPA) → onboarding wizard 4 étapes (incl. CB activation) → dashboard.
- [ ] HotlineCTA opérationnel sur les 7 emplacements (landing/signup/app/onboarding/reactivate), bookings cross-trackés côté `hotline.baseflow.fr`.
- [ ] Stripe en sandbox testé end-to-end : CB obligatoire à l'onboarding step 4 → `subscription_status='trialing'` → accès libre 30j → prélèvement auto J+30 → `subscription_status='active'`. Tests négatifs : CB échouée (`past_due`), annulation Portal (`canceled` → `/billing/reactivate`).
- [ ] Customer Portal Stripe activé et accessible depuis `/billing/reactivate` et footer Settings.
- [ ] PostHog dashboard montre le funnel 8 étapes (visit → signup_submitted → signup_confirmed → pharmacy_created → onboarding_completed → checkout_succeeded → subscription_first_charge_succeeded → still_active_w12).
- [ ] 50 cibles ABM listées, dont ≥ 20 contactées (warm intros vers `/signup` ou hotline.baseflow.fr).

---

## 7. PHASE 5 — Bêta self-serve + accompagnement low-touch (S6–S14)

> 🔄 **Pivot mai 2026.** Plus de kickoff call obligatoire à J0. Les pilotes warm démarrent en autonomie via `/signup` ; on intervient activement seulement (a) si la checklist first-run n'a pas progressé à J+3, (b) si un signal PostHog d'abandon est détecté, (c) si le pilote a réservé une session via `<HotlineCTA />`. On garde un cycle d'accompagnement structuré, mais l'attention humaine n'est plus dépensée à faire de la création de compte mais à débloquer les pilotes en difficulté.

**Objectif** : onboarder 10 officines pilotes en self-serve, intervenir sur signal (pas systématique), itérer le produit, valider le PMF, instrumenter les KPIs.

**Owner principal** : MEHDI (CSM low-touch via hotline + relances ciblées + correctifs sprint frontend) + DIM (correctifs sprint backend) + PHARMA (relais réseau warm).
**Effort estimé** : ~40 % du temps DEV + ~50 % temps Mehdi CSM sur 8 semaines (vs 100 % avant : on récupère du temps sur les kickoffs).

### Cadence opérationnelle

**Rythme** : **2–3 officines onboardées par semaine** en moyenne (vs 1/semaine en sales-led). Cadence soutenable grâce au self-serve.

**Cycle pilote type (self-serve avec CB validée)** :
- **J0** : warm intro PHARMA → lien direct vers `/signup?source=warm_intro_pharma_<nom>` → l'utilisateur s'inscrit, accepte click-wrap, complète onboarding wizard 4 étapes (incl. **saisie CB obligatoire en step 4** — €0 prélevés mais validation Stripe), voit le dashboard avec checklist first-run. Pas de kickoff call obligatoire. Le compte est en `subscription_status='trialing'` jusqu'à J+30.
- **J+1 à J+3** : surveillance PostHog. Si checklist first-run ≤ 1 item coché à J+3, Mehdi envoie un email perso ("besoin d'un coup de main ? Réservez 15 min" → HotlineCTA `context=email_j3`). Si l'utilisateur n'a pas terminé la step 4 (CB), email perso "Une question avant de finaliser ?" + HotlineCTA `context=email_signup_abandon_cb`.
- **J+7** : email automatique "Comment ça se passe ?" + lien `<HotlineCTA context="email_j7" />`. Si signal d'usage régulier (≥ 3 connexions, ≥ 2 modules utilisés), pas de relance manuelle.
- **J+14** : enquête courte in-app (3 questions, PostHog Survey ou maison).
- **J+23 (T-7 de trial_end)** : email Stripe natif "Your trial ends in 7 days" envoyé automatiquement par Stripe (cf. P4-13a config). Aucune action côté code.
- **J+25 (T-5)** : `<TrialBanner />` soft affiché in-app (Mehdi P4-13b, ex-scope Billy) : "Prochain prélèvement le [date] : [tier_price] HT/mois. [Gérer mon abonnement]".
- **J+30** : Stripe facture automatiquement la CB enregistrée au tarif Early Adopter -40 %. `subscription.status: trialing → active`. Webhook met à jour DB, email Stripe natif "Receipt for your subscription". **Pas d'action utilisateur requise** — le banner disparaît.
- **J+30 → J+60** : enquête **NPS** (Net Promoter Score — score de recommandation 0–10, "vous nous recommanderiez à un confrère ?") + interview qualitative 30 min (via HotlineCTA, pas Calendly).

**Scénarios alternatifs** :
- **CB échoue à J+30** : `subscription.status: trialing → past_due`. Banner orange in-app "Paiement échoué, mettez à jour votre CB" + email Stripe natif. Stripe retry 3 fois sur 7 jours. Si toujours échec → `unpaid` → middleware redirige vers `/billing/reactivate` avec Customer Portal.
- **Annulation pendant le trial** : l'utilisateur va dans Customer Portal Stripe, annule. `subscription.cancel_at` = `trial_end`. Il garde l'accès jusqu'à J+30 puis le compte passe en `canceled` → middleware redirige vers `/billing/reactivate`. Email Mehdi pour comprendre la raison + proposer HotlineCTA.
- **Annulation post-J+30 (déjà payant)** : pareil, annulation à la fin de la période courante. Email Mehdi.

### Tickets — onboarding & support

- [ ] **P5-01 — Kit onboarding self-serve (vidéo + page d'aide)** — *Effort: 2j, Owner: MEHDI*
  - **Quoi** : page `/aide/demarrer` (statique, marketing route group) avec vidéo Loom 5 min "premier jour avec PharmaWorkspace", checklist textuelle des 5 first steps (= miroir de la checklist in-app dashboard), lien `<HotlineCTA context="aide_demarrer" />`. Pas de PDF, pas de doc à signer (DPA déjà en click-wrap signup).
  - **Livrable** : page live + Loom intégré.

- [ ] **P5-02 — Dashboard interne "pilotes" (PostHog + Supabase)** — *Effort: 1j, Owner: MEHDI (ex-Billy)*
  - **Quoi** : page Notion ou page interne Next.js (route `/admin/cohort` derrière feature flag) qui liste pour chaque pharmacie : email titulaire, date signup, source, checklist progress (0–5), nb connexions semaine, dernière activité, statut paywall (trialing / past_due / active / canceled), NPS si dispo, dernière HotlineCTA réservée. Mise à jour temps réel via requête Supabase.

- [ ] **P5-03 — Canal feedback in-app + hotline.baseflow.fr** — *Effort: ½j, Owner: MEHDI (ex-Billy)*
  - **Quoi** : remplace le canal WhatsApp/Slack pilote par (a) un bouton "Donner mon avis" in-app (PostHog Survey ou table `feedback`) + (b) le composant `<HotlineCTA context="app_feedback" />` dans le header. Bugs bloquants tracés via Sentry → Mehdi proactif. Pas de relation manuelle par défaut.

- [ ] **P5-04 — Changelog hebdomadaire pilotes** — *Effort: ½j/semaine, Owner: DEV*
  - **Quoi** : email vendredi 17 h à tous les pilotes avec "Cette semaine on a : a) … b) … c) … La semaine prochaine on prépare : …". Crée un sentiment d'avancement.

### Tickets — boucle d'itération produit

- [ ] **P5-05 — Sprint hebdo basé sur les retours pilotes** — *Effort: continu, Owner: DEV*
  - **Quoi** : chaque vendredi 16 h, revue des bugs / feature requests reçus dans la semaine. Priorisation **RICE** (Reach × Impact × Confidence ÷ Effort — framework de priorisation des features). Top 3 dans le sprint suivant.

- [ ] **P5-06 — Système de feedback in-app** — *Effort: 1j, Owner: DEV*
  - **Quoi** : un bouton "Donner mon avis" dans le header app qui ouvre une modale (PostHog Surveys ou Cabinet maison) → row dans table `feedback`. Notif Slack/email à chaque submit.

### Tickets — KPIs & analytics

- [ ] **P5-07 — Dashboard PostHog activation/rétention** — *Effort: 1j, Owner: DEV*
  - **Quoi** : 4 widgets — funnel signup → onboarding complet ; cohorte W1/W4/W12 par pharmacie ; DAU/MAU par pharmacie ; module adoption (combien de pharmacies utilisent ≥ 4 modules).

- [ ] **P5-08 — Mesurer "% équipiers actifs par officine"** — *Effort: ½j, Owner: DEV*
  - **Pourquoi** : c'est ton meilleur **leading indicator** (indicateur prédictif) du churn. Si < 50 % au bout de 2 semaines, intervention CSM ; si < 30 % à 4 semaines, le pilote est acté perdu.
  - **Quoi** : event `user_login` envoyé à PostHog avec pharmacy_id ; dashboard qui calcule chaque semaine le ratio (équipiers loggés / équipiers invités).

### Gate de sortie Phase 5
- [ ] ≥ 7 officines pilotes activées (≥ 50 % équipe active au bout de 2 semaines).
- [ ] NPS moyen ≥ 30 (échelle -100 à +100, 30 = "bon" pour un SaaS jeune).
- [ ] ≤ 5 bugs critiques en backlog.
- [ ] ≥ 3 témoignages écrits/vidéos exploitables marketing.

---

## 8. PHASE 6 — Conversion payante & lancement public (S14–S18)

**Objectif** : convertir 5–7 pilotes en payant, ouvrir l'inscription publique, capitaliser sur PharmagoraPlus mars 2027.

### Tickets

- [ ] **P6-01 — Email custom "merci pour votre 1ʳᵉ facture" + "pourquoi avez-vous annulé"** — *Effort: ½j, Owner: MEHDI*
  - **Quoi** : 2 emails Resend complémentaires aux emails Stripe natifs.
    - **Trigger `subscription_first_charge_succeeded`** (PostHog event de P4-13b) : email "Merci pour votre soutien Early Adopter ! Voici 3 features à découvrir + lien HotlineCTA si vous voulez nous remonter quoi que ce soit."
    - **Trigger `subscription_canceled`** (PostHog event de P4-13b) : email "Désolé de vous voir partir. Si vous avez 30 sec, dites-nous pourquoi en répondant à cet email — ça nous aide énormément à itérer." + HotlineCTA context=`email_post_cancel`.
  - **Note** : Phase 4 livre déjà l'in-app banner J-5 (P4-13b) + emails Stripe natifs (trial ending J-7, facture, CB expiration). Phase 6 ajoute la couche relationnelle custom.

- [ ] **P6-02 — Affinements onboarding step 4 + Stripe Checkout après les 10 premières conversions** — *Effort: 1j, Owner: MEHDI (ex-Billy)*
  - **Quoi** : itère sur la copy de `/onboarding/activate`, l'ordre des tiers, le wording du bouton "Saisir ma carte" en fonction du funnel PostHog observé en Phase 5. Si conversion `onboarding_activate_viewed → checkout_succeeded` < 60 %, A/B test (a) une variante copy "rassurance" qui insiste sur "€0 prélevés / annulable", (b) une variante avec sélecteur de tier par défaut sur Équipe au lieu de Solo (anchoring), (c) une variante avec témoignage pilote inline.

- [ ] **P6-03 — Page cas clients** — *Effort: 1j, Owner: MEHDI (ex-Billy) + PHARMA*
  - **Quoi** : `/cas-clients` avec 3–5 stories pilote ("Comment l'officine X économise 6 h/semaine grâce à PharmaWorkspace") + capture, citation, métriques.
  - **Fichiers** : `src/app/(marketing)/cas-clients/page.tsx`.

- [ ] **P6-04 — Communication d'ouverture publique** — *Effort: ½j, Owner: MEHDI*
  - **Note** : le funnel self-serve est déjà ouvert depuis Phase 4. P6-04 = annonce publique (LinkedIn, newsletter, posts groupes pharmaciens, mention "bêta privée → public") sans changement code (le CTA "Démarrer un essai gratuit 30 jours" est déjà en place).

- [ ] **P6-05 — Préparation salon PharmagoraPlus** — *Effort: 5j, Owner: DEV + PHARMA*
  - **Quoi** : stand mini ou présence partenaire ; goodies (stickers); 200 flyers ; démo live sur tablette ; un QR code Calendly pour rdv post-salon.

- [ ] **P6-06 — Décision recrutement post-bêta** — *Effort: décisionnel*
  - **Quoi** : si traction confirmée (≥ 10 officines payantes, NPS ≥ 40), tu peux ouvrir un poste **Customer Success Manager** (3 j/semaine, ~30 k€/an), ou alternativement un **commercial / SDR** (Sales Development Representative — commercial chargé de la prospection et qualification, pas du closing) pour ouvrir un 2ᵉ canal d'acquisition.

### Gate de sortie Phase 6
- [ ] ≥ 5 conversions payantes sur les 10 pilotes.
- [ ] **MRR** (Monthly Recurring Revenue — revenu mensuel récurrent) ≥ 400 € (5 × 79 € en tier Équipe).
- [ ] Inscription publique ouverte avec essai 30 j.
- [ ] Salon PharmagoraPlus préparé.

---

## 9. KPIs à instrumenter et tracker

### Pendant la bêta (Phase 5)
- **Activation** : % d'inscrits qui complètent l'onboarding (création pharmacie + 1ʳᵉ action métier). **Cible** : > 70 %.
- **Time-to-first-action** : médiane signup → 1ʳᵉ action. **Cible** : < 30 min.
- **% équipe active par officine** à S+2 et S+4. **Cible** : > 50 % à S+2, > 70 % à S+4.
- **DAU/MAU global** (Daily / Monthly Active Users — ratio engagement). **Cible** : > 30 %.
- **Modules adoptés par officine** (sur 8 modules). **Cible** : ≥ 4 modules pour 70 % des pilotes.
- **NPS** à J+30. **Cible** : ≥ 30.
- **Rétention W1/W4/W12** par cohorte. **Cible** : W4 > 60 %.

### Post-bêta (Phase 6)
- **Conversion bêta → payant**. **Cible** : ≥ 50 %.
- **MRR / ARR** (Annual Recurring Revenue — MRR × 12).
- **CAC** (Customer Acquisition Cost — coût d'acquisition d'un client). **Cible** : < 200 € la première année (canal ABM warm).
- **LTV** (Lifetime Value — revenu cumulé prévisionnel d'un client). **Cible** : ratio LTV/CAC > 3 d'ici 12 mois.

### Tech opérationnel
- **p95 latence OCR** (95ᵉ percentile — la valeur sous laquelle se trouvent 95 % des requêtes). **Cible** : < 8 s.
- **Taux d'erreur OCR** (% items corrigés manuellement). **Cible** : < 15 %.
- **Sentry error rate** par release. **Cible** : 0 erreur critique > 1 occurrence.

---

## 10. Risques majeurs et plans de contingence

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Décision HDS défavorable de l'avocat | Moyenne | Élevé | Voie hybride Scaleway/OVH HDS pour les ordonnances seules (+ 50–100 €/mois) |
| Adoption titulaire-only (pas l'équipe) | Élevée | Élevé | KPI explicite "% équipe active" + intervention CSM à S+2 si < 50 % |
| Coût OpenAI explose (10 officines × 100 OCR/j) | Moyenne | Moyen | Dédup SHA-256 + monitoring + bascule Mistral Pixtral EU ou Ollama self-host au-delà de 500 €/mois |
| Un LGO sort un module équipe concurrent | Faible | Élevé | Vélocité + partenariats groupements pour lock-in |
| Bug critique en bêta (perte de données) | Faible | Critique | Backups Supabase quotidiens + Sentry + canal Slack pilotes réactif < 48 h |
| PHARMA partenaire désengagé | Faible | Élevé | Formaliser contrat de partenariat avec equity ou commission par officine signée |
| Pas de conversion à la sortie bêta | Moyenne | Critique | Demander engagement non-juridique mensuel "vous resterez en payant" dès J+30 ; ajuster pricing si NPS bon mais conversion bof |

---

## 11. Budget consolidé — Voie DIY (actée 23/05/2026)

Décision : 0 € de cash externe pour atteindre la bêta. Seul investissement = le temps de Mehdi + Claude Max.

| Poste | Coût | Note |
|---|---|---|
| DPO interne | 0 € | Auto-désignation Mehdi via formulaire CNIL gratuit |
| Conformité juridique (politique, DPA, registre, runbook) | 0 € | Templates gratuits CNIL + CEPD |
| Sentry / PostHog / Upstash / Mistral / Vercel / Supabase | 0 € | Plans gratuits suffisants pour bêta ≤ 30 officines |
| Stripe | 0 € | Pas de frais fixe ; commission seulement sur transactions (3% + 0,25€) |
| Calendly / Loom / Notion | 0 € | Free tiers suffisants |
| Signature DPA | 0 € | PandaDoc free (3 docs/mois) ou contre-signature manuelle scannée |
| Surcoût HDS (optionnel, voie hybride Scaleway) | 50–100 €/mois | **Seulement si** voie hybride retenue ; pour l'instant voie A = 0 € |
| Stand PharmagoraPlus | 0 € pour visite libre | À reconsidérer mars 2027 selon traction |
| **Total externe avant 1er payant** | **0 €** | — |

L'audit initial (collaborateur) chiffrait 45-80 k$. La différence : pas de cabinet avocat externe (templates publics gratuits), pas de DPO mutualisé (auto-désignation), pas de migration HDS (provider OCR EU Mistral via P1-04 résout la partie transfert, stockage Supabase Paris toléré en bêta privée avec DPA explicite).

Une fois la bêta payante lancée et que les premiers revenus arrivent, on pourra investir dans : (a) cabinet avocat santé pour relire le DPA (5-8 k€ post-traction), (b) DPO externe mutualisé si grande échelle (>30 officines), (c) certification HDS si croissance le justifie.

---

## 12. Annexes

### A. Rôles et responsabilités (mis à jour 29/05/2026 — 2 rôles actifs, ex-Billy repris par Mehdi)

| Rôle | Qui | % temps | Mission principale |
|---|---|---|---|
| Founder / CEO / CSM / DPO interne + ex-Frontend commercial | Mehdi | 100 % | Stratégie, commercial, juridique, architecture funnel, reviews PR, kickoff pilotes ; **+ depuis le 28/05/2026, scope ex-Billy** : landing, paywall Stripe, onboarding funnel, PostHog instrumentation client |
| Dev backend / hardening | Dim (DimiTechSys) | plein temps | Backend, queries, DB, migrations, hardening, audit log, search, pagination |
| Partenaire pharmacien | PHARMA | 20-30 % | Pipeline pilotes, intro réseau, expertise métier |

> 📝 **Historique** : le rôle "Dev frontend / commercial — BillyGoat001 (Saytex1)" a existé du 25/05/2026 au 28/05/2026. Indisponibilité du collaborateur → scope repris en solo par Mehdi. PRs déjà mergées par Billy avant la reprise : P4-01, P4-02 (skeleton), P4-05, P4-06, P4-14. Voir `TODO_DEV2.md` (archivé) pour l'historique.

### B. Liste consolidée des décisions structurantes à prendre

1. **Voie HDS** (P3-07) — pragmatique vs hybride. Date limite : **S6**.
2. **Modèle financier 12 mois** — bootstrap rentable vs seed VC. Impact pricing/recrutement. Date limite : **S8**.
3. **Pricing finalisé** (P4-03) — confirmer 39/79/129 € HT après benchmarking. Date limite : **S5**.
4. **Recrutement CSM/SDR** (P6-06) — go/no-go basé sur traction bêta. Date limite : **S14**.
5. **Statut juridique cible** — SAS recommandée. Date limite : **S10** (impacte signature DPA, facturation Stripe).

### C. Conventions documentaires

- Tickets référencés `P{phase}-{numéro}` (ex. P1-04).
- Migrations Supabase : numérotation continue à partir de `0026`.
- Branches Git : `feat/p1-04-switch-ocr-mistral`, `fix/p2-07-rls-initplan`. Toutes les PR ciblent `develop` ; Mehdi seul promeut `develop` → `main`.
- Documents juridiques : dans `/legal/` à la racine du dépôt, gitignored si signés.

### D. Sources

- `BUSINESS_CONTEXT.md` (cadrage business)
- `CLAUDE.md` (cadrage technique)
- `form.txt` (positionnement et willingness-to-pay)
- Audit scalabilité & RGPD du 18 mai 2026 (corrigé après vérification code)
- Code source `pharmaworkspace/` à date du 18 mai 2026
