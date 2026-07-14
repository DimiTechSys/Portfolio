# Prompts Claude Code — P4-03 finish & ONBOARD-01

Deux prompts autonomes prêts à coller dans Claude Code. Chacun part de `main` à jour et crée sa propre branche.

---

## Prompt #1 — P4-03 finish (Mehdi)

```
Tu travailles sur le repo PharmaWorkspace (Next.js 16.2 App Router, React 19, Tailwind, Supabase, Stripe). On lance le ticket P4-03 finish — finalisation de la page /tarifs après le skeleton mergé en PR #53.

────────────────────────────────────────────────────────────
CONTEXTE BUSINESS
────────────────────────────────────────────────────────────

L'enquête finale 92 pharmaciens (mai 2026) a validé :
- Pain N°1 = info pas écrite (90 %)
- Test miroir = 4 sur 10 ne peuvent pas citer les 3 tâches en cours (41 %)
- Frein N°1 = adhésion équipe (40 %), PAS le prix
- 68 % des décideurs plafonnent à <50 € HT/mois
- 65 % en groupement (top 6 : Giphar, Aprium, Giropharm, Pharmavie, Totum, Pharmuni)
- 89 % marché vierge sans outil dédié

Le modèle commercial est : self-serve + CB obligatoire à l'inscription + 30 jours d'essai (€0 prélevés) + tarif Early Adopter -40 % à vie pour les 20 premières officines + annulable en 2 clics depuis Stripe Customer Portal.

3 formules nommées PO / OTM / GO :
- PO (Petite Officine) — ≤ 3 comptes équipe — 23,40 € HT/mois EA (catalog 39 €)
- OTM (Officine Taille Moyenne) — 4 à 8 comptes — 47,40 € HT/mois EA (catalog 79 €) — badge "Recommandé"
- GO (Grande Officine) — 9+ comptes — 77,40 € HT/mois EA (catalog 129 €)

**Toutes les fonctionnalités sont identiques dans les 3 formules. Seul change le nombre de comptes équipe.** C'est un message produit essentiel à porter visuellement et textuellement.

────────────────────────────────────────────────────────────
BRANCHE & SCOPE
────────────────────────────────────────────────────────────

1. Checkout main, pull, puis crée la branche `feat/p4-03-tarifs-finish`.
2. Ne touche QUE ces 3 fichiers :
   - src/app/(marketing)/tarifs/page.tsx
   - src/components/marketing/pricing-table.tsx
   - src/components/marketing/pricing-faq.tsx

3. Avant toute modification, fais un grep pour confirmer que les slugs PO/OTM/GO sont bien utilisés partout dans le repo :
   ```
   grep -rn "tier=solo\|tier=equipe\|tier=grande\|'solo'\|'equipe'\|'grande'" src/
   ```
   Si tu trouves des occurrences résiduelles dans d'autres fichiers (SignupForm, lib/stripe, migrations, events PostHog), liste-les dans ta réponse finale comme "résidus à traiter dans une PR séparée" — ne les touche pas dans cette PR.

────────────────────────────────────────────────────────────
FICHIER 1 — src/app/(marketing)/tarifs/page.tsx
────────────────────────────────────────────────────────────

A. Remplacer le paragraphe de description (ligne 21-25, qui commence par "Lorem ipsum dolor sit amet") par :

  "Toutes les fonctionnalités dans chaque formule. Seul change le nombre de comptes selon la taille de votre équipe. Les 20 premières officines inscrites en bêta bénéficient d'un tarif Early Adopter -40 % à vie."

  (garder le <strong> autour de "20 premières officines inscrites en bêta")

B. Remplacer le paragraphe placeholder du bandeau Early Adopter (ligne 38-41, qui commence par "[À rédiger par Mehdi") par :

  "Réservé aux pilotes bêta · -40 % garantis à vie · Valable sur les 3 formules"

  (garder les classes Tailwind existantes)

C. Le `[X]` dans le bandeau (ligne 36) reste un placeholder pour l'instant — laisse-le tel quel mais ajoute un commentaire `{/* TODO: câbler sur pharmacy_acquisition.confirmed_at count */}` au-dessus.

D. Remplacer le paragraphe lorem ipsum du bandeau "Vous hésitez sur le tier adapté ?" (ligne 54-58) par :

  "Petite officine indépendante, équipe en groupement, multi-comptoirs : on a discuté avec plus de 90 pharmaciens pour calibrer ces formules. 15 minutes avec un fondateur pour valider que la nôtre vous va."

E. Remplacer "Toutes les fonctionnalités, sans surprise." (ligne 81) par :

  "Toutes les fonctionnalités dans chaque formule. Pas de surprise."

────────────────────────────────────────────────────────────
FICHIER 2 — src/components/marketing/pricing-table.tsx
────────────────────────────────────────────────────────────

Le but : passer à PO/OTM/GO + glose pleine, prix 23,40/47,40/77,40 €, et exposer les MÊMES fonctionnalités dans les 3 cartes (seul change le nombre de comptes et le niveau de support).

A. Étendre le type `Tier` pour ajouter `fullName: string` :

```typescript
type Tier = {
  id: 'po' | 'otm' | 'go'
  name: string          // PO / OTM / GO
  fullName: string      // Petite Officine / Officine Taille Moyenne / Grande Officine
  audience: string
  priceMonthly: number
  priceYearly: number
  catalogMonthly: number
  features: string[]
  highlighted?: boolean
  badge?: string
}
```

B. Remplacer le tableau `TIERS` actuel par :

```typescript
// Tous les modules sont identiques dans les 3 formules — seul change le nombre de comptes équipe.
const COMMON_FEATURES = [
  'Tâches et transmissions d\'équipe',
  'Ordonnances avec OCR Mistral (France)',
  'Ruptures CIP13 et alertes ANSM',
  'Locations matériel + photos',
  'Salon textuel d\'équipe',
  'Planning de présence et congés',
  'Formation interne',
] as const

const TIERS: Tier[] = [
  {
    id: 'po',
    name: 'PO',
    fullName: 'Petite Officine',
    audience: '≤ 3 comptes équipe',
    priceMonthly: 23.4,
    priceYearly: 234,
    catalogMonthly: 39,
    features: [...COMMON_FEATURES, 'Support email sous 24 h'],
  },
  {
    id: 'otm',
    name: 'OTM',
    fullName: 'Officine Taille Moyenne',
    audience: '4 à 8 comptes équipe',
    priceMonthly: 47.4,
    priceYearly: 474,
    catalogMonthly: 79,
    highlighted: true,
    badge: 'Recommandé',
    features: [
      ...COMMON_FEATURES,
      'Support prioritaire sous 24 h',
      'Onboarding équipe accompagné (visio 30 min)',
    ],
  },
  {
    id: 'go',
    name: 'GO',
    fullName: 'Grande Officine',
    audience: '9 comptes équipe et +',
    priceMonthly: 77.4,
    priceYearly: 774,
    catalogMonthly: 129,
    features: [
      ...COMMON_FEATURES,
      'Support prioritaire renforcé',
      'Onboarding équipe accompagné renforcé',
      'Hotline directe fondateur',
    ],
  },
]
```

C. Dans le rendu de chaque carte, remplacer l'affichage du nom (le `<h3>` qui contient `{tier.name}`) par :

```tsx
<h3 className="text-lg font-semibold text-slate-900">
  {tier.name}{' '}
  <span className="text-sm font-normal text-slate-500">— {tier.fullName}</span>
</h3>
```

D. Remplacer le label du CTA "Démarrer un essai gratuit" par "Démarrer 30 jours gratuits".

E. Au-dessus du paragraphe `<p>` final (celui avec `<Sparkles />` et "30 jours d'essai · CB validée..."), ajouter un bloc explicatif :

```tsx
<div className="mx-auto max-w-2xl text-center">
  <h2 className="text-xl font-semibold tracking-tight text-slate-900">
    Une seule différence entre les formules : le nombre de comptes.
  </h2>
  <p className="mt-2 text-sm text-slate-600">
    PO, OTM ou GO — vous accédez aux mêmes modules. Que vous soyez seul avec
    une préparatrice ou à dix dans une grande officine, aucune fonctionnalité
    ne vous manque.
  </p>
</div>
```

────────────────────────────────────────────────────────────
FICHIER 3 — src/components/marketing/pricing-faq.tsx
────────────────────────────────────────────────────────────

Patches sur le tableau FAQ_ITEMS :

A. Question 2 "Combien d'utilisateurs sont inclus par tier ?" → remplacer par :

```typescript
{
  question: 'Combien de comptes équipe sont inclus par formule ?',
  answer:
    'PO (Petite Officine) : jusqu\'à 3 comptes équipe. OTM (Officine Taille Moyenne) : 4 à 8 comptes. GO (Grande Officine) : comptes illimités. Si vous dépassez votre formule en cours d\'abonnement, vous changez en un clic depuis votre espace facturation, sans interruption de service.',
},
```

B. Question 3 "Puis-je changer de tier en cours d'abonnement ?" → remplacer par :

```typescript
{
  question: 'Puis-je changer de formule en cours d\'abonnement ?',
  answer:
    "Oui, à tout moment depuis votre espace facturation. Le passage à une formule supérieure (PO → OTM, OTM → GO) est effectif immédiatement avec proratisation. Le passage à une formule inférieure prend effet à la prochaine période de facturation.",
},
```

C. Question 6 "Comment annuler mon abonnement ?" → remplacer la réponse pour virer le lorem ipsum :

```typescript
{
  question: 'Comment annuler mon abonnement ?',
  answer:
    'Dans votre compte → Facturation → Annuler l\'abonnement. Si vous annulez pendant les 30 jours d\'essai, aucun prélèvement. Après J+30, le prélèvement en cours est annulé pour la prochaine échéance et votre accès reste actif jusqu\'à la fin de la période payée.',
},
```

D. Question 7 "Le tarif Early Adopter -40 % est-il à vie ?" → remplacer la réponse pour virer le lorem ipsum :

```typescript
{
  question: 'Le tarif Early Adopter -40 % est-il à vie ?',
  answer:
    "Oui, le tarif -40 % est garanti à vie sur votre compte tant que votre abonnement reste actif. Cette offre est limitée aux 20 premières officines inscrites en bêta. Une fois ces 20 places allouées, le tarif catalogue (39 / 79 / 129 € HT/mois) s'applique aux nouvelles inscriptions.",
},
```

E. Question 8 "Y a-t-il une remise pour les pharmacies en groupement ?" → remplacer la réponse pour virer le lorem ipsum + mentionner les 6 groupements identifiés dans l'enquête :

```typescript
{
  question: 'Y a-t-il une remise pour les pharmacies en groupement ?',
  answer:
    "Si votre groupement (Giphar, Aprium, Giropharm, Pharmavie, Totum, Pharmuni et autres) souhaite déployer PharmaWorkspace sur plusieurs officines, nous pouvons mettre en place un accord cadre avec conditions tarifaires adaptées. Écrivez à contact@pharmaworkspace.fr en mentionnant votre groupement.",
},
```

F. Insérer une NOUVELLE question entre la Q1 et la Q2 (donc en position 2 du tableau), répondant au frein N°1 validé sur 92 répondants :

```typescript
{
  question: 'Comment être sûr que mon équipe va l\'adopter ?',
  answer:
    "C'est la question la plus fréquente. 40 % des pharmaciens nous l'ont posée pendant notre enquête. Notre réponse : on a conçu PharmaWorkspace pour qu'un préparateur puisse l'utiliser sans formation. Concrètement, votre essai 30 jours inclut un onboarding équipe accompagné en visio (gratuit, 30 min) pour vous aider à le présenter à votre équipe, et un widget de missions guide chaque membre dans la prise en main pendant la première semaine.",
},
```

────────────────────────────────────────────────────────────
ACCEPTANCE
────────────────────────────────────────────────────────────

- [ ] Plus AUCUN "Lorem ipsum" visible dans les 3 fichiers (vérifier par grep).
- [ ] 3 cartes affichent PO / OTM / GO + glose pleine + prix EA 23,40 € / 47,40 € / 77,40 €.
- [ ] Toggle mensuel/annuel toujours fonctionnel.
- [ ] CTA des cartes mène à /signup?tier=po|otm|go&billing=monthly|yearly&source=tarifs
- [ ] Toutes les cartes affichent les 7 mêmes fonctionnalités COMMON_FEATURES + delta support/onboarding spécifique.
- [ ] FAQ contient 9 questions (8 originales + 1 nouvelle "adhésion équipe" insérée en position 2).
- [ ] `npm run lint && npm run typecheck && npm run build` tous verts.

────────────────────────────────────────────────────────────
COMMIT & PR
────────────────────────────────────────────────────────────

Commit message :
```
feat(p4-03): finalize tarifs page with PO/OTM/GO + insights 92 pharma

- replace lorem ipsum across page.tsx, pricing-table.tsx, pricing-faq.tsx
- PO/OTM/GO naming with full gloss (Petite/Moyenne/Grande Officine)
- unified COMMON_FEATURES across all 3 tiers (only seat count + support differ)
- FAQ Q2/Q3 reworded with PO/OTM/GO naming
- FAQ Q6/Q7/Q8 lorem ipsum removed
- new FAQ Q "comment être sûr que mon équipe va l'adopter" answering 40% team-adoption block from 92-respondent survey
- Q8 mentions top 6 groupements identified in survey (Giphar/Aprium/Giropharm/Pharmavie/Totum/Pharmuni)

Closes P4-03.
```

Crée la PR vers `develop` avec une description courte qui résume les changements.

Dans ta réponse finale, donne-moi :
1. Le diff résumé par fichier
2. La liste des résidus solo|equipe|grande trouvés dans d'autres fichiers (à traiter ailleurs)
3. La confirmation que lint/typecheck/build passent
```

---

## Prompt #2 — ONBOARD-01 (Dim)

```
Tu travailles sur le repo PharmaWorkspace (Next.js 16.2 App Router, React 19, Tailwind, Supabase + RLS, Stripe, PostHog, Vitest + Playwright). On lance le ticket ONBOARD-01 — missions d'activation in-app pour titulaire et invité.

────────────────────────────────────────────────────────────
CONTEXTE BUSINESS
────────────────────────────────────────────────────────────

L'enquête finale 92 pharmaciens valide :
- Pain N°1 = info pas écrite (90 %)
- Frein N°1 à un nouvel outil = adhésion équipe (40 %)

Le PDF kit onboarding initialement prévu est remplacé par cette feature produit, pattern Linear/Notion/Stripe : un widget de missions qui apparaît dans le wizard puis dans le dashboard après activation Stripe, guide la première semaine d'usage.

────────────────────────────────────────────────────────────
BRANCHE & ARCHITECTURE
────────────────────────────────────────────────────────────

1. Checkout main, pull, crée la branche `feat/onboard-01-mission-checklist`.

2. Concept : 12 missions titulaire + 5 missions invité, réparties wizard (W1-W4 / Wi1) puis dashboard. Détection AUTOMATIQUE via count SQL — pas de coche manuelle, pas de cache, recalculé à chaque render.

3. Tableau des missions :

   **Titulaire (12)** :
   - W1-W4 : 4 missions wizard (officine, profil, invitations, CB) — déjà détectées par P2-01 mergé, RE-utiliser cette logique
   - M1 : Inviter au moins un membre — `pharmacy_members.count >= 2` (le titulaire + 1)
   - M2 : Créer 1ère tâche — `tasks.count(pharmacy_id) >= 1`
   - M3 : Scanner 1ère ordonnance — `prescriptions.count(pharmacy_id) >= 1`
   - M4 : Signaler 1ère rupture — `shortages.count(pharmacy_id) >= 1`
   - M5 : Enregistrer 1ère location — `rentals.count(pharmacy_id) >= 1`
   - M6 : Écrire dans le salon — `chat_messages.count(pharmacy_id) >= 1` (MASQUÉE tant que feature flag MISSIONS_REQUIRE_CHAT = false, c'est-à-dire tant que CHAT-01 pas mergé)
   - M7 : Utiliser ≥ 3 modules — auto-coché dès qu'au moins 3 des tables ci-dessus ont ≥ 1 row
   - M8 : Point équipe + feedback — `feedback.count(pharmacy_id) >= 1` (P5-06 déjà mergé, OK)

   **Invité (5)** :
   - Wi1 : Compléter profil — `members.first_name IS NOT NULL AND last_name IS NOT NULL`
   - M1 : Ajouter photo de profil — `members.avatar_url IS NOT NULL`
   - M2 : Créer 1ère tâche assignée par moi ou créée par moi — `tasks.count(created_by = user_id OR assignee_id = user_id) >= 1`
   - M3 : Lire 1 note de transmission — `task_read_events.count(user_id) >= 1` (créer la table si elle n'existe pas)
   - M4 : Écrire dans le salon — `chat_messages.count(author_id = user_id) >= 1` (MASQUÉE par le même feature flag)

────────────────────────────────────────────────────────────
FICHIERS À CRÉER / MODIFIER
────────────────────────────────────────────────────────────

1. **supabase/migrations/0055_pharmacies_onboarding_dismissed.sql** (nouveau)
   ```sql
   ALTER TABLE pharmacies
     ADD COLUMN onboarding_dismissed_at TIMESTAMPTZ;
   ```

2. **src/lib/onboarding/missions.ts** (nouveau) — types partagés + entry point :

   ```typescript
   export type MissionStatus = 'pending' | 'done' | 'hidden'
   export type MissionVariant = 'wizard' | 'dashboard'

   export type Mission = {
     id: string
     label: string
     tooltip?: string
     cta?: { href: string } | { feedback: true } | null
     status: MissionStatus
     variant: MissionVariant
   }

   export type MissionsResult = {
     missions: Mission[]
     progress: { done: number; total: number }
     allCompleted: boolean
   }

   export async function getMissionsForUser(
     supabase: SupabaseClient,
     userId: string
   ): Promise<MissionsResult> {
     // Lit le rôle de l'utilisateur dans pharmacy_members,
     // dispatche vers getOwnerMissions ou getMemberMissions.
   }
   ```

3. **src/lib/onboarding/missions-owner.ts** (nouveau) — calcule les 12 missions titulaire (counts SQL parallèles via `Promise.all`). Lit le feature flag `MISSIONS_REQUIRE_CHAT` depuis l'env (default `false`) pour décider si M6 est `hidden`. Implémente les labels et tooltips :

   ```typescript
   export const OWNER_MISSION_LABELS = {
     W1: { label: 'Créer votre officine', tooltip: 'Nom, adresse, FINESS si vous l\'avez.' },
     W2: { label: 'Compléter votre profil', tooltip: 'Prénom, nom, fonction.' },
     W3: { label: 'Inviter vos premiers collègues', tooltip: 'Vous pouvez aussi passer cette étape et y revenir plus tard.' },
     W4: { label: 'Activer votre essai 30 jours', tooltip: 'Carte bancaire validée, 0 € prélevé pendant 30 jours.' },
     M1: { label: 'Inviter au moins un membre de l\'équipe', cta: { href: '/team/invite' }, tooltip: 'Sans équipe, l\'outil ne sert à rien. C\'est l\'étape la plus importante.' },
     M2: { label: 'Créer votre première tâche', cta: { href: '/tasks/new' }, tooltip: 'Une tâche du jour, une note de transmission, une commande à passer.' },
     M3: { label: 'Scanner votre première ordonnance', cta: { href: '/prescriptions/new' }, tooltip: 'L\'IA française Mistral l\'analyse en 30 secondes.' },
     M4: { label: 'Signaler votre première rupture', cta: { href: '/shortages/new' }, tooltip: 'Le code-barre CIP13 suffit.' },
     M5: { label: 'Enregistrer une location de matériel', cta: { href: '/rentals/new' }, tooltip: 'Tensiomètre, lecteur glycémie, tire-lait…' },
     M6: { label: 'Écrire un message dans le salon d\'équipe', cta: { href: '/chat' }, tooltip: 'Comme un WhatsApp, en interne et sécurisé.' },
     M7: { label: 'Utiliser au moins 3 modules différents', cta: null, tooltip: 'Un module = Tâches, Ordonnances, Ruptures, Locations, Salon, Formation. Dès que vous avez créé une entrée dans 3 d\'entre eux, cette mission se coche automatiquement.' },
     M8: { label: 'Faire un point équipe à J+7 et nous donner votre retour', cta: { feedback: true }, tooltip: 'Cliquez sur le bouton flottant "Donner mon avis" et envoyez-nous vos premiers retours.' },
   } as const
   ```

4. **src/lib/onboarding/missions-member.ts** (nouveau) — 5 missions invité :

   ```typescript
   export const MEMBER_MISSION_LABELS = {
     Wi1: { label: 'Compléter votre profil', tooltip: 'Prénom, nom.' },
     M1: { label: 'Ajouter votre photo de profil', cta: { href: '/profile' }, tooltip: 'Optionnel mais conseillé pour que vos collègues vous reconnaissent.' },
     M2: { label: 'Créer votre première tâche', cta: { href: '/tasks/new' }, tooltip: 'Une tâche du jour, une demande à un collègue.' },
     M3: { label: 'Lire une note de transmission de l\'équipe', cta: { href: '/tasks?filter=transmission' }, tooltip: 'Pour rester au courant de ce qui s\'est passé pendant votre absence.' },
     M4: { label: 'Écrire votre premier message dans le salon', cta: { href: '/chat' }, tooltip: 'Saluez votre équipe !' },
   } as const
   ```

5. **src/components/onboarding/mission-checklist.tsx** (nouveau) — composant partagé avec prop `variant: 'wizard' | 'dashboard'`. En `dashboard`, vérifie `pharmacy.onboarding_dismissed_at` : si non null, ne rend rien. Titres :
   - `wizard` : "Votre parcours d'inscription" / "4 étapes pour activer votre essai et inviter votre équipe."
   - `dashboard` : "Vos missions d'activation" / "8 actions pour que toute votre équipe adopte PharmaWorkspace en moins d'une semaine."

6. **src/components/onboarding/mission-item.tsx** (nouveau) — une ligne (case animée + label + tooltip + CTA + état done/pending).

7. **src/components/onboarding/mission-progress-bar.tsx** (nouveau) — barre X/N.

8. **src/components/onboarding/missions-completed-banner.tsx** (nouveau) — bannière 100 % avec confetti CSS, texte :

   "🏆 Bravo ! Votre équipe est complètement activée."
   "Vous avez débloqué les 8 missions d'activation. À ce stade, vous êtes parmi les officines les plus engagées de la bêta. Continuez à explorer, et n'hésitez pas à nous dire ce qu'il vous manque."
   2 boutons : "Donner mon avis" (ouvre feedback) / "Masquer ce widget" (ouvre la confirmation dismiss).

9. **src/components/onboarding/transition-banner.tsx** (nouveau) — bannière 5 sec à l'arrivée sur dashboard post-trial :

   "🎉 Bravo, vos 4 missions d'inscription sont terminées !"
   "Voici 8 nouvelles missions pour activer votre équipe."

10. **src/app/(onboarding)/onboarding/layout.tsx** (modification) — injecter `<MissionChecklist variant="wizard" />`.

11. **src/app/(app)/dashboard/page.tsx** (modification) — injecter `<MissionChecklist variant="dashboard" />`. Déclencher la `<TransitionBanner />` une fois (via cookie / sessionStorage) à l'arrivée post-webhook `trialing`.

12. **src/app/(app)/settings/display/page.tsx** (modification ou création si manque) — toggle "Afficher le widget des missions" (réactivation : passe `onboarding_dismissed_at` à NULL).

13. **src/lib/analytics/events.ts** (modification) — ajouter 5 events PostHog :
    - `onboarding_missions_shown` (props : variant, role, progress)
    - `onboarding_mission_clicked` (props : mission_id)
    - `onboarding_mission_completed` (props : mission_id)
    - `onboarding_missions_all_completed` (props : role, time_to_complete_seconds)
    - `onboarding_missions_dismissed`

────────────────────────────────────────────────────────────
FEATURE FLAG
────────────────────────────────────────────────────────────

Variable d'env : `NEXT_PUBLIC_MISSIONS_REQUIRE_CHAT=false` par défaut. Quand `false`, masque M6 titulaire + M4 invité (le total des missions s'ajuste : 7 au lieu de 8 pour titulaire post-wizard, 3 au lieu de 4 pour invité). Au merge de CHAT-01, basculer à `true`.

────────────────────────────────────────────────────────────
TESTS REQUIS
────────────────────────────────────────────────────────────

A. **Vitest** : table de cas matrices sur `getMissionsForUser` :
   - rôle titulaire × état pharmacy (vide, partiellement rempli, tout rempli)
   - rôle invité × état member (vide, profil seul, tout fait)
   - feature flag ON/OFF (vérifier M6 masquée si OFF)
   - `onboarding_dismissed_at IS NOT NULL` → variant dashboard ne rend rien

B. **Playwright** golden path :
   1. signup → wizard 4 étapes → arrivée dashboard
   2. widget dashboard 0/8 (ou 0/7 si flag CHAT OFF)
   3. créer 1 tâche → reload → 1/8
   4. cliquer mission "Scanner ordonnance" → page /prescriptions/new s'ouvre
   5. dismiss → modal confirm → masqué
   6. Paramètres → toggle → réapparaît

────────────────────────────────────────────────────────────
ACCEPTANCE
────────────────────────────────────────────────────────────

- [ ] Migration 0055 créée, allouée dans COORDINATION.md §S5 (vérifier libre avant d'utiliser ce numéro — si pris, prendre le suivant)
- [ ] `getMissionsForUser` testée Vitest (couverture ≥ 90 % sur missions-owner.ts et missions-member.ts)
- [ ] Playwright golden path passe
- [ ] Feature flag MISSIONS_REQUIRE_CHAT respecté
- [ ] 5 events PostHog déclenchés correctement
- [ ] Widget responsive (mobile ≤ 380px, desktop)
- [ ] Aucune fuite de pharmacy_id entre tenants (RLS testée)
- [ ] `npm run lint && npm run typecheck && npm run build && npm run test && npm run e2e` tous verts

────────────────────────────────────────────────────────────
COMMIT & PR
────────────────────────────────────────────────────────────

Commit message :
```
feat(onboard-01): in-app activation missions for owner + member

- 12 missions owner (W1-W4 wizard + M1-M8 dashboard)
- 5 missions member (Wi1 wizard + M1-M4 dashboard)
- auto-detection via parallel SQL counts, no manual checkboxes
- migration 0055 adds onboarding_dismissed_at to pharmacies
- feature flag MISSIONS_REQUIRE_CHAT gates M6 owner + M4 member
- 5 PostHog events for funnel analysis
- Vitest matrix coverage + Playwright golden path

Closes ONBOARD-01.
Refs survey insight: 40% adhésion équipe = frein #1 (92 pharma).
```

PR vers `develop` avec checklist d'acceptance cochée dans la description.

Dans ta réponse finale, donne-moi :
1. La liste des fichiers créés/modifiés (avec n° de lignes)
2. Le résultat des tests (Vitest + Playwright)
3. Les éventuelles assumptions prises (ex : la table `task_read_events` existe-t-elle déjà ?)
```

---

## Note pour Mehdi avant de lancer les prompts

**Prompt #1 P4-03** : à lancer toi-même en local sur ton clone. Effort estimé : ½ jour. Risque faible.

**Prompt #2 ONBOARD-01** : à transmettre à Dim. Effort estimé : 2-3 jours. Risque moyen (touche wizard ET dashboard ET migrations). Penser à allouer le n° 0055 dans COORDINATION.md §S5 avant qu'il commence pour éviter une collision avec une autre PR.

Le hook hero « 4 sur 10 » et les autres patchs de COPY-01 (FAQ landing, sidebar, emails Resend) ne sont **pas** inclus dans ces prompts car ils forment une PR séparée que tu pilotes toi-même (cf. ticket COPY-01 dans TODO_MEHDI.md). Si tu veux qu'on les fasse passer aussi par Claude Code, dis-moi et je te génère le 3ᵉ prompt.
