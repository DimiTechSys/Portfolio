# TODO DEV — PharmaWorkspace Bêta Sprint 1

> **Pour qui** : le dev qui épaule Mehdi (toi).
> **Comment** : ouvre Claude Code à la racine du repo `pharmaworkspace/`, lis ce document en entier AVANT de commencer, puis attaque les tickets dans l'ordre indiqué.
> **Important** : Mehdi te fait confiance, mais il valide TOUT ton diff avant merge. Tu lui ouvres une PR à chaque ticket.
> **Légende des emojis** : 🔴 = sur ce ticket, Mehdi doit intervenir (créer un compte externe, te donner une clé, valider une décision, ou coordonner un handoff). Si tu vois 🔴, vérifie qu'il a fait sa part AVANT de démarrer.
> Mis à jour : 18 mai 2026.

---

## ⚠️ GARDE-FOUS — LIS ÇA D'ABORD

### Règles non négociables

1. **Tu ne touches QUE les fichiers listés dans le périmètre du ticket.** Si tu vois un truc moche ailleurs, tu notes dans un commentaire de PR mais tu ne corriges pas. Refactoring opportuniste = source de bugs.

2. **Tu ne touches JAMAIS** :
   - `src/app/api/ocr/route.ts` (Mehdi)
   - `src/app/api/invitations/**` (Mehdi)
   - `src/app/api/invite/**` (Mehdi)
   - `src/app/api/auth/callback/route.ts` (Mehdi)
   - `src/proxy.ts` (middleware, Mehdi)
   - `src/lib/supabase/service.ts` (service role, Mehdi)
   - `src/contexts/profile-context.tsx` (Mehdi sauf consigne explicite)
   - Toute migration SQL existante (`supabase/migrations/0001_*.sql` à `0025_*.sql`)
   - Le fichier `.env.local` ou `.env` (jamais commit)

3. **Tu lances OBLIGATOIREMENT** avant chaque PR :
   ```bash
   npm run lint
   npm run build
   ```
   Les **deux** doivent être verts. Si ça casse, tu n'ouvres pas la PR.

4. **Tu respectes les conventions §8 de CLAUDE.md** (lis-le en premier) :
   - Pas d'import depuis `@/lib/supabase/*` ni `@/lib/queries/*` dans `components/{tasks,orders,prescriptions,shortages}/**` — passe par `@/features/<domain>`.
   - `useProfile` toujours depuis `@/contexts/profile-context`.
   - Toasts : `import { toast } from 'sonner'` uniquement.
   - Routes EN, labels FR.

5. **Si Claude Code te propose une "refonte" ou un "refactor global"** : tu refuses. Tu lui demandes de rester dans le périmètre exact du ticket. Si tu n'arrives pas à le contraindre, tu arrêtes et tu pingues Mehdi.

6. **Migration SQL** : numéro à partir de `0026`, mais **vérifie d'abord ton allocation dans `COORDINATION.md` §5**. Toi : 0026, 0027, 0029. Mehdi : 0028, 0030, 0031, 0032, 0033.

7. **Si tu hésites** : tu pingues Mehdi avant de coder. Mieux vaut perdre 10 min à clarifier que 2h à défaire un truc cassé.

### Workflow Git

```bash
# Pour chaque ticket
git checkout develop && git pull
git checkout -b feat/p2-XX-short-name      # ou fix/, chore/, refactor/

# ... code ...

npm run lint && npm run build               # OBLIGATOIRE
git add . && git commit -m "[P2-XX] description courte"
git push -u origin feat/p2-XX-short-name

# Ouvre une PR avec : description + checklist acceptance + screenshot/test manuel
```

---

## Setup session Claude Code

À chaque nouvelle session, **commence par ce prompt système** :

```
Tu travailles sur PharmaWorkspace, SaaS B2B pour officines françaises.

Lis ABSOLUMENT d'abord, dans cet ordre :
1. CLAUDE.md (conventions techniques absolues, §8 surtout)
2. TODO_DEV.md (ce document, mes tickets en cours)
3. Le ticket spécifique que je vais te donner (P2-XX)

Règles non négociables :
- Tu ne touches QUE les fichiers listés dans le périmètre du ticket.
- Tu ne touches JAMAIS : src/app/api/ocr/, /invitations/, /invite/, /auth/callback/, src/proxy.ts, src/lib/supabase/service.ts, src/contexts/profile-context.tsx, ni aucune migration existante.
- Pas de refactor prématuré. Pas d'abstraction "préventive". Trois lignes similaires > une mauvaise abstraction.
- Respecte CLAUDE.md §8 (imports, queries, components, toasts).
- Avant de me dire "fini" : npm run lint && npm run build doivent passer.
- Si tu hésites entre 2 approches : tu me demandes. Ne décide pas seul.

Réponds en français, code en anglais. Confirme que tu as lu CLAUDE.md avant qu'on attaque.
```

---

## Ordre d'exécution recommandé Sprint 1 (2 semaines)

Ces tickets sont **indépendants** (pas de dépendance entre eux), tu peux les faire dans cet ordre ou en parallèle si tu te sens à l'aise :

1. **P2-09** — `package.json` ajout script typecheck (15 min — échauffement)
2. **P2-15** — Dependabot config (15 min)
3. **P2-10** 🔴 — GitHub Actions CI lint + typecheck + build (½j) — Mehdi doit avoir ajouté les secrets Supabase
4. **P2-14** — Headers de sécurité dans `next.config.ts` (½j)
5. **P2-11** 🔴 — Intégration Sentry (½j) — Mehdi doit avoir créé le compte Sentry et te donné le DSN
6. **P1-05** 🔴 — Buckets storage en privé (migration SQL — 1j) ⚠️ critique, coordination handoff avec Mehdi
7. **P2-12** — Vitest setup + 5 tests basiques (1j)
8. **P2-05** + **P2-06** 🔴 — Cron jobs notifications retards (1j) — Mehdi doit avoir activé pg_cron
9. **P2-17** — Sortir `work_sessions` du Realtime (½j)
10. **P2-13** — Playwright golden paths (2j)

Semaine 3-4 :
- **P2-03** — Recherche full-text serveur (3j)
- **P2-04** — Pagination keyset (2j)
- **P2-01** — Polish onboarding wizard 4 étapes (3j) — voir nouvelles specs avec step 4 CB activation (consommation endpoint Stripe Mehdi P4-13b)

---

# TICKETS DÉTAILLÉS

---

# 🆕 NOUVEAUX TICKETS — à attaquer 

> **Ordre recommandé** : TECH-12 (critique business) → **ONBOARD-01 (activation)** → TECH-10 → TECH-11 → BADGE-01 → PLAN-01 → CHAT-01.
> Note : la mission #6 d'ONBOARD-01 (« écrire un message dans le salon ») suppose CHAT-01 mergé. Tant que CHAT-01 n'est pas livré, la mission reste masquée via un feature flag local (`MISSIONS_REQUIRE_CHAT = false`) que Dim retire au merge de CHAT-01.

---

## 🔴 TECH-12 — Enforcer la limite d'utilisateurs selon le tier d'abonnement (CRITIQUE BÊTA)

### Pourquoi ce ticket
Le business model PharmaWorkspace repose sur 3 tiers définis dans les CGS (`prod/legal/conditions-generales.md` §5.1) et matérialisés par `pharmacies.subscription_tier` (migration 0042 PR #61) :

| Tier | Limite | Tarif Early Adopter HT/mois |
|---|---|---|
| `solo` | ≤ 3 utilisateurs | 23,40 € |
| `equipe` | 4-8 utilisateurs | 47,40 € |
| `grande` | 9+ utilisateurs | 77,40 € |

**Aujourd'hui, aucune limite n'est enforced.** L'endpoint `/api/invitations/create-native/route.ts` n'effectue aucun comptage des membres actifs et accepte de créer une 4ᵉ invitation sur un compte Solo. Conséquence : business model cassé silencieusement dès le premier pilote qui dépasse son tier. Ce ticket pose la garde-fou côté serveur et l'UX d'avertissement côté client.

**Branche** : `feat/tech-12-enforce-tier-user-limit`
**Estimation** : ½ jour
**Risque** : faible (logique additive sur un endpoint existant).
**Prerequisites** : TECH-10 mergé idéalement (pour que les nouveaux rôles soient inclus dans le count) — sinon adapter au scope actuel.

### Fichiers à modifier / créer
- `src/lib/subscription.ts` — ajouter `getMemberLimit(tier)` et `getCurrentMemberCount(supabase, pharmacyId)` helpers (le fichier existe déjà depuis P4-13)
- `src/app/api/invitations/create-native/route.ts` — ajouter la vérification de limite avant `inviteUserByEmail`
- `src/components/team/team-page.tsx` ou équivalent (chercher la page `/team`) — bannière d'avertissement à 80 % / blocage à 100 %
- `src/components/onboarding/invite/onboarding-invite-step.tsx` (l'étape 3 du wizard P2-01) — pré-désactiver les champs supplémentaires si tier Solo et déjà N membres
- Pas de migration nécessaire (la donnée `subscription_tier` existe déjà)
- Aucun fichier juridique à modifier — les CGS § 5.1 documentent déjà les limites

### À faire

1. **Helpers `src/lib/subscription.ts`** :

   ```ts
   export const TIER_LIMITS: Record<SubscriptionTier, number> = {
     solo: 3,
     equipe: 8,
     grande: Number.POSITIVE_INFINITY,
   }

   export function getMemberLimit(tier: SubscriptionTier | null): number {
     if (!tier) return TIER_LIMITS.solo // défaut conservateur tant que le tier n'est pas saisi
     return TIER_LIMITS[tier]
   }

   export async function getCurrentMemberCount(
     supabase: SupabaseClient,
     pharmacyId: string
   ): Promise<number> {
     // Compte les profiles actifs + les invitations 'pending' (toute invitation pending est un user qui va arriver)
     const { count: activeMembers } = await supabase
       .from('profiles')
       .select('id', { count: 'exact', head: true })
       .eq('pharmacy_id', pharmacyId)

     const { count: pendingInvites } = await supabase
       .from('invitations')
       .select('id', { count: 'exact', head: true })
       .eq('pharmacy_id', pharmacyId)
       .eq('status', 'pending')

     return (activeMembers ?? 0) + (pendingInvites ?? 0)
   }

   export function canInviteMore(tier: SubscriptionTier | null, currentCount: number): boolean {
     return currentCount < getMemberLimit(tier)
   }
   ```

   Vérifier les noms exacts des tables `profiles` et `invitations` selon le schéma actuel (sinon adapter).

2. **Garde dans `/api/invitations/create-native/route.ts`** — juste après l'auth check du titulaire et avant l'appel `inviteUserByEmail` :

   ```ts
   // Vérification limite tier
   const { data: pharmacy } = await admin
     .from('pharmacies')
     .select('subscription_tier')
     .eq('id', user.pharmacy_id)
     .single()

   const currentCount = await getCurrentMemberCount(admin, user.pharmacy_id)

   if (!canInviteMore(pharmacy?.subscription_tier ?? null, currentCount)) {
     return NextResponse.json(
       {
         error: 'tier_limit_reached',
         message: `Votre formule ${pharmacy?.subscription_tier ?? 'Solo'} est limitée à ${getMemberLimit(pharmacy?.subscription_tier ?? null)} utilisateurs. Mettez à niveau votre abonnement pour inviter davantage de collaborateurs.`,
         current_count: currentCount,
         tier_limit: getMemberLimit(pharmacy?.subscription_tier ?? null),
         current_tier: pharmacy?.subscription_tier ?? 'solo',
       },
       { status: 409 }
     )
   }
   ```

3. **UI page `/team`** — au-dessus de la liste des membres, afficher une bannière conditionnelle :
   - Si `currentCount / limit >= 0.8` et `< 1.0` → bannière **jaune** : « Vous avez utilisé X sur Y emplacements de votre formule {tier_label}. [Passer à la formule supérieure] »
   - Si `currentCount / limit >= 1.0` → bannière **rouge** + bouton invitation grisé : « Limite atteinte : X/Y utilisateurs. [Mettre à niveau l'abonnement] »
   - Le bouton « Mettre à niveau » pointe vers le Stripe Customer Portal (`POST /api/stripe/portal` existant depuis PR #61) → l'utilisateur change son tier depuis le portail Stripe → webhook `customer.subscription.updated` met à jour `subscription_tier` automatiquement.

4. **Étape 3 wizard onboarding `/onboarding/invite`** (parcours titulaire) — si tier Solo et 1 titulaire déjà créé → afficher max 2 champs email (3 - 1 = 2). Si tier Équipe → max 7 champs. Si Grande → pas de limite affichée (mais quand même borne à 9 visuellement, sinon UX confuse).

5. **Tests** :
   - Vitest sur `canInviteMore` : combos tier × count.
   - Playwright (étendre un golden path team) : tier Solo, inviter 2 personnes → ok, 3ᵉ → 409 + bannière rouge visible.

### Ne PAS toucher
- Le webhook Stripe (déjà géré en PR #61).
- La logique de Stripe Customer Portal (déjà en place).
- Les RLS sur `pharmacies` (les nouveaux helpers utilisent service role via l'endpoint).

### Acceptance
- [ ] Helpers `getMemberLimit`, `getCurrentMemberCount`, `canInviteMore` dans `src/lib/subscription.ts` + tests Vitest.
- [ ] Endpoint `/api/invitations/create-native` retourne 409 `tier_limit_reached` quand la limite est atteinte.
- [ ] Page `/team` affiche la bannière jaune à 80 % et rouge + bouton grisé à 100 %.
- [ ] Wizard `/onboarding/invite` borne dynamiquement le nombre de champs email selon le tier.
- [ ] Bouton « Mettre à niveau » ouvre le Customer Portal Stripe.
- [ ] Test Playwright tier Solo → 3 invitations OK, 4ᵉ refusée avec message.
- [ ] `npm run lint && npm run typecheck && npm run build && npm run test` verts.

### Prompt Claude Code
```
Ticket TECH-12 (TODO_DEV.md). Enforcer la limite d'utilisateurs selon subscription_tier.

Lis CLAUDE.md §8, TODO_DEV.md ticket TECH-12 en entier, src/lib/subscription.ts existant (livré P4-13 PR #61), src/app/api/invitations/create-native/route.ts existant.

Vérifie d'abord :
- Le nom exact des tables : `grep -rn "from('profiles')" src/lib/queries 2>/dev/null | head -3` et idem pour `invitations`.
- L'enum SubscriptionTier dans subscription.ts.

Plan en 5 étapes (diff par étape, je valide) :
1. Étendre src/lib/subscription.ts avec TIER_LIMITS + getMemberLimit + getCurrentMemberCount + canInviteMore
2. Tests Vitest sur ces helpers (table de cas tier × count)
3. Garde dans /api/invitations/create-native (409 tier_limit_reached)
4. Bannière conditionnelle sur /team (jaune 80 %, rouge 100 %)
5. Limitation dynamique des champs email dans /onboarding/invite

Contraintes :
- AUCUNE migration nécessaire (subscription_tier existe depuis 0042).
- Compter les profiles + invitations 'pending' (les invitations en cours comptent).
- Le bouton "Mettre à niveau" appelle POST /api/stripe/portal (déjà mergé).
- Tier Grande équipe = infinity (mais limiter visuellement à 9 dans l'UI sinon UX confuse).
- Default conservateur si tier NULL : limite Solo (3).

À la fin : tests + test manuel tier Solo avec 3 membres → 4ᵉ invitation → 409 + bannière + bouton grisé.
```

---

## 🟠 ONBOARD-01 — Missions d'activation in-app (wizard + dashboard, composant partagé)

### Pourquoi ce ticket
L'enquête menée auprès de 54 pharmaciens (mai 2026) confirme deux choses : le pain N°1 du marché est « l'information qu'un collègue a en tête mais qui n'est écrite nulle part » (93 % des officines concernées), et le frein N°1 à l'adoption d'un nouvel outil n'est pas le prix mais **l'adhésion de l'équipe** (39 % des répondants). On a besoin d'un mécanisme produit qui (a) **pousse l'utilisateur à exécuter les actions clés dans les 7 premiers jours**, (b) **rend la progression visible à toute l'équipe partagée**, (c) **est mesurable côté PostHog** pour qu'on sache où les comptes décrochent.

Plutôt qu'un PDF kit onboarding lu une fois et oublié, on intègre un système de **missions d'activation interactives** qui démarre au wizard et continue sur le dashboard avec le même composant visuel. Chaque mission se coche automatiquement quand l'action correspondante est effectuée dans l'app (pas de coche manuelle). Pattern éprouvé chez Linear, Notion et Stripe.

Conséquence : le « PDF Kit onboarding » est retiré du périmètre Mehdi et remplacé par cette feature produit.

**Branche** : `feat/onboard-01-mission-checklist`
**Estimation** : 2-3 jours
**Risque** : moyen (touche wizard ET dashboard, attention à ne pas casser P2-01 mergé).
**Prerequisites** : aucun bloquant pour démarrer. CHAT-01 doit être mergé pour activer la mission #6 titulaire et la mission #4 invité (sinon ces missions restent masquées via un feature flag local `MISSIONS_REQUIRE_CHAT`).

### Conception fonctionnelle

**12 missions titulaire au total** :

| # | Mission | Détection | Phase |
|---|---|---|---|
| W1 | Créer votre officine (nom, adresse, FINESS) | `pharmacies` ligne créée | Wizard |
| W2 | Compléter votre profil (prénom, nom) | `profiles.first_name + last_name` non NULL | Wizard |
| W3 | Inviter vos premiers collègues (ou passer cette étape) | invitation envoyée OU flag `onboarding_invites_handled = true` | Wizard |
| W4 | Activer votre essai 30 jours par carte bancaire | `pharmacies.subscription_status = 'trialing'` | Wizard |
| 1 | Inviter au moins un membre de l'équipe (si W3 sauté) | `pharmacy_members.count(pharmacy_id) ≥ 2` | Dashboard |
| 2 | Créer votre première tâche | `tasks.count(pharmacy_id) ≥ 1` | Dashboard |
| 3 | Scanner votre première ordonnance | `prescriptions.count(pharmacy_id) ≥ 1` | Dashboard |
| 4 | Signaler votre première rupture | `drug_shortages.count(pharmacy_id) ≥ 1` | Dashboard |
| 5 | Enregistrer une location de matériel | `rentals.count(pharmacy_id) ≥ 1` | Dashboard |
| 6 | Écrire un message dans le salon d'équipe | `chat_messages.count(pharmacy_id) ≥ 1` *(masqué tant que CHAT-01 non mergé)* | Dashboard |
| 7 | Utiliser au moins 3 modules différents (bouquet final) | au moins 3 des 6 tables ci-dessus avec ≥ 1 row | Dashboard |
| 8 | Organiser un point d'équipe à J+7 + envoyer un feedback | `feedback.count(pharmacy_id) ≥ 1` (P5-06 déjà mergé) | Dashboard |

**5 missions invité au total** :

| # | Mission | Détection | Phase |
|---|---|---|---|
| Wi1 | Compléter votre profil (prénom, nom) | `profiles.first_name + last_name` non NULL | Wizard |
| 1 | Ajouter votre photo de profil (facultatif) | `profiles.avatar_url` non NULL | Dashboard |
| 2 | Créer votre première tâche | `tasks.count where created_by = user ≥ 1` | Dashboard |
| 3 | Lire une note de transmission | événement PostHog `transmission_note_opened` | Dashboard |
| 4 | Écrire votre premier message dans le salon | `chat_messages.count where author_id = user ≥ 1` *(masqué tant que CHAT-01 non mergé)* | Dashboard |

### Fichiers à modifier / créer
- `supabase/migrations/0055_pharmacies_onboarding_dismissed.sql` (vérifier numéro dans COORDINATION.md §S5)
- `src/lib/onboarding/missions.ts` — types `Mission`, `MissionPhase`, `MissionContext` + helper `getMissionsForUser(supabase, userId)` qui dispatche selon le rôle
- `src/lib/onboarding/missions-owner.ts` — calcul des 12 missions titulaire
- `src/lib/onboarding/missions-member.ts` — calcul des 5 missions invité
- `src/components/onboarding/mission-checklist.tsx` — composant partagé, props `variant: 'wizard' | 'dashboard'`, `missions`, `progress`, `onDismiss`
- `src/components/onboarding/mission-item.tsx` — une mission (case animée + label + lien CTA + état pending/done)
- `src/components/onboarding/mission-progress-bar.tsx` — barre de progression X/N
- `src/components/onboarding/missions-completed-banner.tsx` — bannière de félicitations quand 100 %
- Modif `src/app/(onboarding)/onboarding/layout.tsx` — afficher `<MissionChecklist variant="wizard" />` en haut du wizard
- Modif `src/app/(app)/dashboard/page.tsx` (ou équivalent) — afficher `<MissionChecklist variant="dashboard" />` en haut du dashboard, masqué si `pharmacies.onboarding_dismissed_at IS NOT NULL`
- Modif `src/lib/analytics/events.ts` — ajouter les 5 events PostHog
- Modif `src/app/(app)/settings/display/page.tsx` (ou créer) — toggle « Afficher le widget des missions »

### À faire

**Étape 1 — Migration `0055_pharmacies_onboarding_dismissed.sql`**

```sql
-- 0055_pharmacies_onboarding_dismissed.sql
-- Permet à un titulaire de masquer définitivement le widget des missions d'activation.
-- NULL = widget actif. Date = widget masqué (réactivable depuis Paramètres → Affichage).

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at timestamptz;

COMMENT ON COLUMN public.pharmacies.onboarding_dismissed_at IS
  'Date à laquelle le titulaire a masqué le widget des missions d''activation. NULL = widget actif.';
```

Pas de RLS supplémentaire — la colonne est protégée par les policies existantes sur `pharmacies`.

**Étape 2 — Helper `src/lib/onboarding/missions.ts`**

```ts
export type MissionStatus = 'done' | 'pending'
export type MissionPhase = 'wizard' | 'dashboard'

export type Mission = {
  id: string                    // 'create_pharmacy', 'create_task', etc.
  label: string                 // libellé FR affiché
  href: string | null           // null si non cliquable (mission auto)
  status: MissionStatus
  phase: MissionPhase
  hidden?: boolean              // true si feature flag bloque (ex: chat avant CHAT-01)
}

export type MissionsContext = {
  ownerMissions: Mission[]
  memberMissions: Mission[]
  role: 'titulaire' | 'member'
  total: number
  done: number
  isFullyComplete: boolean
}

const MISSIONS_REQUIRE_CHAT = false // À passer à `true` au merge de CHAT-01

export async function getMissionsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<MissionsContext> {
  const profile = await fetchProfile(supabase, userId)
  const role = profile.role === 'titulaire' ? 'titulaire' : 'member'
  const missions = role === 'titulaire'
    ? await computeOwnerMissions(supabase, userId)
    : await computeMemberMissions(supabase, userId)

  return {
    ownerMissions: role === 'titulaire' ? missions : [],
    memberMissions: role === 'member' ? missions : [],
    role,
    total: missions.filter(m => !m.hidden).length,
    done: missions.filter(m => m.status === 'done' && !m.hidden).length,
    isFullyComplete: missions.every(m => m.status === 'done' || m.hidden),
  }
}
```

Le détail des `computeOwnerMissions` / `computeMemberMissions` fait les requêtes count en parallèle via `Promise.all`. Pas de cache, on calcule à chaque render (négligeable : 4 à 8 counts SQL avec index existants).

**Étape 3 — Composant `<MissionChecklist>`**

UI requirements :
- Bandeau en haut de page, fond légèrement teinté (teal-50 ou similaire), bordure douce
- Titre : « Vos missions d'activation » (variant dashboard) ou « Votre parcours d'inscription » (variant wizard)
- Barre de progression visuelle : `X / N missions complétées`
- Liste des missions en lignes : case à cocher animée à gauche, libellé au centre, flèche cliquable à droite (cache si `href = null`)
- État `done` : case verte cochée, libellé barré en gris doux
- État `pending` : case vide, libellé teal-foncé, hover effet sur la flèche
- Bouton « Masquer ce widget » discret en haut à droite (variant dashboard uniquement, pas en wizard)
- Modal confirm de dismissal : « Vous pourrez le réafficher depuis Paramètres → Affichage »
- Animation de complétion : quand une mission passe à `done`, animation de coche + petit son optionnel (silencieux par défaut)
- Bannière finale à 100 % : « Bravo, vous avez activé toute votre équipe ! » avec confetti CSS léger

**Étape 4 — Transition wizard → dashboard**

À la fin du wizard step 4, après webhook Stripe `subscription_status='trialing'` confirmé, la redirection vers `/dashboard` est immédiate et le widget dashboard apparaît automatiquement avec une **bannière temporaire de bienvenue** (5 secondes) qui dit :

> « Bravo, vos 4 missions d'inscription sont terminées ! Voici 8 missions d'équipe pour démarrer. »

La bannière disparaît automatiquement, le widget reste avec sa barre de progression à 0/8 (ou plus si l'utilisateur a déjà fait certaines actions pendant le wizard, ex. « inviter un membre » au step 3).

**Étape 5 — Réafficher depuis Paramètres**

Page `/settings/display` (à créer si absente, sinon ajouter une section) avec un toggle « Afficher le widget des missions d'activation ». Au passage à `true`, `UPDATE pharmacies SET onboarding_dismissed_at = NULL`. Au passage à `false`, `UPDATE pharmacies SET onboarding_dismissed_at = NOW()`.

**Étape 6 — Events PostHog**

Ajouter dans `src/lib/analytics/events.ts` :

- `onboarding_mission_shown` — émis au mount du widget, propriétés : `variant`, `total`, `done`
- `onboarding_mission_clicked` — émis au clic sur le CTA d'une mission, propriété : `mission_id`
- `onboarding_mission_completed` — émis quand une mission passe pending → done (détecté côté serveur lors du refresh), propriétés : `mission_id`, `time_since_signup_minutes`
- `onboarding_all_missions_completed` — émis quand 100 %, propriété : `time_since_signup_hours`
- `onboarding_widget_dismissed` — émis au dismissal manuel

**Étape 7 — Tests Vitest**

- `getMissionsForUser` : table de cas matrices (role × pharmacy state) avec assertions sur les missions retournées et leur status
- Détection automatique : mock count = 0 → status pending, count ≥ 1 → status done
- Feature flag CHAT : flag false → missions chat ont `hidden: true`

**Étape 8 — Tests Playwright (golden path nouveau)**

- Nouveau pilote : signup → wizard 4 étapes → widget dashboard apparaît avec 0/8
- Créer une tâche → recharger dashboard → widget affiche 1/8
- Cliquer sur la mission « scanner une ordonnance » → la page `/prescriptions/new` s'ouvre
- Dismiss widget → confirm → widget disparaît
- Réactiver via Paramètres → widget réapparaît

### Ne PAS toucher

- Le wizard P2-01 mergé (juste ajouter le composant en haut du layout, pas modifier les pages des steps)
- Le module Feedback (P5-06) — la mission 8 lit `feedback.count`, c'est tout
- Les composants métier (tasks, prescriptions, ruptures, locations) — pas besoin de hooks chez eux, la détection est faite serveur-side au refresh du dashboard
- La logique d'authentification ou de session

### Acceptance

- [ ] Migration `0055_pharmacies_onboarding_dismissed.sql` mergée
- [ ] Helper `getMissionsForUser(supabase, userId)` retourne **12 missions** pour titulaire et **5 missions** pour invité (dont 1 masquée tant que CHAT-01 pas mergé)
- [ ] Widget `<MissionChecklist>` visible en haut du wizard ET du dashboard avec design identique
- [ ] Transition wizard → dashboard avec bannière temporaire « 4/4 + 0/8 nouvelles »
- [ ] Chaque mission cliquable mène à la page correspondante
- [ ] Détection automatique : créer une tâche → mission « créer votre première tâche » se coche au prochain reload du dashboard
- [ ] Bouton « Masquer » avec confirm modal, met à jour `pharmacies.onboarding_dismissed_at`
- [ ] Réactivation depuis `/settings/display` fonctionne
- [ ] Bannière de complétion à 100 % avec animation
- [ ] 5 events PostHog émis aux bons moments (vérifié dans PostHog EU dashboard)
- [ ] Feature flag `MISSIONS_REQUIRE_CHAT = false` masque les missions chat sans casser le calcul du `total`
- [ ] Tests Vitest verts (table de cas pour `getMissionsForUser`)
- [ ] Test Playwright golden path nouveau pilote complet
- [ ] `npm run lint && npm run typecheck && npm run build && npm run test` verts
- [ ] Test manuel : ouvrir l'app avec un compte titulaire, valider visuellement la transition wizard → dashboard

### Prompt Claude Code

```
Ticket ONBOARD-01 (TODO_DEV.md). Missions d'activation in-app post-wizard.

Lis CLAUDE.md §4 (arborescence) + §7 (migrations) + §8 (conventions code),
COORDINATION.md §S5 (allocation migrations — on prévoit 0055),
TODO_DEV.md ticket ONBOARD-01 en entier (tableau des 12 + 5 missions et UI requirements).

Vérifie d'abord le pattern existant :
  ls src/app/(onboarding)/onboarding/ 2>/dev/null  # P2-01 wizard mergé
  grep -rn "useProfile\|getCurrentUser" src/contexts 2>/dev/null | head -5
  cat src/lib/analytics/events.ts 2>/dev/null | head -30  # P4-14 mergé, catalogue events

Plan en 8 étapes (diff par étape, je valide) :
1. Migration 0055 (colonne onboarding_dismissed_at sur pharmacies)
2. Types + helper src/lib/onboarding/missions.ts (getMissionsForUser dispatching role)
3. src/lib/onboarding/missions-owner.ts (12 missions titulaire avec leurs détections SQL)
4. src/lib/onboarding/missions-member.ts (5 missions invité)
5. Composants <MissionChecklist> + <MissionItem> + <MissionProgressBar> + <MissionsCompletedBanner>
6. Intégration wizard layout (variant='wizard') + dashboard (variant='dashboard')
7. Page settings/display avec toggle réactivation + events PostHog (5 events)
8. Tests Vitest sur getMissionsForUser + Playwright golden path nouveau pilote

Contraintes :
- Composant <MissionChecklist> PARTAGÉ entre wizard et dashboard via prop variant
- Feature flag MISSIONS_REQUIRE_CHAT = false (à mettre dans un module config) qui masque
  les missions chat tant que CHAT-01 n'est pas mergé. Le total doit s'adapter automatiquement.
- Helper getMissionsForUser fait tous les counts SQL en Promise.all (négligeable
  avec les index existants).
- DB writes (dismiss + reactivate) via createServiceClient ou direct si RLS permet
  l'update par le titulaire.
- AUCUNE modification des pages wizard P2-01 elles-mêmes. Juste ajouter le composant
  en haut du layout (onboarding) au-dessus du contenu.
- Animation de complétion CSS only (pas de bibliothèque externe sauf si shadcn fournit déjà).

À la fin : test manuel sur compte titulaire + compte invité,
verify transition wizard → dashboard avec bannière temporaire, vérifier qu'une mission
se coche bien après création d'une tâche.
```

---

## 🟡 BADGE-01 — Géofencing du badgeage à partir de l'adresse de l'officine

### Pourquoi ce ticket
Le système de badgeage existe déjà (tables `work_sessions` + `work_session_segments` depuis migrations 0001/0018/0019/0026/0030). Aujourd'hui, **n'importe qui peut badger depuis n'importe où** : depuis son canapé en arrêt maladie, depuis la voiture en chemin, depuis chez un collègue. Les titulaires demandent une **garde-fou géographique** : badger uniquement quand on est physiquement à l'officine. Ce ticket ajoute le contrôle via l'API `navigator.geolocation` du navigateur + un rayon configurable autour de l'adresse de l'officine.

**Posture importante** : le geofencing est un **gardefou côté client + double-check serveur**, pas une preuve juridique. Un utilisateur malveillant peut spoofer sa position. C'est un contrôle d'usage normal, pas un système de surveillance certifié.

**Branche** : `feat/badge-01-geofencing-clockin`
**Estimation** : 1,5 jour (géocodage adresse + UI permission + calcul distance + check serveur + UX feedback)
**Risque** : moyen (touche au flux de badgeage qui est critique pour la paie ; UX permission location parfois capricieuse selon navigateurs).
**Prerequisites** : adresse de l'officine renseignée dans `pharmacies.address` (collectée à `/onboarding/create`). Pour les officines existantes sans adresse, le geofencing reste désactivé par défaut.

### Fichiers à modifier / créer
- `supabase/migrations/0052_pharmacy_geofencing.sql` (vérifier numéro dans `COORDINATION.md` §S5)
- `src/lib/geofencing/haversine.ts` — calcul distance entre 2 points (lat/lng)
- `src/lib/geofencing/geocode.ts` — géocodage de l'adresse → lat/lng (Nominatim OSM gratuit, ou Mapbox/Google si tu veux upgrader)
- `src/lib/geofencing/permissions.ts` — wrapper `navigator.geolocation.getCurrentPosition`
- `src/components/work-sessions/clock-in-button.tsx` — bouton existant à enrichir avec check géofence
- `src/components/work-sessions/geofence-status.tsx` — composant indicateur (vert/rouge/orange selon distance + permission)
- `src/app/api/work-sessions/start/route.ts` ou équivalent — double-check côté serveur (le client envoie sa position, le serveur vérifie qu'elle est dans le rayon, sinon 403)
- `src/app/(app)/admin/settings/geofencing.tsx` — réglages titulaire (activer/désactiver, ajuster rayon, regéocoder l'adresse)

### À faire

1. **Migration `0052_pharmacy_geofencing.sql`** — ajouter les colonnes lat/lng + configuration :

   ```sql
   -- 0052_pharmacy_geofencing.sql
   -- Geofencing pour le badgeage : ajoute coordonnées géocodées + rayon configurable.

   ALTER TABLE public.pharmacies
     ADD COLUMN IF NOT EXISTS address_latitude numeric(10, 7),
     ADD COLUMN IF NOT EXISTS address_longitude numeric(10, 7),
     ADD COLUMN IF NOT EXISTS address_geocoded_at timestamptz,
     ADD COLUMN IF NOT EXISTS clockin_geofence_enabled boolean NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS clockin_geofence_radius_m integer NOT NULL DEFAULT 100
       CHECK (clockin_geofence_radius_m BETWEEN 25 AND 1000);

   -- Index utilitaire pour le check serveur si batch
   CREATE INDEX IF NOT EXISTS pharmacies_geofence_enabled_idx
     ON public.pharmacies(clockin_geofence_enabled)
     WHERE clockin_geofence_enabled = true;
   ```

2. **Géocodage de l'adresse** — `src/lib/geofencing/geocode.ts` :

   Recommandation pour la bêta : **Nominatim OpenStreetMap** (gratuit, RGPD-friendly, pas de tracking, max 1 req/sec). User-Agent obligatoire.

   ```ts
   export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
     const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=fr&limit=1`
     const res = await fetch(url, {
       headers: { 'User-Agent': 'PharmaWorkspace/1.0 (contact@pharmaworkspace.fr)' },
       cache: 'force-cache',
     })
     if (!res.ok) return null
     const data = await res.json()
     if (!Array.isArray(data) || data.length === 0) return null
     return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
   }
   ```

   Trigger : à la création de la pharmacie (endpoint `/api/onboarding/create-pharmacy`) si address présente, ou à la mise à jour de l'adresse depuis `/admin/settings`. Stocker dans `address_latitude`, `address_longitude`, `address_geocoded_at`.

   **Alternative payante** : Mapbox Geocoding API (~$0,75 pour 1000 requêtes) si Nominatim est trop lent ou imprécis. À voir en Phase 6.

3. **Calcul distance Haversine** — `src/lib/geofencing/haversine.ts` :

   ```ts
   export function haversineDistanceMeters(
     lat1: number, lng1: number, lat2: number, lng2: number
   ): number {
     const R = 6371000 // rayon Terre en mètres
     const toRad = (deg: number) => (deg * Math.PI) / 180
     const dLat = toRad(lat2 - lat1)
     const dLng = toRad(lng2 - lng1)
     const a = Math.sin(dLat / 2) ** 2 +
               Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
               Math.sin(dLng / 2) ** 2
     return 2 * R * Math.asin(Math.sqrt(a))
   }
   ```

4. **Permission de géolocalisation côté client** — `src/lib/geofencing/permissions.ts` :

   ```ts
   export async function requestUserPosition(): Promise<
     { ok: true; lat: number; lng: number; accuracy: number } |
     { ok: false; reason: 'denied' | 'unavailable' | 'timeout' | 'unsupported' }
   > {
     if (!navigator.geolocation) return { ok: false, reason: 'unsupported' }
     return new Promise((resolve) => {
       navigator.geolocation.getCurrentPosition(
         (pos) => resolve({
           ok: true,
           lat: pos.coords.latitude,
           lng: pos.coords.longitude,
           accuracy: pos.coords.accuracy,
         }),
         (err) => {
           if (err.code === 1) resolve({ ok: false, reason: 'denied' })
           else if (err.code === 2) resolve({ ok: false, reason: 'unavailable' })
           else resolve({ ok: false, reason: 'timeout' })
         },
         { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
       )
     })
   }
   ```

5. **Composant `<ClockInButton>` enrichi** :
   - Si `pharmacies.clockin_geofence_enabled === false` → bouton classique (pas de check).
   - Si activé : au mount du composant, demander la position. Afficher un état visuel :
     - 🟢 Vert + bouton actif : "Vous êtes à l'officine. Badger maintenant."
     - 🟡 Orange : "Vous êtes à X m de l'officine (limite Y m). Approchez-vous."
     - 🔴 Rouge + bouton grisé : "Hors zone (X m). Le badgeage n'est pas autorisé d'ici."
     - ⚫ Gris + bouton grisé : "Autorisez l'accès à la position pour badger." + bouton "Réessayer"
   - Au click sur Badger : POST `/api/work-sessions/start` avec `{ user_lat, user_lng, user_accuracy }`.

6. **Double-check serveur** — endpoint `/api/work-sessions/start/route.ts` (chercher le nom exact) :
   - Récupère `pharmacies.address_latitude/longitude/clockin_geofence_enabled/clockin_geofence_radius_m`.
   - Si geofence activé : calcule `haversineDistanceMeters(user_lat, user_lng, pharmacy_lat, pharmacy_lng)`.
   - Si distance > rayon → 403 + log dans audit. Si OK → procède au badge classique.
   - **Toujours stocker la distance et l'accuracy dans `work_sessions`** (nouvelles colonnes `clockin_distance_m`, `clockin_accuracy_m`) pour audit ultérieur. Audit log applicatif (P2-16) doit également tracer les refus.

7. **Réglages titulaire `/admin/settings/geofencing`** :
   - Toggle "Activer le geofencing du badgeage" (par défaut OFF).
   - Slider rayon 25-1000 m (défaut 100).
   - Bouton "Tester ma position depuis l'officine" (demande la permission + affiche la distance).
   - Bouton "Re-géocoder l'adresse" si elle a changé.
   - Affichage texte + mini-carte (Leaflet OSM gratuit) pour visualiser le rayon — optionnel pour MVP.

### Choix de rayon — recommandations
- **25-50 m** : trop strict, le GPS smartphone a une précision ~10-50m, beaucoup de faux refus.
- **75-100 m** : sweet spot par défaut. Couvre l'officine + parking adjacent + accidents GPS.
- **150-300 m** : tolérant, OK pour officines avec parking déporté ou GPS imprécis indoor.
- **Au-delà de 500 m** : le geofencing n'a plus de sens.

L'`accuracy` retournée par `navigator.geolocation` doit aussi être prise en compte : si `accuracy > 50m`, ne pas refuser un badge marginal, accorder une tolérance d'`accuracy` au calcul (`distance - accuracy <= radius`).

### Ne PAS toucher
- Les RLS existantes sur `work_sessions` et `work_session_segments`.
- La logique métier de calcul des minutes badgées.
- La page `/agenda` (sans rapport).

### Acceptance
- [ ] Migration 0052 appliquée + colonnes geofencing visibles dans Supabase.
- [ ] Géocodage automatique de `pharmacies.address` à la création/modif.
- [ ] Réglages titulaire `/admin/settings/geofencing` fonctionnels (toggle + slider + test).
- [ ] Composant `<ClockInButton>` rend les 4 états (vert/orange/rouge/permission) correctement.
- [ ] Endpoint `/api/work-sessions/start` refuse 403 si hors zone et geofence activé.
- [ ] Tolérance accuracy : un badge à `distance=120m` mais `accuracy=30m` est accepté si rayon = 100m (120 - 30 ≤ 100).
- [ ] Audit log trace les refus avec position envoyée.
- [ ] Test E2E sur staging : titulaire active geofence, employé tente badge depuis l'autre bout de la ville → refusé.

### Prompt Claude Code
```
Ticket BADGE-01 (TODO_DEV.md). Geofencing du badgeage : autoriser le clock-in seulement si l'utilisateur est dans un rayon de N mètres de l'adresse de l'officine.

Lis CLAUDE.md §7 §8, COORDINATION.md §S5 (migration 0052), TODO_DEV.md ticket BADGE-01 en entier.

Vérifie d'abord :
- Le composant et l'endpoint de clock-in actuels : grep -rn "clock_in\|clockIn\|start.*work_session\|workSession" src/components src/app/api 2>/dev/null
- Que pharmacies.address est bien collecté à l'onboarding (probablement déjà fait au step 1).

Plan en 7 étapes (diff par étape) :
1. Migration 0052 (address_lat/lng + geofence_enabled + radius)
2. src/lib/geofencing/haversine.ts (calcul distance)
3. src/lib/geofencing/geocode.ts (Nominatim OSM, User-Agent obligatoire)
4. src/lib/geofencing/permissions.ts (wrapper navigator.geolocation)
5. Trigger géocodage à la création/modif pharmacie
6. <ClockInButton> enrichi avec 4 états visuels
7. Double-check serveur dans /api/work-sessions/start
8. /admin/settings/geofencing (toggle + slider + bouton test)

Contraintes :
- Geofence OFF par défaut (rétrocompat existants).
- Tolérance accuracy : (distance - accuracy) <= radius.
- Audit log trace les refus.
- Pas de cartographie payante en MVP (Nominatim suffit).
- Le geofencing est un gardefou, pas une preuve juridique. Documenter dans la doc admin.

À la fin : test E2E manuel avec ma position Mac qui simule plusieurs endroits via Chrome DevTools (Sensors).
```

---

## 🟢 PLAN-01 — Module Planning de présence + demandes de congés (nouveau module)

### Pourquoi ce ticket
Aujourd'hui, l'onglet `/agenda` est en réalité une **vue calendrier des tâches/locations/commandes** (composant `TaskAgendaView`), désactivée sur mobile, sans rapport avec la gestion de présence d'équipe. **Mehdi veut un vrai module Planning de présence** : visualisation des horaires de chaque membre, demandes de congés (CP, RTT, maladie, formation), validation par le titulaire. Cohérent avec le cœur du produit (organisation interne de l'officine, à l'instar des tâches et de la transmission).

**Renommage** : l'onglet `/agenda` actuel sera renommé `/calendrier` (ou conservé sous `/agenda` mais avec un label « Calendrier » dans la sidebar). Le nouveau module sera accessible sous `/planning` avec le label « Planning » dans la sidebar.

**Branche** : `feat/plan-01-planning-conges`
**Estimation** : 5-6 jours (gros module — DB + RLS + UI vue planning + workflow congés + notifications)
**Risque** : moyen-fort (nouveau module, plusieurs tables, workflow validation).
**Prerequisites** : aucun bloquant ; idéalement TECH-10 mergé pour avoir tous les rôles dans le sélecteur affecté.

### ⚠️ Décisions produit à acter par Mehdi avant code (voir TODO_MEHDI.md PROD-PLAN-01)
- Types de congés à supporter : **CP, RTT, maladie, formation, jour férié, autre** (ajustable)
- Workflow validation : **titulaire seul valide** ? Ou titulaire + adjoint ? Pour MVP : titulaire seul.
- Notification : email + in-app banner ? Slack/SMS plus tard ?
- Visibilité : un préparateur voit-il les congés des autres ou seulement les siens + récapitulatif anonymisé ? Pour MVP : il voit tout le planning de présence de l'équipe (transparent).
- Période de planification : semaine glissante (recommandé), mois, trimestre ?
- Auto-population : intégration avec les badges (`work_session_segments`) pour montrer les heures réellement faites vs prévues ?

### Fichiers à modifier / créer
- `supabase/migrations/0053_planning_leave_requests.sql` (vérifier numéro §S5)
- `src/app/(app)/planning/page.tsx` — nouvelle route
- `src/app/(app)/planning/requests/page.tsx` — liste des demandes (préparateur : ses demandes ; titulaire : à valider)
- `src/components/planning/planning-week-view.tsx` — grille hebdomadaire 7 jours × N collaborateurs
- `src/components/planning/leave-request-form.tsx` — formulaire de demande
- `src/components/planning/leave-request-card.tsx` — card avec actions valider/refuser
- `src/lib/queries/planning.ts` — queries lecture
- `src/features/planning/services/leave-service.ts` — création/validation/refus
- `src/lib/email/templates/leave-request-notification.tsx` — email titulaire à chaque demande
- `src/lib/email/templates/leave-decision.tsx` — email collaborateur (validation/refus)
- Modification sidebar : renommer "Agenda" → "Calendrier" et ajouter "Planning" en dessous

### À faire

**Étape 1 — Migration `0053_planning_leave_requests.sql`** :

```sql
-- 0053_planning_leave_requests.sql

-- Demandes de congés / absences
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type text NOT NULL CHECK (leave_type IN (
    'cp',          -- congé payé
    'rtt',         -- réduction temps de travail
    'sick',        -- maladie
    'training',    -- formation
    'public_holiday', -- jour férié
    'unpaid',      -- congé sans solde
    'other'
  )),
  start_date date NOT NULL,
  end_date date NOT NULL CHECK (end_date >= start_date),
  half_day_start boolean NOT NULL DEFAULT false, -- demi-journée matin si true
  half_day_end boolean NOT NULL DEFAULT false,   -- demi-journée après-midi si true
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leave_requests_pharmacy_id_idx ON public.leave_requests(pharmacy_id);
CREATE INDEX IF NOT EXISTS leave_requests_requester_id_idx ON public.leave_requests(requester_id);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS leave_requests_dates_idx ON public.leave_requests(pharmacy_id, start_date, end_date);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les membres de la pharmacie
CREATE POLICY leave_requests_select ON public.leave_requests FOR SELECT
  USING (pharmacy_id = (SELECT public.get_pharmacy_id()));

-- Création : par le membre lui-même
CREATE POLICY leave_requests_insert ON public.leave_requests FOR INSERT
  WITH CHECK (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND requester_id = auth.uid()
  );

-- Update : requester peut cancel sa demande pending ; titulaire/adjoint peut approve/reject
CREATE POLICY leave_requests_update ON public.leave_requests FOR UPDATE
  USING (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND (
      (requester_id = auth.uid() AND status = 'pending')
      OR (auth.jwt() ->> 'role' IN ('titulaire', 'adjoint'))
    )
  );

-- Optionnel : planning hebdomadaire pré-défini (horaires "type") — phase 2 du module
CREATE TABLE IF NOT EXISTS public.weekly_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=dimanche
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time),
  break_start time,
  break_end time,
  active_from date NOT NULL,
  active_until date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS weekly_schedules_pharmacy_user_idx
  ON public.weekly_schedules(pharmacy_id, user_id);
ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY weekly_schedules_select ON public.weekly_schedules FOR SELECT
  USING (pharmacy_id = (SELECT public.get_pharmacy_id()));
CREATE POLICY weekly_schedules_mutate ON public.weekly_schedules FOR ALL
  USING (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND auth.jwt() ->> 'role' IN ('titulaire', 'adjoint')
  );
```

**Étape 2 — Vue planning hebdomadaire** :
- Grille 7 jours × N collaborateurs.
- Pour chaque cellule : horaires prévus (depuis `weekly_schedules`), congés en cours (depuis `leave_requests` approved/pending), heures réellement badgées (depuis `work_session_segments` — utilitaire pour titulaire).
- Code couleur :
  - Vert : présent badgé
  - Bleu pâle : présent prévu (pas encore badgé)
  - Jaune : congé pending
  - Rouge : congé approuvé (absent)
  - Gris : non prévu / hors période
- Navigation semaine précédente/suivante + bouton "Aujourd'hui".
- Vue mobile : liste verticale par jour avec carrousel jours.

**Étape 3 — Formulaire demande de congé** :
- Type (select), période (datepicker range), demi-journée début/fin (checkbox), raison (textarea optional).
- Soumission → INSERT `leave_requests` avec status='pending' → notification email au titulaire via Resend (template `leave-request-notification.tsx`).
- Affichage liste des demandes du requester dans `/planning/requests`.

**Étape 4 — Workflow validation titulaire** :
- Page `/planning/requests` affiche aux titulaires/adjoints toutes les demandes pending de la pharmacie.
- Pour chaque demande : carte avec infos + boutons "Approuver" / "Refuser" + textarea note review.
- UPDATE `leave_requests` set status + reviewed_by + reviewed_at + review_note.
- Notification email au requester (template `leave-decision.tsx`).
- PostHog : event `leave_request_submitted`, `leave_request_approved`, `leave_request_rejected`.

**Étape 5 — Sidebar et renommage** :
- Renommer l'item "Agenda" → "Calendrier" (le lien reste `/agenda`).
- Ajouter item "Planning" pointant vers `/planning`.
- Si tu veux pousser plus loin : déplacer ultérieurement la route `/agenda` → `/calendrier` avec redirect.

**Étape 6 — Intégration emails** :
- 2 templates Resend dans `src/lib/email/templates/`.
- Helper `send-leave-notification.ts` qui choisit le bon template.

**Étape 7 — Audit log** :
- Étendre la table d'audit applicatif (P2-16) pour tracer les approbations/refus de congés.

**Étape 8 — Tests** :
- Vitest sur les services et la matrice de transitions de status.
- Playwright nouveau golden path : préparateur soumet → titulaire approuve → notif email envoyée (mock) → status mis à jour.

### Phase 2 (post-MVP, à scoper séparément)
- Soldes congés (capital CP / RTT par collaborateur)
- Auto-population des badges réels vs prévu
- Vue mensuelle / trimestrielle
- Export PDF planning hebdo
- Intégration ICS pour synchroniser vers Google Calendar perso

### Ne PAS toucher
- `/agenda` actuel (le composant `TaskAgendaView` reste fonctionnel, on renomme juste le label sidebar).
- Les tables `work_sessions` et `work_session_segments` (la consommation pour visualisation est lecture seule).
- Les notifications existantes (P2-05/06 cron rappels) — c'est un autre flux.

### Acceptance
- [ ] Migration 0053 appliquée avec RLS validées.
- [ ] Page `/planning` rend la vue hebdomadaire desktop + liste mobile.
- [ ] Préparateur peut créer une demande, voir l'historique de ses demandes.
- [ ] Titulaire reçoit notif email + voit la demande dans `/planning/requests` + peut approuver/refuser.
- [ ] Email de décision envoyé au préparateur (template Resend).
- [ ] Sidebar mise à jour : Calendrier + Planning.
- [ ] Tests Vitest + Playwright nouveau golden path.
- [ ] `npm run lint && npm run typecheck && npm run build && npm run test` verts.

### Prompt Claude Code (à lancer SEULEMENT après que Mehdi ait acté les décisions produit ci-dessus)
```
Ticket PLAN-01 (TODO_DEV.md). Nouveau module Planning de présence + demandes de congés.

PRÉREQUIS : Mehdi a acté les décisions produit (cf. PROD-PLAN-01 dans TODO_MEHDI.md).
Si non, STOP, demande à Mehdi.

Lis CLAUDE.md §7 §8, COORDINATION.md §S5 (migration 0053), TODO_DEV.md ticket PLAN-01 en entier.
Inspecte le pattern existant feedback (P5-06 PR #58) pour le style des emails et des notifications,
et le pattern tasks pour la vue agenda.

Plan en 8 étapes, diff après chacune, je valide :
1. Migration 0053 (leave_requests + weekly_schedules + RLS)
2. src/lib/queries/planning.ts (lecture)
3. src/features/planning/services/leave-service.ts (mutations + notifications)
4. Templates emails Resend (notification titulaire + décision)
5. <PlanningWeekView> desktop + carrousel mobile
6. <LeaveRequestForm> + page /planning/requests
7. Workflow validation titulaire avec audit log
8. Sidebar renommage + tests Vitest + Playwright

Contraintes :
- Renommer item sidebar Agenda → Calendrier, ajouter Planning.
- Ne PAS casser /agenda existant (route reste).
- RLS strictes : préparateur ne modifie pas une demande déjà approved/rejected.
- PostHog events snake_case (leave_request_submitted/approved/rejected).
- Audit log trace les décisions titulaire.

À la fin : test E2E préparateur → titulaire → email simulé.
```

---

## 🟢 CHAT-01 — Salon textuel d'équipe (style WhatsApp)

### Pourquoi ce ticket
La promesse marketing PharmaWorkspace est de **remplacer les groupes WhatsApp d'équipe** (slogan dans le hero de la landing). Aujourd'hui, on gère les tâches, les ordonnances, les ruptures, le feedback in-app — mais pas la conversation libre. Or les équipes officine échangent énormément en cours de journée : "Le client X a oublié son ordo", "Le déstockage du Doliprane est arrivé", "On manque de sacs en caisse". Sans canal textuel persistant intégré, les pharmaciens reviennent sur WhatsApp et le produit perd sa principale promesse.

**Scope MVP** : 1 canal général par officine (créé automatiquement à la création de la pharmacie), messages texte, accusés de lecture optionnels, notification badge unread. Pas de pièces jointes en MVP, pas de mentions @user, pas de réactions emoji, pas de threads — tout ça en phase 2.

**Branche** : `feat/chat-01-team-general-channel`
**Estimation** : 3-4 jours (DB + Realtime + UI + notifications unread)
**Risque** : moyen (Realtime peut être capricieux à debugger ; UX chat est codée par ce que les gens attendent — WhatsApp).
**Prerequisites** : aucun.

### Fichiers à modifier / créer
- `supabase/migrations/0054_chat_channels_messages.sql`
- `src/app/(app)/chat/page.tsx` — page principale chat (vue full-page sur desktop, sheet bottom sur mobile)
- `src/components/chat/chat-window.tsx` — la fenêtre de messages
- `src/components/chat/message-bubble.tsx`
- `src/components/chat/message-composer.tsx`
- `src/components/chat/unread-badge.tsx` — badge dans la sidebar
- `src/lib/queries/chat.ts`
- `src/features/chat/services/chat-service.ts`
- `src/hooks/use-realtime-chat.ts` — abonnement Supabase Realtime au canal général
- Sidebar : ajouter item "Chat" avec compteur unread

### À faire

**Étape 1 — Migration `0054_chat_channels_messages.sql`** :

```sql
-- 0054_chat_channels_messages.sql

-- Canaux de discussion. MVP : un seul canal 'general' par pharmacie.
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  slug text NOT NULL,             -- 'general' pour MVP, futurs 'transmission', 'pause', etc.
  name text NOT NULL,             -- libellé affiché
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pharmacy_id, slug)
);
CREATE INDEX IF NOT EXISTS chat_channels_pharmacy_idx ON public.chat_channels(pharmacy_id);
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_channels_select ON public.chat_channels FOR SELECT
  USING (pharmacy_id = (SELECT public.get_pharmacy_id()));

-- Messages dans un canal
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_channel_created_idx
  ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_pharmacy_created_idx
  ON public.chat_messages(pharmacy_id, created_at DESC);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_messages_select ON public.chat_messages FOR SELECT
  USING (pharmacy_id = (SELECT public.get_pharmacy_id()));
CREATE POLICY chat_messages_insert ON public.chat_messages FOR INSERT
  WITH CHECK (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND author_id = auth.uid()
  );
CREATE POLICY chat_messages_update ON public.chat_messages FOR UPDATE
  USING (
    pharmacy_id = (SELECT public.get_pharmacy_id())
    AND author_id = auth.uid()
    AND deleted_at IS NULL
  );

-- Statut de lecture par user × channel
CREATE TABLE IF NOT EXISTS public.chat_read_states (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, channel_id)
);
ALTER TABLE public.chat_read_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_read_states_select ON public.chat_read_states FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY chat_read_states_mutate ON public.chat_read_states FOR ALL
  USING (user_id = auth.uid() AND pharmacy_id = (SELECT public.get_pharmacy_id()));

-- Auto-création du canal "Général" à la création d'une pharmacie via trigger
CREATE OR REPLACE FUNCTION public.create_default_chat_channel()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.chat_channels (pharmacy_id, slug, name, is_default)
  VALUES (NEW.id, 'general', 'Général', true)
  ON CONFLICT (pharmacy_id, slug) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pharmacies_create_default_channel ON public.pharmacies;
CREATE TRIGGER pharmacies_create_default_channel
  AFTER INSERT ON public.pharmacies
  FOR EACH ROW EXECUTE FUNCTION public.create_default_chat_channel();

-- Backfill : créer le canal pour les pharmacies existantes
INSERT INTO public.chat_channels (pharmacy_id, slug, name, is_default)
SELECT id, 'general', 'Général', true FROM public.pharmacies
ON CONFLICT (pharmacy_id, slug) DO NOTHING;
```

**Étape 2 — Hook Realtime `use-realtime-chat.ts`** :

Utiliser Supabase Realtime channel subscription :
```ts
const channel = supabase
  .channel(`chat:${chatChannelId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `channel_id=eq.${chatChannelId}`,
  }, (payload) => {
    onMessage(payload.new as ChatMessage)
  })
  .subscribe()
```

Optimistic UI : ajout en local avant ACK serveur, rollback si erreur.

**Étape 3 — UI** :
- `<ChatWindow>` : liste virtualisée des derniers 50 messages, infinite scroll vers le haut.
- `<MessageBubble>` : auteur (avatar + prénom), corps texte, timestamp relatif ("il y a 3 min"), bouton "•••" pour author own message → édit/supprimer.
- `<MessageComposer>` : textarea auto-resize + bouton envoyer (Cmd+Enter pour envoyer).
- Affichage différencié : own messages alignés droite + couleur primaire (teal), others alignés gauche + gris.
- Markdown léger côté affichage : **gras**, *italique*, `code inline`, URLs auto-link. Pas de XSS.

**Étape 4 — Badge unread** :
- Hook `useUnreadCount(channelId)` : compte `chat_messages.created_at > last_read_at`.
- Badge dans la sidebar : pastille rouge avec nombre si > 0.
- Au focus de la page `/chat` : UPDATE `chat_read_states` set `last_read_at = now()`.

**Étape 5 — Notifications PostHog** :
- `chat_message_sent`
- `chat_window_opened`
- `chat_first_message_in_pharmacy` (sur le premier message jamais envoyé dans une pharmacie → KPI activation)

**Étape 6 — Modération** :
- Soft delete (`deleted_at not null`) côté auteur ou titulaire.
- Pas de "report" en MVP (équipe restreinte, confiance forte).
- Audit log applicatif sur les suppressions.

**Étape 7 — Tests** :
- Vitest sur les services.
- Playwright : ouvrir /chat avec 2 sessions (user A + user B), B envoie, A voit le message en moins de 3s.

### Phase 2 (post-MVP)
- Pièces jointes images
- Mentions @user
- Réactions emoji
- Threads
- Plusieurs canaux (créés par titulaire) : #transmission, #pause, #commandes
- Recherche full-text (PostgreSQL tsvector)

### Ne PAS toucher
- Le feedback in-app (P5-06) — c'est un autre flux (signalement vers l'éditeur, pas conversation interne).
- Les notifications email — le chat n'envoie PAS d'email par défaut (sinon spam).

### Acceptance
- [ ] Migration 0054 appliquée + trigger auto-création canal Général.
- [ ] Backfill : toutes les pharmacies existantes ont un canal Général.
- [ ] Page `/chat` rend la fenêtre + composer + permet d'envoyer un message.
- [ ] 2 sessions ouvertes → message envoyé par A reçu par B en <3s via Realtime.
- [ ] Badge unread visible sidebar, remis à zéro au focus de `/chat`.
- [ ] Édition/suppression de ses propres messages OK.
- [ ] Tests Vitest + Playwright.
- [ ] `npm run lint && npm run typecheck && npm run build && npm run test` verts.

### Prompt Claude Code
```
Ticket CHAT-01 (TODO_DEV.md). Nouveau module : salon textuel équipe (style WhatsApp).

Lis CLAUDE.md §7 §8, COORDINATION.md §S5 (migration 0054), TODO_DEV.md ticket CHAT-01 en entier.

Vérifie d'abord le pattern Realtime déjà en place :
- grep -rn "supabase.channel\|use.*realtime" src/hooks src/features 2>/dev/null
- src/features/feedback (P5-06 PR #58) pour pattern services + queries

Plan en 7 étapes, diff par étape :
1. Migration 0054 (channels + messages + read_states + trigger backfill)
2. src/lib/queries/chat.ts + service mutations
3. Hook use-realtime-chat
4. <ChatWindow> + <MessageBubble> + <MessageComposer>
5. Badge unread sidebar + reset au focus
6. Modération (soft delete, audit log)
7. Tests Vitest + Playwright 2 sessions

Contraintes :
- 1 seul canal 'general' par pharmacie en MVP (trigger auto-create).
- Optimistic UI obligatoire.
- Markdown affichage léger SANS dangerouslySetInnerHTML — use react-markdown ou sanitize.
- Compteur unread = COUNT messages where created_at > last_read_at.
- Pas de notification email (volume potentiel trop élevé).

À la fin : 2 navigateurs en parallèle (1 Chrome + 1 Safari), envoi + réception Realtime + edit + delete.
```

---

### Pourquoi ce ticket
Aujourd'hui, le modèle de droits ne reconnaît que trois rôles : `titulaire`, `adjoint`, `préparateur`. Or, deux profils d'équipe sont systématiquement présents en officine et ne disposent d'aucun rôle dédié : les **étudiants en pharmacie en stage** (3ᵉ–6ᵉ année) et les **rayonnistes** (responsables des rayons OTC / parapharmacie, souvent non-pharmaciens). Sans rôle dédié, le titulaire est obligé de les inviter en tant que « préparateur » ce qui est sémantiquement inexact et casse la fidélité du registre de traitement art. 30. **Mêmes droits que préparateur pour l'instant** : on étend juste la liste de valeurs autorisées, sans changer la matrice de permissions. Si le besoin émerge ultérieurement de différencier finement (par exemple : l'étudiant n'a pas le droit d'enregistrer une délivrance d'ordonnance type 2), on créera un ticket spécifique.

**Branche** : `feat/tech-10-roles-student-shelver`
**Estimation** : ½ jour (migration + UI sélecteur + libellés)
**Risque** : faible — étendre un enum est additif et rétrocompatible.
**Prerequisites** : aucun, peut démarrer dès que cette PR est lue.

### Fichiers à modifier / créer
- `supabase/migrations/0050_pharmacy_member_roles_extension.sql` (vérifier le numéro dans `COORDINATION.md` §S5 avant de créer)
- `src/components/onboarding/invite/role-select.tsx` (ou équivalent — chercher dans l'app le composant qui rend le `<Select>` rôle dans l'invitation)
- `src/lib/auth/roles.ts` ou `src/lib/permissions.ts` (selon où vit la matrice rôle → droits) — ajouter les 2 nouvelles valeurs avec les mêmes permissions que `preparateur`
- `src/components/team/member-row.tsx` ou équivalent — libellés affichage français (titulaire / Pharmacien adjoint / Préparateur / **Étudiant en pharmacie** / **Rayonniste**)
- Éventuellement i18n : `messages/fr/team.json` et `messages/en/team.json` si un système de traduction est en place

### À faire

1. **Migration `0050_pharmacy_member_roles_extension.sql`** — étendre l'enum existant `pharmacy_member_role` (ou similaire — vérifier le nom exact dans le schema actuel). Migration idempotente, hors transaction (ALTER TYPE … ADD VALUE ne peut pas tourner en transaction selon les versions Postgres).

   ```sql
   -- 0050_pharmacy_member_roles_extension.sql
   -- Ajoute 'student' (étudiant en pharmacie) et 'shelver' (rayonniste)
   -- à l'enum pharmacy_member_role. Mêmes droits que 'preparateur' pour l'instant.

   ALTER TYPE pharmacy_member_role ADD VALUE IF NOT EXISTS 'student';
   ALTER TYPE pharmacy_member_role ADD VALUE IF NOT EXISTS 'shelver';
   ```

   Si l'enum n'existe pas (rôle stocké en `text` avec CHECK constraint), adapter en modifiant le CHECK :

   ```sql
   ALTER TABLE pharmacy_members
     DROP CONSTRAINT IF EXISTS pharmacy_members_role_check,
     ADD CONSTRAINT pharmacy_members_role_check
     CHECK (role IN ('titulaire', 'adjoint', 'preparateur', 'student', 'shelver'));
   ```

2. **Auth Hook JWT (P2-08)** — vérifier que la fonction `custom_access_token_hook` (cf. migrations 0039 et 0040) inclut le nouveau rôle dans les claims JWT **sans aucune modification de code requise** (l'auth hook lit `role` tel quel depuis la DB). Test : invite un compte test avec rôle `student`, vérifie que `auth.jwt() ->> 'role' = 'student'` dans une session Supabase.

3. **Mise à jour matrice permissions (`src/lib/auth/roles.ts`)** — ajouter `student` et `shelver` avec **strictement les mêmes droits que `preparateur`** :
   - Lecture/écriture sur tâches, locations, formations (selon configuration du titulaire) ;
   - Lecture seule sur les ordonnances par défaut (à confirmer avec la matrice actuelle) ;
   - Pas d'accès à la configuration officine ;
   - Pas de gestion des invitations.

4. **UI sélecteur d'invitation** — étendre le `<Select>` de rôle (étape `/onboarding/invite` du wizard + page `/team/invite`) avec 2 nouvelles options et leur libellé français.

5. **UI affichage membre** — étendre les libellés rendus dans la liste des membres de l'équipe (`/team`) avec :
   - `titulaire` → « Titulaire »
   - `adjoint` → « Pharmacien adjoint »
   - `preparateur` → « Préparateur »
   - `student` → « Étudiant en pharmacie »
   - `shelver` → « Rayonniste »

6. **Mise à jour docs juridiques** — répercuter les 2 nouveaux rôles dans :
   - `prod/legal/securite.md` §3.3 — étendre le tableau « Modèle de droits »
   - `prod/legal/privacy.md` §3.3 — étendre la liste « Rôle dans l'officine »
   - `prod/legal/dpa.md` Annexe 1 — étendre « Catégories de personnes concernées (a) »
   - **Important** : ces docs sont hashés et leur hash est stocké en DB à chaque consentement (RGPD art. 7). Toute modification substantielle bump la version. Mais comme l'ajout de rôles ne change pas le périmètre du traitement (juste la nomenclature interne), **ce n'est PAS une modification substantielle** au sens de l'art. 13(3) RGPD. Tu peux donc soit (a) bumper de `2026-05-30` à `2026-06-05` sans notification 30j aux clients existants, soit (b) ne pas bumper et attendre la prochaine modification substantielle pour grouper. **Décision Mehdi à acter dans la PR.**

7. **Régénérer les hashes** via `scripts/hash-legal.mjs` (P3-05, livré PR #67) si bump de version. Mettre à jour `src/lib/legal/consent-versions.ts`.

### Ne PAS toucher
- La logique de permissions existante — on ajoute des valeurs au mapping, on ne refait pas la matrice.
- Les RLS policies — si elles filtrent par rôle (peu probable, elles filtrent par `pharmacy_id`), elles doivent être permissives pour les nouveaux rôles. Vérifier rapidement, sinon ne pas modifier.
- Les invitations existantes — aucune migration de données nécessaire.

### Acceptance
- [ ] Migration appliquée sur staging via `npx supabase db push`.
- [ ] Sélecteur d'invitation affiche 5 options (titulaire / adjoint / préparateur / étudiant / rayonniste).
- [ ] Inviter un compte test avec rôle `student` → l'invité reçoit son email magique, complète le parcours invité (2 étapes — voir P2-01 PR #63), accède au produit avec les mêmes droits qu'un préparateur.
- [ ] JWT du compte invité contient bien `role: "student"`.
- [ ] Liste équipe affiche correctement les libellés français.
- [ ] Docs juridiques mises à jour (au moins `/securite` et `/privacy`).
- [ ] `npm run lint && npm run typecheck && npm run build && npm run test` verts.
- [ ] Test Playwright golden path « invitation préparateur » dupliqué pour étudiant + rayonniste (au minimum un des deux).

### Prompt Claude Code
```
Ticket TECH-10 (TODO_DEV.md). Ajouter les rôles 'student' (étudiant en pharmacie) et 'shelver' (rayonniste) avec mêmes droits que préparateur.

Lis CLAUDE.md §7 (migrations) + §8 (conventions), COORDINATION.md §S5 (allocation migrations — vérifier le prochain numéro libre, on prévoit 0050), TODO_DEV.md ticket TECH-10 en entier.

Vérifie d'abord la nature du stockage du rôle :
  grep -rn "pharmacy_member_role" supabase/migrations/ src/
Si c'est un enum Postgres → ALTER TYPE ... ADD VALUE IF NOT EXISTS
Si c'est un text + CHECK → DROP CONSTRAINT + ADD CONSTRAINT

Plan en 6 étapes (diff par étape, je valide) :
1. Vérification du schema actuel (grep + show table definition)
2. Migration 0050 (ou prochain numéro libre selon §S5)
3. Matrice permissions : étendre student + shelver = preparateur
4. UI sélecteur invitation : 5 options avec libellés FR
5. UI affichage liste équipe : 5 libellés
6. Maj docs juridiques /securite §3.3, /privacy §3.3, /dpa Annexe 1

Contraintes :
- Migration idempotente (IF NOT EXISTS).
- AUCUNE modification de la matrice de permissions existante — on ajoute des valeurs, on ne refait pas.
- NE TOUCHE PAS aux RLS policies — vérifier qu'elles sont permissives, sinon ping Mehdi.
- Pas de bump consent-versions sauf si Mehdi le demande explicitement.

À la fin : npm run dev + invitation test d'un compte 'student' + vérification JWT contient role:student + screenshot liste équipe avec les 5 libellés.
```

---

## TECH-11 — Photos sur module Locations (upload fichier + capture caméra mobile)

### Pourquoi ce ticket
Le module **Locations** gère le matériel médical loué par l'officine aux patients (tensiomètres, lecteurs glycémie, pousse-seringue, etc.). Les pharmaciens veulent **documenter visuellement** l'état du matériel à la sortie et au retour (rayures, casse, propreté) pour gérer les litiges avec les patients et tracer les remises en état. Aujourd'hui, le module ne permet que des champs textuels. On ajoute la capacité d'**uploader des photos depuis le fichier** ou de **prendre une photo directement depuis le téléphone** (caméra arrière). Ce ticket s'aligne sur le pattern déjà en place pour les tâches (`task_attachments`, migrations 0016/0017/0022) et les ordonnances.

**Branche** : `feat/tech-11-rental-photos`
**Estimation** : 1 jour (table + bucket policy + UI upload + UI capture + galerie + tests)
**Risque** : faible — pattern réutilisé des tâches.
**Prerequisites** : aucun. Bucket `attachments` privé déjà en place (P1-05 PR #26 + migration 0031).

### Fichiers à modifier / créer
- `supabase/migrations/0051_rental_attachments.sql` (vérifier numéro dans `COORDINATION.md` §S5)
- `src/lib/queries/rental-attachments.ts` (lecture / création / suppression)
- `src/features/rentals/services/rental-attachment-service.ts` (upload via Supabase Storage + insert en DB)
- `src/components/rentals/rental-photo-upload.tsx` (composant client : 2 boutons « Charger une photo » + « Prendre une photo »)
- `src/components/rentals/rental-photo-gallery.tsx` (composant client : grille de vignettes, modal de visualisation, suppression)
- Intégration dans la vue détail location (`src/components/rentals/rental-detail.tsx` ou équivalent)
- Tests : `src/lib/queries/__tests__/rental-attachments.test.ts` (Vitest) + extension d'un golden path Playwright

### À faire

1. **Migration `0051_rental_attachments.sql`** :

   ```sql
   -- 0051_rental_attachments.sql
   -- Table de jointure rentals ↔ attachments stockés dans Supabase Storage bucket 'attachments'
   -- Pattern aligné sur task_attachments (migrations 0017 + 0022).

   CREATE TABLE IF NOT EXISTS public.rental_attachments (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
     pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
     storage_path text NOT NULL,           -- ex: 'rentals/{rental_id}/{uuid}.jpg'
     mime_type text NOT NULL,              -- ex: 'image/jpeg', 'image/png', 'image/webp'
     size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760), -- 10 MB max
     original_filename text,
     captured_at timestamptz,              -- date EXIF si dispo, sinon NULL
     uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   );

   CREATE INDEX IF NOT EXISTS rental_attachments_rental_id_idx
     ON public.rental_attachments(rental_id);
   CREATE INDEX IF NOT EXISTS rental_attachments_pharmacy_id_idx
     ON public.rental_attachments(pharmacy_id);

   ALTER TABLE public.rental_attachments ENABLE ROW LEVEL SECURITY;

   -- SELECT : tous les membres de la pharmacie peuvent voir les photos
   CREATE POLICY rental_attachments_select_own_pharmacy
     ON public.rental_attachments FOR SELECT
     USING (pharmacy_id = (SELECT public.get_pharmacy_id()));

   -- INSERT : tous les membres autorisés à écrire dans rentals
   CREATE POLICY rental_attachments_insert_own_pharmacy
     ON public.rental_attachments FOR INSERT
     WITH CHECK (pharmacy_id = (SELECT public.get_pharmacy_id()));

   -- DELETE : titulaire + uploader original peuvent supprimer
   CREATE POLICY rental_attachments_delete_own_pharmacy
     ON public.rental_attachments FOR DELETE
     USING (pharmacy_id = (SELECT public.get_pharmacy_id()));
   ```

2. **Storage policy sur le bucket `attachments`** — vérifier dans la migration 0031 (PR #26) que la policy SELECT par `pharmacy_id` couvre déjà le préfixe `rentals/`. Si non, ajouter une policy dédiée :

   ```sql
   -- Si nécessaire, étendre la policy bucket existante pour permettre les paths 'rentals/*'
   -- (souvent les policies sont déjà génériques `name LIKE pharmacy_id || '/%'`).
   ```

3. **Service `rental-attachment-service.ts`** — pattern Supabase Storage classique :
   - Côté client : sélection fichier ou capture caméra → compression (canvas resize à 1920px max + JPEG quality 85) → upload via `supabase.storage.from('attachments').upload(path, blob)` → insert row `rental_attachments`.
   - Génération `storage_path` : `${pharmacyId}/rentals/${rentalId}/${crypto.randomUUID()}.jpg`.
   - Récupération URL signée (1h) pour affichage : `supabase.storage.from('attachments').createSignedUrl(path, 3600)`.

4. **Composant `RentalPhotoUpload`** (Client Component) :

   ```tsx
   <div className="flex gap-2">
     <input
       type="file"
       accept="image/jpeg,image/png,image/webp,image/heic"
       multiple
       hidden
       ref={fileInputRef}
       onChange={handleFileSelect}
     />
     <Button onClick={() => fileInputRef.current?.click()}>
       Charger une photo
     </Button>

     <input
       type="file"
       accept="image/*"
       capture="environment"
       hidden
       ref={cameraInputRef}
       onChange={handleFileSelect}
     />
     <Button onClick={() => cameraInputRef.current?.click()}>
       Prendre une photo
     </Button>
   </div>
   ```

   Le `capture="environment"` ouvre directement la caméra arrière sur mobile (iOS Safari, Chrome Android). Sur desktop, il ouvre le sélecteur de fichier.

5. **Compression côté client** (helper `src/lib/images/compress.ts` à créer ou réutiliser s'il existe pour les ordonnances) :

   ```ts
   export async function compressImage(
     file: File,
     maxDim = 1920,
     quality = 0.85
   ): Promise<Blob> {
     const img = await createImageBitmap(file)
     const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
     const canvas = new OffscreenCanvas(img.width * scale, img.height * scale)
     const ctx = canvas.getContext('2d')!
     ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
     return canvas.convertToBlob({ type: 'image/jpeg', quality })
   }
   ```

   Limite finale 10 MB par photo (matches le CHECK migration), idéalement < 500 KB après compression.

6. **Composant `RentalPhotoGallery`** :
   - Grille de vignettes 4 colonnes desktop / 2 mobile ;
   - Click → modal full-screen (Lightbox shadcn ou maison) ;
   - Bouton suppression (icône trash) sur chaque vignette, avec confirm dialog ;
   - State management : SWR ou TanStack Query selon pattern existant dans `rentals`.

7. **Intégration vue détail location** — ajouter une section « Photos » dans `RentalDetail` (titre h3, `<RentalPhotoGallery />` + `<RentalPhotoUpload />` masqué hors édition selon TECH-07 PR #39).

8. **Tests** :
   - Vitest : test que `compressImage` retourne un blob ≤ 10 MB ; test que les policies SQL refusent une lecture cross-pharmacy.
   - Playwright (étendre golden path locations) : créer une location → uploader 2 photos via fichier → vérifier qu'elles apparaissent dans la galerie → supprimer une photo → vérifier qu'il en reste 1.

### Ne PAS toucher
- La table `rentals` elle-même (ne pas ajouter une colonne `photos[]`, on utilise la table de jointure pour pattern propre).
- Le bucket `attachments` (privé, déjà en place).
- Les uploads d'ordonnances / pièces jointes de tâches.

### Acceptance
- [ ] Migration `0051_rental_attachments.sql` appliquée sur staging.
- [ ] Vue détail location affiche la section « Photos » avec galerie + 2 boutons « Charger une photo » + « Prendre une photo ».
- [ ] Sur iOS Safari et Android Chrome, le bouton « Prendre une photo » ouvre directement la caméra arrière.
- [ ] Upload d'une image 5 MB → après compression, le fichier stocké est < 500 KB.
- [ ] Photo uploadée par l'officine A invisible pour l'officine B (test RLS manuel).
- [ ] Suppression d'une photo retire l'enregistrement DB ET supprime le blob dans le bucket Storage.
- [ ] `npm run lint && npm run typecheck && npm run build && npm run test` verts.
- [ ] Test Playwright golden path locations étendu et vert.

### Prompt Claude Code
```
Ticket TECH-11 (TODO_DEV.md). Ajouter upload + capture photo sur module Locations, pattern aligné sur task_attachments (migrations 0017 + 0022).

Lis CLAUDE.md §7 (migrations) + §8 (conventions), COORDINATION.md §S5 (allocation migrations, on prévoit 0051), TODO_DEV.md ticket TECH-11 en entier.

Vérifie d'abord le pattern existant :
  cat supabase/migrations/0017_add_task_attachments.sql 2>/dev/null
  cat supabase/migrations/0022_tasks_attachments.sql 2>/dev/null
  cat supabase/migrations/0031_buckets_private_and_pharmacy_select.sql
  find src -path '*task-attachment*' -o -path '*attachments*' -name '*.ts*'

Plan en 8 étapes (diff par étape, je valide) :
1. Lecture du pattern task_attachments + helper queries existants
2. Migration 0051_rental_attachments.sql (table + RLS)
3. Service rental-attachment-service.ts (upload + signed URL + delete)
4. Helper images/compress.ts si pas déjà existant
5. Composant RentalPhotoUpload (2 boutons fichier + caméra)
6. Composant RentalPhotoGallery (grille + modal + delete)
7. Intégration dans la vue détail Location
8. Tests Vitest + extension Playwright golden path locations

Contraintes :
- Migration idempotente (IF NOT EXISTS partout).
- Storage path : '{pharmacy_id}/rentals/{rental_id}/{uuid}.jpg' (cohérence avec le bucket attachments privé existant).
- Compression client OBLIGATOIRE avant upload (1920px max + JPEG 85 %).
- Limite hard 10 MB par fichier (CHECK migration + validation côté client).
- Mobile : capture="environment" pour ouvrir la caméra arrière directement.
- NE TOUCHE PAS task_attachments ni le bucket attachments existant.
- Affichage galerie masqué hors édition (cohérent TECH-07 PR #39).

À la fin : npm run dev + test manuel iOS Safari ou Chrome Android (caméra) + 2 photos uploadées + suppression + vérif galerie. Screenshot avant PR.
```

---

# TICKETS DÉTAILLÉS (ARCHIVES — Sprint 1 & 2, tous mergés)

---

## P2-09 — Ajouter le script `typecheck` dans package.json

### Pourquoi ce ticket
Échauffement, mais utile : ce script va être appelé par la CI GitHub Actions à chaque PR (dans le ticket suivant P2-10). Aujourd'hui le script n'existe pas, donc si un dev introduit une erreur TypeScript dans une PR, **personne ne le voit avant le moment du build sur Vercel** — trop tard, c'est déjà déployé. On l'ajoute, c'est littéralement une ligne dans `package.json`.

**Branche** : `chore/p2-09-typecheck-script`
**Estimation** : 15 min
**Risque** : nul.

### Fichiers à modifier
- `package.json` (uniquement)

### À faire
Dans `package.json`, section `"scripts"`, ajouter :
```json
"typecheck": "tsc --noEmit"
```
Position : entre `"lint"` et la fin de l'objet `scripts`.

### Acceptance
- [ ] `npm run typecheck` s'exécute et termine sans erreur.
- [ ] Le diff fait littéralement 1 ligne ajoutée.

### Prompt Claude Code
```
Ticket P2-09 (TODO_DEV.md). Ajoute le script "typecheck": "tsc --noEmit" dans package.json. C'est tout. Une ligne.

Avant : montre-moi le diff. Après : lance npm run typecheck pour vérifier que ça marche.
```

---

## P2-15 — Dependabot config

### Pourquoi ce ticket
**Dependabot** est un robot GitHub qui scanne tes dépendances NPM chaque semaine et ouvre automatiquement une PR quand un paquet a une **mise à jour de sécurité** ou une nouvelle version. Sans Dependabot, ta dette de dépendances s'accumule en silence et un jour tu te retrouves avec une faille critique non patchée (cf. Log4Shell, etc. — des CVE majeures de paquets ultra-utilisés). C'est gratuit, automatique, et tu n'as qu'à reviewer/merger les PR au fil de l'eau.

**Branche** : `chore/p2-15-dependabot`
**Estimation** : 15 min
**Risque** : nul.

### À faire
Créer `.github/dependabot.yml` :
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    groups:
      patch-updates:
        update-types: ["patch"]
      minor-dev-dependencies:
        dependency-type: "development"
        update-types: ["minor"]
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
```

### Acceptance
- [ ] Fichier créé.
- [ ] PR mergée → vérifier sur GitHub que Dependabot est actif (Settings → Code security and analysis → Dependabot enabled).

### Prompt Claude Code
```
Ticket P2-15. Crée .github/dependabot.yml avec le contenu spécifié dans TODO_DEV.md. C'est un fichier neuf, rien d'autre à toucher.
```

---

## 🔴 P2-10 — GitHub Actions CI (lint + typecheck + build)

### Pourquoi ce ticket
**GitHub Actions** est le système d'intégration continue (CI) de GitHub. Tu écris un fichier YAML qui décrit ce qui doit s'exécuter automatiquement à chaque Pull Request : (1) le code respecte le **lint** (style) ; (2) il compile en **TypeScript** sans erreur ; (3) le **build Next.js** passe (preuve que le code est déployable). Si un de ces 3 checks casse, **la PR ne peut pas être mergée** (Mehdi configurera la protection de branche après). C'est ton **filet de sécurité** principal contre les régressions silencieuses — sans CI, n'importe quel push peut casser la prod.

**Branche** : `chore/p2-10-ci-workflow`
**Estimation** : ½ jour
**Risque** : faible (touche uniquement `.github/`).
**Prerequisites** : P2-09 mergée.
**🔴 Mehdi intervient** : il doit avoir ajouté les variables Supabase dans **GitHub repo → Settings → Secrets and variables → Actions** (`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`), sinon le build CI échouera systématiquement.

### Fichiers à créer
- `.github/workflows/ci.yml`

### À faire
Créer `.github/workflows/ci.yml` :
```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: http://localhost:3000
```

### Vérification avant code
**🔴 Avant de coder, ping Mehdi** : "Les GitHub Secrets sont-ils en place ? Je peux commencer ?". Si non, attends qu'il fasse (~5 min de sa part).

### Acceptance
- [ ] Ouvrir une PR test (un changement bidon dans un README) → CI verte.
- [ ] Ajouter volontairement une erreur TypeScript → CI rouge.

### Ne PAS toucher
- `package.json` (sauf si déjà fait par P2-09).
- Aucun fichier dans `src/`.

### Prompt Claude Code
```
Ticket P2-10. Crée .github/workflows/ci.yml selon TODO_DEV.md.

Une fois créé, vérifie :
- npm run lint passe localement
- npm run typecheck passe localement
- npm run build passe localement (avec les env vars du .env.local)

Si l'un d'eux casse, NE PUSH PAS. Diagnostique le problème et pingue Mehdi.
```

---

## P2-14 — Headers de sécurité

### Pourquoi ce ticket
Tu ajoutes des **en-têtes HTTP** que le navigateur reçoit avec chaque page de l'app. Ces headers durcissent le navigateur contre les attaques classiques : **XSS** (injection de script malveillant), **clickjacking** (page chargée dans un iframe pour piéger l'utilisateur), **fuites de referer** (l'URL précédente exposée à des sites tiers). Sans ces headers, tout audit sécurité (et tout titulaire d'officine prudent qui passera ton site dans un scanner type Mozilla Observatory) te flaggera. Avec eux, tu coches une grosse case de conformité en 2h. La seule subtilité : ne pas casser le scan caméra (CIP13) ni l'audio recorder.

**Branche** : `chore/p2-14-security-headers`
**Estimation** : 1-2h
**Risque** : faible (peut casser des intégrations tierces si CSP trop stricte).

### Fichiers à modifier
- `next.config.ts` (ou `next.config.mjs` si c'est ce qui existe)

### À faire
Trouver le fichier `next.config.*` à la racine. Ajouter une fonction `headers()` :

```ts
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(self), microphone=(self), geolocation=()',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://*.supabase.co",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
            "media-src 'self' blob:",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
  ]
},
```

**Important** : `camera=(self), microphone=(self)` est nécessaire pour le scan CIP13 et l'enregistrement audio. Ne pas mettre `()`.

### Test manuel obligatoire
Après déploiement local :
- [ ] Le scan CIP13 fonctionne (caméra).
- [ ] L'enregistrement audio dans `audio-recorder.tsx` fonctionne.
- [ ] Le scan d'ordonnance (upload + envoi OCR) fonctionne.
- [ ] La console navigateur ne montre PAS d'erreurs CSP qui bloquent le rendu.

**Si l'un casse** : note l'erreur CSP exacte (console navigateur), ajoute le domaine concerné dans la directive correspondante, et recommence. Ne désactive PAS la CSP en désespoir de cause — pingue Mehdi.

### Ne PAS toucher
- `next.config.ts` autre que la fonction `headers()`.
- Aucun composant.

### Prompt Claude Code
```
Ticket P2-14 (TODO_DEV.md).

Étape 1 : lis next.config.ts (ou .mjs) existant.
Étape 2 : ajoute la fonction async headers() avec la config CSP fournie dans TODO_DEV.md.
Étape 3 : npm run build pour vérifier.
Étape 4 : npm run dev et teste manuellement : scan CIP13, audio, scan ordonnance, ouverture dashboard. Si la console montre une erreur CSP, dis-moi laquelle.

Ne touche AUCUN autre fichier.
```

---

## 🔴 P2-11 — Intégration Sentry

### Pourquoi ce ticket
**Sentry** est un outil de monitoring d'erreurs en production. Concrètement : aujourd'hui, si l'app plante chez un utilisateur pilote (un titulaire qui essaie de scanner une ordonnance et tombe sur une erreur blanche), **vous n'êtes au courant que s'il vous le dit** (et 90 % du temps, il ne dira rien, il fermera la fenêtre). Avec Sentry, vous recevez automatiquement une notif Slack/email avec la **stack trace exacte**, le user concerné, la page, le moment. Sans Sentry, vous pilotez la bêta **dans le noir** — vous croyez que tout va bien jusqu'au churn qui arrive sans explication. Plan gratuit suffisant (5 k erreurs/mois).

**Branche** : `feat/p2-11-sentry`
**Estimation** : ½ jour
**Risque** : faible (additif, n'affecte pas la logique métier).
**🔴 Mehdi intervient** : il doit avoir créé le compte Sentry et ajouté `NEXT_PUBLIC_SENTRY_DSN` dans `.env.local` + Vercel. Vérifie l'existence avant de coder.

### Setup
1. Compte Sentry sur https://sentry.io (gratuit) — fait par Mehdi.
2. Projet "Next.js" → DSN récupéré → ajouté dans `.env.local` — fait par Mehdi.

### À faire
1. `npm i @sentry/nextjs`.
2. Lance `npx @sentry/wizard@latest -i nextjs` — l'assistant officiel Sentry. Il va créer :
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`
   - Modifs `next.config.ts` pour wrapper avec `withSentryConfig`.
3. Configure les sample rates pour le free tier :
   ```ts
   // sentry.client.config.ts
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 0.1,
     replaysSessionSampleRate: 0.0,
     replaysOnErrorSampleRate: 1.0,
   })
   ```
4. **Filtrage PII (Personally Identifiable Information — donnée perso identifiante)** — IMPORTANT pour RGPD :
   ```ts
   Sentry.init({
     ...
     beforeSend(event, hint) {
       if (event.request?.cookies) delete event.request.cookies
       if (event.user?.email) delete event.user.email
       return event
     },
   })
   ```

### Acceptance
- [ ] Forcer un `throw new Error('sentry-test')` dans une page → erreur visible dans le dashboard Sentry < 30 s.
- [ ] Vérifier qu'aucun email/cookie n'apparaît dans les erreurs Sentry.

### Ne PAS toucher
- Les routes API existantes pour y ajouter du try/catch Sentry. Sentry capture automatiquement les erreurs non gérées.

### Prompt Claude Code
```
Ticket P2-11 (TODO_DEV.md). Intégration Sentry.

Étapes :
1. npm i @sentry/nextjs
2. npx @sentry/wizard@latest -i nextjs — l'assistant officiel.
3. Configure les sample rates et beforeSend pour filtrer PII (voir code dans TODO_DEV.md).

Une fois fait, je teste avec un throw bidon dans une page non-critique (genre une route admin).

Conditions : Mehdi a déjà ajouté NEXT_PUBLIC_SENTRY_DSN dans .env.local. Vérifie qu'elle existe avant de coder.
```

---

## 🔴 P1-05 — Buckets storage en privé ⚠️ CRITIQUE

### Pourquoi ce ticket
**Faille majeure de cloisonnement multi-pharmacies.** Aujourd'hui, les buckets de stockage Supabase (où sont stockés les pièces jointes des tâches, les mémos vocaux patients, les vidéos de formation) sont **publics**. La policy de sécurité associée vérifie juste "est-ce que c'est ce bucket ?", elle ne vérifie **pas** "est-ce que cet utilisateur appartient à la bonne pharmacie ?". Conséquence : si quelqu'un devine ou intercepte une URL de pièce jointe (par exemple un mémo vocal qui parle d'un patient nominatif), **il peut l'ouvrir sans être connecté**. Tu passes les buckets en privé : les fichiers ne deviennent accessibles que via des URLs **signées temporaires** générées par le serveur après vérification d'autorisation. Cette migration est **critique** parce qu'elle va casser temporairement l'affichage des fichiers en prod — d'où la coordination obligatoire avec Mehdi.

**Branche** : `fix/p1-05-private-buckets`
**Estimation** : 1 jour
**Risque** : ÉLEVÉ — si tu rates, plus aucun fichier ne s'affiche dans l'app.
**🔴 Mehdi intervient** : il enchaînera **immédiatement** derrière avec P1-06 (refactor signed URLs côté code applicatif). Sans P1-06, l'app est cassée pour l'affichage. **Coordonne le moment du merge avec lui** — typiquement vendredi 17h pour qu'il prenne le relais le samedi.

### Fichiers à créer
- `supabase/migrations/0026_buckets_private_and_pharmacy_select.sql`

### À faire
Migration `0026_buckets_private_and_pharmacy_select.sql` :

```sql
-- 0026_buckets_private_and_pharmacy_select.sql
-- Passe les buckets attachments et training-files en privé + ajoute filtre pharmacy_id sur SELECT.

UPDATE storage.buckets SET public = false WHERE id IN ('attachments', 'training-files');

-- Re-crée la policy SELECT pour attachments avec filtre pharmacy_id
DROP POLICY IF EXISTS "attachments_select" ON storage.objects;
CREATE POLICY "attachments_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);

-- Idem pour training-files
DROP POLICY IF EXISTS "training_files_select" ON storage.objects;
CREATE POLICY "training_files_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'training-files'
  AND split_part(name, '/', 1) = (SELECT pharmacy_id::text FROM public.profiles WHERE id = auth.uid())
);
```

**Ne touche PAS aux policies INSERT et DELETE** : elles sont déjà bonnes (vérifié dans `0010_training_files_storage_bucket.sql` et `0016_add_attachments_and_audio.sql`).

### À mettre à jour
- `supabase.sql` (snapshot) : reporter les changements.

### Test avant merge
1. Lance la migration en local : `supabase migration up`.
2. Test manuel : crée une tâche avec une pièce jointe → l'aperçu ne s'affiche **plus** (normal, c'est ce qu'on veut, Mehdi va corriger avec P1-06).
3. Vérifier en base : `SELECT id, public FROM storage.buckets WHERE id IN ('attachments', 'training-files');` → `false` pour les deux.
4. Vérifier qu'on peut TOUJOURS uploader (test ajouter une pièce jointe → ça doit toujours passer, c'est juste l'affichage qui casse).

### ⚠️ IMPORTANT
Cette migration **va casser temporairement l'affichage des pièces jointes** dans l'app. C'est attendu — Mehdi va corriger immédiatement après avec P1-06 (signed URLs). **Coordonne-toi avec lui** : préviens-le que tu mergerais cette PR vendredi 17h, qu'il puisse enchaîner samedi-dimanche.

### Acceptance
- [ ] Migration appliquée.
- [ ] `SELECT public FROM storage.buckets WHERE id = 'attachments'` → `false`.
- [ ] Upload d'une pièce jointe fonctionne toujours (test manuel dans l'UI).
- [ ] `supabase.sql` mis à jour avec les changements.

### Prompt Claude Code
```
⚠️ Ticket P1-05 (TODO_DEV.md). C'EST UNE MIGRATION CRITIQUE.

Lis CLAUDE.md §7 et les migrations 0010 et 0016 pour comprendre la situation actuelle.

Crée supabase/migrations/0026_buckets_private_and_pharmacy_select.sql avec le SQL exact de TODO_DEV.md. Ne dévie pas, ne "améliore" pas, ne change pas les policies INSERT/DELETE.

Mets à jour aussi supabase.sql (le snapshot lisible).

Avant de me dire "fini" : vérifie qu'il n'y a AUCUNE autre policy storage.objects que tu touches par accident.

IMPORTANT : préviens-moi quand tu veux que je teste, j'ai besoin de coordonner avec Mehdi pour qu'il enchaîne avec P1-06 derrière.
```

---

## P2-12 — Vitest setup + 5 tests basiques

### Pourquoi ce ticket
**Tests unitaires.** Aujourd'hui le repo n'a aucun test — pas une seule fonction n'est vérifiée automatiquement. Conséquence concrète : à chaque refactor ou Dependabot update, on espère que rien ne casse. Tu poses **Vitest** (un framework de tests rapide, compatible Vite/Next 16) et tu écris 5 tests sur des **fonctions pures** (sans dépendance Supabase) : validation de codes CIP13 (les codes-barres médicaments français), matching de noms de médicaments, helpers de dates. C'est le minimum vital pour que ces fonctions ne cassent pas silencieusement. Sans tests, chaque refactor futur est un saut dans le noir.

**Branche** : `test/p2-12-vitest-setup`
**Estimation** : 1 jour
**Risque** : nul (additif).

### À faire
1. `npm i -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom`.
2. Créer `vitest.config.ts` :
   ```ts
   import { defineConfig } from 'vitest/config'
   import path from 'path'
   
   export default defineConfig({
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: ['./vitest.setup.ts'],
     },
     resolve: {
       alias: { '@': path.resolve(__dirname, './src') },
     },
   })
   ```
3. Créer `vitest.setup.ts` vide (ou `import '@testing-library/jest-dom'` si tu veux les matchers).
4. Ajouter scripts dans `package.json` :
   ```json
   "test": "vitest run",
   "test:watch": "vitest"
   ```
5. Écrire 5 tests dans `src/lib/queries/__tests__/` :
   - `cip13.test.ts` : test des fonctions de validation/normalisation CIP13 (la fonction existe dans `src/lib/shortages/cip13.ts`).
   - `name-match.test.ts` : test de matching des noms de médicaments (`src/lib/shortages/name-match.ts`).
   - `task-attachments.test.ts` : test de `getTaskAttachments` / `getTaskDescriptionText` (`src/lib/tasks/task-attachments.ts`).
   - `agenda-utils.test.ts` : tests basiques sur `agenda-utils.ts`.
   - `time.test.ts` : tests sur `src/lib/sessions/time.ts`.

Cherche les fonctions pures (sans dépendance Supabase) pour ces 5 tests. **Ne mocke PAS Supabase**, ne teste pas les hooks React Query pour l'instant.

### Acceptance
- [ ] `npm run test` exécute les 5 tests et tous passent.
- [ ] Ajouter `npm run test` dans la CI (`.github/workflows/ci.yml`) en étape additionnelle.

### Prompt Claude Code
```
Ticket P2-12 (TODO_DEV.md). Setup Vitest + 5 tests sur fonctions pures.

Étapes :
1. npm i -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
2. vitest.config.ts + vitest.setup.ts (cf TODO_DEV.md).
3. Scripts package.json.
4. Lis ces 5 fichiers pour comprendre ce que tu vas tester :
   - src/lib/shortages/cip13.ts
   - src/lib/shortages/name-match.ts
   - src/lib/tasks/task-attachments.ts
   - src/lib/agenda-utils.ts
   - src/lib/sessions/time.ts
5. Pour chaque, écris 3-5 cas de test basiques (happy path + 1-2 edge cases). Tests dans `src/lib/**/__tests__/*.test.ts`.
6. Ajoute `npm run test` dans .github/workflows/ci.yml.

Si une fonction utilise Supabase : SKIP, on testera ça plus tard avec mocks.

npm run test doit passer en vert.
```

---

## 🔴 P2-05 + P2-06 — Cron jobs notifications retards

### Pourquoi ce ticket
**Le système de notifications existe** dans l'app (la table `public.notifications`, les channels Realtime), **mais aucun robot ne déclenche automatiquement une notif quand une tâche dépasse sa date d'échéance ou qu'une location de matériel doit être retournée**. Conséquence : ces retards passent à la trappe — or **la gestion des retards est une fonctionnalité-clé que les pharmaciens attendent** (suivi des locations, traçabilité des tâches qualité). Tu crées un **job SQL** qui tourne automatiquement toutes les heures côté Postgres et insère des notifications pour chaque retard détecté. Sans ce ticket, le module notifications est à moitié mort — les retards ne remontent jamais sauf à ce qu'un humain les voie.

**Branche** : `feat/p2-05-06-overdue-cron`
**Estimation** : 1 jour (les deux ensemble)
**Risque** : moyen.
**🔴 Mehdi intervient** : il doit avoir activé l'extension `pg_cron` côté Supabase Dashboard → Database → Extensions. Vérifie avant de démarrer.

### À faire
1. Vérifier que l'extension `pg_cron` est activée sur le projet Supabase. Si ce n'est pas le cas, **ping Mehdi**.
2. Migration `0027_overdue_notifications_cron.sql` :
   ```sql
   -- 0027_overdue_notifications_cron.sql
   -- Job horaire qui crée des notifications pour les tâches et locations en retard.
   
   CREATE OR REPLACE FUNCTION public.create_overdue_notifications()
   RETURNS void AS $$
   BEGIN
     -- Tâches en retard
     INSERT INTO public.notifications (pharmacy_id, user_id, type, title, body, target_type, target_id)
     SELECT
       t.pharmacy_id,
       t.assigned_to,
       'task_overdue',
       'Tâche en retard',
       'La tâche "' || t.title || '" a dépassé son échéance.',
       'task',
       t.id
     FROM public.tasks t
     WHERE t.due_date < now()
       AND t.status = 'todo'
       AND t.assigned_to IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.notifications n
         WHERE n.target_type = 'task' AND n.target_id = t.id AND n.type = 'task_overdue'
       );
   
     -- Locations en retard
     INSERT INTO public.notifications (pharmacy_id, user_id, type, title, body, target_type, target_id)
     SELECT DISTINCT
       r.pharmacy_id,
       p.id,
       'rental_overdue',
       'Location en retard',
       'La location "' || r.equipment_name || '" devait être rendue le ' || to_char(r.expected_return_date, 'DD/MM/YYYY') || '.',
       'rental',
       r.id
     FROM public.rentals r
     JOIN public.profiles p ON p.pharmacy_id = r.pharmacy_id AND p.role IN ('titulaire', 'adjoint')
     WHERE r.expected_return_date < now()
       AND r.status = 'active'
       AND NOT EXISTS (
         SELECT 1 FROM public.notifications n
         WHERE n.target_type = 'rental' AND n.target_id = r.id AND n.type = 'rental_overdue' AND n.user_id = p.id
       );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   
   SELECT cron.schedule(
     'create-overdue-notifications-hourly',
     '0 * * * *',  -- toutes les heures à xx:00
     $$ SELECT public.create_overdue_notifications(); $$
   );
   ```
3. **Vérifier les noms de colonnes** : avant d'écrire la migration, lis `0001_init.sql` pour confirmer :
   - `tasks` a bien `due_date`, `status`, `assigned_to`, `pharmacy_id`, `title`.
   - `rentals` a bien `expected_return_date`, `status`, `equipment_name`, `pharmacy_id`. Si le nom diffère, **adapte la migration**, ne devine pas.
   - `notifications` a bien les colonnes utilisées (`pharmacy_id`, `user_id`, `type`, `title`, `body`, `target_type`, `target_id`).

### Acceptance
- [ ] Créer une tâche `due_date = now() - interval '1 day'`, status `todo`, assignée à toi-même.
- [ ] Exécuter manuellement `SELECT public.create_overdue_notifications();`.
- [ ] Vérifier qu'une row apparaît dans `notifications`.
- [ ] `SELECT * FROM cron.job WHERE jobname = 'create-overdue-notifications-hourly';` retourne 1 ligne.

### Ne PAS toucher
- La table `notifications` (schéma).
- Le code applicatif des notifications (`src/hooks/use-notifications.ts`).

### Prompt Claude Code
```
Tickets P2-05 + P2-06 (TODO_DEV.md). Cron jobs notifications retards.

D'abord : lis 0001_init.sql et confirme-moi les noms EXACTS des colonnes de tasks, rentals, et notifications. Liste-les. Si une colonne du SQL proposé n'existe pas avec ce nom, signale-le-moi avant d'écrire la migration.

Ensuite : crée 0027_overdue_notifications_cron.sql avec le contenu (adapté si besoin aux vrais noms de colonnes).

Test manuel avant PR : crée une tâche en retard, exécute create_overdue_notifications(), vérifie qu'une notification apparaît.

⚠️ pg_cron doit être activé côté Supabase Dashboard. Si tu ne peux pas, dis-moi.
```

---

## P2-17 — Sortir `work_sessions` du Realtime vers polling

### Pourquoi ce ticket
Aujourd'hui l'app maintient **3 connexions WebSocket Realtime actives par utilisateur** pour suivre les `work_sessions` (les clock-in/clock-out d'employés). Or ces événements sont **rares** (~2 événements/jour/personne — quelqu'un arrive le matin, quelqu'un part le soir). C'est du **sur-engineering** : 3 connexions WebSocket maintenues en permanence pour 2 événements/jour, c'est gaspiller tes quotas Supabase et compliquer le code. Tu remplaces par un **polling** (rafraîchissement) toutes les 30 secondes côté client. Résultat : moins de connexions WebSocket consommées (utile quand vous approcherez les limites du plan Pro à 50+ officines), code plus simple, scaling meilleur. **Tu gardes les notifications en Realtime** (elles, c'est légitime — un user veut voir une notification arriver en temps réel).

**Branche** : `refactor/p2-17-work-sessions-polling`
**Estimation** : ½ jour
**Risque** : moyen (touche 3 fichiers qui affichent les sessions).

### Fichiers à modifier
- `src/contexts/session-context.tsx` (lignes 115-140 — channel `work_sessions_realtime_*`)
- `src/app/(app)/dashboard/page.tsx` (lignes 117-131 — channel `dashboard_work_sessions_*`)
- `src/components/admin/team-sessions-panel.tsx` (lignes 46-59 — channel `rh_work_sessions_*`)

### À faire
Pour chaque fichier :
1. **Supprimer** le `supabase.channel(...).on('postgres_changes', ...).subscribe()`.
2. **Conserver** la logique de fetch existante mais ajouter `refetchInterval: 30_000` sur le `useQuery` correspondant (ou créer un `useEffect` avec `setInterval` si pas dans React Query).

Exemple pour `dashboard/page.tsx` :
```ts
// Avant
useEffect(() => {
  const channel = supabase.channel(...).on('postgres_changes', ...).subscribe()
  return () => { supabase.removeChannel(channel) }
}, [pharmacyId])

// Après
const { data } = useQuery({
  queryKey: ['dashboard_work_sessions', pharmacyId],
  queryFn: () => fetchWorkSessions(pharmacyId),
  refetchInterval: 30_000,
  enabled: !!pharmacyId,
})
```

### Ne PAS toucher
- La structure de la table `work_sessions`.
- Les autres channels Realtime (notifications doit rester en Realtime).
- La logique de **création/update** des work_sessions (les actions clock-in/clock-out).

### Acceptance
- [ ] DevTools Network → onglet WS : aucune connexion sur `work_sessions_*` après navigation sur dashboard/admin.
- [ ] Les compteurs de sessions actives se mettent à jour sous 30s quand un user clock-in/out (test en ouvrant 2 onglets).
- [ ] Les notifications continuent de fonctionner en Realtime (test : un autre user assigne une tâche → notif arrive en temps réel).

### Prompt Claude Code
```
Ticket P2-17 (TODO_DEV.md). Migration Realtime → polling pour work_sessions.

Lis ces 3 fichiers :
- src/contexts/session-context.tsx
- src/app/(app)/dashboard/page.tsx
- src/components/admin/team-sessions-panel.tsx

Pour chacun :
1. Identifie le bloc Realtime (.channel() ... .subscribe()).
2. Identifie le hook de fetch correspondant.
3. Remplace le Realtime par refetchInterval: 30_000 sur le useQuery (si pas useQuery, propose-moi une approche AVANT de coder).

NE TOUCHE PAS :
- src/hooks/use-notifications.ts (notifications restent en Realtime)
- La logique de clock-in/clock-out

Diff par fichier, je valide chacun.
```

---

## P2-13 — Playwright golden paths

### Pourquoi ce ticket
**Tests end-to-end (E2E).** Là où Vitest (P2-12) teste des fonctions isolées, Playwright lance un vrai navigateur Chromium, charge l'app comme un vrai utilisateur, simule des clics et vérifie ce qui s'affiche. Tu codes **3 scénarios "golden path"** (les parcours absolument critiques) : (1) login OTP, (2) scan ordonnance + création prescription, (3) scan CIP13 + levée rupture. Ces tests s'exécutent en CI à chaque PR. Si un dev casse silencieusement le login en refactorant un composant qui n'a "rien à voir", **la CI le bloque** avant merge. C'est ton filet de sécurité supérieur aux tests unitaires pour les parcours business critiques.

**Branche** : `test/p2-13-playwright-e2e`
**Estimation** : 2 jours
**Risque** : nul (additif).

### À faire
1. `npm i -D @playwright/test` ; `npx playwright install chromium`.
2. `playwright.config.ts` :
   ```ts
   import { defineConfig } from '@playwright/test'
   export default defineConfig({
     testDir: './e2e',
     timeout: 30_000,
     use: {
       baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
       trace: 'on-first-retry',
     },
     projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
     webServer: {
       command: 'npm run dev',
       url: 'http://localhost:3000',
       timeout: 60_000,
       reuseExistingServer: true,
     },
   })
   ```
3. Scripts `package.json` :
   ```json
   "e2e": "playwright test",
   "e2e:ui": "playwright test --ui"
   ```
4. Tests dans `e2e/` :
   - `login.spec.ts` : vérifie que la page `/login` charge et que le formulaire OTP s'affiche.
   - `dashboard-loads.spec.ts` : avec un utilisateur de test (Mehdi te donnera des creds dev), navigation `/login` → OTP → `/dashboard` → vérifier qu'un titre s'affiche.
   - `task-create.spec.ts` : créer une tâche depuis l'UI, vérifier qu'elle apparaît dans la liste.

**Note** : ces tests s'exécutent contre un Supabase de **dev** (pas la prod). Mehdi te dira quel projet utiliser. Tu peux créer un compte test "test@pharmaworkspace.fr" pour l'OTP.

### Acceptance
- [ ] `npm run e2e` passe localement avec le serveur dev tourné.
- [ ] Ajouter dans CI : étape `e2e` après `build`.

### Ne PAS toucher
- Le code de l'app pour "faciliter les tests" (data-testid, etc.). Si un test est dur à écrire, utilise des locators `getByRole`, `getByLabel`, `getByText`. Si vraiment besoin, propose un data-testid précis à Mehdi avant d'ajouter.

---

## P2-03 — Recherche full-text serveur

### Pourquoi ce ticket
À **100 ordonnances ou ruptures** dans une officine (équivalent ~2 semaines d'activité d'une officine moyenne), les listes de l'app deviennent **illisibles sans une barre de recherche**. Aujourd'hui : zéro recherche côté serveur. Tu poses un **index Postgres tsvector** (la technologie native Postgres pour la recherche full-text en français — gère les accents, la conjugaison, les pluriels nativement) + une barre de recherche dans les pages liste. **Sans ce ticket, à la 3e semaine de bêta tes pilotes ne peuvent plus retrouver une ordonnance par nom de patient → c'est le moment où ils arrêtent d'utiliser l'app.** C'est une feature critique d'usage quotidien.

**Branche** : `feat/p2-03-fulltext-search`
**Estimation** : 3 jours
**Risque** : moyen (touche queries et listes).

### À faire
1. **Migration `0029_search_indexes.sql`** :
   ```sql
   -- Ajout d'une colonne tsvector pour recherche full-text
   ALTER TABLE public.prescriptions
     ADD COLUMN IF NOT EXISTS search_vec tsvector
     GENERATED ALWAYS AS (
       setweight(to_tsvector('french', coalesce(patient_name, '')), 'A') ||
       setweight(to_tsvector('french', coalesce(notes, '')), 'B')
     ) STORED;
   
   CREATE INDEX IF NOT EXISTS prescriptions_search_idx
     ON public.prescriptions USING GIN (search_vec);
   
   ALTER TABLE public.drug_shortages
     ADD COLUMN IF NOT EXISTS search_vec tsvector
     GENERATED ALWAYS AS (
       setweight(to_tsvector('french', coalesce(product_name, '')), 'A') ||
       setweight(to_tsvector('french', coalesce(notes, '')), 'B')
     ) STORED;
   
   CREATE INDEX IF NOT EXISTS drug_shortages_search_idx
     ON public.drug_shortages USING GIN (search_vec);
   ```
   ⚠️ **Vérifie d'abord** les noms exacts des colonnes (`patient_name`, `notes`, `product_name`) en lisant `0001_init.sql` et les migrations suivantes.

2. **Query function** dans `src/lib/queries/prescriptions.ts` (ajouter, ne pas remplacer) :
   ```ts
   export async function searchPrescriptions(
     pharmacyId: string,
     query: string,
     limit = 50
   ): Promise<QueryResult<Prescription[]>> {
     if (!query.trim()) return { data: [], error: null }
     const supabase = createClient()
     const { data, error } = await supabase
       .from('prescriptions')
       .select('*')
       .eq('pharmacy_id', pharmacyId)
       .textSearch('search_vec', query, { config: 'french', type: 'plain' })
       .limit(limit)
     if (error) return { data: null, error: error.message }
     return { data: data ?? [], error: null }
   }
   ```
   Idem pour `drug_shortages`.

3. **UI** : composant `<SearchInput />` dans `src/components/shared/` (debounced 300ms). À utiliser dans les pages liste `/prescriptions` et `/shortages`.

### Acceptance
- [ ] Tape "doliprane" dans la recherche `/prescriptions` → résultats pertinents en < 200ms.
- [ ] Tape une partie de nom patient → match aussi.
- [ ] Effacer la recherche → liste complète revient.

### Ne PAS toucher
- Les autres queries existantes (`getPrescriptions`, etc.). Tu **ajoutes** `searchPrescriptions`, tu ne remplaces pas.

---

## P2-04 — Pagination keyset

### Pourquoi ce ticket
Aujourd'hui, quand un utilisateur ouvre une page liste (tâches, ordonnances, commandes), **TOUTES les rows sont chargées en mémoire d'un coup**. À 50 items : invisible. À 500 : ça lague. À 5000 (officine active depuis 1 an) : la page met 10 secondes à charger, ou crashe carrément le navigateur sur mobile. Tu refactores pour charger **50 items + un bouton "Charger plus"** qui ramène les 50 suivants. Tu utilises la technique **keyset pagination** (curseur sur `created_at` + `id`) qui est **beaucoup plus rapide** que la pagination naïve par `OFFSET` (laquelle se dégrade linéairement avec la profondeur). Sans ce ticket, l'app devient inutilisable au bout de 6 mois d'usage.

**Branche** : `feat/p2-04-keyset-pagination`
**Estimation** : 2 jours
**Risque** : moyen (refactor de queries).

### À faire
1. Choisir une query à pilote (recommandé : `getTasks`).
2. Modifier sa signature :
   ```ts
   export async function getTasks(
     pharmacyId: string,
     cursor?: { created_at: string; id: string },
     limit = 50
   ): Promise<QueryResult<{ items: Task[]; nextCursor: { created_at: string; id: string } | null }>>
   ```
3. Query :
   ```ts
   let q = supabase
     .from('tasks')
     .select('*')
     .eq('pharmacy_id', pharmacyId)
     .order('created_at', { ascending: false })
     .order('id', { ascending: false })
     .limit(limit + 1)
   
   if (cursor) {
     q = q.or(
       `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
     )
   }
   
   const { data, error } = await q
   ```
4. Hook React Query → `useInfiniteQuery` au lieu de `useQuery`.
5. UI : bouton "Charger plus" en bas de la liste.

Une fois validé sur tasks, répliquer sur `prescriptions`, `orders`, `shortages`.

### Acceptance
- [ ] Sur 500 tâches : seule les 50 premières chargent au mount, "Charger plus" récupère les 50 suivantes.
- [ ] Le tri reste cohérent (pas de doublons, pas de manqués).

### ⚠️
**Ne casse pas les hooks existants.** Si tu changes la signature de `getTasks`, change aussi tous les appels. Si tu hésites : ajoute un `getTasksPaginated` séparé et migre progressivement.

---

## P2-01 — Polir le flow onboarding (wizard 4 étapes avec CB obligatoire)

### Pourquoi ce ticket
**C'est LE moment où on perd 80 % des inscrits dans tout SaaS.** Un titulaire d'officine s'inscrit, fait l'onboarding, et **doit valider sa CB pour activer son compte** (pattern Linear / Vercel Pro : €0 prélevés pendant 30 jours, prélèvement auto Early Adopter -40 % à J+30, annulable depuis le Customer Portal Stripe). Tu re-designes ce parcours pour qu'un titulaire le complète **en moins de 5 minutes sans aide** : pharmacie → profil → équipe → activation CB (Stripe Checkout). C'est le ticket avec le **plus gros impact sur ton taux d'activation**.

**Branche** : `feat/p2-01-onboarding-wizard-4-steps`
**Estimation** : 3 jours
**Risque** : moyen (parcours critique + 1 endpoint Stripe à consommer + helper consommé par le middleware Mehdi).
**Prerequisites** : Mehdi P4-13b a livré `/api/stripe/checkout-setup` (sinon mock via `/dev/mock-stripe-success`).

### Fichiers à modifier / créer
- `src/app/(onboarding)/onboarding/layout.tsx` — barre de progression 4 étapes
- `src/app/(onboarding)/onboarding/create/page.tsx` — étape 1 (pharmacie)
- `src/app/(onboarding)/onboarding/profile/page.tsx` — étape 2 (profil)
- `src/app/(onboarding)/onboarding/invite/page.tsx` (nouveau) — étape 3 (équipe)
- `src/app/(onboarding)/onboarding/activate/page.tsx` (nouveau) — étape 4 (CB)
- `src/app/api/onboarding/create-pharmacy/route.ts` — modif : `INSERT ... subscription_status='incomplete'` + UPDATE `pharmacy_acquisition.pharmacy_id`
- `src/lib/onboarding/wizard-state.ts` (nouveau) — helper `getWizardStep()` consommé par `src/proxy.ts` de Mehdi

### À faire

1. **Layout 4 étapes** : barre de progression `1/4 → 2/4 → 3/4 → 4/4` (Pharmacie · Profil · Équipe · Activation CB). L'étape 4 affiche un cadenas + sous-titre "Validation par carte (€0 prélevés pendant 30 jours)".

2. **Étape 1 `/onboarding/create`** : nom officine + ville + FINESS (optionnel). Au submit, endpoint `/api/onboarding/create-pharmacy` fait `INSERT pharmacies ... subscription_status='incomplete'` (état initial bloquant) **+** `UPDATE pharmacy_acquisition SET pharmacy_id = <new_id> WHERE id = <acquisition_id from user_metadata>`. Si `acquisition_id` absent (vieux compte), skip silencieusement.

3. **Étape 2 `/onboarding/profile`** : juste prénom + nom.

4. **Étape 3 `/onboarding/invite`** (nouveau) : 3 champs email + sélecteur rôle (titulaire / adjoint / préparateur), boutons "Inviter" + "Passer cette étape". `/api/invitations/create-native` est à Mehdi — tu ne le touches pas. Au "Passer", set `user_metadata.onboarding_invites_handled=true`.

5. **Étape 4 `/onboarding/activate`** (nouveau, **bloquante**) : titre "Activez votre essai 30 jours gratuit" + sous-titre "€0 prélevés pendant 30 jours. Premier prélèvement le [J+30] au tarif Early Adopter -40 % à vie. Annulable à tout moment." + sélecteur 3 tiers (Solo Early Adopter 23,40 € HT/mois par défaut) + bouton "Saisir ma carte" → POST `/api/stripe/checkout-setup` (Mehdi P4-13b) avec `{ tier, billing }` → reçoit `{ checkout_url }` → `window.location = checkout_url`. En bas : `<HotlineCTA context="onboarding_activate" variant="link" />`. **Pas de bouton "Passer"** — la CB est obligatoire. Au retour de Stripe, l'utilisateur atterrit sur `/onboarding/activate/success?session_id=…` (route livrée par Mehdi P4-13b).

6. **Helper `getWizardStep()` (`src/lib/onboarding/wizard-state.ts`)** :
   ```ts
   export type WizardStep = 'create' | 'profile' | 'invite' | 'activate' | 'done'
   export async function getWizardStep(supabase, userId): Promise<WizardStep> {
     // 1. Pas de pharmacy → 'create'
     // 2. profile.first_name/last_name vide → 'profile'
     // 3. user_metadata.onboarding_invites_handled !== true → 'invite'
     // 4. pharmacy.subscription_status IN (NULL, 'incomplete') → 'activate'
     // sinon → 'done'
   }
   ```
   Mehdi appelle ce helper dans `src/proxy.ts` pour rediriger l'utilisateur sur la bonne étape. **Tu ne touches pas `src/proxy.ts`** ; tu documentes juste la signature dans `COORDINATION.md` §B8 (contrat 6) pour que Mehdi puisse la wirer.

7. **PostHog events** via `capture()` de `@/lib/analytics/posthog` (P4-06 mergée) : `pharmacy_created`, `profile_completed`, `first_invite_sent` (par invité), `onboarding_invites_skipped`, `onboarding_activate_viewed`, `onboarding_completed` (à l'arrivée sur `/` une fois `subscription_status='trialing'`). Catalogue typé dans `src/lib/analytics/events.ts`.

### Ne PAS toucher
- `src/proxy.ts` (middleware — Mehdi).
- `/api/invitations/create-native` (Mehdi).
- `/api/stripe/*` (Mehdi P4-13b).
- La logique DB existante hors INSERT pharmacy + UPDATE pharmacy_acquisition.

### Acceptance
- [ ] Flow complet local : signup OTP → wizard 4 étapes → CB test Stripe `4242 4242 4242 4242` → dashboard accessible (`subscription_status='trialing'`).
- [ ] Si CB pas saisie : middleware redirige sur `/onboarding/activate` à chaque tentative de nav (Mehdi wire ça via `getWizardStep`).
- [ ] `pharmacy_acquisition.pharmacy_id` updated après création pharmacie (vérif Supabase Dashboard).
- [ ] Events PostHog tous émis aux bons moments (vérif PostHog EU).
- [ ] Test par 2 personnes externes : complétion en < 5 min sans aide.
- [ ] `npm run lint && npm run typecheck && npm run build` verts.

---

## ⚪ P4-01 + P4-02 + P4-06 — ARCHIVÉ (hors scope Dim depuis le 25/05/2026)

> 📝 **Hors scope Dim.** Ces tickets concernaient la landing commerciale + l'instrumentation PostHog client. Réassignés à BillyGoat001 le 25/05/2026, puis repris en solo par Mehdi le 28/05/2026 après indisponibilité Billy. **Tous mergés** (PR #47, #48, #49). Le code vit dans `src/app/(marketing)/*`, `src/components/marketing/*` et `src/lib/analytics/posthog.ts` — Mehdi maintient ces fichiers.
>
> **Ce que Dim doit faire à la place** : si tu poses des events `first_*` (`first_task_created`, `first_ocr_done`, `first_shortage_resolved`) dans tes composants métier, utilise le helper `capture()` exporté de `@/lib/analytics/posthog` et respecte la nomenclature `snake_case` (voir `src/lib/analytics/events.ts` pour le catalogue — P4-14 mergée). Cf. `COORDINATION.md` §B6 pour la convention de naming.
>
> Pour le détail historique des specs, voir `git log -- prod/TODO_DEV.md` autour du 25/05/2026.

---

## P5-06 — Système de feedback in-app

### Pourquoi ce ticket
**Ton canal de feedback principal pendant la bêta.** Tu poses un **bouton flottant "Donner mon avis"** visible en permanence dans l'app (en bas à droite, comme Intercom/Crisp), qui ouvre une modale simple : catégorie (bug / idée / compliment) + textarea + submit. Le pilote peut reporter un truc en 10 secondes sans changer de fenêtre, sans chercher un email. **Sans ce bouton, les retours arrivent dispersés** : WhatsApp, SMS, email, appel — tout finit perdu. Avec ce bouton, tout est centralisé dans une table `feedback` que vous reviewez chaque vendredi pour prioriser le sprint suivant.

**Branche** : `feat/p5-06-in-app-feedback`
**Estimation** : 1 jour
**Risque** : faible (additif).

### À faire
1. Migration `0029_feedback.sql` :
   ```sql
   CREATE TABLE public.feedback (
     id uuid primary key default gen_random_uuid(),
     pharmacy_id uuid references public.pharmacies(id) on delete set null,
     user_id uuid references auth.users(id) on delete set null,
     category text not null check (category in ('bug', 'idea', 'praise', 'other')),
     content text not null,
     page_url text,
     created_at timestamptz not null default now()
   );
   ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
   CREATE POLICY feedback_insert ON public.feedback FOR INSERT TO authenticated WITH CHECK (true);
   CREATE POLICY feedback_select_own ON public.feedback FOR SELECT TO authenticated USING (user_id = auth.uid());
   ```
2. Composant `<FeedbackButton />` dans `src/components/shared/feedback-button.tsx` — bouton flottant en bas à droite, ouvre une modale `<FeedbackDialog />` (catégorie radio + textarea + submit).
3. Insertion via query helper dans `src/lib/queries/feedback.ts`.

### Acceptance
- [ ] Bouton visible sur toutes les pages app (pas sur marketing/auth).
- [ ] Submit → row dans `feedback`.

---

# Tickets à attaquer en semaine 3-4 (préview)

Une fois Sprint 1 fini :
- **P5-07** : Dashboard PostHog (visualisations DAU/MAU/cohorte) — ½j (à coordonner avec Mehdi qui maintient l'init PostHog client).
- **P5-08** : Mesurer % équipiers actifs — ½j.
- **P2-02** : OCR `prescriber_name`, `prescribed_date`, `expiry_date` — 2j.
- _(P4-03 / P4-04 / P4-05 / P4-07 : hors scope Dim — c'est Mehdi maintenant. Voir `TODO_MEHDI.md`.)_

---

## Recap : ce que tu ne touches PAS (Mehdi s'en occupe)

- Tout ce qui touche **auth / login / middleware / proxy**.
- Tout ce qui touche **/api/ocr**.
- Tout ce qui touche les **invitations** (`/api/invite/**`, `/api/invitations/**`).
- Le **service-role** Supabase.
- Les **migrations existantes** (0001 à 0025).
- Le **profile-context**.
- Les fichiers **juridiques** dans `legal/`.
- Tout ce qui touche **Stripe** et le paiement.

Si Claude Code te propose de "petit refacto opportuniste" sur un de ces fichiers : **tu refuses**.

---

## Workflow PR — Checklist avant ouverture

À cocher AVANT de demander à Mehdi de review :

- [ ] Branche nommée selon convention (`feat/`, `fix/`, `chore/`, `refactor/`, `test/`, `perf/`).
- [ ] Un seul ticket par PR.
- [ ] `npm run lint` → vert.
- [ ] `npm run typecheck` → vert.
- [ ] `npm run build` → vert.
- [ ] `npm run test` → vert (si tu as ajouté des tests).
- [ ] Test manuel du golden path concerné par le ticket (cf "Acceptance" de chaque ticket).
- [ ] Description PR : ticket ID + résumé + checklist acceptance + screenshot/loom si UI.
- [ ] AUCUN fichier hors périmètre touché (relire le diff).

---

## En cas de doute — questions à Mehdi (template)

> **Ticket** : P2-XX
> **Bloqueur / question** : [phrase claire]
> **Ce que j'ai essayé** : [bullet points]
> **Options envisagées** : A — ..., B — ...
> **Ma préférence** : [ton avis si tu en as un]

Plutôt que de partir tout seul sur un truc fragile, demande. C'est le meilleur usage de son temps et du tien.
