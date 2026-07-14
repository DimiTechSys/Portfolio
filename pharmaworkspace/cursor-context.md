# PharmaWorkspace — Document de contexte agent Cursor

## Vue d'ensemble

PharmaWorkspace est une application SaaS B2B pour officines pharmaceutiques françaises.
Stack : Next.js 16 App Router, Supabase (PostgreSQL + Auth OTP), Tailwind CSS, shadcn/ui, Vercel.
Projet Supabase : eddwztmplkgwdijvhfjy.supabase.co (région Paris)

---

## Stack technique

- **Framework** : Next.js 16.2 App Router (Turbopack)
- **Auth** : Supabase OTP email (code 8 chiffres, pas de mot de passe)
- **Base de données** : Supabase PostgreSQL avec RLS
- **UI** : Tailwind CSS + shadcn/ui
- **Toasts** : sonner (jamais useToast)
- **Déploiement** : Vercel

---

## Architecture du projet

```
src/
├── app/
│   ├── (auth)/          login, verify, invite/[token]
│   ├── (onboarding)/    onboarding, create, profile
│   ├── (app)/           dashboard, tasks, prescriptions, orders, rentals, shortages
│   ├── (admin)/         admin, admin/settings
│   └── api/             auth/callback, invite
├── components/
│   ├── layout/          header, sidebar, session-guard
│   ├── shared/          data-table, detail-drawer, kpi-card, status-badge, priority-badge
│   ├── tasks/           task-table, task-drawer, task-form, task-kanban
│   ├── prescriptions/   prescription-table, prescription-drawer, prescription-form
│   ├── orders/          order-table, order-drawer, order-form, supplier-dialog
│   ├── rentals/         rental-table, rental-drawer, rental-form
│   ├── shortages/       shortage-table, shortage-drawer, shortage-form
│   ├── admin/           members-table, invite-dialog, pharmacy-settings-form
│   └── dashboard/       handover-note
├── contexts/
│   └── profile-context.tsx   ← source unique de useProfile (ProfileProvider)
├── hooks/
│   ├── use-tasks.ts
│   ├── use-prescriptions.ts
│   ├── use-orders.ts
│   ├── use-rentals.ts
│   ├── use-shortages.ts
│   └── use-session.ts
├── lib/
│   ├── queries/         sessions, tasks, prescriptions, orders, rentals, shortages, admin
│   └── supabase/        client, server, middleware
├── types/
│   ├── database.types.ts
│   └── index.ts
└── proxy.ts             middleware Next.js (renommé depuis middleware.ts)
```

---

## Règles absolues — ne jamais enfreindre

### Imports
- `useProfile` vient **toujours** de `@/contexts/profile-context` — jamais de `@/hooks/use-profile`
- Types viennent de `@/types/index` — jamais de `@/types/database.types`
- Toasts : `import { toast } from 'sonner'` — jamais `useToast`

### Queries Supabase
- Chaque fonction dans `lib/queries/*.ts` crée son propre client : `const supabase = createClient()`
- Jamais de paramètre `client: SupabaseClient` dans les fonctions query
- Return type : `QueryResult<T>` où `error` est `string | null` — jamais `{ message, code, details }`

### DataTable
- Les colonnes utilisent `header` (jamais `label`)
- Les fonctions `render` ont la signature `(value: unknown, row: T) => ReactNode` — jamais `(row: T)`

### Enums — valeurs anglaises uniquement
```
task_status:         todo | done | cancelled
task_priority:       low | medium | high
prescription_status: to_serve | served | expired | on_hold
order_status:        draft | sent | received
rental_status:       active | returned | overdue
shortage_status:     open | substitute_found | resolved
user_role:           titulaire | adjoint | preparateur
handover_target:     today | tomorrow
```

### created_by / reported_by
- Toujours récupérer `user.id` dans le handler avec `createClient().auth.getUser()`
- Jamais au niveau du composant en dehors d'une fonction async
- `orders.created_by`, `tasks.created_by`, `prescriptions.created_by`, `rentals.created_by`, `shortages.reported_by`

---

## Schéma de la base de données

### Tables

```sql
pharmacies       id, name, finess, address, logo_url, created_at
profiles         id (→ auth.users), pharmacy_id, role, first_name, last_name, display_name, avatar_url, created_at
invitations      id, pharmacy_id, email, role, token, accepted_at, expires_at, created_at
work_sessions    id, user_id, pharmacy_id, started_at, ended_at, handover_note, handover_target, tasks_completed, created_at
tasks            id, pharmacy_id, created_by, assigned_to, completed_in_session, title, description, status, priority, due_date, completed_at, created_at, updated_at
prescriptions    id, pharmacy_id, created_by, patient_ref, status, priority, execution_date, missing_products, notes, created_at, updated_at
prescription_comments  id, prescription_id, pharmacy_id, author_id, content, created_at
suppliers        id, pharmacy_id, name, contact_name, phone, email, notes, created_at
orders           id, pharmacy_id, supplier_id, created_by, status, notes, ordered_at, received_at, created_at, updated_at
order_items      id, order_id, pharmacy_id, product_name, quantity, unit_price, is_shortage
rentals          id, pharmacy_id, created_by, client_name, client_phone, equipment, status, started_at, expected_return, returned_at, deposit, notes, created_at, updated_at
shortages        id, pharmacy_id, reported_by, resolved_by, linked_prescription_id, product_name, status, substitute, notes, created_at, updated_at
```

### RLS
- `pharmacies` et `profiles` : RLS **désactivé** pour le MVP
- Toutes les autres tables : RLS activé avec policies `pharmacy_id = get_pharmacy_id()`

---

## Types TypeScript clés

```typescript
// Depuis @/types/index.ts
type UserRole = 'titulaire' | 'adjoint' | 'preparateur'
type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high'
type PrescriptionStatus = 'to_serve' | 'in_progress' | 'served' | 'expired' | 'on_hold'
type OrderStatus = 'draft' | 'sent' | 'received' | 'cancelled'
type RentalStatus = 'active' | 'returned' | 'overdue'
type ShortageStatus = 'open' | 'substitute_found' | 'resolved'
type HandoverTarget = 'today' | 'tomorrow'

type QueryResult<T> = { data: T; error: null } | { data: null; error: string }

interface Profile {
  id: string
  pharmacy_id: string | null
  role: UserRole
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

interface Pharmacy {
  id: string
  name: string
  finess: string | null
  address: string | null
  logo_url: string | null
  created_at: string
}

// useProfile() retourne :
type UserContext = {
  profile: Profile | null
  pharmacy: Pharmacy | null
  role: UserRole | null
  isAdmin: boolean      // role === 'titulaire'
  canWrite: boolean     // role === 'titulaire' || role === 'adjoint'
  loading: boolean
  signOut: () => Promise<void>
  refetch: () => Promise<void>
}
```

---

## Patterns de code à respecter

### Query function
```typescript
// src/lib/queries/exemple.ts
import { createClient } from '@/lib/supabase/client'
import type { QueryResult } from '@/types/index'

export async function getItems(pharmacyId: string): Promise<QueryResult<Item[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
  
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
```

### Hook
```typescript
// src/hooks/use-exemple.ts
'use client'
import { useCallback, useEffect, useState } from 'react'
import { useProfile } from '@/contexts/profile-context'
import { getItems } from '@/lib/queries/exemple'

export function useItems() {
  const { pharmacy } = useProfile()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!pharmacy?.id) return
    setLoading(true)
    const result = await getItems(pharmacy.id)
    if (result.error) setError(result.error)
    else setItems(result.data)
    setLoading(false)
  }, [pharmacy?.id])

  useEffect(() => { fetchItems() }, [fetchItems])

  return { items, loading, error, refresh: fetchItems }
}
```

### DataTable column
```typescript
const columns: Column<MyType>[] = [
  {
    key: 'name',
    header: 'Nom',          // ← header, pas label
    sortable: true,
    render: (_value, row) => <span>{row.name}</span>,  // ← (value, row)
  },
]
```

### Création avec created_by
```typescript
const handleSubmit = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const payload = {
    pharmacy_id: pharmacy!.id,
    created_by: user.id,     // ← toujours récupéré ici
    ...formData,
  }
  await createItem(payload)
}
```

### Layout avec ProfileProvider
```typescript
// Les deux layouts (app) et (admin) wrappent avec ProfileProvider
import { ProfileProvider, useProfile } from '@/contexts/profile-context'

function LayoutInner({ children }) {
  const { profile, signOut } = useProfile()
  return <div>...</div>
}

export default function Layout({ children }) {
  return (
    <ProfileProvider>
      <LayoutInner>{children}</LayoutInner>
    </ProfileProvider>
  )
}
```

---

## État actuel du MVP

### Fonctionnel ✅
- Auth OTP email complet (login → verify → dashboard)
- Onboarding titulaire (create pharmacy → profile)
- Dashboard avec KPIs et notes de transmission
- Module Tâches (liste + kanban + drawer)
- Module Ordonnances (liste + drawer + commentaires)
- Module Commandes (liste + drawer + fournisseurs)
- Module Locations (liste + drawer)
- Module Ruptures (liste + drawer)
- Admin Équipe (membres + invitations)
- Admin Paramètres officine
- Session de travail (démarrer / clôturer avec note de transmission)
- ProfileContext partagé (performance optimisée)

### Connu à améliorer
- Page `/invite/[token]` — flux d'acceptation d'invitation à valider
- RLS pharmacies/profiles à réactiver après validation complète
- `src/app/api/invite/route.ts` — à remplacer par version sans `getInviteByToken`
- Latence Supabase côté client (normale pour MVP, à optimiser en V2 avec React Query)

---

## Conventions UI

- Pas de `useToast` — utiliser `toast.success()`, `toast.error()` de sonner
- `StatusBadge` accepte directement le status enum : `<StatusBadge status={item.status} />`
- `PriorityBadge` accepte directement la priorité : `<PriorityBadge priority={item.priority} />`
- Dialogs de création : pattern `Dialog > DialogContent > DialogHeader + Form`
- Drawers de détail : utiliser `DetailDrawer` avec props `open`, `onClose`, `title`, `actions`
- Labels en français dans les constantes de `src/config/constants.ts`
- Routes en anglais : `/tasks`, `/prescriptions`, `/orders`, `/rentals`, `/shortages`, `/admin`
