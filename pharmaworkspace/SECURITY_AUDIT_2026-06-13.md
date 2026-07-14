# Audit sécurité & cohérence structurelle — 2026-06-13

Plateforme : pharmaworkspace (Next.js 16 App Router + Supabase, SaaS multi-tenant pharmacies).
Méthode : audit multi-agents sur 8 dimensions (IDOR/multi-tenant, auth/session, RLS, Stripe, RGPD,
validation d'entrées, secrets/config, cohérence structurelle), puis **vérification adversariale de
chaque finding** (réfutation par relecture du code réel + des couches de protection).

Résultat : 45 findings bruts → **23 confirmés uniques** (après dédup) · 16 réfutés (faux positifs).
Répartition confirmée : **1 critique · 4 hauts · 6 moyens · 9 bas · 3 info**.

> ⚠️ Racine commune des plus graves : les colonnes qui définissent l'**isolation tenant**
> (`profiles.pharmacy_id`, `profiles.role`) et la **facturation** (`pharmacies.subscription_*`)
> vivent dans des tables que l'utilisateur peut **écrire lui-même via RLS**, sans trigger ni
> protection au niveau colonne. Le client navigateur utilise l'anon key + JWT et atteint
> directement l'API REST Supabase — le gating UI/middleware ne protège pas la base.

---

## 🔴 CRITIQUE

### C1 — Auto-octroi d'abonnement : un titulaire se donne le tier illimité sans payer (bypass total de Stripe)
- **Fichier** : `supabase.sql:1895` (policy `pharmacies_update_titulaire`), colonnes `supabase.sql:672-688`, `src/lib/supabase/client.ts:4-9`
- **Problème** : la policy autorise tout titulaire à `UPDATE` sa ligne `pharmacies` avec pour seule contrainte `id = get_pharmacy_id()` + rôle titulaire. **Aucune restriction de colonne, aucun trigger** ne protège `subscription_status`, `subscription_tier`, `subscription_billing`, `trial_end`, `current_period_end`. Les seuls garde-fous sont les CHECK d'enum, qui n'empêchent rien.
- **Exploitation** : depuis la console navigateur, avec l'anon key publique + son JWT :
  ```js
  supabase.from('pharmacies').update({
    subscription_status:'active', subscription_tier:'go',
    trial_end:'2099-01-01', current_period_end:'2099-01-01'
  }).eq('id', monPharmacyId)
  ```
  Le rôle titulaire est le rôle **par défaut au self-onboarding** → n'importe quel client peut le faire.
- **Impact** : accès produit à vie sans payer + tier `go` = **utilisateurs illimités** (`TIER_LIMITS.go = Infinity`, enforce dans `/api/invitations/create-native` qui lit `subscription_tier` en DB). Contournement complet de la facturation + escalade de quota.
- **Correctif** : retirer les colonnes d'abonnement de la portée d'écriture client — trigger `BEFORE UPDATE` qui `RAISE` si une colonne `subscription_*`/`trial_end`/`current_period_end`/`stripe_*` change et que `auth.role() <> 'service_role'` ; **ou** déplacer ces colonnes dans une table écrite uniquement par le webhook (service_role), SELECT-only pour les membres.

---

## 🟠 HAUT

### H1 — `invitations_select USING (true)` : lecture cross-tenant de toutes les invitations
- **Fichier** : `supabase.sql:1798` (policy) · colonnes table `575-585` · grants `2246-2248`
- **Problème** : `CREATE POLICY "invitations_select" ON public.invitations FOR SELECT USING (true)`. La table contient `email`, `pharmacy_id`, `role` et `token` (UUID **en clair**, drop prévu par 0036 jamais effectué). `insert/update/delete` sont correctement scopés titulaire, mais le SELECT casse l'isolation. Le filtre applicatif `getPendingInvitations()` (`lib/queries/admin.ts:112`) est **cosmétique** : la RLS est la frontière, et elle est ouverte.
- **Exploitation** : tout utilisateur authentifié de n'importe quelle officine : `supabase.from('invitations').select('*')` → énumère emails + pharmacy_id + role + token de **toute la plateforme**.
- **Impact** : fuite PII cross-tenant massive + cartographie de tous les clients (breach RGPD). La réutilisation du token volé est bornée par le check `invite.email !== user.email → 403` dans `/api/invite/complete`, mais la **fuite des données reste intacte**.
- **Correctif** : `USING (pharmacy_id = (SELECT public.get_pharmacy_id()) AND (SELECT public.get_user_role()) = 'titulaire')` (aligné sur insert/update/delete). Le flux d'acceptation passe déjà par le service client serveur → aucune lecture client de cette table n'est nécessaire. Dropper la colonne `token` clair.

### H2 — Auto-escalade de privilège + réécriture du tenant via UPDATE de son propre profil
- **Fichier** : `supabase.sql:1966` (policy `profiles_update_self_or_titulaire`), fonctions `315-333`
- **Problème** : la policy autorise l'`UPDATE` quand `id = auth.uid()` **sans restreindre les colonnes**. L'utilisateur peut donc modifier sa propre ligne `profiles` y compris `role` **et** `pharmacy_id`. Or `get_pharmacy_id()`/`get_user_role()` (qui scopent TOUTES les policies métier) lisent justement ces colonnes. Aucun trigger de garde.
- **Exploitation** :
  ```js
  // escalade intra-tenant
  supabase.from('profiles').update({ role:'titulaire' }).eq('id', user.id)
  // pivot cross-tenant
  supabase.from('profiles').update({ pharmacy_id:'<UUID victime>', role:'titulaire' }).eq('id', user.id)
  ```
  Chemin applicatif direct : `updateMemberRole()` (`lib/queries/admin.ts:78`) utilise le client anon RLS-bound.
- **Impact** : (1) tout membre bas-privilège devient titulaire de son officine (contrôle admin complet : invitations, erase RGPD de collègues, facturation, audit_log) ; (2) en réécrivant `pharmacy_id`, **escalade cross-tenant complète** → lecture/écriture sur les données (ordonnances, RH, chat) d'une officine cible. Le gating `proxy.ts:206` est purement UI.
- **Correctif** : trigger `BEFORE UPDATE` qui rejette toute modif de `pharmacy_id`/`role` par un non-service-role ; rattachement à une officine et changement de rôle réservés aux routes service-role (invite/complete, create-pharmacy) ou à une RPC `SECURITY DEFINER set_member_role` gardée titulaire. Faire passer `updateMemberRole`/`deactivateMember` par une route serveur qui vérifie le rôle.

### H3 — `pharmacies_select_onboarding` : tout compte sans officine lit TOUTES les pharmacies
- **Fichier** : `supabase.sql:1885-1891`
- **Problème** : deux policies SELECT coexistent sur `pharmacies` (combinées en OR). `pharmacies_select_onboarding` s'évalue à `true` pour **chaque ligne** dès que le profil n'a pas encore de `pharmacy_id` (`NOT EXISTS (...)`). Trivialement atteint : créer un compte OTP et ne pas finir l'onboarding.
- **Impact** : fuite cross-tenant de tout le référentiel officines — `name`, `finess`, `address`, `address_latitude/longitude` (géoloc geofencing), `stripe_customer_id`, `stripe_subscription_id`, `subscription_tier/status`, `trial_end`. Énumération du parc clients + état de facturation.
- **Correctif** : limiter la branche onboarding à `id = get_pharmacy_id()` (le besoin de lire d'autres pharmacies pendant l'onboarding n'existe pas), faire l'INSERT/lien via la RPC `create_pharmacy_onboarding` (service_role) déjà présente. À défaut, exposer une vue restreinte `(id, name)`.

### H4 — `/api/auth/callback` écrit `pharmacy_id`/`role` depuis `user_metadata` sans revalider l'invitation
- **Fichier** : `src/app/api/auth/callback/route.ts:20-67`
- **Problème** : deux chemins de rattachement post-auth **divergents**. `/api/invite/complete` revalide l'invitation (hash token, email == session, expires_at, accepted_at) avant d'écrire. `/api/auth/callback` fait confiance directement à `user.user_metadata.{pharmacy_id, role, invitation_token}` et met à jour le profil (y compris `role:'titulaire'`) **sans vérifier que l'invitation existe/est valide/correspond à l'email**. Seule garde : `if (user && invitationToken && pharmacyId && role)`.
- **Impact** : si `user_metadata` est influençable (flux antérieur, lien forgé), un compte se rattache à une officine arbitraire en titulaire sans invitation valide — la validation rigoureuse de `invite/complete` est contournée par ce second chemin (combiné à H2 qui rend l'auto-update possible).
- **Correctif** : helper unique `applyInvitationToProfile()` qui valide TOUJOURS l'invitation (hash + email + non expirée + non acceptée) avant tout write, appelé depuis les deux flux. Ne jamais dériver `role` depuis `user_metadata` sans contrôle serveur.

---

## 🟡 MOYEN

### M1 — Policies basées sur `auth.jwt() ->> 'role'` : claim inexistant → branches mortes qui cassent planning/congés/chat
- **Fichier** : `supabase.sql:1735` (chat_messages_update), `1817` (leave_requests_update), `2086` (weekly_schedules_mutate) ; sources `migrations/0053`, `0054`
- **Problème** : ces policies testent `auth.jwt() ->> 'role' = 'titulaire'`. Mais le claim top-level `role` d'un JWT Supabase vaut **toujours** `authenticated` ; le rôle métier est dans `app_metadata.pharmacy_role` (hook `custom_access_token_hook`, 0039). Branches **toujours fausses**.
- **Impact** : pas une ouverture (plus restrictif), mais **fonctionnalités cassées via RLS** : (1) `weekly_schedules` inécrivable par tous ; (2) validation/refus de congé titulaire silencieusement bloquée au niveau DB ; (3) modération chat titulaire inopérante. Et **fausse garantie** d'autorisation : un correctif naïf pourrait élargir à tort.
- **Correctif** : remplacer par `(SELECT public.get_user_role()) = 'titulaire'` (homogène avec le reste du schéma) dans les 3 policies + test de non-régression écriture planning / validation congé.

### M2 — Open redirect via le paramètre `next` non validé après authentification
- **Fichier** : `src/app/(marketing)/verify/page.tsx:26,151` ; `src/app/(auth)/auth/callback/page.tsx:19,99` ; `src/app/api/auth/callback/route.ts:9,80`
- **Problème** : `next` est lu brut (`searchParams.get("next")`) et utilisé tel quel en navigation (`router.push(next)` / `${origin}${next}`) — aucune vérification de chemin relatif.
- **Impact** : `https://app/login?next=https://evil.tld` → après OTP réussi, la victime (en confiance, fraîchement authentifiée) est redirigée vers le site attaquant. Vecteur de phishing/exfil. (`emailRedirectTo` du magic link reste figé, donc c'est de la navigation cliente post-auth.)
- **Correctif** : `const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'` dans un helper réutilisable, appliqué dans les 3 emplacements (la route GET doit aussi rejeter `//` et tout schéma).

### M3 — `notifications_insert` : ciblage arbitraire d'un `user_id` du tenant (spoof in-tenant)
- **Fichier** : `supabase.sql:1828`
- **Problème** : le WITH CHECK contraint `pharmacy_id = get_pharmacy_id()` mais **pas** `user_id` (destinataire). Tout membre peut insérer une notification (avec `metadata.target_url` cliquable) pour n'importe quel collègue.
- **Impact** : phishing interne — un bas-privilège forge des notifications « légitimes » vers le titulaire avec une URL contrôlée. Intra-tenant uniquement.
- **Correctif** : réserver l'INSERT au service/triggers `SECURITY DEFINER` (déjà le cas pour `create_overdue_notifications`/`notify_rental_event`), ou ajouter au WITH CHECK `EXISTS (profiles p WHERE p.id = user_id AND p.pharmacy_id = get_pharmacy_id())` + restreindre les `type` insérables client.

### M4 — Le changement de prix via Customer Portal ne met pas à jour `subscription_tier`
- **Fichier** : `src/app/api/stripe/webhook/route.ts:147-181`
- **Problème** : `handleSubscriptionUpdated` ne synchronise que `subscription_status`/`trial_end`/`current_period_end`. Le tier vient exclusivement de `metadata.tier` posée au checkout (`apply-checkout-session.ts:49,63`), jamais redérivé du `price_id` réel. Après un price-switch dans le portail (`customer.subscription.updated`), la metadata reste figée.
- **Impact** : un titulaire `go` (illimité) bascule vers `po` (le moins cher) dans le portail : il **paie `po` mais garde le quota `go`** en DB. Escalade de quota durable à coût réduit.
- **Correctif** : dans `handleSubscriptionUpdated`, lire `subscription.items.data[0].price.id`, le mapper vers `(tier,billing)` via une table inverse de `price-ids.ts`, écrire `subscription_tier`/`subscription_billing` à chaque update. Ne jamais traiter `metadata.tier` comme source de vérité du quota.

### M5 — Effacement RGPD incomplet : PII résiduelle réidentifiante
- **Fichier** : `src/app/api/legal/erase/route.ts:109-137`
- **Problème** : l'erase n'anonymise que `profiles` (noms/avatar) + l'email auth. Restent en clair, corrélables via `profile.id` intact : `pharmacy_acquisition` (email + `ip_address` + `user_agent` + UTM, sans `user_id` donc inatteignable), `invitations.email`, `work_sessions.clockin_latitude/longitude` (géoloc précise), `feedback.content`+`page_url`, `chat_messages.body`, `prescription_comments`, `contacts`, et `audit_log` (`user_id`+`ip_address`+`user_agent`).
- **Impact** : la personne reste réidentifiable après exercice du droit à l'effacement (art. 17 RGPD) — risque CNIL, l'« anonymisation contrôlée » annoncée est inexacte.
- **Correctif** : étendre l'erase à toutes ces tables (matcher `pharmacy_acquisition`/`invitations` par email ; nuller géoloc `work_sessions` ; anonymiser `feedback`/`chat_messages`/`prescription_comments` ; nuller `ip_address`/`user_agent` dans `audit_log`). Documenter la liste couverte.

### M6 — `/api/signup/start` non authentifié, sans rate limit : email-bomb + coût `listUsers`
- **Fichier** : `src/app/api/signup/start/route.ts:30-145`
- **Problème** : route publique (`proxy.ts:49`), aucun rate limit. Chaque POST : `admin.auth.admin.listUsers({perPage:200})` (service role, O(n)), insert `pharmacy_acquisition`, `signInWithOtp()` (email réel). Seule validation : zod format.
- **Impact** : email-bombing de n'importe quelle adresse (grillage du quota d'envoi + réputation expéditeur), coût/charge serveur par appel, pollution table. DoS applicatif scriptable.
- **Correctif** : Ratelimit Upstash (par IP **et** email cible, ex. `slidingWindow(3,'10 m')`) avant tout appel admin/OTP ; remplacer `listUsers({perPage:200})` par une requête ciblée (`getUserByEmail`).

---

## 🟢 BAS

- **L1** — `tasks_update`/`contacts_update`/`rentals_update`/`prescriptions_update` (`supabase.sql:2060,1765,2000,1951`) : UPDATE ouvert à tout membre sans contrôle de rôle, **incohérent avec les DELETE** correspondants. Altération de données métier par bas-privilège. → aligner la matrice droits UPDATE sur DELETE.
- **L2** — `GRANT ALL TO anon/authenticated` sur toutes les tables (`supabase.sql:2204-2369`) : RLS = unique rempart, sans filet. Une policy permissive (cf. H1) devient directement un accès complet. → réduire les grants au strict nécessaire par table.
- **L3** — Email utilisateur en clair vers PostHog (`src/app/(marketing)/verify/page.tsx:102-103`) : PII vers sous-traitant, viole la minimisation (art. 5.1.c). → n'envoyer que `user.id` au distinctId, jamais l'email en propriété d'event.
- **L4** — Aucun rate limit sur `/api/legal/export` et `/api/legal/erase` (`export/route.ts:19-71`) : amplification de charge DB. → `slidingWindow(5,'1 h')` keyé `user.id`.
- **L5** — Consentement cookies sans versionnage (`src/lib/consent/cookie-consent.ts:38-49`) : impossible de re-solliciter après évolution CNIL. → encoder une version dans le cookie (modèle du hash légal click-wrap).
- **L6** — OCR sans validation serveur de taille/MIME (`src/app/api/ocr/route.ts:281-303`) : DoS mémoire (jusqu'à 10 req/min), contenu non-image passé aux fournisseurs. → rejeter `size > 8 Mo` + allowlist MIME via magic-number avant `arrayBuffer()`.
- **L7** — Énumération de comptes via 409 `email_exists` sur `/api/signup/start:70-79` : teste quels emails sont clients. → réponse uniforme + rate limit (couplé M6).
- **L8** — Header `Strict-Transport-Security` absent (`next.config.ts:6-44`) : risque SSL-stripping. → `max-age=63072000; includeSubDomains; preload`.
- **L9** — `error.message` Postgres brut renvoyé au client dans certaines routes (`invite/complete:91,117,167,187,201`, onboarding, planning, invitations) alors que signup/stripe/legal masquent : fingerprinting du schéma. → helper d'erreur standard (log brut serveur, code stable client).

---

## ⚪ INFO

- **I1** — `establishSessionFromCallbackUrl` accepte `access_token`/`refresh_token` bruts depuis l'URL (`src/lib/auth/establish-session-from-callback-url.ts:66-72`) : login-CSRF / session-fixation théorique. → privilégier PKCE (code) côté serveur ; nettoyer le hash (déjà partiellement fait).
- **I2** — `planning/leave-requests` : champs texte libres (`reason`, `review_note`) non bornés, parsés sans zod (`route.ts:29,65-77`). → zod avec `.max(500)` + bornes dates/enums.
- **I3** — Route de debug `/api/sentry-example-api` exposée en prod (`route.ts:11-18`) : bruit/coût Sentry. → supprimer la route + la page `/sentry-example-page` avant mise en prod.

---

## Faux positifs écartés (16) — pour mémoire

Vérifiés puis **réfutés** par relecture du code et des couches de protection : `confirm-checkout` (cible d'écriture re-dérivée de la metadata, pas exploitable) ×2 ; middleware `/api/*` (auto-déclaré info, pas de vuln) ; `feedback` sur-restreinte (durcissement, pas leak) ; `stripe_webhook_log`/`pharmacy_acquisition` RLS sans policy (service-role only, intentionnel) ; idempotence webhook (couche de rattrapage existe) ; export RGPD « données patients » (données de l'officine de l'user, légitimes) ; `loadPolicy` path-traversal (slug non influençable) ; `audit_log` (constat positif : tamper-proof + cloisonné) ; injection PostgREST ruptures ANSM (ilike paramétré, pas d'impact) ; liens markdown chat (react-markdown v10 sanitize par défaut, prémisse fausse) ; `erase` targetUserId non-UUID (pas d'impact atteignable) ; OCR provider doc/code (bénin) ; CSP `unsafe-inline`/`unsafe-eval` (pas de chemin d'exploitation concret) ; secrets `.env*` (réels mais correctement gitignorés, hors historique git) ; helper auth dupliqué dans 6 routes (dette, pas de vuln actuelle).

> Note `.env.local` : les secrets sont **réels et vivants** (la `SUPABASE_SERVICE_ROLE_KEY` staging décode en un JWT service_role valide jusqu'en 2036) mais correctement gitignorés et hors historique git. À ne jamais committer ; rotation recommandée si le poste a été partagé.

---

## Plan de remédiation suggéré (par ordre)

1. **Bloquant pilote** : C1 (billing bypass), H1 (invitations leak), H2 (escalade/pivot tenant), H3 (leak pharmacies), H4 (callback). Tous corrigeables par migrations RLS + triggers + 1 refactor de route. → une migration `0056_rls_hardening.sql` couvre C1/H1/H2/H3/M1/M3/L1.
2. **Avant ouverture** : M4 (tier portal), M5 (erase RGPD), M6 (rate limit signup), M2 (open redirect).
3. **Durcissement** : L2–L9, I1–I3.

---

# Round 2 — Revue des angles morts (méta-audit)

Le 1er audit (8 dimensions) n'avait **pas** examiné : Supabase **Storage**, **Realtime**, les **dépendances** (`npm audit`), le **Sentry/logging serveur**, ni les **fonctions `SECURITY DEFINER`** elles-mêmes — alors que le Storage était explicitement dans le scope du prompt RLS. Cette seconde passe (7 angles, même vérification adversariale + `npm audit` réel) comble ces trous. Résultat : 18 bruts → **9 confirmés** (1 haut, 3 moyens, 5 bas) + plusieurs cas « atténués / à vérifier en prod ».

## 🟠 HAUT

### G1 — Sentry exfiltre des données de santé + le JWT de session (PHI/PII non scrubés)
- **Fichier** : `src/lib/sentry/before-send.ts:4-8` (+ `sentry.server.config.ts`)
- **Problème** : `beforeSend` ne supprime que `event.request.cookies` et `event.user.email`. Or `@sentry/nextjs` v10.53.1 capture par défaut, **indépendamment de `sendDefaultPii:false`** : le **body** de requête (`requestData`/`httpServer`, jusqu'à 10 Ko), les **headers** dont `cookie` (= JWT Supabase `sb-…-auth-token`), et les **breadcrumbs** `console.*`. Sur toute exception non gérée d'une route Node (ex. `POST /api/planning/leave-requests` dont le body contient `reason`, un motif de congé pouvant révéler une donnée de santé ; ou le contenu d'ordonnance OCRisé), tout part vers Sentry.
- **Impact** : fuite de PHI/PII (santé) vers un processeur probablement **hors HDS / US** = manquement RGPD/HDS, **et** vol de session possible via le `cookie`/JWT capturé.
- **Correctif** : `Sentry.requestDataIntegration({include:{data:false,cookies:false,headers:false}})` + `Sentry.httpIntegration({maxIncomingRequestBodySize:'none'})` ; renforcer `beforeSend` (supprimer `event.request.data` et `event.request.headers`) ; valider l'engagement HDS de Sentry au DPA. (cf. G8 : retirer/limiter `consoleIntegration`.)

## 🟡 MOYEN

### G2 — Next.js 16.2.1 : cluster de CVE dont bypass de middleware (l'auth est dans `proxy.ts`)
- **Fichier** : `package.json` → `next@16.2.1`
- **Problème** : `npm audit` classe `next` **high**, range couvrant 16.2.1, `fixAvailable: 16.2.9` (non-major). Le cluster inclut 4 advisories de **bypass middleware/proxy** (GHSA-26hh-7cqf-hhc6, GHSA-492v-c6pp-mqqv, GHSA-267c-6grr-h53f, GHSA-36qx-fr4f-26g5), une **SSRF via WebSocket** (GHSA-c4j6-fc7j-m34r) et des DoS. L'auth + le routing par rôle de l'app vivent dans `src/proxy.ts` (middleware) → un bypass est de classe critique.
- **Correctif** : bump `next@16.2.9` ; ajouter `npm audit --audit-level=high` en CI ; ne jamais faire reposer l'autorisation sur le seul middleware (revérifier `pharmacy_id`/rôle côté route — recoupe le constat structurel du round 1).

### G3 — `notifications` : RLS SELECT scopée `pharmacy_id` mais pas `user_id` (fuite intra-officine)
- **Fichier** : `supabase.sql:1832`
- **Problème** : `notifications_select` ne filtre que `pharmacy_id = get_pharmacy_id()`, alors que DELETE (1824) et UPDATE (1836) exigent `user_id = auth.uid()`. Le filtrage par destinataire n'est que **côté client** (`queries/notifications.ts:12`, filtre Realtime `use-notifications.ts:106`). Tout membre peut lire en REST direct les notifications de ses collègues.
- **Impact** : fuite intra-tenant de notifications RH sensibles (handover, assignations). Pas de franchissement cross-tenant.
- **Correctif** : `USING (user_id = auth.uid() AND pharmacy_id = get_pharmacy_id())` — aligner sur update/delete. (à inclure dans `0056`.)

### G4 — Fraude au pointage : `clockin_accuracy_m` (client, non borné) annule le geofence serveur
- **Fichier** : `supabase.sql:287` (trigger `enforce_clockin_geofence`) ; `src/lib/queries/sessions.ts:150-156`
- **Problème** : le contrôle serveur existe (`BEFORE INSERT/UPDATE`) mais teste `(dist - COALESCE(clockin_accuracy_m,0)) > radius`. La colonne `clockin_accuracy_m` (`numeric`, **aucun CHECK**, `supabase.sql:1006`) est fournie par le navigateur et insérée via le client anon. Un employé frappe l'API REST avec `clockin_latitude/longitude` arbitraires + `clockin_accuracy_m=999999999` → le terme devient négatif, la condition est toujours fausse, badgeage accepté quelle que soit la distance.
- **Impact** : pointage frauduleux (présence physique non garantie) → intégrité des heures travaillées (RH/paie) compromise. Note : toute géoloc navigateur est intrinsèquement falsifiable.
- **Correctif** : `CHECK (clockin_accuracy_m BETWEEN 0 AND 100)` + plafonner la tolérance dans le trigger. Documenter le geofence comme **dissuasif**, pas comme contrôle dur ; pour une vraie preuve de présence, exiger une source non rejouable (réseau officine, badge).

## 🟢 BAS

- **G5** — `create_overdue_notifications()` (`supabase.sql:2144`) : RPC **`SECURITY DEFINER`** (bypass RLS), **sans aucune garde caller**, mais `GRANT EXECUTE` à **anon + authenticated** alors que c'est un job `pg_cron`. Tout client peut l'invoquer via `supabase.rpc(...)` ; elle parcourt tasks/rentals/profiles **tous tenants**. Effet borné (idempotence interne, `RETURNS void`) mais exécution non autorisée d'une fonction privilégiée. → `REVOKE … FROM PUBLIC, anon, authenticated;` (pattern déjà appliqué à `custom_access_token_hook` en 0039). Auditer toutes les RPC cron-only.
- **G6** — Pas de **machine à états** sur `prescriptions`/`orders`/`rentals` (`queries/*.ts` + policies `1874/1951/2000`) : un membre peut, en REST direct, sauter/inverser un statut (`order draft→received`, `rental returned→active`, `prescription served→to_serve`). Les gardes applicatifs ne dérivent que des dates. Intégrité métier/KPI intra-tenant. → trigger `BEFORE UPDATE` de transitions valides (sur le modèle `VALID_TRANSITIONS` des congés).
- **G7** — **Race TOCTOU** sur le quota de sièges (`/api/invitations/create-native:134-159`) : `canInviteMore` (count) puis insert, sans verrou → 2 invites parallèles dépassent la limite du tier. Impact financier marginal et auto-infligé. → `pg_advisory_xact_lock(hash(pharmacy_id))` ou contrainte DB.
- **G8** — Sentry `consoleIntegration` (défaut) transforme `console.*` serveur en breadcrumbs non scrubés (`sentry.server.config.ts:8-13`). Bénin aujourd'hui (logs disciplinés) mais ouvert pour tout futur `console.error(objet)`. → `consoleIntegration({levels:['error']})` ou retrait.
- **G9** — Aucun rate-limit applicatif sur la **demande/renvoi d'OTP** (`login/page.tsx:32` avec `shouldCreateUser:true`, `verify/page.tsx:158`) : abus d'envoi d'emails + création de comptes Auth fantômes. GoTrue throttle l'essentiel, d'où low. → router via une route serveur Upstash (3/15 min) + `shouldCreateUser:false` au login. Complète M6/L7 du round 1.

## ✔️ Angles vérifiés — SAINS ou atténués (le bon à savoir)

- **Storage tenant-isolation : SAIN.** État final des migrations (0010→0038) : les 3 buckets finissent **privés**, policies `storage.objects` scopées `split_part(name,'/',1) = pharmacy_id` **serveur** (pas la valeur client), lecture 100 % via `createSignedUrl` (zéro `getPublicUrl`). Pas de fuite cross-tenant des ordonnances. **⚠️ Action prod requise** : la migration de réparation `0034` crée le bucket `prescriptions` en `ON CONFLICT DO NOTHING` → **elle ne ré-affirme jamais le flag `public=false`**. Si le bucket avait été créé public au Dashboard, il le reste. **À vérifier en prod** : `SELECT id, public FROM storage.buckets;` doit montrer `public=false` partout. (Défaut Dashboard = privé, donc probablement OK, mais non observable depuis le repo.)
- **Realtime : SAIN cross-tenant.** Canaux RLS-gated, SELECT scopée `pharmacy_id` ; le seul résidu est G3 (intra-tenant `user_id`).
- **`get_user_role()` sans `SET search_path`** (incohérent avec `get_pharmacy_id()` durci en 0018) : dette de durcissement réelle mais **non exploitable** (aucun `GRANT CREATE` sur `public` à anon/authenticated → pas de search_path hijacking). Fix trivial recommandé par cohérence.
- **CSRF** sur les routes mutantes : neutralisé par `SameSite=Lax` (cookie non envoyé sur POST cross-site) + `Content-Type: application/json` (preflight). Défense-en-profondeur seulement → ajouter un check `Origin` reste sain.
- **Brute-force vérification OTP** : neutralisé par le cap de tentatives par-token de GoTrue (hébergé). **Mais** la posture dépend de défauts hébergés non versionnés → ajouter un `supabase/config.toml` (config-as-code) pour figer `otp_length`/limites.
- **`/api/legal/export` en GET** : pas d'exfiltration cross-site (Lax + pas de CORS + `Content-Disposition: attachment`). Hygiène → passer en POST.
- **Dépendances transitives** (`express-rate-limit`/`hono` via `shadcn` CLI, `fast-uri` via build webpack) : non atteignables au runtime. Hygiène CI uniquement.
- **Lecture d'ordonnances par tous les rôles** (student/shelver inclus) : **choix métier explicite** (mêmes droits que préparateur), pas une faille — mais **décision de minimisation RGPD / secret pro à documenter**.
- **Auto-approbation de congé par le titulaire** : par conception (titulaire = unique autorité). Pas de faille.

> **Réponse à « a-t-il loupé des pistes ? »** : oui — 5 surfaces entières non explorées (Storage, Realtime, dépendances/CVE, Sentry serveur, fonctions SECURITY DEFINER). La plus grave nouvelle trouvaille est **G1 (Sentry fuite santé + JWT)**, à traiter avant pilote au même titre que C1/H1–H4. Le Storage, lui, est correctement isolé (sous réserve de vérifier le flag `public` du bucket `prescriptions` en prod).

---

# Round 3 — Vérification du rapport + angles restants (méta-méta-audit)

Objectif : (a) **vérifier l'exactitude** des findings existants (chasse aux hallucinations / mauvaises calibrations), (b) **re-examiner les faux positifs** écartés, (c) couvrir les **dernières surfaces** (12 routes service-role, OCR/LLM/SSRF, session client/XSS, cache Next.js). Même méthode adversariale.

## ✅ Verdict sur l'exactitude du rapport : FIABLE

Les findings graves ont été **revérifiés ligne à ligne contre le code réel** : **C1, H1, H2, H3, G1 sont exacts** (policies, numéros de ligne, extraits, chemins d'exploitation tous confirmés ; `TIER_LIMITS.go = +Infinity` confirmé ; aucun trigger garde sur `pharmacies` confirmé ; capture body+JWT de Sentry confirmée dans le bundle `@sentry/nextjs` 10.53.1). **Aucune hallucination, aucune policy inventée.** Corrections mineures de calibration seulement :
- **H4 légèrement sur-calibré** (HAUT → réel ~moyen) : l'exploitabilité standalone est **conditionnée à H2** (l'écriture passe par le client RLS `id=auth.uid()`). Le correctif proposé reste valable ; reformuler H4 comme « durcissement de cohérence », pas une voie d'escalade indépendante.
- **L'injection `.or()` ANSM** (faux positif round 1) : la justification « ilike paramétré » est **techniquement fausse** — l'input user est bien interpolé en chaîne (seules les virgules retirées, `drug-shortages.ts:53-56`). **Mais la conclusion « pas d'impact » tient** (table de référence ANSM publique, pas de PII, pas de scope tenant). Reformuler, et échapper l'input par hygiène.
- **CSP `unsafe-inline`/`unsafe-eval`** (faux positif round 1) : le raisonnement « pas de chemin d'exploitation » était **incomplet** (un seul sink markdown examiné). Mais après revue exhaustive, le vecteur candidat (`contact.website` rendu en `<a href>`, `annuaire/page.tsx:482`) est **non exploitable** car **React-DOM 19 `sanitizeURL()` neutralise `javascript:`** au rendu. → La conclusion « faux positif » **tient**, mais c'est bien la sanitisation React (pas l'absence de sink) qui protège. La CSP reste à durcir en defense-in-depth (cf. R3-7).
- **M1** : pas de contradiction interne réelle — la validation de congé titulaire passe par le client **cookie RLS** (`[id]/route.ts:80`), donc la fonctionnalité **est bien cassée** par la policy morte, comme le dit le rapport. Cohérent.

Les autres rejets (webhook idempotence, `pharmacy_acquisition`/`stripe_webhook_log` RLS sans policy = deny-all, storage privé, react-markdown) **tiennent après re-vérification**.

## 🟠 Nouvelles trouvailles (manquées par R1 **et** R2)

### R3-1 — PostHog `autocapture` exfiltre le texte écran (noms patients, médicaments) — HAUT, bloquant pilote
- **Fichier** : `src/instrumentation-client.ts:35-64`
- **Problème** : `posthog.init()` ne passe **jamais** `autocapture:false` ni `mask_all_text:true` au niveau racine. Le seul bloc de masquage (`maskAllInputs`, `maskTextSelector:'*'`) est **imbriqué sous `session_recording`** → il ne s'applique **qu'au** session-recording, **pas à l'autocapture**. Or `autocapture` (activé par défaut en posthog-js 1.376.2) capture `$el_text` = le **texte visible de l'élément cliqué** à chaque clic. Un clic sur une carte d'ordonnance (`prescription-drawer.tsx:189,311`), un nom de médicament, un contact ou un message chat envoie ce texte à PostHog. Le round 1 (L3) n'avait vu que l'email en property d'un event manuel — il a **totalement manqué** l'autocapture du contenu écran.
- **Impact** : fuite de PHI/PII (identifiants patients, médicaments, RH/chat) vers PostHog à **chaque interaction**, sans masquage. RGPD art. 9 + HDS. Même rang que L3/G1.
- **Correctif** : `autocapture:false` dans `posthog.init()` (le tracking produit passe déjà par des `capture()` manuels, cf. `lib/analytics/posthog.ts`). À défaut, forcer `mask_all_text:true` + `mask_all_element_attributes:true` au **niveau racine**. Vérifier en console PostHog que le session-recording n'est pas activé server-side.

### R3-2 — Ordonnances (données de santé) traitées par Mistral La Plateforme : posture HDS à cadrer (RGPD OK) — MOYEN
> **Recalibré le 2026-06-13 après vérification web.** RGPD ≠ HDS : Mistral est RGPD-compliant ; le point qui tient est la **certification HDS**, distincte.
- **Fichier** : `src/app/api/ocr/route.ts:196-221,291-314` ; `.env.local` (`OCR_PROVIDER=mistral`)
- **Problème** : la route OCR transmet l'**image complète de l'ordonnance** en base64 à Mistral (`callMistral()` → `api.mistral.ai`). Le provider réel est **Mistral** (`.env.local` : `OCR_PROVIDER=mistral`) ; le type `OcrProvider = 'ollama'|'claude'|'mistral'` n'a **aucune branche `openai`** → l'affirmation « OpenAI en prod » de CLAUDE.md §2 est **fausse** (doc à corriger).
- **Vérifié (juin 2026)** — axe RGPD **favorable** : Mistral = société UE, **DPA disponible** (art. 28), hébergement UE (Suède/Irlande), **pas d'entraînement sur les données API** par défaut, rétention 30 j + option **Zero Data Retention**. → Ce n'est **pas** une fuite vers un tiers non-conforme.
- **Point qui tient** : **La Plateforme n'est PAS qualifiée HDS** (art. L1111-8 CSP — certification FR distincte du RGPD, requise pour héberger des données de santé). Pour une appli pharmacie, l'usage conforme documenté = **Mistral self-host sur hébergeur HDS** (OVH/Scaleway/Outscale), pas l'API publique. Caveat résidence : un *processing US* aurait été ajouté en 02/2025 → à exclure contractuellement.
- **Impact** : exposition de **conformité** (et non de sécurité technique). Le RGPD est gérable contractuellement ; la **nécessité HDS** est une question juridique ouverte qui peut rester bloquante pilote selon l'interprétation DPO.
- **Correctif** : (1) signer le **DPA** Mistral ; (2) activer **ZDR** ; (3) verrouiller la **résidence UE** (exclure US) ; (4) **décision DPO** sur l'obligation HDS → si requise, basculer sur Mistral **self-host HDS** ; (5) corriger la doc et remplacer le cast `as OcrProvider` par une validation explicite ; (6) tracer le transfert au registre + consentement.

### R3-3/R3-4 — IDOR en écriture sur `pharmacy_acquisition` via `user_metadata.acquisition_id` — BAS (×2)
- **Fichiers** : `src/app/api/signup/confirm/route.ts:28-96` ; `src/app/api/onboarding/create-pharmacy/route.ts:161-178`
- **Problème** : ces 2 routes service-role écrivent dans `pharmacy_acquisition` en utilisant un `acquisition_id` lu depuis `user.user_metadata` — **entièrement contrôlable par le client** (`onboarding/create/page.tsx:139` fait `updateUser({data:{...}})`). Aucune vérification que la row ciblée appartient à l'utilisateur (pas de match email). → IDOR cross-tenant en **écriture** sur une table analytics/consentement (repointage de `pharmacy_id`, écrasement d'horodatages CGS/DPA).
- **Impact** : **bas** — `pharmacy_acquisition` n'est jamais relue pour une décision d'autorisation/facturation (seuls lecteurs : composants marketing + `apply-checkout-session` qui matche par `pharmacy_id`). Mais altération de preuves de consentement légal.
- **Correctif** : re-dériver l'`acquisition_id` côté serveur (match par email de la session), comme le fait `invite/complete`. Harmoniser le pattern entre routes service-role (le finding R3 le note aussi comme incohérence structurelle).

### R3-5 — Sortie OCR non validée (pas de zod) + chaînes non bornées persistées — BAS
- **Fichier** : `src/app/api/ocr/route.ts:70-118` ; `src/lib/ocr/normalize-medication-item.ts:22`
- **Problème** : le JSON du LLM est coercé structurellement (`String()/Number()`, regex date) mais **pas validé par zod**, et `medication_name` n'est pas borné en longueur. Le texte d'une ordonnance piégée (prompt-injection indirect) peut polluer l'extraction. Atténué : le pharmacien **relit et confirme** avant insertion DB, et la sortie n'est jamais re-injectée dans un autre LLM/SQL/shell.
- **Correctif** : valider la sortie LLM par zod (`.max()` sur les chaînes, enums) ; tronquer/rejeter au-delà des bornes.

### R3-6 — JWT en `httpOnly:false` × CSP `unsafe-*` : un seul XSS = vol de session — BAS (defense-in-depth)
- **Fichier** : `next.config.ts:31` ; cookies via `@supabase/ssr` (défaut `httpOnly:false`, non surchargé dans `lib/supabase/{server,middleware}.ts`)
- **Problème** : le JWT de session (`sb-…-auth-token`) est **lisible en JS** (`httpOnly:false`, requis par le client navigateur Supabase) et la CSP autorise `unsafe-inline`/`unsafe-eval`. Aucun XSS exploitable trouvé aujourd'hui (React sanitise), mais la **chaîne est armée** : toute future XSS (ou dépendance compromise) = exfiltration immédiate du JWT.
- **Correctif** : retirer `unsafe-inline` du `script-src` (nonces/hashes Next), confiner `unsafe-eval` au worker pdfjs (ou self-host le worker pour sortir `unpkg`), et forcer `httpOnly` sur l'auth si l'architecture le permet (flux server-side).

## ✔️ Angles R3 vérifiés — SAINS

- **12 routes service-role** : globalement **saines** — chacune fait `getUser()` (ou vérif signature webhook) **avant** d'utiliser le client service, et la cible/`pharmacy_id` est **re-dérivée du profil DB**, pas d'un input client. Pas d'IDOR cross-tenant direct via le client service (hormis R3-3/R3-4, table analytics, bas). `leave-requests`, `create-pharmacy`, `legal/erase`, Stripe ×4, `invite/complete` : autorisation re-vérifiée serveur.
- **SSRF** (geocode Nominatim + provider OCR) : **SAIN** — host hardcodé, `encodeURIComponent`, endpoints OCR en env serveur non influençables.
- **XSS `contact.website`** : non exploitable (React-DOM 19 `sanitizeURL`).
- **Cache Next.js / RSC** : pas de read service-role non scopé en Server Component ; les `queryKey` incluent `pharmacy?.id`. Résidu INFO : `get-signed-url`/`rental-attachments` queryKeys non scopées pharmacy (pas d'impact concret, hygiène anti-régression).

> **Verdict final round 3** : le rapport d'Opus était **exact et bien calibré** (à 3 nuances mineures près, toutes documentées ci-dessus). Mais il manquait encore **2 fuites de données de santé bloquantes pilote** — **R3-1 (PostHog autocapture)** et **R3-2 (OCR→Mistral non-HDS)** — qui rejoignent G1 et L3 dans un même thème récurrent : **les données de santé fuitent vers les sous-traitants tiers (Sentry, PostHog, Mistral) faute de minimisation/masquage/HDS**. C'est, au total, l'angle le plus sous-estimé de tout l'audit.

---

# Classification : Sécurité technique vs Conformité

> Le **plan correctif** ci-dessous ne couvre **QUE les failles de sécurité techniques exploitables** (modèle attaquant : accès non autorisé, escalade, vol de données/session, bypass de facturation, DoS, injection). Les points de **conformité administrative** (certification HDS, DPA, consentement, minimisation, droits RGPD) sont **parqués dans un volet séparé** relevant du DPO/juridique — ils ne bloquent pas le travail d'ingénierie sécurité et suivent leur propre cadence.

## 🛠️ TRACK A — Plan correctif sécurité technique

**Phase 0 — Préalables**
- [ ] Confirmer que `0055` est poussée ; claim `0056` dans `COORDINATION.md` ; lire `MIGRATIONS_GUARDRAILS.md`.
- [ ] Harnais de preuve (baseline rouge C1/H1/H2 sur staging avec l'anon key).

**Phase 1 — Migration `0056_rls_hardening.sql`** (critique + 3 hauts)
- [ ] C1 (trigger colonnes `subscription_*`) · H2 (trigger `pharmacy_id`/`role`) · H1 (re-scope `invitations_select`) · H3 (`pharmacies_select_onboarding`) · M1 (`get_user_role()` dans 3 policies) · M3+G3 (`notifications`) · G4 (`CHECK clockin_accuracy_m`) · G5 (`REVOKE create_overdue_notifications`) · L1 (UPDATE = DELETE) · `SET search_path` sur `get_user_role()`.

**Phase 2 — App**
- [ ] H4 (`applyInvitationToProfile()` partagé callback/complete).

**Phase 3 — Exposition de session (sécurité, pas conformité)**
- [ ] G1/G8 — Sentry `beforeSend`/intégrations : **scrub headers `cookie` (JWT), body, breadcrumbs** → empêche le **vol de session** via les logs d'erreur. (le bénéfice PHI est un effet de bord ; voir Track B pour l'angle conformité.)
- [ ] R3-6 — durcir CSP (`unsafe-inline`/`unsafe-eval`) + `httpOnly` sur l'auth si possible.

**Phase 4 — Facturation, quota, abus**
- [ ] M4 (tier depuis `price_id`) · G7 (advisory lock quota) · G6 (machine à états statuts) · M6+G9+L4+L7 (rate-limit signup/OTP/export + anti-énumération) · M2 (open redirect) · G2 (bump `next@16.2.9`).

**Phase 5 — Durcissement**
- [ ] L2 (grants) · L8 (HSTS) · L9 (masquage erreurs) · R3-3/R3-4 (IDOR `acquisition_id`) · R3-5 (zod sortie OCR) · L6 (taille/MIME OCR) · I1 (PKCE) · I2 (zod leave-requests) · I3 (route debug Sentry).

**Phase 6 — Vérification** (round 4 = fix-verification)
- [ ] Preuve dynamique C1/H1/H2/H3 (rouge→vert) · revue adversariale de la migration · non-régression M1 (planning/congés/chat).

## 📋 TRACK B — Conformité / RGPD-HDS (hors plan technique — DPO/juridique)

> Aucune de ces lignes n'est une faille exploitable par un attaquant ; ce sont des obligations légales/contractuelles. Certaines ont un correctif code trivial (noté), mais la **décision** relève de la conformité.

- **R3-2** — OCR/Mistral : **décision HDS** (self-host HDS si requis), **signer le DPA**, **activer ZDR**, verrouiller la résidence UE, tracer au registre. RGPD OK, HDS à trancher.
- **R3-1** — PostHog `autocapture:false` (fix 1 ligne) : minimisation, stop capture du texte écran (PHI) vers le sous-traitant.
- **L3** — ne pas envoyer l'email à PostHog (minimisation art. 5).
- **M5** — complétude de l'effacement RGPD (art. 17) : étendre l'erase à toutes les tables à PII (fix code, obligation légale).
- **L5** — versionnage du consentement cookies (CNIL).
- **DPA-HDS** — valider l'engagement HDS/DPA de **Sentry, PostHog, Mistral** (le scrub Sentry de Phase 3 réduit le résidu PHI mais ne dispense pas du DPA).
- **Checklist ops prod** : `SELECT id, public FROM storage.buckets` (tout `false`), config rate-limit Supabase Auth hébergée.
