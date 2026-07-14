# NOSOCLEAN Academy · Architecture technique V1

> Document interne baseflow® · juillet 2026 · Confidentiel
> Architecture fondée sur les patterns éprouvés par baseflow® sur ses plateformes conversationnelles à fort trafic : overlay de chat streamé, RAG indexé, suggestions contextuelles, gouvernance des conversations.

## 1. Décisions structurantes (actées client)

| Décision | Valeur |
|---|---|
| Nom | **NOSOCLEAN Academy** · « la référence scientifique en hygiène hospitalière : savoirs, guides et assistance » |
| Canal V1 | **PWA** (stores natifs en V2) |
| Périmètre V1 | Bibliothèque + Assistant IA + Protocoles hospitaliers |
| Secteur pilote | Hospitalier |
| Charte | Vert `#076D38` · Rouge accent `#E01F26` · Noir `#231F20` · Frutiger LT (fallback Calibri) |
| Ton | Scientifique, sobre, premium · glassmorphism validé |
| Exigence éditoriale | Sources traçables : SF2H, SF2S, ECDC, FDA, OMS + références algériennes. Double validation interne avant publication. |

## 2. Vue d'ensemble

Le système est découpé en **deux briques** : le front public (PWA) et le socle éditorial/indexation (back-office).

```
┌─────────────────────── FRONT PWA (public) ───────────────────────┐
│  Next.js 15 (App Router) + React + TS + Tailwind + Framer Motion  │
│  PWA via Serwist (manifest, service worker, offline shell)        │
│                                                                   │
│  Bibliothèque ── Fiches Protocoles ── Produits/CTA                │
│       │                                                           │
│  Bloc « Questions suggérées » contextuel par article              │
│       └─► Overlay Assistant · streaming SSE                       │
│            dictée vocale · contexte article injecté · sources     │
└──────────────┬────────────────────────────────────────────────────┘
               │ HTTPS
┌──────────────▼───────── API EDGE (Vercel) ────────────────────────┐
│  /api/chat        streaming SSE → Claude (clé serveur only)       │
│  /api/suggestions questions contextuelles par article             │
│  /api/feedback    👍/👎 + qualification lead                       │
│  /api/ingest      webhook d'indexation (auth service)             │
│  Retrieval RAG : pgvector top-k + filtre secteur                  │
└──────┬───────────────────────────────┬───────────────────────────┘
       │                               │
┌──────▼── SUPABASE ─────────┐  ┌──────▼── BACK-OFFICE CONTENU ────┐
│ Postgres + pgvector        │  │ Payload CMS 3 (admin généré,      │
│ • chunks + embeddings      │  │  même app Next.js, même Postgres) │
│ • conversations            │  │ • Collections : Article,          │
│ • leads / comptes Pro      │  │   Fiche Protocole, Produit        │
│ • Auth (magic link)        │  │ • Workflow double validation      │
└────────────────────────────┘  │   (Boudeja → Zamoun/Lyna → DG)    │
                                │ • Hook publish → /api/ingest      │
                                │ • Panneau « Academy Settings »     │
                                │   (état index, log, resync,        │
                                │    kill-switch assistant)          │
                                └───────────────────────────────────┘
```

## 3. Patterns retenus (socle méthodologique baseflow®)

| Pattern | Application NOSOCLEAN Academy |
|---|---|
| Overlay conversationnel décomposé | `AssistantOverlay` React : `AsHeader`, `AsMessagesList`, `AsSearchBar`, `AsSuggestions`, `AsSourcesList/Modal`, `AsLoader`, `AsToolbar` · chaque sous-composant isolé et testable |
| Déclencheur persistant | Bouton flottant (logo Academy, couleurs charte), toujours visible, ouvre l'overlay |
| Suggestions contextuelles | Bloc « Questions suggérées » par article · ≤7 questions, ordre aléatoire à chaque affichage, générées à l'indexation et stockées par article |
| Chat streamé côté serveur | `/api/chat` (Edge, SSE) → Claude Sonnet via SDK Anthropic ; affichage mot à mot |
| Pipeline d'indexation piloté | publish → chunk → embed → upsert pgvector ; état et log persistés en base ; écran admin de resynchronisation ; zones de connaissance = secteurs (hospitalier V1, extensibles V2) |
| Journalisation des conversations | Table `conversations` (thread_id, q/r, langue, feedback, statut) + dashboard leads + export CSV · cœur du « tableau de bord leads » promis au kickoff |
| Kill-switch front | Feature flag `assistant_enabled` (option back-office exposée à la PWA) · coupure de l'assistant sans redéploiement |
| Mode résumé d'article | « Résumer cet article » dans l'overlay · V1 si marge, sinon V1.1 |
| TTS / multilingue | FR/AR/EN + synthèse vocale · **V2** (déjà prévu au kickoff) |
| Panneau d'indexation | Panneau « Academy Intelligence » sur Article/Protocole (admin Payload) : indexer / ré-indexer / désindexer depuis l'écran d'édition |

## 4. Choix techniques & justifications

**Front · Next.js 15 (App Router) + React + TS + Tailwind.** Les composants du prototype validé (glassmorphism approuvé) sont portés dans Next ; PWA via Serwist : installable, diffusion QR code, mise à jour instantanée. Contraintes mobiles déjà traitées au prototype : 100dvh natif, anti-zoom iOS, clavier tactile. Un seul déploiement Vercel héberge front public + admin.

**Dictée vocale.** Web Speech API quand disponible ; fallback MediaRecorder → transcription serveur. Visualisation temps réel des fréquences conservée du prototype.

**IA · Anthropic Claude (Sonnet), streaming SSE.** Clé uniquement côté Edge. Prompt système : périmètre scientifique strict, citation obligatoire des sources (SF2H, SF2S, ECDC, FDA, OMS…), refus hors-domaine, disclaimer sur les pratiques de soin. Double contexte : injection silencieuse de l'article consulté (pattern prototype) **+** retrieval RAG pour les questions générales.

**RAG · Supabase pgvector.** Coût quasi nul au volume V1 (30 contenus → quelques centaines de chunks), une seule base pour vecteurs + conversations + auth, migration possible si le volume explose. Embeddings `text-embedding-3-small` (ou Voyage). Chunking par section avec métadonnées (secteur, type, source, URL).

**Back-office · Payload CMS 3 (décision actée).** Schéma déclaré en TypeScript, admin React généré, drafts/versions inclus, access control par rôle, localisation prête pour AR/EN en V2. Vit dans la même app Next.js et écrit dans le même Postgres Supabase : zéro deuxième stack, zéro lock-in (MIT, self-hosted, données chez nous). Workflow : `brouillon → validation scientifique → validation DG → publié` ; la publication déclenche l'indexation via hook `afterChange`. Contexte : Payload appartient à Figma depuis 2025, projet toujours open source et activement maintenu ; plan de sortie trivial car la base nous appartient.

**Auth & leads.** Bibliothèque publique (SEO, crédibilité, acquisition). Assistant en accès Pro sur inscription légère · email pro + fonction + établissement, magic link Supabase · levier de qualification des leads. Chaque conversation est rattachée au compte → dashboard leads.

**Sécurité / RGPD.** Rate limiting IP + compte sur `/api/chat` ; secrets en variables d'env Vercel ; rétention conversations à proposer (12 mois) ; consentement à l'inscription ; hébergement UE (Supabase eu-central, Vercel cdg1).

## 5. Modèle de données (minimum V1)

```
articles / protocoles / produits → Payload (collections, tables Postgres Supabase)
chunks(id, post_id, secteur, type, content, embedding, source_url)
conversations(id, user_id, thread_id, question, réponse, article_ctx, langue, feedback, créé_le)
users(id, email, fonction, établissement, statut_lead)
suggestions(post_id, questions[≤7])
ingest_state(post_id, hash, indexed_at, status)
```

## 6. Environnements

| Env | Front | Back-office | Data |
|---|---|---|---|
| dev | Vercel preview | Payload `/admin` (même app) | Supabase dev |
| staging | `staging.academy.nosoclean.com` | Payload `/admin` (même app) | Supabase dev |
| prod | `academy.nosoclean.com` (domaine à confirmer) | Payload `/admin` (même app) | Supabase prod |

## 7. Risques techniques

| Risque | Mitigation |
|---|---|
| Contenus livrés en retard (S2 critique) | Gabarits envoyés dès la pré-semaine ; 10 contenus de démo rédigés par baseflow® pour ne jamais bloquer le dev |
| Licence web Frutiger LT incertaine | Vérifier la licence ; fallback Calibri/Carlito déjà acté par la charte |
| Dictée vocale iOS Safari | Validée au prototype ; conserver le fallback serveur |
| Hallucinations IA en domaine médical | RAG strict + citations obligatoires + disclaimer + jeu de 50 questions de recette validé par le Dr Zamoun |
| Charge éditoriale de la cellule contenu | Assistant IA de rédaction côté back-office proposable en V1.1 |
