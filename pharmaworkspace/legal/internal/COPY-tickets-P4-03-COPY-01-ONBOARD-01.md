# Copy adapté insights v3 (92 répondants) — patch direct sur le code mergé

*Doc patch-ready basé sur le scan des fichiers réels du repo et le rapport final 92 répondants. Chaque section donne le texte exact à coller dans le fichier indiqué.*

---

## 0. Trois arbitrages actés par Mehdi (08/06/2026)

| # | Sujet | Décision | Conséquence |
|---|---|---|---|
| A | Nom des tiers | **PO / OTM / GO** (slug `po\|otm\|go`) — on suit le ticket, pas le code | Renommer dans `pricing-table.tsx`, mettre à jour les slugs partout (signup, Stripe metadata, FAQ landing) |
| B | Prix tiers | **23,40 € / 47,40 € / 77,40 € HT/mois** Early Adopter — on garde les prix du code | Catalogue affiché barré = 39 / 79 / 129 € (déjà cohérent avec le code) |
| C | Features par tier | **Tous les modules dans tous les tiers**, seul change le nombre de comptes — on suit le ticket | Réécriture du tableau `features` dans `pricing-table.tsx`, mention explicite ajoutée dans `page.tsx` |

### Effet de bord important pour A (changement de slug)

Le slug `tier=` est utilisé dans plusieurs endroits :

1. **CTA des cartes** (`pricing-table.tsx` ligne 180) : `?tier=solo|equipe|grande` → `?tier=po|otm|go`
2. **Page `/signup`** : lit `?tier=` pour pré-sélectionner — vérifier `SignupForm` accepte les 3 nouvelles valeurs
3. **P4-13b Stripe trial** : la metadata `tier` envoyée à Stripe Checkout doit suivre — vérifier `tier_to_price_id` map dans `src/lib/stripe/`
4. **Analytics PostHog** : tout event qui carry `tier` change de cardinalité (les dashboards historiques peuvent montrer un trou)
5. **Webhook Stripe → DB** : la colonne `subscription_tier` dans `pharmacies` doit accepter les nouvelles valeurs — vérifier la contrainte CHECK si elle existe

**Recommandation** : Mehdi fait un grep `solo\|equipe\|grande` sur tout le repo avant la PR P4-03 finish pour ne rien oublier.

### Glose à afficher pour les acronymes

Comme PO/OTM/GO ne sont pas auto-explicatifs pour un pharmacien, on ajoute une glose sous le nom du tier dans chaque carte :

- **PO** — Petite Officine
- **OTM** — Officine Taille Moyenne
- **GO** — Grande Officine

Le reste du document part de A=PO/OTM/GO, B=23,40/47,40/77,40, C=tout dans tout.

---

## 1. P4-03 finish — patch précis fichier par fichier

### 1.1 `src/app/(marketing)/tarifs/page.tsx`

#### Lorem ipsum à virer (ligne 21-25)

**Avant** :

```tsx
<p className="mt-4 text-base text-slate-600 sm:text-lg">
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Choisissez le
  tier adapté à la taille de votre officine. Les{' '}
  <strong>20 premières officines inscrites en bêta</strong> bénéficient
  d&apos;un tarif Early Adopter -40 % à vie.
</p>
```

**Après** (intègre l'insight v3 « 89 % marché vierge » + frein « adhésion équipe ») :

```tsx
<p className="mt-4 text-base text-slate-600 sm:text-lg">
  Toutes les fonctionnalités dans chaque formule. Seul change le nombre de
  comptes selon la taille de votre équipe. Les{' '}
  <strong>20 premières officines inscrites en bêta</strong> bénéficient
  d&apos;un tarif Early Adopter -40 % à vie.
</p>
```

#### Titre H1 (ligne 17-19)

**Avant** :

```tsx
<h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
  Une tarification claire, sans engagement
</h1>
```

**Après** (pas de changement, le titre actuel est bon) — laisse tel quel.

#### Bandeau Early Adopter (ligne 28-42)

**Avant** :

```tsx
<p className="mt-2 text-xs text-slate-500">
  [À rédiger par Mehdi — chiffre dynamique à câbler sur
  pharmacy_acquisition.confirmed_at count]
</p>
```

**Après** (à remplacer par une mention explicite tant que le compteur n'est pas câblé) :

```tsx
<p className="mt-2 text-xs text-slate-500">
  Réservé aux pilotes bêta · -40 % garantis à vie · Valable sur les 3 formules
</p>
```

Note technique pour Dim : le `[X]` ligne 36 doit devenir un compteur dynamique. Tant que pas câblé, garder une valeur affichée façon « 12 » (manuelle, à mettre à jour à la main).

#### Bandeau « Vous hésitez sur le tier adapté ? » (ligne 50-71)

**Avant** :

```tsx
<p className="mt-2 text-sm text-slate-600 sm:text-base">
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
  eiusmod tempor incididunt ut labore et dolore magna aliqua. Réservez
  15 minutes avec un fondateur pour discuter de vos besoins.
</p>
```

**Après** (intègre l'insight #1 « pain = info pas écrite » + frein équipe) :

```tsx
<p className="mt-2 text-sm text-slate-600 sm:text-base">
  Petite officine indépendante, équipe en groupement, multi-comptoirs :
  on a discuté avec plus de 90 pharmaciens pour calibrer ces formules.
  15 minutes avec un fondateur pour valider que la nôtre vous va.
</p>
```

#### Footer CTA (ligne 79-88)

**Avant** :

```tsx
<p className="text-sm text-slate-600">
  Toutes les fonctionnalités, sans surprise.{' '}
```

**Après** :

```tsx
<p className="text-sm text-slate-600">
  Toutes les fonctionnalités dans chaque formule. Pas de surprise.{' '}
```

---

### 1.2 `src/components/marketing/pricing-table.tsx`

#### Le bloc TIERS (ligne 23-74) — réécriture complète

Conformément aux arbitrages : naming PO/OTM/GO + glose, prix 23,40/47,40/77,40 €, toutes les fonctionnalités identiques dans les 3 tiers, seul change le nombre de comptes.

Il faut d'abord élargir le type `Tier` pour accueillir la glose. Modifier la définition (ligne 10-20) :

```tsx
type Tier = {
  id: 'po' | 'otm' | 'go'
  name: string          // PO / OTM / GO
  fullName: string      // Petite Officine / Officine Taille Moyenne / Grande Officine
  audience: string
  priceMonthly: number  // € HT/mois en Early Adopter -40 %
  priceYearly: number   // € HT/an en Early Adopter -40 %
  catalogMonthly: number // prix catalogue € HT/mois (barré)
  features: string[]
  highlighted?: boolean
  badge?: string
}
```

Puis le bloc `TIERS` :

```tsx
// Tous les modules sont identiques dans les 3 tiers — seul change le nombre de comptes équipe.
// Cette liste est volontairement la même dans les 3 cartes pour rendre visible
// l'engagement « tous les modules, sans surprise ».
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

#### Affichage du nom + glose dans la carte (ligne 146-149)

**Avant** :

```tsx
<div className="space-y-1">
  <h3 className="text-lg font-semibold text-slate-900">{tier.name}</h3>
  <p className="text-sm text-slate-500">{tier.audience}</p>
</div>
```

**Après** (le sigle reste lisible, la glose donne le sens) :

```tsx
<div className="space-y-1">
  <h3 className="text-lg font-semibold text-slate-900">
    {tier.name}{' '}
    <span className="text-sm font-normal text-slate-500">— {tier.fullName}</span>
  </h3>
  <p className="text-sm text-slate-500">{tier.audience}</p>
</div>
```

#### CTA des cartes (ligne 180) — slug à mettre à jour

**Avant** :

```tsx
href={`/signup?tier=${tier.id}&billing=${billing}&source=tarifs`}
```

**Après** : pas de changement de syntaxe mais comme `tier.id` est passé de `'solo'|'equipe'|'grande'` à `'po'|'otm'|'go'`, l'URL générée change automatiquement. **Vérifier que `SignupForm` accepte les 3 nouvelles valeurs** (voir effet de bord #2 en section 0).

#### CTA des cartes (ligne 188)

**Avant** :

```tsx
Démarrer un essai gratuit
```

**Après** (CTA plus engageant et précis) :

```tsx
Démarrer 30 jours gratuits
```

#### Mention sous les cartes (ligne 197-201)

**Avant** :

```tsx
<p className="text-center text-sm text-slate-500">
  <Sparkles className="mr-1 inline h-4 w-4 text-teal-600" aria-hidden="true" />
  30 jours d&apos;essai · CB validée à l&apos;inscription · €0 prélevés avant J+30
  · Annulable à tout moment
</p>
```

**Après** (ajout d'un H2 court juste au-dessus pour la pédagogie issue de l'insight « marché vierge ») :

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
<p className="text-center text-sm text-slate-500">
  <Sparkles className="mr-1 inline h-4 w-4 text-teal-600" aria-hidden="true" />
  30 jours d&apos;essai · CB validée à l&apos;inscription · €0 prélevés avant J+30
  · Annulable à tout moment
</p>
```

---

### 1.3 `src/components/marketing/pricing-faq.tsx`

#### Question 2 — utilisateurs par tier (ligne 12-15) — naming à mettre à jour

**Avant** :

```tsx
{
  question: 'Combien d\'utilisateurs sont inclus par tier ?',
  answer:
    'Tier Solo : jusqu\'à 3 utilisateurs. Tier Équipe : 4 à 8 utilisateurs. Tier Grande équipe : utilisateurs illimités. Si vous dépassez votre tier en cours d\'abonnement, nous vous accompagnons pour la transition.',
},
```

**Après** :

```tsx
{
  question: 'Combien de comptes équipe sont inclus par formule ?',
  answer:
    'PO (Petite Officine) : jusqu\'à 3 comptes équipe. OTM (Officine Taille Moyenne) : 4 à 8 comptes. GO (Grande Officine) : comptes illimités. Si vous dépassez votre formule en cours d\'abonnement, vous changez en un clic depuis votre espace facturation, sans interruption de service.',
},
```

#### Question 3 — changement de tier (ligne 16-19) — naming + simplification

**Avant** :

```tsx
{
  question: 'Puis-je changer de tier en cours d\'abonnement ?',
  answer:
    "Oui, à tout moment depuis l'espace facturation. Le passage à un tier supérieur est effectif immédiatement, le passage à un tier inférieur prend effet à la prochaine période de facturation.",
},
```

**Après** :

```tsx
{
  question: 'Puis-je changer de formule en cours d\'abonnement ?',
  answer:
    "Oui, à tout moment depuis votre espace facturation. Le passage à une formule supérieure (PO → OTM, OTM → GO) est effectif immédiatement avec proratisation. Le passage à une formule inférieure prend effet à la prochaine période de facturation.",
},
```

#### Question 6 — annulation (ligne 32-35)

**Avant** :

```tsx
{
  question: 'Comment annuler mon abonnement ?',
  answer:
    'Dans votre compte → Facturation → Annuler l\'abonnement. Si vous annulez pendant les 30 jours d\'essai, aucun prélèvement. Après J+30, le prélèvement en cours est annulé pour la prochaine échéance (Lorem ipsum dolor sit amet, consectetur adipiscing elit).',
},
```

**Après** :

```tsx
{
  question: 'Comment annuler mon abonnement ?',
  answer:
    'Dans votre compte → Facturation → Annuler l\'abonnement. Si vous annulez pendant les 30 jours d\'essai, aucun prélèvement. Après J+30, le prélèvement en cours est annulé pour la prochaine échéance et votre accès reste actif jusqu\'à la fin de la période payée.',
},
```

#### Question 7 — EA à vie (ligne 36-40)

**Avant** :

```tsx
{
  question: 'Le tarif Early Adopter -40 % est-il à vie ?',
  answer:
    "Oui, le tarif -40 % est garanti à vie sur votre compte tant que votre abonnement reste actif. Cette offre est limitée aux 20 premières officines inscrites en bêta (Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua).",
},
```

**Après** :

```tsx
{
  question: 'Le tarif Early Adopter -40 % est-il à vie ?',
  answer:
    "Oui, le tarif -40 % est garanti à vie sur votre compte tant que votre abonnement reste actif. Cette offre est limitée aux 20 premières officines inscrites en bêta. Une fois ces 20 places allouées, le tarif catalogue (39 / 79 / 129 € HT/mois) s'applique aux nouvelles inscriptions.",
},
```

#### Question 8 — groupements (ligne 41-45)

**Avant** :

```tsx
{
  question: 'Y a-t-il une remise pour les pharmacies en groupement ?',
  answer:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Pour les groupements, contactez-nous directement à contact@pharmaworkspace.fr pour un accord cadre personnalisé.",
},
```

**Après** (intègre l'insight #5 — 65 % en groupement, top 6 Giphar/Aprium/Giropharm/Pharmavie/Totum/Pharmuni) :

```tsx
{
  question: 'Y a-t-il une remise pour les pharmacies en groupement ?',
  answer:
    "Si votre groupement (Giphar, Aprium, Giropharm, Pharmavie, Totum, Pharmuni et autres) souhaite déployer PharmaWorkspace sur plusieurs officines, nous pouvons mettre en place un accord cadre avec conditions tarifaires adaptées. Écrivez à contact@pharmaworkspace.fr en mentionnant votre groupement.",
},
```

#### Nouvelle question à insérer (en position 2, après l'essai) — frein N°1 v3

À ajouter dans le tableau `FAQ_ITEMS` juste après la question 1 :

```tsx
{
  question: 'Comment être sûr que mon équipe va l\'adopter ?',
  answer:
    "C'est la question la plus fréquente. 40 % des pharmaciens nous l'ont posée pendant notre enquête. Notre réponse : on a conçu PharmaWorkspace pour qu'un préparateur puisse l'utiliser sans formation. Concrètement, votre essai 30 jours inclut un onboarding équipe accompagné en visio (gratuit, 30 min) pour vous aider à le présenter à votre équipe, et un widget de missions guide chaque membre dans la prise en main pendant la première semaine.",
},
```

---

## 2. COPY-01 — patch précis sur les fichiers landing existants

### 2.1 `src/components/marketing/hero.tsx`

#### Titre H1 (ligne 18-23)

**Avant** :

```tsx
<h1
  id="hero-title"
  className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
>
  Remplacez le cahier de transmission, les post-it et les groupes WhatsApp par un seul espace partagé.
</h1>
```

**Après** (intègre le hook « 4 sur 10 » — test miroir validé à 41 % sur 92 répondants) :

```tsx
<h1
  id="hero-title"
  className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
>
  4 pharmaciens sur 10 ne peuvent pas citer les 3 tâches en cours dans leur officine. La vôtre les a-t-elle écrites quelque part ?
</h1>
```

#### Sous-titre (ligne 25-29)

**Avant** :

```tsx
<p className="max-w-xl text-base text-slate-600 sm:text-lg">
  PharmaWorkspace centralise les tâches, ordonnances, ruptures et locations de votre officine.
  Hébergé en France, GDPR-compliant, intégré au CIP13 et à l&apos;ANSM. 30 jours d&apos;essai —
  annulable à tout moment, premier prélèvement seulement à J+30.
</p>
```

**Après** (ton plus concret, vocabulaire validé enquête, sortir GDPR-compliant qui sonne tech) :

```tsx
<p className="max-w-xl text-base text-slate-600 sm:text-lg">
  PharmaWorkspace remplace le cahier de transmission, les post-it et le groupe WhatsApp
  de votre équipe par un seul espace partagé. Conçu avec des pharmaciens en exercice,
  hébergé en France, conforme RGPD. 30 jours d&apos;essai gratuits — annulable à tout
  moment, premier prélèvement seulement à J+30.
</p>
```

---

### 2.2 `src/components/marketing/trust-bar.tsx`

#### Items (ligne 1-8)

**Avant** :

```tsx
const ITEMS = [
  'Hébergé en France',
  'RGPD',
  'BDPM/ANSM officiel',
  'OCR EU (Mistral AI)',
  '30 jours d’essai',
  'Annulable à tout moment',
]
```

**Après** (priorise les insights v3 — équipe + simplicité) :

```tsx
const ITEMS = [
  'Hébergé en France',
  'RGPD conforme',
  'IA française (Mistral)',
  'Conçu pour toute l\'équipe',
  '30 jours d\'essai',
  'Annulable en 2 clics',
]
```

---

### 2.3 `src/components/marketing/testimonial.tsx`

#### Témoignage (ligne 15-19)

**Avant** :

```tsx
<blockquote className="mt-6 text-xl font-medium leading-relaxed text-slate-900 sm:text-2xl">
  « En deux semaines, on a arrêté le cahier de transmission et le groupe WhatsApp.
  L'équipe sait quoi faire en arrivant, et moi je vois ce qui se passe même quand je
  suis dehors. »
</blockquote>
```

**Après** (laisse tel quel — il est déjà excellent et aligné). Note pour Mehdi : remplacer `[Nom du pilote]` / `[Nom de l'officine]` par le pilote réel dès que dispo. Si pas encore de pilote signé, considérer le retrait du composant `<Testimonial />` de `page.tsx` pour ne pas exposer le placeholder.

---

### 2.4 `src/components/marketing/faq.tsx`

#### Question 1 — essai (ligne 12-21)

Reste bonne. Pas de changement.

#### Question 7 — coût (ligne 67-75)

**Avant** :

```tsx
{
  question: 'Combien ça coûte après les 30 jours ?',
  answer: (
    <p>
      Early Adopter (les 20 premières officines) : à partir de 23,40 € HT/mois (-40 % à vie).
      Tarif catalogue : 39 € HT/mois. Voir tarifs détaillés.
    </p>
  ),
},
```

**Après** (ajoute la grille complète pour répondre direct sans clic) :

```tsx
{
  question: 'Combien ça coûte après les 30 jours ?',
  answer: (
    <p>
      Early Adopter (les 20 premières officines, -40 % à vie) : 23,40 € / 47,40 € / 77,40 €
      HT/mois selon la taille de votre équipe. Tarif catalogue : 39 € / 79 € / 129 € HT/mois.
      Toutes les fonctionnalités dans chaque formule.{' '}
      <a href="/tarifs" className="font-medium text-teal-700 underline-offset-4 hover:underline">
        Voir tarifs détaillés
      </a>.
    </p>
  ),
},
```

#### Nouvelle question à insérer (en position 6, après LGO) — frein adhésion équipe

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

---

### 2.5 `src/components/marketing/cta-final.tsx`

#### Titre (ligne 17-21)

**Avant** :

```tsx
<h2
  id="cta-final-title"
  className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl"
>
  Prêt à libérer votre équipe ?
</h2>
```

**Après** (laisse tel quel — il est très bien). Note : le mot « libérer » fait écho au pain N°1 (info pas écrite qui charge mentalement le titulaire).

---

### 2.6 `src/app/(marketing)/signup/page.tsx`

#### Sous-titre (ligne 18-21)

**Avant** :

```tsx
<p className="mt-2 text-slate-600">
  30 jours d&apos;essai gratuit. Carte bancaire demandée à l&apos;inscription
  pour valider votre compte, mais aucun prélèvement avant J+30.
</p>
```

**Après** (laisse tel quel — déjà bon).

#### Mention bas (ligne 41-44)

Laisse tel quel.

---

### 2.7 Sidebar (produit interne) — libellés à uniformiser

Localisation : à chercher dans `src/components/app/*` ou `src/app/(app)/layout.tsx`. Règle :

| Item EN | Item FR validé |
|---|---|
| Dashboard | **Tableau de bord** |
| Tasks | **Tâches** |
| Prescriptions | **Ordonnances** |
| Shortages | **Ruptures** |
| Rentals | **Locations** |
| Agenda | **Calendrier** (libère « Agenda » pour PLAN-01) |
| Training | **Formation** |
| Team | **Équipe** |
| Settings | **Paramètres** |
| Chat | **Salon d'équipe** |

---

### 2.8 États vides — règle universelle

Modèle : `Vous n'avez pas encore [X]. [CTA pour créer le premier].`

| Module | Texte |
|---|---|
| Tâches | « Vous n'avez pas encore de tâche en cours. Créez la première pour démarrer la transmission d'équipe. » → [ Créer une tâche ] |
| Ordonnances | « Aucune ordonnance scannée pour l'instant. Scannez-en une pour la voir apparaître ici. » → [ Scanner une ordonnance ] |
| Ruptures | « Bonne nouvelle, aucune rupture en cours. » → [ Signaler une rupture ] |
| Locations | « Aucun matériel actuellement loué à un patient. » → [ Enregistrer une location ] |
| Salon | « Le salon de votre équipe est tout neuf. Écrivez le premier message pour démarrer la conversation. » → input direct |

---

### 2.9 Messages d'erreur — règle universelle

Modèle : `On n'a pas pu [action]. [Cause si connue]. [Action de récupération].`

| Cas | Texte |
|---|---|
| Création tâche | « On n'a pas pu enregistrer votre tâche. Réessayez ou contactez-nous si le problème persiste. » |
| OCR | « On n'a pas pu lire votre ordonnance. Reprenez une photo bien éclairée et bien cadrée. » |
| Upload photo trop lourde | « Votre image dépasse 10 Mo. Choisissez une photo plus légère ou réduisez sa qualité. » |
| Session expirée | « Votre session a expiré. Reconnectez-vous pour continuer. » |
| Permission refusée | « Vous n'avez pas accès à cette fonctionnalité. Demandez à votre titulaire de vérifier vos droits. » |

---

### 2.10 Toasts de succès

Modèle : `[Élément] [action au passé court]`

- « Tâche créée »
- « Ordonnance enregistrée »
- « Rupture signalée »
- « Location ajoutée »
- « Membre invité — courriel envoyé »
- « Modifications enregistrées »

---

### 2.11 Email d'invitation — `src/lib/email/templates/invitation.tsx`

#### Paragraphe descriptif (ligne 131-135)

**Avant** :

```tsx
<Text style={textStyle}>
  PharmaWorkspace est l&apos;outil de coordination de votre équipe officinale : tâches,
  ordonnances, ruptures, commandes, transmissions — tout en un seul espace partagé
  mobile et desktop.
</Text>
```

**Après** (intègre le hook v3 + langage validé enquête) :

```tsx
<Text style={textStyle}>
  Sur PharmaWorkspace, vous pourrez voir les tâches en cours et les notes de
  transmission de toute l&apos;équipe, scanner les ordonnances pour gagner du temps,
  signaler une rupture en un clic, et discuter avec vos collègues dans le salon
  textuel. Pas de mot de passe à créer : le lien ci-dessous vous connecte directement.
</Text>
```

#### Footer (ligne 159-166)

**Avant** :

```tsx
<Text style={footerStyle}>
  PharmaWorkspace — SaaS de coordination pour officines françaises. Hébergement France,
  conforme RGPD.{' '}
  <Link href="https://pharmaworkspace.fr/securite" style={{ color: '#64748b' }}>
    En savoir plus sur notre sécurité
  </Link>
  .
</Text>
```

**Après** :

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

---

### 2.12 Email Stripe — confirmation paiement (Dashboard Stripe)

À configurer dans Stripe Dashboard → Settings → Branding & emails. Sujet et corps proposés :

**Sujet** :
> Votre essai PharmaWorkspace est activé

**Corps** :
> Bonjour,
>
> Votre essai gratuit de 30 jours est activé. Vous avez accès à toutes les fonctionnalités de PharmaWorkspace dès maintenant. Premier prélèvement le [date J+30] au tarif Early Adopter -40 % à vie (montant : [X] € HT/mois).
>
> Annulation possible en 2 clics depuis votre [espace facturation].
>
> Pour démarrer du bon pied avec votre équipe, suivez les missions d'activation affichées en haut de votre tableau de bord.
>
> À très vite,
> L'équipe PharmaWorkspace

### 2.13 Email Stripe — trial ending J-7

**Sujet** :
> Votre essai PharmaWorkspace se termine dans 7 jours

**Corps** :
> Bonjour,
>
> Votre essai gratuit se termine le [date J+30]. À cette date, votre carte bancaire sera débitée de [X] € HT au tarif Early Adopter -40 % à vie.
>
> Si vous voulez continuer : rien à faire, l'accès continue sans interruption.
>
> Si vous voulez arrêter : annulez en 2 clics depuis votre [espace facturation], aucun prélèvement.
>
> Une question avant l'échéance ? Répondez simplement à ce courriel ou réservez 15 min avec un fondateur.
>
> À bientôt,
> L'équipe PharmaWorkspace

---

## 3. ONBOARD-01 — strings prêtes pour Dim

### 3.1 Titres du widget

#### Variant `wizard`

```ts
title: 'Votre parcours d\'inscription'
subtitle: '4 étapes pour activer votre essai et inviter votre équipe.'
```

#### Variant `dashboard`

```ts
title: 'Vos missions d\'activation'
subtitle: '8 actions pour que toute votre équipe adopte PharmaWorkspace en moins d\'une semaine.'
```

### 3.2 Libellés des 12 missions titulaire

```ts
// src/lib/onboarding/missions-owner.ts
export const OWNER_MISSION_LABELS = {
  W1: { label: 'Créer votre officine', tooltip: 'Nom, adresse, FINESS si vous l\'avez.' },
  W2: { label: 'Compléter votre profil', tooltip: 'Prénom, nom, fonction.' },
  W3: { label: 'Inviter vos premiers collègues', tooltip: 'Vous pouvez aussi passer cette étape et y revenir plus tard.' },
  W4: { label: 'Activer votre essai 30 jours', tooltip: 'Carte bancaire validée, 0 € prélevé pendant 30 jours.' },

  M1: { label: 'Inviter au moins un membre de l\'équipe', cta: '/team/invite', tooltip: 'Sans équipe, l\'outil ne sert à rien. C\'est l\'étape la plus importante.' },
  M2: { label: 'Créer votre première tâche', cta: '/tasks/new', tooltip: 'Une tâche du jour, une note de transmission, une commande à passer.' },
  M3: { label: 'Scanner votre première ordonnance', cta: '/prescriptions/new', tooltip: 'L\'IA française Mistral l\'analyse en 30 secondes.' },
  M4: { label: 'Signaler votre première rupture', cta: '/shortages/new', tooltip: 'Le code-barre CIP13 suffit.' },
  M5: { label: 'Enregistrer une location de matériel', cta: '/rentals/new', tooltip: 'Tensiomètre, lecteur glycémie, tire-lait…' },
  M6: { label: 'Écrire un message dans le salon d\'équipe', cta: '/chat', tooltip: 'Comme un WhatsApp, en interne et sécurisé.' },
  M7: { label: 'Utiliser au moins 3 modules différents', cta: null, tooltip: 'Un module = Tâches, Ordonnances, Ruptures, Locations, Salon, Formation. Dès que vous avez créé une entrée dans 3 d\'entre eux, cette mission se coche automatiquement.' },
  M8: { label: 'Faire un point équipe à J+7 et nous donner votre retour', cta: 'feedback', tooltip: 'Cliquez sur le bouton flottant « Donner mon avis » et envoyez-nous vos premiers retours. Ça nous aide énormément à itérer.' },
} as const
```

### 3.3 Libellés des 5 missions invité

```ts
// src/lib/onboarding/missions-member.ts
export const MEMBER_MISSION_LABELS = {
  Wi1: { label: 'Compléter votre profil', tooltip: 'Prénom, nom.' },

  M1: { label: 'Ajouter votre photo de profil', cta: '/profile', tooltip: 'Optionnel mais conseillé pour que vos collègues vous reconnaissent.' },
  M2: { label: 'Créer votre première tâche', cta: '/tasks/new', tooltip: 'Une tâche du jour, une demande à un collègue.' },
  M3: { label: 'Lire une note de transmission de l\'équipe', cta: '/tasks?filter=transmission', tooltip: 'Pour rester au courant de ce qui s\'est passé pendant votre absence.' },
  M4: { label: 'Écrire votre premier message dans le salon', cta: '/chat', tooltip: 'Saluez votre équipe !' },
} as const
```

### 3.4 Bannière de transition wizard → dashboard

Affichée 5 secondes au montage du dashboard après webhook Stripe `trialing` confirmé :

```tsx
<TransitionBanner duration={5000}>
  🎉 Bravo, vos 4 missions d&apos;inscription sont terminées !
  <br />
  Voici 8 nouvelles missions pour activer votre équipe.
</TransitionBanner>
```

### 3.5 Bannière de complétion 100 %

```tsx
<CompletedBanner>
  <Heading>🏆 Bravo ! Votre équipe est complètement activée.</Heading>
  <Text>
    Vous avez débloqué les 8 missions d&apos;activation. À ce stade, vous êtes parmi
    les officines les plus engagées de la bêta. Continuez à explorer, et n&apos;hésitez
    pas à nous dire ce qu&apos;il vous manque.
  </Text>
  <Actions>
    <Button variant="primary" onClick={openFeedback}>Donner mon avis</Button>
    <Button variant="ghost" onClick={dismiss}>Masquer ce widget</Button>
  </Actions>
</CompletedBanner>
```

### 3.6 Modal de confirmation dismissal

```tsx
<DismissModal>
  <Title>Masquer le widget des missions ?</Title>
  <Description>
    Vous pourrez le réafficher à tout moment depuis Paramètres → Affichage.
  </Description>
  <Actions>
    <Button variant="ghost" onClick={confirmDismiss}>Masquer</Button>
    <Button variant="primary" onClick={cancel}>Garder visible</Button>
  </Actions>
</DismissModal>
```

### 3.7 Page Paramètres → Affichage

```tsx
<SettingsSection>
  <SectionTitle>Widget des missions d&apos;activation</SectionTitle>
  <Description>
    Le widget des missions vous aide à activer votre équipe pendant la première
    semaine. Une fois toutes les missions complétées ou si vous préférez ne plus
    l&apos;afficher, vous pouvez le masquer ici.
  </Description>
  <Toggle
    label="Afficher le widget des missions"
    checked={showMissions}
    onChange={setShowMissions}
  />
</SettingsSection>
```

---

## 4. Synthèse — comment ces 3 tickets s'alignent sur les insights v3

| Ticket | Avant insights v3 | Après insights v3 |
|---|---|---|
| **P4-03** | Lorem ipsum + features incrémentales + prix Équipe arbitraire | Tarification claire « tous les modules, seul change le nombre de comptes », prix Équipe 47,40 € validé par 68 % budget <50 €, FAQ Giropharm incluse, nouvelle question « adhésion équipe » répondant au frein N°1 |
| **COPY-01** | Strings éparpillées, anglicismes, hero générique « cahier de transmission » | Hero « 4 sur 10 » validé statistiquement, trust-bar repositionné « conçu pour toute l'équipe », FAQ étendue avec onboarding équipe, emails Resend reformulés avec vocabulaire enquête, sidebar entièrement francisée |
| **ONBOARD-01** | Libellés génériques | Libellés métier + tooltips qui parlent (CIP13, OCR Mistral, salon comme WhatsApp), mission 8 explicitement liée au feedback (P5-06), bannière finale qui valorise « officines les plus engagées de la bêta » |

---

## 5. Décisions actées (08/06/2026) et points restants

✅ **Tiers : PO / OTM / GO** (acronymes + glose pleine en sous-titre)
✅ **Prix : 23,40 € / 47,40 € / 77,40 € HT/mois Early Adopter**
✅ **Toutes les fonctionnalités dans toutes les formules** (seul change le nombre de comptes)

À valider encore :

1. **Hook hero « 4 sur 10 »** — choix éditorial fort, à acter formellement
2. **Question FAQ « comment être sûr que mon équipe l'adopte »** — confirmer son insertion en tarifs ET en landing
3. **Effets de bord changement de slug `solo|equipe|grande` → `po|otm|go`** (cf. section 0) :
   - Vérifier `SignupForm` accepte les 3 nouvelles valeurs
   - Vérifier `tier_to_price_id` map dans `src/lib/stripe/`
   - Vérifier contrainte CHECK sur colonne `subscription_tier` dans table `pharmacies`
   - Faire un `grep -rn "tier=solo\|tier=equipe\|tier=grande"` sur le repo avant la PR

Une fois validé, tu peux copier-coller chaque bloc « Après » directement dans les fichiers indiqués.

---

*Document interne PharmaWorkspace. Référence : RAPPORT-FINAL-92-key-insights.md. Patch direct sur les fichiers PR #53 (skeleton tarifs) et landing existante.*
