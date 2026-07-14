 CLAUDE.md — PharmaWorkspace

> Document de contexte pour toute session Claude Code travaillant sur ce dépôt.
> À jour au 18 mai 2026 — phase **MVP → bêta privée**.


## 1. Vue d'ensemble

PharmaWorkspace est une **application SaaS B2B** pour officines pharmaceutiques françaises. Elle centralise : tâches, ordonnances (avec OCR IA), commandes fournisseurs, locations de matériel médical, ruptures de stock (avec scan CIP13 + sync ANSM), annuaire, procédures qualité, agenda, sessions de travail, notifications.

- **Multi-tenant** : une "officine" = une `pharmacy` ; chaque profil utilisateur appartient à une (et une seule) pharmacie.
- **Rôles** : `titulaire` (admin), `adjoint`, `preparateur`.
- **Langue UI** : français. **Code, identifiants, enums, routes** : anglais.
- **Statut produit** : MVP fonctionnel, en préparation pour pilote/bêta terrain. Plusieurs chantiers de durcissement avant prod (voir §10).

---

## 2. Stack & commandes

| | |
|---|---|
| Framework | **Next.js 16.2** (App Router, Turbopack) |
| Runtime | React 19.2, Node (route OCR : `runtime = 'nodejs'`, `maxDuration = 60`) |
| Style | Tailwind CSS 4, shadcn/ui, Framer Motion, `tw-animate-css` |
| Data | **Supabase** (Postgres + Auth OTP email + Storage + Realtime), `@supabase/ssr` |
| State serveur | **TanStack React Query v5** (`staleTime: 60s`, `gcTime: 10m`, pas de refetch on focus) |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Toasts | **`sonner`** (`toast.success/error/...`) — **jamais** `useToast` |
| OCR | **OpenAI** GPT-4o-mini en prod, stubs Claude/Ollama dans `src/app/api/ocr/route.ts` |
| PDF/Scan | `pdfjs-dist`, `@zxing/browser` (scanner CIP13) |
| Déploiement | Vercel (Edge sur la plupart des routes, Node pour OCR) |

```bash
npm install
npm run dev      # Next dev (Turbopack)
npm run build    # build prod
npm run lint     # ESLint (ignore .next/, out/, build/)
```

Pas de scripts de test ni de typecheck dédiés à ce jour — `tsc --noEmit` n'est pas câblé dans `package.json` (à ajouter, cf §10).

---

## 3. Variables d'environnement

Fichiers : `.env`, `.env.local` (le second prévaut, contient en plus `SUPABASE_SERVICE_ROLE_KEY`).

```bash
NEXT_PUBLIC_SUPABASE_URL=https://eddwztmplkgwdijvhfjy.supabase.co   # projet Paris
NEXT_PUBLIC_SUPABASE_ANON_KEY=...                                   # publishable
NEXT_PUBLIC_APP_URL=http://localhost:3000

OCR_PROVIDER=openai          # openai | ollama | claude (stub) | mistral (stub)
OPENAI_API_KEY=...

# Server-only (jamais NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=...   # utilisé par /api/invitations/create-native & /api/invite/*
```

**Sécurité** : ne jamais committer `.env*`, ne jamais exposer la `SERVICE_ROLE_KEY` côté client, et ne jamais l'utiliser depuis une route accessible non-authentifiée sans contrôle d'autorisation explicite.

---

## 4. Arborescence

```
src/
├── app/
│   ├── (auth)/            # login, verify (+ /auth/callback côté api)
│   ├── (onboarding)/      # onboarding/create (pharmacie) + /profile
│   ├── (app)/             # cœur de l'app, layout avec Sidebar/Header
│   │   ├── dashboard/     agenda/  annuaire/  notifications/
│   │   ├── tasks/         (+ board, completed)
│   │   ├── prescriptions/ (+ completed)
│   │   ├── orders/        (+ completed, suppliers)
│   │   ├── rentals/       (+ completed)
│   │   ├── shortages/     (+ resolved)
│   │   ├── procedures/    profile/
│   ├── (admin)/admin/     # RH, paramètres officine (rôle titulaire only)
│   └── api/
│       ├── auth/callback              # échange code OAuth/OTP
│       ├── invite/{accept,complete,lookup,request-magic-link,send-otp}
│       ├── invitations/{create-native,send-email}
│       └── ocr                         # POST → OCR ordonnance
├── components/
│   ├── ui/                # shadcn primitives
│   ├── shared/            # data-table, detail-drawer, kpi-card, status/priority-badge,
│   │                        barcode-scanner, audio-recorder, file-uploader
│   ├── layout/            # sidebar (desktop), header (mobile bottom bar), session-guard, profile-bar
│   ├── tasks/  prescriptions/  orders/  rentals/  shortages/
│   ├── admin/  formation/  profile/  providers/
├── contexts/
│   ├── profile-context.tsx   # ProfileProvider — source unique de useProfile()
│   └── session-context.tsx   # work_sessions actives
├── features/                 # couche métier (services + hooks React Query)
│   ├── tasks/  orders/  prescriptions/  shortages/
│   └── _template/            # squelette pour nouveau domaine
├── hooks/                    # legacy ou non encore migrés en feature/
│   ├── use-{tasks,orders,prescriptions,shortages,session}.ts   # ré-exports vers features/
│   └── use-{contacts,notifications,rentals,training}.ts        # implémentation directe
├── lib/
│   ├── queries/              # accès DB bas niveau (un client par fonction)
│   ├── supabase/             # client, server, middleware, anon, service, route-handler-client
│   ├── ocr/                  # normalize-medication-item, render-pdf-first-page
│   ├── auth/  invite/        # helpers session/invitation
│   ├── agenda-utils.ts  notification-url.ts  utils.ts
├── config/
│   ├── nav.ts                # NAV_GROUPS (labels FR, hrefs EN, rôles)
│   └── constants.ts          # labels enums, PAGINATION_SIZES
├── types/
│   ├── database.types.ts     # généré (manuellement) depuis Supabase
│   └── index.ts              # raccourcis + types composites + types applicatifs
└── proxy.ts                  # middleware Next.js (renommé volontairement)
```

**Note importante** : le fichier middleware Next.js est `src/proxy.ts` (export `proxy` + `config.matcher`). Le nom `middleware.ts` n'est **pas** utilisé à la racine — `src/lib/supabase/middleware.ts` est un helper, pas le middleware Next.

---

## 5. Architecture & couches

```
┌─ app/(routes)/page.tsx ────────────────────────────────────────────────┐
│  Pages "use client" qui consomment des hooks                           │
└────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─ components/<domain>/*.tsx ────────────────────────────────────────────┐
│  UI de domaine. NE DOIT PAS importer @/lib/supabase/* ni @/lib/queries │
│  → garde-fou ESLint (eslint.config.mjs : no-restricted-imports)        │
└────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─ features/<domain>/{hooks,services}/* ─────────────────────────────────┐
│  Hooks React Query + services qui orchestrent les queries.             │
│  Public API exposée via features/<domain>/index.ts UNIQUEMENT.         │
└────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─ lib/queries/*.ts ─────────────────────────────────────────────────────┐
│  Accès Supabase. Chaque fonction crée son propre client                │
│  ( const supabase = createClient() ). Retourne QueryResult<T>.         │
└────────────────────────────────────────────────────────────────────────┘
```

Migration en cours : `tasks`, `orders`, `prescriptions`, `shortages` passent par `features/`. Les autres modules (`rentals`, `notifications`, `contacts`, `training`, `sessions`) sont encore en `src/hooks/use-*.ts` direct. **Quand tu ajoutes/refactores un domaine, calque-toi sur le pattern `features/_template/`** plutôt que d'agrandir `src/hooks/`.

**Providers** (`src/components/providers/app-providers.tsx`) :
```
<QueryProvider>
  <ProfileProvider>
    <SessionProvider>{children}</SessionProvider>
  </ProfileProvider>
</QueryProvider>
```

---

## 6. Auth & flux utilisateur

- **OTP email** (code 8 chiffres / magic link). Pas de mot de passe.
- Le middleware `src/proxy.ts` :
  1. injecte la session Supabase via `updateSession()` ;
  2. autorise `PUBLIC_ROUTES = ['/login', '/verify', '/auth/callback', '/api/auth/callback']` + tout `/api/invite/*` ;
  3. force la redirection vers `/onboarding/create` si l'utilisateur n'a pas de `pharmacy_id` ;
  4. force `/onboarding/profile` si `first_name`/`last_name` manquent (ne se base **pas** sur `user_metadata.profile_complete` seul — voir le commentaire dans `proxy.ts`) ;
  5. interdit l'accès à `/onboarding/*` une fois onboardé.
- **Invitations** : flux distinct côté `/api/invite/*` + `lib/invite/post-invite-complete.ts`. Le `ProfileContext` réessaie automatiquement `/api/invite/complete` une fois si l'utilisateur connecté n'a pas encore de `pharmacy_id` (rattrapage cookie/JWT).

---

## 7. Schéma Supabase (résumé)

Voir `supabase.sql` (snapshot lisible) et `supabase/migrations/*.sql` pour l'historique.

**Tables principales** : `pharmacies`, `profiles`, `invitations`, `work_sessions`, `tasks`, `prescriptions` + `prescription_items` + `prescription_comments`, `suppliers`, `orders` + `order_items`, `rentals`, `shortages`, `notifications`, `contacts` (annuaire), `training_resources`, `medications` (BDPM), `drug_shortages` (ANSM).

**Enums** (valeurs canoniques, alignées avec `src/types/index.ts` et `src/config/constants.ts`) :

```
user_role            titulaire | adjoint | preparateur
task_status          todo | done | cancelled                  ← in_progress retiré (mig. 0013)
task_priority        low | medium | high
prescription_status  to_serve | served | expired | on_hold
order_status         draft | sent | received
rental_status        active | returned | overdue
rental_billing_type  daily | (autres)
shortage_status      open | substitute_found | resolved
notification.type    task_assigned | shortage_reported | handover_note   (CHECK text, pas un enum)
```

**Realtime** publié sur `public.notifications` et `public.work_sessions`.

**Storage** : buckets `prescriptions`, `training-files`, `attachments` (avec un schéma de chemin `temp/tasks/{uuid}` → `{pharmacy_id}/tasks/{task_id}/{file}` géré dans `lib/queries/tasks.ts`).

**RLS** : activée sur toutes les tables métier avec policy `pharmacy_id = get_pharmacy_id()`. Une policy `notifications_delete` a été ajoutée pendant l'audit. ⚠️ Voir §10 pour les zones à durcir avant prod.

**Migrations** :
- `0001` → `0017` versionnées dans `supabase/migrations/`.
- ⚠️ **Drift de numérotation** : deux fichiers `0017_*` coexistent (`0017_rework_sessions.sql` et `0017_add_task_attachments.sql`). Ne plus créer de nouvelles migrations avec un numéro déjà pris ; utiliser `0018+`.

---

## 8. Règles absolues — à ne jamais enfreindre

Ces règles ont été établies au fil du MVP et sont déjà partiellement appliquées par ESLint :

### Imports
- `useProfile` ⇒ **toujours** depuis `@/contexts/profile-context`. Jamais depuis un éventuel `@/hooks/use-profile`.
- Les types métier ⇒ **toujours** depuis `@/types/index`. Pas depuis `@/types/database.types`.
- Toasts ⇒ `import { toast } from 'sonner'`. **Jamais** `useToast`/`useSonner`.
- Dans `components/{tasks,orders,prescriptions,shortages}/**` : **interdit** d'importer `@/lib/supabase/*` ou `@/lib/queries/*` (règle ESLint `no-restricted-imports`). Passer par `@/features/<domain>`.

### Queries (`lib/queries/*.ts`)
- Chaque fonction instancie son propre client : `const supabase = createClient()`. **Pas** de paramètre `client: SupabaseClient`.
- Retour : `QueryResult<T> = { data: T; error: null } | { data: null; error: string }`. **Pas** d'objet `{ message, code, details }`.
- Side-effects côté DB (ex. notifications sur assignation de tâche) restent dans la query, pas dans le composant.

### created_by / reported_by
- L'`auth.getUser()` se fait dans le **handler** (`async`), pas au niveau du composant.
- Payloads concernés : `orders.created_by`, `tasks.created_by`, `prescriptions.created_by`, `rentals.created_by`, `shortages.reported_by`.

### Composants partagés
- `DataTable` : les colonnes utilisent `header` (jamais `label`). Signature `render: (value, row) => ReactNode` — **pas** `(row)`.
- `StatusBadge` et `PriorityBadge` reçoivent directement l'enum : `<StatusBadge status={item.status} />`.
- **Création ET détail : toujours `DetailDrawer` (bar latérale, `open`/`onClose`/`title`/`actions`/`width`).** Convention actée le 2026-06-16 : aucun formulaire de création d'entité ne doit s'ouvrir dans un `Dialog` central — c'est le drawer latéral sur desktop, partout (orders, prescriptions, rentals, shortages, procedures…). Ne PAS utiliser `centeredOnDesktop` pour la création (= latéral). `Dialog`/`DialogContent` shadcn reste réservé aux petites confirmations/sélecteurs ponctuels (ex. `supplier-dialog`), jamais à un formulaire de création.
- Les **pièces jointes** (photos/mémo/documents) s'ajoutent **dès la création**, pas seulement à l'édition : pattern temp-buffer `temp/{domain}/{uuid}` uploadé pendant la saisie, puis déplacé vers `{entity}/{id}/…` à la création (cf. `tasks`/`orders`).

### UI / i18n
- **Labels FR**, dans `src/config/constants.ts` ou colocalisés. **Routes EN** (`/tasks`, `/prescriptions`, etc.).
- Police : Poppins (300/400/500/600/700) chargée localement, variable `--font-poppins`.
- Mobile-first : `<Sidebar>` masquée < lg, header mobile = barre flottante + bottom bar. La nav `Agenda` est `desktopOnly: true`.

### Style des changements
- Pas de fichier de doc additionnel sauf demande explicite.
- Pas de commentaires "ce que fait le code" — uniquement le *pourquoi* non-obvious (voir `proxy.ts` pour un bon exemple).
- Éviter les abstractions prématurées ; trois lignes similaires valent mieux qu'une mauvaise factorisation.

---

## 9. Conventions & patterns récurrents

### Query function (`lib/queries/`)

```ts
import { createClient } from '@/lib/supabase/client'
import type { QueryResult } from '@/types/index'

export async function getItems(pharmacyId: string): Promise<QueryResult<Item[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('items').select('*').eq('pharmacy_id', pharmacyId)
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
```

### Hook feature (`features/<domain>/hooks/`)

```ts
'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfile } from '@/contexts/profile-context'
import { tasksService } from '@/features/tasks/services/tasks.service'

export function useTasks() {
  const { pharmacy } = useProfile()
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['tasks', pharmacy?.id],
    enabled: !!pharmacy?.id,
    queryFn: async () => {
      const r = await tasksService.getTasks(pharmacy!.id)
      if (r.error) throw new Error(r.error)
      return r.data ?? []
    },
  })
  // mutations… invalident ['tasks', pharmacy?.id]
}
```

### Création avec `created_by`

```ts
const handleSubmit = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await createItem({ pharmacy_id: pharmacy!.id, created_by: user.id, ...form })
}
```

---

## 10. Roadmap technique avant bêta

Issues connues à traiter (sources : `analyse-critique-mvp.md`, `Pharmaworkspace_AUDIT_REPORT.md`, lecture du code) :

**Sécurité / data**
- [ ] Vérifier RLS sur `pharmacies` et `profiles` (historiquement désactivés au MVP) et confirmer que les policies actuelles couvrent bien lecture/écriture cross-tenant.
- [ ] Auditer toutes les routes `/api/invite/*` et `/api/invitations/*` qui utilisent `SUPABASE_SERVICE_ROLE_KEY` — chaque route doit valider explicitement l'autorisation.
- [ ] Consolider les policies dupliquées (résidu des migrations itératives).
- [ ] Process de drift schéma (check mensuel ou avant release).

**Qualité code**
- [ ] Ajouter `typecheck` (`tsc --noEmit`) et `format` (Prettier) dans `package.json` + CI.
- [ ] Mettre en place une suite de tests (aucun framework installé à ce jour). `features/_template/__tests__/` est prêt à l'emploi.
- [ ] Automatiser la génération de `src/types/database.types.ts` (`supabase gen types` en CI) — c'est aujourd'hui maintenu à la main.
- [ ] Résoudre le drift `0017_*` : renommer ou archiver, et documenter une convention de numérotation.

**Produit**
- [ ] Tests de charge OCR multi-pages (cf. `pharmaworkspace-status.md`).
- [ ] Recherche dans les listes + pagination serveur (les `PAGINATION_SIZES` existent mais pas la pagination réelle).
- [ ] Notifications "tâches en retard" (le système de notifs existe, le déclencheur manque).
- [ ] Export / impression (ordonnances, commandes).
- [ ] Job hebdo de refresh BDPM/ANSM.

**Architecture**
- [ ] Migrer les modules restants (`rentals`, `notifications`, `contacts`, `training`, `sessions`) sous `features/` pour homogénéiser.
- [ ] Étendre la règle ESLint `no-restricted-imports` à ces modules une fois migrés.

---

## 11. Notes pratiques pour Claude Code
- **Langue de réponse** : FR par défaut. Le code et les identifiants restent EN.
- **Avant TOUTE opération qui touche la DB Supabase (migration, ALTER, CREATE TABLE, RLS policy, bucket storage, extension)** : **lire `supabase/MIGRATIONS_GUARDRAILS.md` en premier**. Sans exception. C'est le document de référence pour éviter le schema drift qui a coûté 2 jours en mai 2026.
- **Avant toute modif `types/index.ts`** : vérifier la cohérence avec `database.types.ts` et les enums du §7.
- **Avant d'ajouter un toast/dialog/drawer** : passer par les primitives `shared/` existantes (cf. §8 "Composants partagés").
- **Tester l'UI** : `npm run dev` puis valider le golden path manuellement. Pas de Playwright/Vitest câblé pour le moment.

---

## 12. Migrations Supabase — Règles ABSOLUES

**Avant toute opération DB, lire `supabase/MIGRATIONS_GUARDRAILS.md` intégralement.** Ce qui suit en est l'extrait minimal :

1. **Toute modification de schéma passe par un fichier dans `supabase/migrations/`.** Pas de `CREATE TABLE`/`ALTER TABLE`/`CREATE POLICY` dans le Dashboard SQL Editor. Sans exception.
2. **Numéro de migration** : à claimer dans `COORDINATION.md` §5 AVANT de créer le fichier.
3. **Idempotence** : `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS … CREATE POLICY …`, etc.
4. **Ne JAMAIS éditer une migration déjà appliquée.** Si fix nécessaire : nouvelle migration corrective.
5. **Avant `CREATE TABLE`** : vérifier sur prod (`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`) que la table n'existe pas déjà. Si elle existe → c'est du drift, à réparer via migration repair (cf. Règle 7 du guard rails), pas à créer.
6. **Tester local (`supabase db reset`) puis staging (`db push`) AVANT prod.**
7. **Régénérer `supabase.sql`** après chaque migration mergée.

Si Claude Code propose une opération DB qui viole une de ces règles → **refuser et exiger une migration**. C'est exactement comme ça que le drift `notifications`/`prescription_items`/`drug_shortages` est arrivé en prod.