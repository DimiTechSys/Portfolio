# Prompt Claude Code unifié — P4-03 + COPY-01 + ONBOARD-01

Un seul prompt autonome à coller dans Claude Code. Mehdi pilote, pas de séparation Dim. Trois PRs distinctes seront créées dans l'ordre.

---

```
Tu travailles sur le repo PharmaWorkspace (Next.js 16.2 App Router, React 19, Tailwind, Supabase + RLS, Stripe, PostHog EU, Vitest + Playwright). Tu vas exécuter TROIS tickets liés à la suite, chacun sur sa propre branche, chacun avec sa propre PR vers `develop`.

═══════════════════════════════════════════════════════════════
ORDRE D'EXÉCUTION (impératif)
═══════════════════════════════════════════════════════════════

1. P4-03 finish — page /tarifs (effort ½ jour, risque faible)
2. COPY-01 — revue éditoriale plateforme (effort ½ jour, risque nul)
3. ONBOARD-01 — missions d'activation in-app (effort 2-3 jours, risque moyen)

Chaque ticket : branche dédiée, PR vers `develop`, lint + typecheck + build + tests verts avant de passer au suivant. Si un ticket bloque, arrête-toi et donne-moi le diagnostic — ne contourne pas.

═══════════════════════════════════════════════════════════════
CONTEXTE BUSINESS (commun aux 3 tickets)
═══════════════════════════════════════════════════════════════

L'enquête finale 92 pharmaciens (mai 2026) a validé :
- Pain N°1 = info pas écrite (90 %)
- Test miroir = 4 pharmaciens sur 10 ne peuvent pas citer les 3 tâches en cours dans leur officine (41 %)
- Frein N°1 = adhésion équipe (40 %), pas le prix
- 68 % des décideurs plafonnent à <50 € HT/mois
- 65 % en groupement (top 6 : Giphar, Aprium, Giropharm, Pharmavie, Totum, Pharmuni)
- 89 % marché vierge sans outil dédié

Le modèle commercial est : self-serve + CB obligatoire à l'inscription + 30 jours d'essai (€0 prélevés) + tarif Early Adopter -40 % à vie pour les 20 premières officines + annulable en 2 clics depuis Stripe Customer Portal.

3 formules nommées PO / OTM / GO :
- PO (Petite Officine) — ≤ 3 comptes équipe — 23,40 € HT/mois EA (catalog 39 €)
- OTM (Officine Taille Moyenne) — 4 à 8 comptes — 59,40 € HT/mois EA (catalog 99 €) — badge "Recommandé"
- GO (Grande Officine) — 9+ comptes — 77,40 € HT/mois EA (catalog 129 €)

Toutes les fonctionnalités sont identiques dans les 3 formules. Seul change le nombre de comptes équipe.

═══════════════════════════════════════════════════════════════
PRÉ-FLIGHT (avant le ticket 1)
═══════════════════════════════════════════════════════════════

Sur `main` à jour, fais un grep pour vérifier qu'aucun résidu de l'ancien naming solo/equipe/grande ne subsiste :

```
grep -rn "tier=solo\|tier=equipe\|tier=grande\|'solo'\|'equipe'\|'grande'\b" src/ supabase/
```

Liste les occurrences trouvées dans ta réponse. Si elles ne touchent pas les 3 fichiers de P4-03, ne les modifie PAS dans cette session — note-les comme "résidus à traiter dans une PR séparée".

═══════════════════════════════════════════════════════════════
═══ TICKET 1 : P4-03 finish ═══
═══════════════════════════════════════════════════════════════

Branche : `feat/p4-03-tarifs-finish`
Scope : 3 fichiers seulement.

────────────────────────────────────────
Fichier 1A — src/app/(marketing)/tarifs/page.tsx
────────────────────────────────────────

A. Remplacer le paragraphe lorem ipsum de description (ligne 21-25) par :
   "Toutes les fonctionnalités dans chaque formule. Seul change le nombre de comptes selon la taille de votre équipe. Les 20 premières officines inscrites en bêta bénéficient d'un tarif Early Adopter -40 % à vie."
   (garder le <strong> autour de "20 premières officines inscrites en bêta")

B. Remplacer le paragraphe placeholder du bandeau Early Adopter (ligne 38-41) par :
   "Réservé aux pilotes bêta · -40 % garantis à vie · Valable sur les 3 formules"

C. Le `[X]` dans le bandeau (ligne 36) reste un placeholder. Ajouter un commentaire JSX `{/* TODO: câbler sur pharmacy_acquisition.confirmed_at count */}` juste au-dessus.

D. Remplacer le paragraphe lorem ipsum du bandeau "Vous hésitez sur le tier adapté ?" par :
   "Petite officine indépendante, équipe en groupement, multi-comptoirs : on a discuté avec plus de 90 pharmaciens pour calibrer ces formules. 15 minutes avec un fondateur pour valider que la nôtre vous va."

E. Remplacer "Toutes les fonctionnalités, sans surprise." (footer ligne 81) par :
   "Toutes les fonctionnalités dans chaque formule. Pas de surprise."

────────────────────────────────────────
Fichier 1B — src/components/marketing/pricing-table.tsx
────────────────────────────────────────

A. Étendre le type `Tier` avec un champ `fullName: string` :

```typescript
type Tier = {
  id: 'po' | 'otm' | 'go'
  name: string
  fullName: string
  audience: string
  priceMonthly: number
  priceYearly: number
  catalogMonthly: number
  features: string[]
  highlighted?: boolean
  badge?: string
}
```

B. Remplacer le tableau `TIERS` par :

```typescript
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
    priceMonthly: 59.4,
    priceYearly: 594,
    catalogMonthly: 99,
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

C. Dans le rendu de chaque carte, remplacer le `<h3>` qui contient `{tier.name}` par :

```tsx
<h3 className="text-lg font-semibold text-slate-900">
  {tier.name}{' '}
  <span className="text-sm font-normal text-slate-500">— {tier.fullName}</span>
</h3>
```

D. Remplacer "Démarrer un essai gratuit" par "Démarrer 30 jours gratuits" sur le CTA des cartes.

E. Juste au-dessus du paragraphe final avec `<Sparkles />`, ajouter ce bloc :

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

────────────────────────────────────────
Fichier 1C — src/components/marketing/pricing-faq.tsx
────────────────────────────────────────

Patches sur le tableau FAQ_ITEMS :

A. INSÉRER une nouvelle entrée entre la Q1 actuelle et la Q2 actuelle (donc en position 2 du tableau) :

```typescript
{
  question: 'Comment être sûr que mon équipe va l\'adopter ?',
  answer:
    "C'est la question la plus fréquente. 40 % des pharmaciens nous l'ont posée pendant notre enquête. Notre réponse : on a conçu PharmaWorkspace pour qu'un préparateur puisse l'utiliser sans formation. Concrètement, votre essai 30 jours inclut un onboarding équipe accompagné en visio (gratuit, 30 min) pour vous aider à le présenter à votre équipe, et un widget de missions guide chaque membre dans la prise en main pendant la première semaine.",
},
```

B. Remplacer la question "Combien d'utilisateurs sont inclus par tier ?" par :

```typescript
{
  question: 'Combien de comptes équipe sont inclus par formule ?',
  answer:
    'PO (Petite Officine) : jusqu\'à 3 comptes équipe. OTM (Officine Taille Moyenne) : 4 à 8 comptes. GO (Grande Officine) : comptes illimités. Si vous dépassez votre formule en cours d\'abonnement, vous changez en un clic depuis votre espace facturation, sans interruption de service.',
},
```

C. Remplacer la question "Puis-je changer de tier en cours d'abonnement ?" par :

```typescript
{
  question: 'Puis-je changer de formule en cours d\'abonnement ?',
  answer:
    "Oui, à tout moment depuis votre espace facturation. Le passage à une formule supérieure (PO → OTM, OTM → GO) est effectif immédiatement avec proratisation. Le passage à une formule inférieure prend effet à la prochaine période de facturation.",
},
```

D. Remplacer la réponse de "Comment annuler mon abonnement ?" pour virer le lorem ipsum :

```
Dans votre compte → Facturation → Annuler l'abonnement. Si vous annulez pendant les 30 jours d'essai, aucun prélèvement. Après J+30, le prélèvement en cours est annulé pour la prochaine échéance et votre accès reste actif jusqu'à la fin de la période payée.
```

E. Remplacer la réponse de "Le tarif Early Adopter -40 % est-il à vie ?" :

```
Oui, le tarif -40 % est garanti à vie sur votre compte tant que votre abonnement reste actif. Cette offre est limitée aux 20 premières officines inscrites en bêta. Une fois ces 20 places allouées, le tarif catalogue (39 / 99 / 129 € HT/mois) s'applique aux nouvelles inscriptions.
```

F. Remplacer la réponse de "Y a-t-il une remise pour les pharmacies en groupement ?" :

```
Si votre groupement (Giphar, Aprium, Giropharm, Pharmavie, Totum, Pharmuni et autres) souhaite déployer PharmaWorkspace sur plusieurs officines, nous pouvons mettre en place un accord cadre avec conditions tarifaires adaptées. Écrivez à contact@pharmaworkspace.fr en mentionnant votre groupement.
```

────────────────────────────────────────
Acceptance P4-03
────────────────────────────────────────

- Plus AUCUN "Lorem ipsum" dans les 3 fichiers (vérifier par grep).
- 3 cartes affichent PO / OTM / GO + glose pleine + prix EA 23,40 € / 59,40 € / 77,40 €.
- Toggle mensuel/annuel fonctionnel.
- CTA des cartes mène à /signup?tier=po|otm|go&billing=monthly|yearly&source=tarifs
- COMMON_FEATURES identiques dans les 3 tiers + delta support/onboarding spécifique.
- FAQ contient 9 entrées (8 originales + 1 nouvelle "adhésion équipe").
- npm run lint && npm run typecheck && npm run build verts.

Commit message :

```
feat(p4-03): finalize tarifs page with PO/OTM/GO + insights 92 pharma

- remove all lorem ipsum across page.tsx, pricing-table.tsx, pricing-faq.tsx
- PO/OTM/GO naming with full gloss (Petite/Moyenne/Grande Officine)
- unified COMMON_FEATURES across 3 tiers (only seat count + support differ)
- new FAQ Q "comment être sûr que mon équipe va l'adopter" (40% team-adoption block from 92-respondent survey)
- Q "groupements" mentions top 6 from survey (Giphar/Aprium/Giropharm/Pharmavie/Totum/Pharmuni)

Closes P4-03.
```

PR vers `develop`. Attendre qu'elle passe les checks avant de continuer au ticket 2.

═══════════════════════════════════════════════════════════════
═══ TICKET 2 : COPY-01 ═══
═══════════════════════════════════════════════════════════════

Branche : `chore/copy-01-editorial-review`
Scope : revue éditoriale globale (strings only, zéro logique).

────────────────────────────────────────
Fichier 2A — src/components/marketing/hero.tsx
────────────────────────────────────────

A. Remplacer le titre H1 (ligne 18-23) par le hook validé statistiquement à 41 % sur 92 répondants :

```tsx
<h1
  id="hero-title"
  className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
>
  4 pharmaciens sur 10 ne peuvent pas citer les 3 tâches en cours dans leur officine. La vôtre les a-t-elle écrites quelque part ?
</h1>
```

B. Remplacer le sous-titre (ligne 25-29) par :

```tsx
<p className="max-w-xl text-base text-slate-600 sm:text-lg">
  PharmaWorkspace remplace le cahier de transmission, les post-it et le groupe WhatsApp
  de votre équipe par un seul espace partagé. Conçu avec des pharmaciens en exercice,
  hébergé en France, conforme RGPD. 30 jours d&apos;essai gratuits — annulable à tout
  moment, premier prélèvement seulement à J+30.
</p>
```

────────────────────────────────────────
Fichier 2B — src/components/marketing/trust-bar.tsx
────────────────────────────────────────

Remplacer le tableau `ITEMS` (ligne 1-8) par :

```typescript
const ITEMS = [
  'Hébergé en France',
  'RGPD conforme',
  'IA française (Mistral)',
  'Conçu pour toute l\'équipe',
  '30 jours d\'essai',
  'Annulable en 2 clics',
]
```

────────────────────────────────────────
Fichier 2C — src/components/marketing/faq.tsx (landing)
────────────────────────────────────────

A. Remplacer la réponse de Q7 "Combien ça coûte après les 30 jours ?" :

```tsx
answer: (
  <p>
    Early Adopter (les 20 premières officines, -40 % à vie) : 23,40 € / 59,40 € / 77,40 €
    HT/mois selon la taille de votre équipe. Tarif catalogue : 39 € / 99 € / 129 € HT/mois.
    Toutes les fonctionnalités dans chaque formule.{' '}
    <a href="/tarifs" className="font-medium text-teal-700 underline-offset-4 hover:underline">
      Voir tarifs détaillés
    </a>.
  </p>
),
```

B. INSÉRER une nouvelle entrée juste après l'entrée "PharmaWorkspace remplace-t-il mon LGO ?" (donc en position 6 du tableau ENTRIES) :

```tsx
{
  question: 'Comment être sûr que mon équipe va l\'adopter ?',
  answer: (
    <p>
      C&apos;est la question la plus fréquente. 40 % des pharmaciens nous l&apos;ont posée
      pendant notre enquête. PharmaWorkspace est conçu pour qu&apos;un préparateur l&apos;utilise
      sans formation. L&apos;essai inclut un onboarding équipe en visio gratuite (30 min) et un
      widget de missions guide chaque membre dans la prise en main pendant la première semaine.
    </p>
  ),
},
```

────────────────────────────────────────
Fichier 2D — src/lib/email/templates/invitation.tsx
────────────────────────────────────────

A. Remplacer le paragraphe descriptif (ligne 131-135) par :

```tsx
<Text style={textStyle}>
  Sur PharmaWorkspace, vous pourrez voir les tâches en cours et les notes de
  transmission de toute l&apos;équipe, scanner les ordonnances pour gagner du temps,
  signaler une rupture en un clic, et discuter avec vos collègues dans le salon
  textuel. Pas de mot de passe à créer : le lien ci-dessous vous connecte directement.
</Text>
```

B. Remplacer le footer (ligne 159-166) par :

```tsx
<Text style={footerStyle}>
  PharmaWorkspace — l&apos;espace partagé des équipes officinales françaises.
  Hébergement France, IA française pour l&apos;OCR (Mistral), conforme RGPD.{' '}
  <Link href="https://pharmaworkspace.fr/securite" style={{ color: '#64748b' }}>
    En savoir plus sur notre sécurité
  </Link>
  .
</Text>
```

────────────────────────────────────────
Fichier 2E — Sidebar produit interne
────────────────────────────────────────

Localise la sidebar : probablement `src/components/app/sidebar.tsx` ou injectée dans `src/app/(app)/layout.tsx`. Identifier les libellés des items.

Renommages à appliquer :

| Avant (anglais ou ancien français) | Après |
|---|---|
| Dashboard | Tableau de bord |
| Tasks | Tâches |
| Prescriptions | Ordonnances |
| Shortages | Ruptures |
| Rentals | Locations |
| Agenda | Calendrier |
| Training | Formation |
| Team | Équipe |
| Settings | Paramètres |
| Chat | Salon d'équipe |

Si certains items sont déjà en français correct, ne pas les retoucher. Si certains items n'existent pas encore (ex. "Salon d'équipe" tant que CHAT-01 pas mergé), les laisser de côté.

────────────────────────────────────────
Fichier 2F — États vides standardisés
────────────────────────────────────────

Grep dans `src/app/(app)/**/*.tsx` les composants d'état vide existants (chaînes type "No tasks yet", "Aucune donnée", "Empty"). Pour chacun, appliquer le modèle :

| Module | Texte à utiliser |
|---|---|
| Tâches | "Vous n'avez pas encore de tâche en cours. Créez la première pour démarrer la transmission d'équipe." + CTA "Créer une tâche" |
| Ordonnances | "Aucune ordonnance scannée pour l'instant. Scannez-en une pour la voir apparaître ici." + CTA "Scanner une ordonnance" |
| Ruptures | "Bonne nouvelle, aucune rupture en cours." + CTA "Signaler une rupture" |
| Locations | "Aucun matériel actuellement loué à un patient." + CTA "Enregistrer une location" |

Si les pages modules n'ont pas encore d'état vide implémenté, ne pas créer le composant — note-le dans le rapport final comme "non patché : pas d'état vide existant".

────────────────────────────────────────
Fichier 2G — Messages d'erreur et toasts
────────────────────────────────────────

Grep `src/lib/i18n/` ou les chaînes brutes dans les composants. Standardiser les patterns "Une erreur est survenue" → reformulation explicite avec cause + action de récupération.

Toasts succès : utiliser "Tâche créée", "Ordonnance enregistrée", "Rupture signalée", "Location ajoutée", "Membre invité — courriel envoyé", "Modifications enregistrées".

────────────────────────────────────────
Fichier 2H — legal/internal/stripe-emails-copy.md (nouveau)
────────────────────────────────────────

Crée ce fichier (le dossier `legal/internal/` existe déjà — le dossier `docs/` racine n'existe PAS, ne pas le créer) avec le texte EXACT à copier-coller dans Stripe Dashboard → Settings → Branding & emails (à faire manuellement par Mehdi, pas par Claude Code) :

```markdown
# Stripe emails — copy à coller dans le Dashboard

## Email 1 : Confirmation paiement (envoyé au moment de l'activation Stripe)

**Subject** : Votre essai PharmaWorkspace est activé

**Body** :
> Bonjour,
>
> Votre essai gratuit de 30 jours est activé. Vous avez accès à toutes les fonctionnalités de PharmaWorkspace dès maintenant. Premier prélèvement le {date J+30} au tarif Early Adopter -40 % à vie (montant : {X} € HT/mois).
>
> Annulation possible en 2 clics depuis votre espace facturation.
>
> Pour démarrer du bon pied avec votre équipe, suivez les missions d'activation affichées en haut de votre tableau de bord.
>
> À très vite,
> L'équipe PharmaWorkspace

## Email 2 : Trial ending J-7

**Subject** : Votre essai PharmaWorkspace se termine dans 7 jours

**Body** :
> Bonjour,
>
> Votre essai gratuit se termine le {date J+30}. À cette date, votre carte bancaire sera débitée de {X} € HT au tarif Early Adopter -40 % à vie.
>
> Si vous voulez continuer : rien à faire, l'accès continue sans interruption.
>
> Si vous voulez arrêter : annulez en 2 clics depuis votre espace facturation, aucun prélèvement.
>
> Une question avant l'échéance ? Répondez simplement à ce courriel ou réservez 15 min avec un fondateur.
>
> À bientôt,
> L'équipe PharmaWorkspace
```

────────────────────────────────────────
Acceptance COPY-01
────────────────────────────────────────

- Hero affiche le hook "4 sur 10".
- Trust-bar contient les 6 items mis à jour.
- FAQ landing contient 9 entrées (8 + nouvelle "adhésion équipe").
- Email invitation reformulé.
- Sidebar entièrement en français (si elle existait en anglais).
- États vides standardisés sur les pages qui en avaient.
- legal/internal/stripe-emails-copy.md créé.
- npm run lint && npm run typecheck && npm run build verts.

Commit message :

```
chore(copy-01): editorial review aligned with 92-respondent survey

- hero hook "4 sur 10" (test miroir validated at 41% statistically)
- trust-bar repositioned on team-adoption (frein N°1 from survey)
- FAQ landing extended with team-adoption Q + full pricing grid
- invitation email reworded with survey-validated vocabulary
- sidebar items fully translated to French
- empty states standardized across modules
- legal/internal/stripe-emails-copy.md generated for manual Dashboard configuration

Closes COPY-01.
```

PR vers `develop`. Attendre les checks avant de continuer au ticket 3.

═══════════════════════════════════════════════════════════════
═══ TICKET 3 : ONBOARD-01 ═══
═══════════════════════════════════════════════════════════════

Branche : `feat/onboard-01-mission-checklist`
Scope : feature complète (backend + frontend + migration + tests).

────────────────────────────────────────
Concept
────────────────────────────────────────

12 missions titulaire + 5 missions invité, réparties wizard (W1-W4 / Wi1) puis dashboard. Détection AUTOMATIQUE via count SQL — pas de coche manuelle, pas de cache, recalculé à chaque render.

⚠️ **Schema réel à respecter** :
- Il n'y a PAS de table `pharmacy_members` — l'appartenance se lit dans `profiles.pharmacy_id`. Pour compter les membres d'une pharmacie : `SELECT count(*) FROM profiles WHERE pharmacy_id = X`.
- Il n'y a PAS de table `chat_messages` — CHAT-01 n'est pas mergé. Quand `MISSIONS_REQUIRE_CHAT = false`, le code JS ne doit PAS exécuter de requête sur cette table (elle n'existe pas en DB). Le calcul de M6/M4 chat est skippé entièrement au niveau du compute, pas juste filtré au rendu.
- Il n'y a PAS de table `task_read_events`. À la place, on tracke la lecture de note de transmission via un event PostHog `transmission_note_opened` (capture côté client lors du mount d'une page tâche en mode lecture). La mission M3 invité lit donc PostHog (pas une table SQL) OU se base sur un flag user_metadata `has_opened_transmission_note: true` posé à la première ouverture. Choisir la 2ème approche pour limiter les dépendances externes en SSR. Documenter le choix dans le rapport final.

Tableau missions titulaire (12) :
- W1-W4 : 4 missions wizard (officine, profil, invitations, CB) — déjà détectées par P2-01 mergé
- M1 : Inviter au moins un membre — `SELECT count(*) FROM profiles WHERE pharmacy_id = X >= 2`
- M2 : Créer 1ère tâche — `tasks.count(pharmacy_id) >= 1`
- M3 : Scanner 1ère ordonnance — `prescriptions.count(pharmacy_id) >= 1`
- M4 : Signaler 1ère rupture — `shortages.count(pharmacy_id) >= 1`
- M5 : Enregistrer 1ère location — `rentals.count(pharmacy_id) >= 1`
- M6 : Écrire dans le salon — **SKIPPÉE côté compute** quand `MISSIONS_REQUIRE_CHAT = false`. Marquée `status: 'hidden'`, ne déclenche aucune query SQL.
- M7 : Utiliser ≥ 3 modules — auto-coché dès qu'au moins 3 des 5 tables tasks/prescriptions/shortages/rentals/feedback ont ≥ 1 row (on exclut chat tant que flag OFF)
- M8 : Point équipe + feedback — `feedback.count(pharmacy_id) >= 1`

Tableau missions invité (5) :
- Wi1 : Compléter profil — `profiles.first_name IS NOT NULL AND last_name IS NOT NULL`
- M1 : Ajouter photo profil — `profiles.avatar_url IS NOT NULL` (table `profiles`, pas `members`)
- M2 : Créer 1ère tâche — `tasks.count(created_by = userId) >= 1`
- M3 : Lire 1 note de transmission — `user_metadata.has_opened_transmission_note = true` (flag posé côté client lors de la 1ère ouverture d'une page tâche, via `supabase.auth.updateUser`)
- M4 : Écrire dans le salon — **SKIPPÉE côté compute** quand `MISSIONS_REQUIRE_CHAT = false`

────────────────────────────────────────
Migration Supabase
────────────────────────────────────────

Le prochain numéro de migration disponible est **0054** (vérifié au 2026-06-10 : dernière migration mergée = `0053_planning_leave_requests.sql` PR #75). Si une autre PR est mergée entre-temps qui prend 0054, prendre 0055 ou suivant.

Fichier : `supabase/migrations/0054_pharmacies_onboarding_dismissed.sql` :

```sql
ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.pharmacies.onboarding_dismissed_at IS
  'Set when the owner manually dismisses the onboarding missions widget. NULL = widget visible. Reactivatable from Settings > Display.';
```

**Pas de table `task_read_events` à créer.** La mission M3 invité ("Lire une note de transmission") utilise un flag dans `auth.users.user_metadata` :

```typescript
// Côté client, au mount d'une page tâche en mode lecture pour la 1ère fois :
const { data: { user } } = await supabase.auth.getUser()
if (!user?.user_metadata?.has_opened_transmission_note) {
  await supabase.auth.updateUser({
    data: { has_opened_transmission_note: true }
  })
}
```

Justification : limite les dépendances DB (pas de nouvelle table + RLS + index), évite le coupling SSR/PostHog, le flag user_metadata est déjà utilisé pour `invitation_token` (P2-01) et `profile_complete` (legacy). Documentation du choix obligatoire dans le rapport final.

────────────────────────────────────────
Fichiers à créer
────────────────────────────────────────

1. `src/lib/onboarding/missions.ts` — types + getMissionsForUser

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

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
  dismissed: boolean
}

export async function getMissionsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<MissionsResult> {
  // 1. Lit le rôle + pharmacy_id depuis `profiles` (PAS de table `pharmacy_members`).
  //    `SELECT role, pharmacy_id, first_name, last_name, avatar_url FROM profiles WHERE id = userId`
  //    role === 'titulaire' → dispatch owner ; sinon → member.
  //
  // 2. Lit `pharmacies.onboarding_dismissed_at` pour le flag dismissed (titulaire uniquement).
  //
  // 3. Counts parallèles via Promise.all sur les tables existantes UNIQUEMENT.
  //    NE PAS QUERY `chat_messages` ni `task_read_events` — elles n'existent pas en DB.
  //    Si MISSIONS_REQUIRE_CHAT === false, les missions chat sortent en `status: 'hidden'` sans query.
}
```

2. `src/lib/onboarding/missions-owner.ts` — labels + calcul 12 missions (counts parallèles via Promise.all) :

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

3. `src/lib/onboarding/missions-member.ts` — 5 missions invité :

```typescript
export const MEMBER_MISSION_LABELS = {
  Wi1: { label: 'Compléter votre profil', tooltip: 'Prénom, nom.' },
  M1: { label: 'Ajouter votre photo de profil', cta: { href: '/profile' }, tooltip: 'Optionnel mais conseillé pour que vos collègues vous reconnaissent.' },
  M2: { label: 'Créer votre première tâche', cta: { href: '/tasks/new' }, tooltip: 'Une tâche du jour, une demande à un collègue.' },
  M3: { label: 'Lire une note de transmission de l\'équipe', cta: { href: '/tasks?filter=transmission' }, tooltip: 'Pour rester au courant de ce qui s\'est passé pendant votre absence.' },
  M4: { label: 'Écrire votre premier message dans le salon', cta: { href: '/chat' }, tooltip: 'Saluez votre équipe !' },
} as const
```

4. `src/components/onboarding/mission-checklist.tsx` — composant partagé `variant: 'wizard' | 'dashboard'`. En `dashboard`, si `result.dismissed === true`, ne rend rien.

Titres :
- wizard : "Votre parcours d'inscription" / "4 étapes pour activer votre essai et inviter votre équipe."
- dashboard : "Vos missions d'activation" / "8 actions pour que toute votre équipe adopte PharmaWorkspace en moins d'une semaine."

5. `src/components/onboarding/mission-item.tsx` — une ligne (case animée + label + tooltip + CTA + état done/pending).

6. `src/components/onboarding/mission-progress-bar.tsx` — barre X/N avec animation.

7. `src/components/onboarding/missions-completed-banner.tsx` — bannière 100 % avec confetti CSS (pas de JS lourd). Texte :
   - Titre : "🏆 Bravo ! Votre équipe est complètement activée."
   - Corps : "Vous avez débloqué les 8 missions d'activation. À ce stade, vous êtes parmi les officines les plus engagées de la bêta. Continuez à explorer, et n'hésitez pas à nous dire ce qu'il vous manque."
   - 2 boutons : "Donner mon avis" (ouvre feedback) / "Masquer ce widget" (ouvre modal dismiss).

8. `src/components/onboarding/transition-banner.tsx` — bannière auto-dismiss 5 sec :
   - "🎉 Bravo, vos 4 missions d'inscription sont terminées !"
   - "Voici 8 nouvelles missions pour activer votre équipe."

9. `src/components/onboarding/dismiss-modal.tsx` :
   - Titre : "Masquer le widget des missions ?"
   - Description : "Vous pourrez le réafficher à tout moment depuis Paramètres → Affichage."
   - Boutons : "Masquer" (ghost) / "Garder visible" (primary)

────────────────────────────────────────
Fichiers à modifier
────────────────────────────────────────

10. `src/app/(onboarding)/onboarding/layout.tsx` — injecter `<MissionChecklist variant="wizard" />`.

11. `src/app/(app)/dashboard/page.tsx` — injecter `<MissionChecklist variant="dashboard" />`. Déclencher la `<TransitionBanner />` une seule fois via un flag en sessionStorage à l'arrivée post-webhook trialing.

12. `src/app/(app)/settings/display/page.tsx` (créer si absent) — toggle "Afficher le widget des missions". Quand activé, met `onboarding_dismissed_at = NULL` ; quand désactivé, met `onboarding_dismissed_at = now()`.

13. `src/lib/analytics/events.ts` — ajouter 5 events PostHog :
    - `onboarding_missions_shown` (variant, role, progress_done, progress_total)
    - `onboarding_mission_clicked` (mission_id)
    - `onboarding_mission_completed` (mission_id) — déclencher dès qu'on détecte la transition pending → done à un re-render
    - `onboarding_missions_all_completed` (role, time_to_complete_seconds depuis le wizard end)
    - `onboarding_missions_dismissed`

────────────────────────────────────────
Feature flag
────────────────────────────────────────

Variable d'env : `NEXT_PUBLIC_MISSIONS_REQUIRE_CHAT=false` par défaut.

Quand `false` :
- M6 titulaire masquée (status: 'hidden', ne compte pas dans le total)
- M4 invité masquée
- Total titulaire passe de 8 à 7 missions post-wizard
- Total invité passe de 4 à 3 missions post-wizard

Au merge ultérieur de CHAT-01, basculer la variable à `true` pour réactiver M6/M4.

────────────────────────────────────────
Tests requis
────────────────────────────────────────

A. Vitest (`src/lib/onboarding/__tests__/missions.test.ts`) : table de cas matrices

```typescript
describe('getMissionsForUser', () => {
  // Owner cases
  it.each([
    ['empty pharmacy', { tasks: 0, prescriptions: 0, ... }, 4, 12], // 4 wizard done + 0 dashboard done
    ['1 task created', { tasks: 1, prescriptions: 0, ... }, 5, 12],
    ['3 modules used', { tasks: 1, prescriptions: 1, shortages: 1, ... }, 8, 12], // M7 auto-checked
    ['all done', { tasks: 1, prescriptions: 1, shortages: 1, rentals: 1, chat: 1, feedback: 1, members: 2 }, 12, 12],
  ])('%s', async (label, state, expectedDone, expectedTotal) => { ... })

  // Member cases similar

  // Feature flag
  it('hides M6 owner + M4 member when MISSIONS_REQUIRE_CHAT=false', async () => { ... })

  // Dismissed
  it('returns dismissed=true when pharmacy.onboarding_dismissed_at is set', async () => { ... })

  // RLS isolation
  it('does not leak data across pharmacies', async () => { ... })
})
```

B. Playwright (`e2e/onboarding-missions.spec.ts`) golden path :

1. Signup nouveau titulaire → wizard 4 étapes (utiliser fixtures Stripe test mode)
2. Arrivée dashboard → bannière transition 5 sec apparaît
3. Widget dashboard affiche progress 0/8 (ou 0/7 si flag CHAT OFF en CI)
4. Créer 1 tâche depuis le CTA mission → reload → progress 1/8
5. Cliquer mission "Scanner ordonnance" → page /prescriptions/new s'ouvre
6. Cliquer "Masquer ce widget" → modal confirm → confirmer → widget disparaît
7. Aller Paramètres → Affichage → toggle ON → widget réapparaît au reload dashboard

────────────────────────────────────────
Acceptance ONBOARD-01
────────────────────────────────────────

- Migration 0054 (ou n° suivant si conflit de claim entre-temps) appliquée localement et vérifiée
- COORDINATION.md §S5 mis à jour pour réserver le n° utilisé (passer la ligne `0054+ À allouer au besoin` à `0054 MEHDI pharmacies_onboarding_dismissed (ONBOARD-01)`)
- getMissionsForUser testée Vitest (couverture ≥ 90 % sur missions-owner.ts et missions-member.ts)
- Playwright golden path passe en CI
- Feature flag MISSIONS_REQUIRE_CHAT respecté (testé ON et OFF)
- 5 events PostHog déclenchés correctement
- Widget responsive (mobile ≤ 380 px, desktop)
- RLS testée — aucune fuite de pharmacy_id entre tenants
- npm run lint && npm run typecheck && npm run build && npm run test && npm run e2e tous verts

Commit message :

```
feat(onboard-01): in-app activation missions for owner + member

- 12 missions owner (W1-W4 wizard + M1-M8 dashboard)
- 5 missions member (Wi1 wizard + M1-M4 dashboard)
- auto-detection via parallel SQL counts, no manual checkboxes
- migration adds onboarding_dismissed_at to pharmacies
- feature flag MISSIONS_REQUIRE_CHAT gates M6 owner + M4 member
- 5 PostHog events for funnel analysis
- Vitest matrix coverage + Playwright golden path

Closes ONBOARD-01.
Refs survey insight: 40% adhésion équipe = frein #1 (92 pharma).
```

PR vers `develop`.

═══════════════════════════════════════════════════════════════
RAPPORT FINAL ATTENDU
═══════════════════════════════════════════════════════════════

Quand les 3 PRs sont créées et que les checks CI passent, donne-moi un rapport unique avec :

1. Liste des 3 PRs avec leur n° GitHub et leur statut (open / merged / failing)
2. Pour chaque PR : la liste des fichiers modifiés ou créés
3. Résultat des tests (lint, typecheck, build, vitest, playwright) ticket par ticket
4. Liste des résidus solo|equipe|grande trouvés dans le pré-flight (à traiter dans une PR séparée si nécessaire)
5. Assumptions prises (ex : mécanisme M3 invité retenu — user_metadata flag vs autre approche, items sidebar trouvés et renommés, états vides détectés ou non, etc.)
6. Numéro de migration finalement utilisé pour ONBOARD-01 + ligne à ajouter dans COORDINATION.md §S5

Si l'un des 3 tickets bloque, arrête-toi avant le suivant et donne-moi le diagnostic. Ne contourne pas.
```

---

## Note pratique

Une fois ces 3 PRs mergées sur `develop`, tu auras :

- Page /tarifs propre, alignée sur le pivot 2 et les insights v3
- Landing avec le hook « 4 sur 10 », FAQ étendue, trust-bar repositionné, emails reformulés
- Widget de missions d'activation produit en wizard ET dashboard, avec analytics et toggle réactivation

Le numéro de migration ONBOARD-01 doit être réservé dans COORDINATION.md §S5 dès que Claude Code te le confirme — pour éviter une collision si tu ouvres une autre PR en parallèle.
