# TODO DEV · NOSOCLEAN Academy V1

> **Pour qui** : le dev qui construit Academy (front + back).
> **Comment** : ouvre Claude Code à la racine du repo `nosoclean-academy/`, lis ce document en entier AVANT de commencer, puis attaque les tickets dans l'ordre indiqué. Chaque ticket contient son prompt Claude Code prêt à coller.
> **Important** : Mehdi valide TOUT ton diff avant merge. Une PR par ticket.
> **Légende** : 🔴 = Mehdi doit intervenir (compte externe, clé, décision, ressource client). Si tu vois 🔴, vérifie qu'il a fait sa part AVANT de démarrer.
> **Réfs** : `ARCHITECTURE.md` (source de vérité technique), `ROADMAP-INTERNE.md`. Budget dev : 39,5 JH sur 6 séquences (S1 → S6), estimations tickets ≈ 28 j + marge imprévus.

---

## ⚠️ GARDE-FOUS · LIS ÇA D'ABORD

### Règles non négociables

1. **Tu ne touches QUE les fichiers listés dans le périmètre du ticket.** Un truc moche ailleurs : tu le notes en commentaire de PR, tu ne corriges pas. Refactoring opportuniste = source de bugs.

2. **Tu ne touches JAMAIS** :
   - `.env`, `.env.local` (jamais commit, jamais dans un diff)
   - `ANTHROPIC_API_KEY` et tout secret : uniquement en variables d'env Vercel, jamais exposés au client (`NEXT_PUBLIC_*` interdit pour un secret)
   - Une migration SQL déjà mergée (tu en crées une nouvelle, tu ne modifies jamais l'existant)
   - La config Payload access control d'une collection déjà validée, sauf ticket explicite

3. **Tu lances OBLIGATOIREMENT avant chaque PR** :
   ```bash
   pnpm lint && pnpm typecheck && pnpm build
   ```
   Les trois doivent être verts. Sinon, pas de PR.

4. **Conventions du repo** (reprises dans le `CLAUDE.md` créé au ticket NA-02) :
   - Composants UI purs dans `src/components/`, logique métier dans `src/features/<domaine>/`
   - Immutabilité côté JS : copies, jamais de mutation
   - Mobile-first, Safari iOS = cible n°1 (100dvh, anti-zoom, clavier tactile)
   - Réponses IA : toujours streamées, toujours sourcées, jamais de clé côté client
   - Code en anglais, UI et contenus en français

5. **Si Claude Code te propose une « refonte » ou un « refactor global »** : tu refuses. Périmètre exact du ticket, rien d'autre. Si tu n'arrives pas à le contraindre, tu arrêtes et tu pingues Mehdi.

6. **Si tu hésites entre deux approches** : ping Mehdi. 10 min de clarification valent mieux que 2 h à défaire.

### Workflow Git

```bash
# Pour chaque ticket
git checkout develop && git pull
git checkout -b feat/na-XX-short-name      # ou fix/, chore/

# ... code ...

pnpm lint && pnpm typecheck && pnpm build   # OBLIGATOIRE
git add . && git commit -m "[NA-XX] description courte"
git push -u origin feat/na-XX-short-name
# PR : description + checklist acceptance + capture ou test manuel
```

---

## Setup session Claude Code

À chaque nouvelle session, **commence par ce prompt** :

```
Tu travailles sur NOSOCLEAN Academy, PWA mobile-first pour professionnels
de l'hygiène hospitalière : bibliothèque scientifique publique, assistant
IA contextuel (RAG + streaming) réservé aux inscrits, fiches protocoles
reliées aux produits, back-office éditorial Payload CMS 3.

Stack imposée (ARCHITECTURE.md = source de vérité, ne dévie pas) :
- Next.js 15 App Router + TypeScript + Tailwind + Framer Motion
- Payload CMS 3 intégré dans la même app Next (admin sur /admin)
- Postgres Supabase (+ pgvector) via l'adaptateur Payload postgres
- PWA via Serwist · IA : Claude Sonnet via SDK Anthropic, streaming SSE
- Embeddings text-embedding-3-small · Auth publique Supabase magic link

Lis ABSOLUMENT d'abord, dans cet ordre :
1. CLAUDE.md (conventions du repo)
2. ARCHITECTURE.md (architecture, modèle de données §5)
3. Le ticket que je te donne (NA-XX dans BRIEF-DEV.md)

Règles non négociables :
- Tu ne touches QUE les fichiers du périmètre du ticket.
- Jamais de secret côté client, jamais de .env dans un diff,
  jamais modifier une migration mergée.
- Pas de refactor global, pas d'abstraction préventive.
- Mobile-first, Safari iOS cible n°1.
- Avant de dire « fini » : pnpm lint && pnpm typecheck && pnpm build verts.
- Si tu hésites entre 2 approches : tu me demandes, tu ne décides pas seul.

Réponds en français, code en anglais. Confirme que tu as lu CLAUDE.md
et ARCHITECTURE.md avant qu'on attaque.
```

---

## Ordre d'exécution

### Pré-semaine · fondations repo
1. **NA-01** · Audit du prototype (½ j, échauffement)
2. **NA-02** · Scaffold monorepo Next 15 + Payload 3 + CI + CLAUDE.md (1 j)
3. **NA-03** 🔴 · Supabase + envs Vercel + secrets (½ j)

### S1 · back-office + shell
4. **NA-04** 🔴 · Collections Payload + workflow double validation (1½ j)
5. **NA-05** · Hook publish → ingest + table `ingest_state` (1 j)
6. **NA-06** · Shell PWA (1 j)
7. **NA-07** 🔴 · Seed 10 contenus de démo (½ j) · 🎯 back-office démontrable à la cellule contenu en fin de S1

### S2 · bibliothèque + RAG
8. **NA-08** · Bibliothèque + filtres + page article (2 j)
9. **NA-09** · Pipeline d'indexation + suggestions (2 j)
10. **NA-10** · Panneau « Academy Settings » (1 j) · 🎯 GO/NO-GO Phase 1

### S3 · assistant IA
11. **NA-11** 🔴 · `/api/chat` SSE + RAG + prompt scientifique (1½ j)
12. **NA-12** · Overlay assistant (2 j)
13. **NA-13** · Dictée vocale (1 j)
14. **NA-14** 🔴 · Inscription Pro + conversations + feedback (1½ j) · 🎯 GO/NO-GO Phase 2

### S4 · conversion + leads
15. **NA-15** · Fiches protocoles + produits + CTA (1½ j)
16. **NA-16** · Dashboard leads + export CSV (1½ j)
17. **NA-17** 🔴 · Exécution du jeu de recette IA (1 j) · 🎯 feature-complete

### S5 · QA + bêta
18. **NA-18** 🔴 · Recette croisée iOS/Android + perf (2 j)
19. **NA-19** · Corrections bêta (2 j) · 🎯 GO/NO-GO lancement

### S6 · production
20. **NA-20** 🔴 · Mise en production (1½ j) · 🎯 lancement
21. **NA-21** · Post-lancement : astreinte + métriques J+15 (1 j)

---

# TICKETS DÉTAILLÉS

---

## NA-01 · Audit du prototype

### Pourquoi ce ticket
Le prototype (nosoclean.vercel.app, repo Vite) contient des acquis validés par le client : composants glassmorphism, gestion clavier iOS, chat streamé, dictée vocale. On industrialise sur Next.js 15 : il faut savoir ce qu'on porte tel quel, ce qu'on réécrit, ce qu'on jette.

**Branche** : `chore/na-01-proto-audit` · **Estimation** : ½ j · **Risque** : nul (lecture seule)

### À faire
Produire `docs/AUDIT-PROTOTYPE.md` : inventaire des composants (garder / porter / jeter), dettes repérées, liste des styles et animations à conserver, points durs iOS déjà résolus (à ne pas perdre au portage).

### Acceptance
- [ ] `docs/AUDIT-PROTOTYPE.md` listant chaque composant du proto avec verdict et justification en 1 ligne
- [ ] Liste explicite des solutions iOS à préserver (100dvh, anti-zoom, clavier)

### Prompt Claude Code
```
Ticket NA-01. Lis l'intégralité du repo prototype (dossier legacy/ ou URL
que je te donne). Produis docs/AUDIT-PROTOTYPE.md : tableau composant par
composant avec verdict garder / porter / jeter + justification 1 ligne.
Section dédiée : hacks iOS à préserver. Tu ne modifies AUCUN fichier de code.
```

---

## NA-02 · Scaffold monorepo Next 15 + Payload 3 + CI

### Pourquoi ce ticket
Tout le projet vit dans une seule app Next.js : front public + admin Payload sur `/admin` + routes API. C'est le socle de tous les tickets suivants. Le `CLAUDE.md` du repo naît ici : c'est lui qui cadrera Claude Code pour toute la suite.

**Branche** : `chore/na-02-scaffold` · **Estimation** : 1 j · **Prérequis** : NA-01

### Fichiers à créer
- App Next 15 (`create-payload-app` puis nettoyage) : `src/app/(site)/`, `src/app/(payload)/admin/`, `payload.config.ts`
- `CLAUDE.md` (conventions §Garde-fous de ce document + arborescence + commandes)
- `.github/workflows/ci.yml` (lint + typecheck + build sur PR)
- `.env.example` (toutes les clés, valeurs factices)

### Acceptance
- [ ] `pnpm dev` : site vide + `/admin` Payload fonctionnels en local
- [ ] CI verte sur une PR de test, rouge si erreur TS volontaire
- [ ] `CLAUDE.md` relu par Mehdi

### Ne PAS toucher
- Aucune collection métier (NA-04), aucun composant du proto pour l'instant

### Prompt Claude Code
```
Ticket NA-02. Scaffold une app Next.js 15 App Router + Payload CMS 3
(adaptateur @payloadcms/db-postgres, DATABASE_URI en env), TypeScript
strict, Tailwind, pnpm. Ajoute .github/workflows/ci.yml (lint, typecheck,
build). Rédige CLAUDE.md à partir des garde-fous de BRIEF-DEV.md.
Aucune collection métier dans ce ticket. pnpm lint && pnpm typecheck &&
pnpm build doivent passer.
```

---

## NA-03 🔴 · Supabase + environnements Vercel

### Pourquoi ce ticket
Une seule base porte tout : contenu Payload, vecteurs RAG, conversations, comptes Pro. Les envs Vercel (dev / staging / prod) et les secrets doivent exister avant le premier deploy.

**Branche** : `chore/na-03-envs` · **Estimation** : ½ j
**🔴 Mehdi intervient** : création org Supabase (région UE) + projets Vercel + il te transmet `DATABASE_URI`, `PAYLOAD_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (embeddings), `RESEND_API_KEY`. Ping-le avant de démarrer.

### À faire
Config des 3 environnements Vercel, secrets posés, migration initiale Payload appliquée, extension `pgvector` activée, doc `docs/ENVIRONMENTS.md` (qui pointe où, comment déployer).

### Acceptance
- [ ] Deploy preview Vercel fonctionnel avec `/admin` connecté à Supabase dev
- [ ] `pgvector` activé (`create extension vector`) sur dev et prod
- [ ] `.env.example` à jour, aucun secret commité

### Prompt Claude Code
```
Ticket NA-03. Écris docs/ENVIRONMENTS.md (3 envs Vercel, mapping Supabase
dev/prod, procédure de deploy et de rollback) et la migration SQL initiale
activant pgvector. Vérifie que .env.example couvre toutes les variables
utilisées dans le code. Tu ne touches à aucun autre fichier.
```

---

## NA-04 🔴 · Collections Payload + workflow double validation

### Pourquoi ce ticket
C'est le back-office que la cellule contenu Nosoclean utilise dès la fin de S1. Le circuit éditorial du client est contractuel : `brouillon → validation scientifique → validation DG → publié`, avec des rôles nominatifs. Un contenu ne peut JAMAIS être publié sans passer les deux validations.

**Branche** : `feat/na-04-collections` · **Estimation** : 1½ j · **Prérequis** : NA-02, NA-03
**🔴 Mehdi intervient** : il te fournit les gabarits article / protocole validés client (champs exacts) et la liste des comptes cellule (Boudeja édition, Zamoun + Lyna validation scientifique, Benyoucef lecture, Timsiline validation DG).

### Fichiers à créer
- `src/collections/Articles.ts`, `Protocoles.ts`, `Produits.ts`, `EditorialUsers.ts`
- Champ partagé `statut` (select + access control par rôle sur les transitions)
- `src/access/` : helpers de rôles

### À faire
Collections avec champs des gabarits (dont : sources obligatoires avec référence SF2H/SF2S/ECDC/FDA/OMS, secteur, type de contamination pour les protocoles, relation protocole ↔ produits). Drafts Payload activés. Un rédacteur ne peut pas passer un contenu en `publié` ; seul le rôle DG le peut, et uniquement depuis `validation DG`.

### Acceptance
- [ ] Matrice de droits testée : chaque rôle ne voit que ses transitions autorisées
- [ ] Impossible de publier sans les 2 validations (test manuel + test unitaire access)
- [ ] Champ sources obligatoire : publication bloquée si vide
- [ ] Comptes cellule créés sur staging, démo faisable

### Ne PAS toucher
- `payload.config.ts` au-delà de l'enregistrement des collections

### Prompt Claude Code
```
Ticket NA-04. Crée les collections Payload Articles, Protocoles, Produits,
EditorialUsers selon ARCHITECTURE.md §5 et les gabarits que je te colle.
Workflow statut : brouillon → validation scientifique → validation DG →
publié, transitions verrouillées par rôle via access control (pas de
simple hook). Drafts activés. Écris un test qui prouve qu'un rédacteur ne
peut pas publier. Ne crée aucun hook d'indexation (ticket NA-05).
```

---

## NA-05 · Hook publish → ingest + `ingest_state`

### Pourquoi ce ticket
L'indexation RAG doit être un réflexe du back-office, pas une action manuelle : à chaque publication ou mise à jour d'un contenu publié, l'app pousse le contenu vers le pipeline d'indexation. La table `ingest_state` trace ce qui est indexé, avec quel hash, quand : c'est elle qui rend l'index auditable et resynchronisable.

**Branche** : `feat/na-05-ingest-hook` · **Estimation** : 1 j · **Prérequis** : NA-04

### Fichiers à créer
- `src/hooks/afterChangeIngest.ts` (+ `afterDelete` pour désindexer)
- Migration `ingest_state(post_id, collection, hash, indexed_at, status, error)`
- `src/app/api/ingest/route.ts` (squelette : auth service à service par token, enqueue)

### Acceptance
- [ ] Publier un article → ligne `ingest_state` en `pending` puis `done` (indexation réelle en NA-09, ici stub)
- [ ] Dépublier / supprimer → statut `removed`
- [ ] Hash inchangé → pas de réindexation (idempotence)

### Prompt Claude Code
```
Ticket NA-05. Ajoute le hook Payload afterChange sur Articles et
Protocoles : si statut publié et hash du contenu changé, POST interne vers
/api/ingest (token service en env, pas de secret client). Crée la
migration ingest_state et la route /api/ingest en stub (enregistre, marque
done). Idempotence par hash. Test : publier 2 fois sans changement = 1
seule ingestion.
```

---

## NA-06 · Shell PWA

### Pourquoi ce ticket
La PWA est le canal de distribution acté avec le client (installation par QR code, pas de store). Le shell doit être irréprochable sur Safari iOS : c'est le terrain réel des utilisateurs hospitaliers.

**Branche** : `feat/na-06-pwa-shell` · **Estimation** : 1 j · **Prérequis** : NA-02

### Fichiers à créer
- Config Serwist (`sw.ts`, manifest, icônes fournies par l'UI/UX)
- `src/app/(site)/layout.tsx` : viewport, 100dvh, anti-zoom, safe-areas
- Page offline de repli

### Acceptance
- [ ] Installable sur iPhone réel (Safari) et Android (Chrome), icône et splash corrects
- [ ] Offline : shell + page de repli servis, pas d'écran blanc
- [ ] Aucun zoom involontaire sur focus input (iOS), layout stable clavier ouvert

### Prompt Claude Code
```
Ticket NA-06. Intègre Serwist dans l'app Next 15 : manifest, service
worker, précache du shell, page offline. Layout racine : 100dvh, viewport
anti-zoom iOS, safe-areas. Reprends les hacks iOS listés dans
docs/AUDIT-PROTOTYPE.md. Ne touche pas aux collections ni aux routes API.
```

---

## NA-07 🔴 · Seed 10 contenus de démo

### Pourquoi ce ticket
Règle du projet : le dev n'attend JAMAIS le contenu client. Ces 10 contenus réalistes (rédigés côté baseflow®) alimentent bibliothèque, RAG et démos jusqu'à l'arrivée des 30 contenus réels.

**Branche** : `chore/na-07-seed` · **Estimation** : ½ j · **Prérequis** : NA-04
**🔴 Mehdi intervient** : il te fournit les 10 contenus de démo (rédaction CdP) au format des gabarits.

### Acceptance
- [ ] Script `pnpm seed` idempotent : 10 articles + 3 protocoles + 5 produits liés
- [ ] Contenus visibles dans l'admin en statut `publié` (via le workflow, pas en force)

### Prompt Claude Code
```
Ticket NA-07. Écris un script seed (pnpm seed) utilisant l'API locale
Payload : 10 articles, 3 protocoles, 5 produits liés, à partir des
fichiers docs/seed/*.md que je fournis. Idempotent (upsert par slug).
Les statuts passent par les vraies transitions du workflow.
```

---

## NA-08 · Bibliothèque + filtres + page article

### Pourquoi ce ticket
Le cœur public de la plateforme : cartes dynamiques filtrées en temps réel par problématique métier, page article lisible et sourcée. Accès libre (SEO, crédibilité). Les maquettes UI/UX font foi.

**Branche** : `feat/na-08-library` · **Estimation** : 2 j · **Prérequis** : NA-06, NA-07

### Fichiers à créer
- `src/app/(site)/bibliotheque/page.tsx`, `src/app/(site)/articles/[slug]/page.tsx`
- `src/features/library/` (queries Payload local API, filtres)
- `src/components/library/` (Card, FilterBar, badges source/secteur)

### Acceptance
- [ ] Filtrage temps réel sans rechargement, état dans l'URL (partageable)
- [ ] Page article : sources visibles, typographie conforme maquettes, SSG/ISR
- [ ] Seuls les contenus `publié` sortent (jamais un brouillon, test inclus)
- [ ] LCP < 2,5 s mobile sur staging

### Prompt Claude Code
```
Ticket NA-08. Implémente la bibliothèque et la page article selon les
maquettes (je te donne les exports). Data via l'API locale Payload,
uniquement statut publié (écris le test). Filtres temps réel avec état
dans l'URL. ISR pour les pages articles. Composants purs dans
src/components/library, logique dans src/features/library.
```

---

## NA-09 · Pipeline d'indexation + suggestions

### Pourquoi ce ticket
C'est le moteur du RAG : à l'ingestion, chaque contenu est découpé par section, enrichi de métadonnées (secteur, type, source, URL), vectorisé, upserté dans pgvector. On génère aussi jusqu'à 7 questions suggérées par article, stockées, servies en ordre aléatoire.

**Branche** : `feat/na-09-rag-pipeline` · **Estimation** : 2 j · **Prérequis** : NA-05

### Fichiers à créer
- `src/features/rag/chunk.ts`, `embed.ts`, `upsert.ts` · migration `chunks` (+ index vector)
- `src/features/rag/suggestions.ts` + migration `suggestions`
- Compléter `/api/ingest` (remplace le stub NA-05)

### Acceptance
- [ ] Publier un article → chunks en base avec embeddings + métadonnées, `ingest_state` cohérent
- [ ] Modifier puis republier → anciens chunks remplacés (pas de doublons)
- [ ] 7 suggestions générées par article, pertinentes sur les 10 contenus de démo
- [ ] Recherche de similarité manuelle (script) retourne les bons passages

### Prompt Claude Code
```
Ticket NA-09. Implémente le pipeline d'ingestion : chunking par section
(garde les titres), métadonnées (secteur, type, source, URL), embeddings
text-embedding-3-small, upsert pgvector (remplacement par post_id).
Génère jusqu'à 7 questions suggérées par article via Claude (prompt court,
questions de professionnel hospitalier) et stocke-les. Script de test de
similarité inclus. Idempotence stricte par hash.
```

---

## NA-10 · Panneau « Academy Settings »

### Pourquoi ce ticket
L'index doit être pilotable sans toucher au code : état d'indexation par contenu, log, réindexation manuelle, resynchronisation globale, et le kill-switch `assistant_enabled` qui coupe l'assistant côté PWA sans redéploiement.

**Branche** : `feat/na-10-settings` · **Estimation** : 1 j · **Prérequis** : NA-09

### Fichiers à créer
- Global Payload `AcademySettings` (kill-switch, paramètres RAG)
- Vue admin custom : tableau `ingest_state` + actions réindexer / désindexer / resync
- Panneau « Academy Intelligence » sur l'écran d'édition Article/Protocole

### Acceptance
- [ ] Kill-switch OFF → l'assistant disparaît de la PWA en < 60 s (sans deploy)
- [ ] Réindexation manuelle d'un contenu depuis son écran d'édition
- [ ] Resync global : détecte et corrige les écarts base ↔ index

### Prompt Claude Code
```
Ticket NA-10. Crée le global Payload AcademySettings (assistant_enabled +
paramètres RAG) exposé via une route publique cachée derrière un cache
court. Vue admin custom listant ingest_state avec actions réindexer /
désindexer / resync (réutilise les fonctions NA-09, ne les duplique pas).
Panneau Academy Intelligence sur les écrans d'édition.
```

---

## NA-11 🔴 · `/api/chat` SSE + RAG + prompt scientifique

### Pourquoi ce ticket
Le différenciateur du produit. Réponses streamées, ancrées dans le contexte (article consulté injecté silencieusement + retrieval pgvector), sources citées systématiquement, refus hors-domaine, disclaimer sur les pratiques de soin. La qualité de ce prompt système est un engagement contractuel vis-à-vis de la ligne éditoriale Nosoclean.

**Branche** : `feat/na-11-chat-api` · **Estimation** : 1½ j · **Prérequis** : NA-09
**🔴 Mehdi intervient** : `ANTHROPIC_API_KEY` posée sur tous les envs (fait en NA-03, vérifie), et il valide le prompt système avant merge.

### Fichiers à créer
- `src/app/api/chat/route.ts` (SSE, runtime edge si compatible, sinon node streaming)
- `src/features/assistant/retrieval.ts`, `systemPrompt.ts`, `rateLimit.ts`

### Acceptance
- [ ] Streaming mot à mot fonctionnel (curl + front de test)
- [ ] Chaque réponse liste ses sources (métadonnées des chunks utilisés)
- [ ] Question hors hygiène hospitalière → refus poli et cadré
- [ ] Rate limiting par IP + compte, kill-switch respecté
- [ ] Aucune clé exposée : audit du bundle client

### Prompt Claude Code
```
Ticket NA-11. Implémente /api/chat : SSE streaming via SDK Anthropic
(Claude Sonnet), contexte = article courant (si fourni) + top-k pgvector
filtré secteur, prompt système dans systemPrompt.ts (périmètre scientifique
strict, sources SF2H/SF2S/ECDC/FDA/OMS citées, refus hors-domaine,
disclaimer soin, réponse en français). Rate limiting IP + user. Vérifie
qu'aucun secret ne fuit dans le bundle client. Tests : refus hors-domaine,
présence de sources.
```

---

## NA-12 · Overlay assistant

### Pourquoi ce ticket
L'interface du chat, décomposée en sous-composants isolés et testables : `AsHeader`, `AsMessagesList`, `AsSearchBar`, `AsSuggestions`, `AsSourcesList/Modal`, `AsLoader`, `AsToolbar`, plus le bouton flottant persistant. Tous les états sont spécifiés par l'UI/UX (vide, suggestions, saisie, streaming, sources, feedback, erreur, hors-ligne).

**Branche** : `feat/na-12-overlay` · **Estimation** : 2 j · **Prérequis** : NA-11

### Fichiers à créer
- `src/components/assistant/As*.tsx` + `AssistantOverlay.tsx` + `FloatingTrigger.tsx`
- `src/features/assistant/useChat.ts` (état conversation, consommation SSE)

### Acceptance
- [ ] Tous les états UI/UX rendus, streaming fluide, autoscroll intelligent (stoppé si l'utilisateur remonte)
- [ ] Suggestions contextuelles cliquables (≤7, ordre aléatoire)
- [ ] Sources dépliables par réponse · feedback 👍/👎 branché sur `/api/feedback`
- [ ] Clavier iOS : l'input reste visible, pas de saut de layout

### Prompt Claude Code
```
Ticket NA-12. Construis l'overlay assistant en sous-composants As* isolés
(specs UI/UX fournies) + bouton flottant persistant. Hook useChat :
consommation SSE, états (idle, streaming, error, offline), immutabilité
stricte. Framer Motion pour l'apparition. Safari iOS prioritaire :
teste clavier ouvert. Aucun appel direct à Anthropic : tout passe par
/api/chat.
```

---

## NA-13 · Dictée vocale

### Pourquoi ce ticket
Usage terrain : mains prises, gants. Web Speech API quand disponible, sinon MediaRecorder + transcription serveur. La visualisation temps réel des fréquences (validée au prototype) fait partie de l'expérience.

**Branche** : `feat/na-13-voice` · **Estimation** : 1 j · **Prérequis** : NA-12

### Acceptance
- [ ] Dictée fonctionnelle iOS Safari ET Android Chrome (le fallback serveur couvre iOS si besoin)
- [ ] Visualisation fréquences pendant l'enregistrement
- [ ] Refus micro géré proprement (message, pas de crash)

### Prompt Claude Code
```
Ticket NA-13. Ajoute la dictée vocale à AsSearchBar : Web Speech API si
disponible, sinon MediaRecorder → route de transcription serveur.
Visualisation des fréquences (AnalyserNode) reprise du prototype (voir
docs/AUDIT-PROTOTYPE.md). Gère refus de permission et arrêt auto sur
silence. Teste sur iOS Safari en priorité.
```

---

## NA-14 🔴 · Inscription Pro + conversations + feedback

### Pourquoi ce ticket
L'assistant est le levier de qualification des leads : accès sur inscription légère (email pro + fonction + établissement, magic link Supabase). Chaque conversation est journalisée et rattachée au compte : c'est la matière première du dashboard leads (NA-16). Attention : comptes cellule = users Payload (admin), comptes Pro publics = Supabase Auth. Deux mondes, pas de mélange.

**Branche** : `feat/na-14-auth-pro` · **Estimation** : 1½ j · **Prérequis** : NA-11
**🔴 Mehdi intervient** : domaine d'envoi email (Resend) vérifié + textes des emails transactionnels validés avec l'UI/UX.

### Fichiers à créer
- `src/features/auth/` (magic link Supabase, gate de l'assistant)
- Migrations `users_pro`, `conversations` · `src/app/api/feedback/route.ts`

### Acceptance
- [ ] Non inscrit : l'overlay s'ouvre mais montre l'écran d'inscription (promesse claire), pas d'appel IA possible côté serveur (test)
- [ ] Magic link bout en bout sur staging · RGPD : consentement + lien politique
- [ ] Chaque échange écrit dans `conversations` (thread_id, langue, feedback, user)
- [ ] `/api/feedback` idempotent par message

### Prompt Claude Code
```
Ticket NA-14. Implémente l'inscription Pro : Supabase Auth magic link,
champs email pro / fonction / établissement, consentement RGPD. Gate
serveur sur /api/chat (401 si non authentifié, testé). Journalise chaque
échange dans conversations, rattaché au user. Route /api/feedback (👍/👎).
Ne touche pas aux users Payload (cellule éditoriale = monde séparé).
```

---

## NA-15 · Fiches protocoles + produits + CTA

### Pourquoi ce ticket
Le parcours de conversion, discret mais structuré : navigation par use case / secteur / type de contamination, produits Nosoclean accessibles depuis chaque protocole pertinent, CTA contact sans rupture de parcours. Séparation nette éditorial / commercial (exigence client).

**Branche** : `feat/na-15-protocols` · **Estimation** : 1½ j · **Prérequis** : NA-08

### Acceptance
- [ ] Navigation par facettes fonctionnelle, état dans l'URL
- [ ] Bloc produits liés visuellement distinct du contenu scientifique
- [ ] CTA contact : formulaire court, enregistré comme lead (visible NA-16)

### Prompt Claude Code
```
Ticket NA-15. Pages protocoles : liste à facettes (use case, secteur,
type de contamination) + page détail avec produits liés (bloc visuellement
séparé, mention claire) et CTA contact sans rupture (drawer, pas de
redirection). Le submit crée un lead en base. Réutilise les composants
library existants, n'en duplique pas.
```

---

## NA-16 · Dashboard leads + export CSV

### Pourquoi ce ticket
La promesse business du kickoff : « tableau de bord leads ». La DG Nosoclean doit voir les inscrits, leurs conversations, les CTA soumis, et exporter en CSV.

**Branche** : `feat/na-16-leads` · **Estimation** : 1½ j · **Prérequis** : NA-14

### Acceptance
- [ ] Vue admin (rôle DG + Mehdi uniquement) : inscrits, volumétrie conversations, leads CTA, filtres par période
- [ ] Export CSV (UTF-8, séparateur ;) conforme à ce que la DG ouvrira dans Excel
- [ ] Aucune donnée conversationnelle exposée aux rôles éditoriaux

### Prompt Claude Code
```
Ticket NA-16. Vue admin Payload custom « Leads » : tableau des comptes Pro
(fonction, établissement, nb conversations, dernier échange, statut lead),
détail des conversations d'un compte, export CSV (;, UTF-8 BOM). Access
control : rôles DG et admin uniquement, écris le test d'accès refusé pour
un rédacteur.
```

---

## NA-17 🔴 · Exécution du jeu de recette IA

### Pourquoi ce ticket
50 questions hospitalières avec réponses attendues, rédigées par le CdP et validées par le Dr Zamoun (référent scientifique client). C'est le contrat qualité de l'assistant avant la bêta : on exécute, on score, on corrige prompt/retrieval, on archive les résultats.

**Branche** : `chore/na-17-eval` · **Estimation** : 1 j · **Prérequis** : NA-11, contenus réels indexés
**🔴 Mehdi intervient** : il te fournit le fichier des 50 questions/réponses attendues (validé Zamoun).

### Acceptance
- [ ] Script `pnpm eval` : rejoue les 50 questions, score (sources citées ? réponse alignée ? refus corrects ?), sortie markdown datée dans `docs/evals/`
- [ ] Itérations prompt/retrieval documentées jusqu'à ≥ 90 % de réponses conformes
- [ ] Zéro réponse engageant une pratique de soin sans source + disclaimer

### Prompt Claude Code
```
Ticket NA-17. Écris pnpm eval : rejoue docs/evals/questions.json contre
/api/chat (env staging), score chaque réponse (sources présentes,
alignement avec la réponse attendue via juge LLM, refus corrects) et
génère docs/evals/RESULTS-<date>.md. Propose des ajustements de
systemPrompt.ts ou du retrieval, un par un, mesurés par re-run.
```

---

## NA-18 🔴 · Recette croisée iOS/Android + perf

### Pourquoi ce ticket
La cible réelle est un smartphone hospitalier en 4G. On recette tout sur devices réels : installation PWA, offline, dictée, clavier, streaming. Et on tient l'engagement perf : Lighthouse PWA ≥ 90 mobile.

**Branche** : `fix/na-18-qa` · **Estimation** : 2 j · **Prérequis** : NA-15, NA-16
**🔴 Mehdi intervient** : il fournit les devices de test (iPhone réel indispensable) et fige le périmètre : plus aucune feature après ce point.

### Acceptance
- [ ] Grille de recette remplie (docs/QA-V1.md) : parcours complet sur iOS Safari, Android Chrome
- [ ] Lighthouse mobile ≥ 90 (PWA, perf), bundle audité, images optimisées
- [ ] Zéro bug bloquant ouvert · les mineurs sont listés et priorisés

### Prompt Claude Code
```
Ticket NA-18. Crée docs/QA-V1.md : grille de recette exhaustive (install
PWA, offline, bibliothèque, filtres, article, assistant streaming, dictée,
inscription, protocoles, CTA, dashboard). Puis audit perf : bundle
analyzer, images, fonts, lazy loading ; vise Lighthouse mobile ≥ 90.
Corrige uniquement ce qui relève de la perf ou de bugs, aucune feature.
```

---

## NA-19 · Corrections bêta

### Pourquoi ce ticket
3 à 5 professionnels hospitaliers utilisent l'app en conditions réelles. Leurs retours arrivent triés par le CdP (bloquant / majeur / mineur). On corrige les bloquants et majeurs, on archive le reste pour V1.1.

**Branche** : une branche `fix/na-19-*` par correction · **Estimation** : 2 j (enveloppe)

### Acceptance
- [ ] Tous les bloquants fermés, majeurs traités ou explicitement reportés par Mehdi
- [ ] Chaque fix = PR + note dans docs/QA-V1.md
- [ ] Re-run `pnpm eval` si un fix touche prompt ou retrieval

### Prompt Claude Code
```
Ticket NA-19. Je te donne un retour bêta trié. Reproduis le bug
(étapes exactes), corrige au plus près de la cause, ajoute un test si
pertinent, note la correction dans docs/QA-V1.md. Un bug = une PR.
Aucun refactor au passage.
```

---

## NA-20 🔴 · Mise en production

### Pourquoi ce ticket
Le lancement. Domaine réel, monitoring, sauvegardes, rétention RGPD : l'app passe en conditions de production et la distribution démarre (QR codes du réseau Nosoclean).

**Branche** : `chore/na-20-prod` · **Estimation** : 1½ j · **Prérequis** : GO du client
**🔴 Mehdi intervient** : domaine (`academy.nosoclean.com`, DNS côté client), GO/NO-GO signé, mentions légales validées.

### Acceptance
- [ ] Prod déployée sur le domaine final, HTTPS, headers de sécurité
- [ ] Monitoring : uptime, erreurs (Sentry), coûts API (alerte budget Anthropic)
- [ ] Sauvegardes Supabase vérifiées (restore testé sur dev) · rétention conversations 12 mois (job de purge)
- [ ] QR codes pointant vers la prod, testés

### Prompt Claude Code
```
Ticket NA-20. Checklist de prod : headers de sécurité next.config, Sentry,
route /api/health, job de purge conversations > 12 mois (documenté),
docs/RUNBOOK.md (deploy, rollback, incidents, contacts). Vérifie
qu'aucune route de debug ne part en prod. Ne touche à aucune feature.
```

---

## NA-21 · Post-lancement

### Pourquoi ce ticket
Deux semaines d'astreinte légère, correctifs au fil de l'eau, et la matière du bilan J+15 : installs, conversations, leads, latence, coûts.

**Branche** : `chore/na-21-metrics` · **Estimation** : 1 j étalé

### Acceptance
- [ ] Script ou vue `docs/METRICS-J15.md` : installs (approx. via events), comptes Pro, conversations/jour, taux de feedback, top questions, latence p95, coût API/jour
- [ ] Incidents J+1 → J+15 documentés dans le RUNBOOK

### Prompt Claude Code
```
Ticket NA-21. Construis la collecte du bilan J+15 : requêtes SQL sur
conversations/users/leads, latence p95 depuis les logs, coût API estimé.
Sortie : docs/METRICS-J15.md régénérable via pnpm metrics. Aucune
dépendance analytics externe sans mon accord.
```
