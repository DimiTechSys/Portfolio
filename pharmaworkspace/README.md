# PharmaWorkspace

Application SaaS B2B pour officines pharmaceutiques françaises : tâches, ordonnances (OCR IA),
commandes fournisseurs, locations de matériel médical, ruptures de stock (scan CIP13 + sync ANSM),
annuaire, procédures qualité, agenda, sessions de travail et notifications — le tout multi-tenant
(une officine = une `pharmacy`).

> Contexte détaillé pour le développement : voir [`CLAUDE.md`](./CLAUDE.md).

## Stack

- **Next.js 16** (App Router, Turbopack) — React 19
- **Supabase** (Postgres + Auth OTP email + Storage + Realtime)
- **TanStack React Query v5**, `react-hook-form` + `zod`
- **Tailwind CSS 4** + shadcn/ui, Framer Motion
- OCR via **Mistral** (stubs Ollama/Claude), scanner CIP13 (`@zxing`)
- Emails **Resend**, paiements **Stripe**, rate-limit **Upstash**, observabilité **Sentry** + **PostHog**

## Prérequis

- **Node.js ≥ 20** (testé sur 20.19) et npm
- Un projet **Supabase** (cloud ou local via la [Supabase CLI](https://supabase.com/docs/guides/cli))
- Une clé API **Mistral** (pour l'OCR des ordonnances)
- _Optionnel_ : comptes Resend, Stripe, Upstash, Sentry, PostHog selon les modules utilisés

## Installation

```bash
# 1. Cloner le dépôt
git clone <url-du-repo> pharmaworkspace
cd pharmaworkspace

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env.local
# puis éditer .env.local avec vos propres clés (voir ci-dessous)
```

### Variables d'environnement

Toutes les variables sont décrites dans [`.env.example`](./.env.example). Les **obligatoires**
pour démarrer en local :

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL de l'app (`http://localhost:3000` en dev) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publishable / anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (server-only, jamais exposée au client) |
| `OCR_PROVIDER` + `MISTRAL_API_KEY` | OCR des ordonnances |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Emails de connexion (OTP) et invitations |

Les variables Stripe, Upstash, Sentry et PostHog sont **optionnelles** : sans elles, les
fonctionnalités correspondantes restent inactives mais l'app démarre.

> ⚠️ Ne jamais committer `.env.local`. La `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais porter
> le préfixe `NEXT_PUBLIC_` ni être appelée côté client.

### Base de données (Supabase)

Le schéma est versionné dans [`supabase/migrations/`](./supabase/migrations).

- **Supabase cloud** : appliquer les migrations via la CLI

  ```bash
  npx supabase link --project-ref <ref-du-projet>
  npx supabase db push
  ```

- **Supabase local** :

  ```bash
  npx supabase start
  npx supabase db reset   # applique toutes les migrations
  ```

> Avant toute modification de schéma, lire impérativement
> [`supabase/MIGRATIONS_GUARDRAILS.md`](./supabase/MIGRATIONS_GUARDRAILS.md).

## Démarrage

```bash
npm run dev      # serveur de dev (Turbopack) → http://localhost:3000
```

Première connexion : authentification par **OTP email** (pas de mot de passe). Après login,
le parcours d'onboarding crée la pharmacie puis le profil.

## Scripts npm

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification des types (`tsc --noEmit`) |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:watch` | Vitest en mode watch |
| `npm run e2e` | Tests end-to-end (Playwright) |
| `npm run e2e:ui` | Playwright en mode UI |

## Structure du projet

Voir [`CLAUDE.md` §4](./CLAUDE.md) pour l'arborescence détaillée et les conventions
d'architecture (couches `app` → `components` → `features` → `lib/queries`).
