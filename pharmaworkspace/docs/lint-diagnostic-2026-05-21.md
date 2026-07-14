# Diagnostic ESLint — 21 mai 2026

> Audit des **66 warnings** retournés par `npm run lint` sur la branche `develop` à date.
> Pas d'erreurs (exit code 0), CI ne bloquera pas. Ce diagnostic sert à prioriser les corrections.

## Verdict global

| Catégorie | Volume | Criticité | Action recommandée |
|---|---|---|---|
| **Vrais bugs hooks** | 2 warnings | 🔴 ÉLEVÉE | Ticket dédié, à faire avant fin Sprint 1 |
| **Hooks deps "stable function"** | 3 warnings | 🟠 MOYENNE | Fix opportuniste, wrap en `useCallback` |
| **Hooks deps "session" ambiguës** | 2 warnings | 🟡 FAIBLE | Documenter intent avec `eslint-disable` + commentaire |
| **Hooks deps "unnecessary"** | 2 warnings | 🟢 COSMÉTIQUE | Fix en 30 sec |
| **Perf `<img>`** | 5 warnings | 🟠 MOYENNE | Fix si LCP > 2,5 s sur PostHog Web Vitals |
| **Dead code / refactor crumbs** | ~10 warnings | 🟠 MOYENNE | Vrai signal, fix avant audit externe |
| **Unused imports cosmétique** | ~40 warnings | 🟢 COSMÉTIQUE | `eslint --fix` automatique |
| **Limitation React Compiler** | 1 warning | ⚪ IGNORABLE | Aucune action |

---

## 🔴 Catégorie 1 — Vrais bugs latents (à fixer en priorité)

### 1.1 `src/components/shared/data-table.tsx:114`
```ts
useLayoutEffect(() => {
  if (!highlightRowId || loading) return;
  const idx = sorted.findIndex((r) => r.id === highlightRowId);  // ← utilise `sorted`
  // ...
}, [highlightRowId, page, loading]);  // ← `sorted` manquant
```

**Pourquoi c'est un bug** : l'effect utilise `sorted` pour trouver la row à highlighter, mais ne re-fire pas quand `sorted` change (tri par colonne par exemple). Conséquence : si un user trie une table puis suit un lien `?highlight=X`, le scroll-to-highlight peut viser le mauvais index.

**Fix** :
```ts
}, [highlightRowId, page, loading, sorted]);
```

**Effort** : 1 min.

---

### 1.2 `src/components/prescriptions/prescription-form.tsx:337`
```ts
const handleSubmit = useCallback(
  async (...) => {
    // utilise: patientRef, status, priority, pharmacy, imageFile,
    //          medicationItems, onCancel, defaultValues, executionDate,
    //          isEditing, onCreated, onSubmit
  },
  [patientRef, status, priority, pharmacy, imageFile, medicationItems, onCancel]  
  // ← manque: defaultValues, executionDate, isEditing, onCreated, onSubmit
);
```

**Pourquoi c'est un bug** : si l'utilisateur ouvre le formulaire en édition (`isEditing=true`, `defaultValues=...`), modifie sans soumettre, puis le parent change ces props (rare mais possible si on garde le drawer ouvert et navigue), le `handleSubmit` capture les anciennes props via closure. Risque de soumettre des données obsolètes.

**Fix** : ajouter toutes les deps manquantes.

**Effort** : 5 min + test manuel du flow édition prescription pour valider que ça ne re-crée pas le callback à chaque keystroke.

---

## 🟠 Catégorie 2 — Hooks deps avec fonction locale stable (false positive technique)

### 2.1 `src/app/(app)/tasks/page.tsx:122, 130, 138`

3 `useMemo` qui appellent `sortByPriority` (fonction de tri locale au composant) :
```ts
const myAssignedTasks = useMemo(
  () => filteredTasks.filter(...).sort(sortByPriority),
  [filteredTasks, profile?.id]  // ← ESLint veut sortByPriority ici
)
```

**Pourquoi c'est borderline** : `sortByPriority` est défini dans le scope du composant, mais c'est une fonction **pure** qui ne ferme que sur `priorityRank` (constante). La fonction est techniquement re-créée à chaque render mais son comportement ne change jamais → pas de risque de bug réel.

**Options de fix** :

**Option A (propre)** : wrap `sortByPriority` en `useCallback` au-dessus :
```ts
const sortByPriority = useCallback((a, b) => {
  const prioDiff = (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99)
  if (prioDiff !== 0) return prioDiff
  const aDate = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER
  const bDate = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER
  return aDate - bDate
}, [])

// Puis dans les useMemo :
[filteredTasks, profile?.id, sortByPriority]
```

**Option B (équivalent)** : sortir `sortByPriority` du composant (constante module-level). Plus propre encore.

**Option C (rapide)** : `// eslint-disable-next-line react-hooks/exhaustive-deps` avec commentaire "sortByPriority is a pure local function, identity changes are irrelevant".

**Recommandation** : Option B (sortir du composant), c'est 30 sec et c'est définitif.

**Effort** : 5 min pour les 3 warnings.

---

## 🟡 Catégorie 3 — Hooks deps "session" (intent ambigu)

### 3.1 `src/contexts/session-context.tsx:149, 239`

```ts
useEffect(() => {
  if (!session) return
  const intervalId = setInterval(() => setNowMs(Date.now()), 1000)
  return () => clearInterval(intervalId)
}, [session?.id])  // ← ESLint veut `session` (l'objet entier)
```

**Pourquoi c'est ambigu** : le code dépend explicitement de `session?.id` (passer d'une session à une autre re-démarre le chronomètre). Si `session` change mais que `session.id` reste le même (ex. un autre champ comme `ended_at` est modifié), tu **ne veux pas** re-démarrer l'interval — c'est intentionnel. Mais ESLint ne comprend pas cette nuance.

**Recommandation** : `eslint-disable` avec commentaire explicite :
```ts
}, [session?.id])
// eslint-disable-next-line react-hooks/exhaustive-deps -- on veut explicitement re-démarrer uniquement quand l'id de session change, pas quand d'autres champs (ended_at, accumulated_minutes) mutent.
```

**Effort** : 2 min pour les 2 occurrences.

---

## 🟢 Catégorie 4 — Hooks deps "unnecessary" (cosmétique)

### 4.1 `src/components/prescriptions/prescription-table.tsx:253`
```ts
const renderMobilePrescriptionCard = useCallback((row) => {
  // ne réfère pas handleQuickProcess
}, [handleQuickProcess])  // ← dep inutile
```

### 4.2 `src/components/shortages/shortage-table.tsx:279`
```ts
const handleQuickResolve = useCallback(async () => {
  // ne réfère pas resolveDrugName
}, [..., resolveDrugName, ...])  // ← dep inutile
```

**Fix** : retirer la dep inutile de l'array.

**Effort** : 1 min pour les 2.

---

## 🟠 Catégorie 5 — Performance `<img>` vs `<Image>`

### 5 warnings dans le module Formation :
- `src/components/formation/training-card.tsx:166`
- `src/components/formation/training-form.tsx:286, 337`
- `src/components/formation/training-upload-recorder.tsx:290`
- `src/components/formation/training-video-player.tsx:186`

**Impact réel** : chaque `<img>` charge l'image au format/taille original, sans lazy loading ni WebP. Sur mobile, le LCP (Largest Contentful Paint, métrique Google Core Web Vitals) peut grimper à 3-5 s sur des photos d'ordonnances ou de matériel médical.

**Quand le fixer** : quand tu activeras Web Vitals via PostHog (déjà coché dans la config wizard) en prod, regarde le LCP des pages `/procedures`, `/training`. Si > 2,5 s → fix. Si < 2,5 s (parce que personne n'utilise vraiment ces pages encore) → laisse traîner.

**Fix générique** :
```tsx
import Image from 'next/image'

// Avant :
<img src={url} alt="Procédure" className="w-full h-48 object-cover" />

// Après :
<Image src={url} alt="Procédure" width={400} height={192} className="w-full h-48 object-cover" />
```

⚠️ Si les images viennent de Supabase Storage, ajouter le domaine dans `next.config.ts` :
```ts
images: {
  remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
},
```

**Effort** : ~30 min pour les 5 sites + config Next.

---

## 🟠 Catégorie 6 — Dead code / refactor crumbs (vrai signal)

### 6.1 `src/components/orders/order-drawer.tsx`
- Lignes 10 : imports `FileUploader`, `AttachmentList` non utilisés.
- Ligne 102 : fonction `handleAudioUpload` définie mais jamais appelée.
- Ligne 114 : fonction `handleAudioDelete` définie mais jamais appelée.
- Ligne 121 : fonction `mapDocToDeleteIndex` définie mais jamais appelée.

**Diagnostic** : c'est du **dead feature code**. Quelqu'un a commencé à implémenter la gestion audio des commandes (avec upload + delete) mais a abandonné en cours de route. Les helpers existent, les boutons UI manquent.

**Action** : 2 options :
1. **Supprimer** le dead code (recommandé pour Sprint 1 — 5 min).
2. **Finir** la feature (audio sur commandes) si c'est vraiment utile — mais ça mérite un ticket dédié, pas un nettoyage.

### 6.2 `src/components/prescriptions/prescription-drawer.tsx`
- 9 warnings d'imports non utilisés : `Input`, `Select*`, `Textarea`, `shortagesService`, `toast`, `NewPrescriptionItem`.

**Diagnostic** : le drawer prescription a été refactoré pour déléguer l'édition à `PrescriptionForm`, mais les anciens imports d'édition inline sont restés. Pas de fonctionnalité manquante, juste du code mort.

**Action** : `eslint --fix` les vire automatiquement. 30 sec.

### 6.3 `src/components/rentals/rental-form.tsx:56`
- `setTotalUnits` est déclaré mais jamais appelé.

**Diagnostic** : `totalUnits` est utilisé en lecture (probablement pour calculer le total facturé) mais ne peut pas être modifié par l'utilisateur. Soit c'est volontaire (calculé automatiquement), soit le champ d'édition manque.

**Action** : **à vérifier avec toi** — est-ce qu'un user devrait pouvoir modifier `total_units` depuis le form de location ? Si oui, c'est un bug fonctionnel à corriger (ajout d'un input). Si non, simplifie en supprimant `setTotalUnits` :
```ts
const totalUnits = defaultValues?.total_units ?? 1
```

### 6.4 Autres warnings de variables/imports non utilisés (~30 fichiers)

Mostly des `'X' is defined but never used` ou `'Y' is assigned a value but never used` dans des composants UI. La majorité = imports restés après refactor.

**Action** : `npx eslint --fix --ext .ts,.tsx src/` enlève tout automatiquement. 5 min avec review du diff.

---

## ⚪ Catégorie 7 — Limitation React Compiler (ignorable)

### `src/app/(app)/annuaire/page.tsx:171`
```ts
const categoryValue = watch('category')  // ← react-hook-form watch()
```

ESLint signale que `watch()` retourne une fonction qui ne peut pas être mémoisée par React Compiler. C'est une **limitation connue** entre react-hook-form et React 19's React Compiler. Le compiler skip la mémoisation pour ce composant — comportement attendu et inoffensif.

**Action** : si ce warning te gêne visuellement, ajoute en tête du fichier :
```ts
/* eslint-disable react-hooks/incompatible-library */
```

Sinon ignore.

---

## Plan d'action recommandé

### Ticket prioritaire (Sprint 1) — **chore/fix-critical-hook-deps** (~20 min)

Tu fixes en 1 PR :
1. `data-table.tsx:114` — ajout `sorted` aux deps.
2. `prescription-form.tsx:337` — ajout des 5 deps manquantes.
3. `prescription-table.tsx:253` — retire `handleQuickProcess` (dep inutile).
4. `shortage-table.tsx:279` — retire `resolveDrugName` (dep inutile).

C'est le minimum vital pour éliminer les vrais risques de bugs.

### Ticket secondaire (Sprint 1 ou 2) — **chore/clean-dead-code-and-imports** (~45 min)

1. `npx eslint --fix --ext .ts,.tsx src/` pour auto-fix les unused imports (la majorité des warnings disparaît).
2. Review du diff (5 min).
3. Décision sur `order-drawer.tsx` audio (supprimer ou finir).
4. Décision sur `rental-form.tsx` totalUnits (ajouter input ou simplifier).
5. Wrap `sortByPriority` dans `tasks/page.tsx` (option B : sortir du composant).
6. Disable les 2 warnings session-context avec commentaires explicites.

### Ticket optionnel (selon LCP PostHog) — **perf/replace-img-with-next-image** (~30 min)

5 sites + config Next images. À faire si Web Vitals montrent un LCP problématique sur les pages Formation.

---

## Après ces 2-3 tickets

Tu devrais passer de **66 warnings → ~5 warnings** (seulement les volontairement ignorés avec commentaire). Tu peux alors :

1. Configurer ESLint pour transformer `react-hooks/exhaustive-deps` en **error** (pas warning) → la CI bloquera les missing deps en PR à l'avenir.

   Dans `.eslintrc` ou `eslint.config.mjs` :
   ```js
   rules: {
     'react-hooks/exhaustive-deps': 'error',
   }
   ```

2. Configurer un **max-warnings** sur `npm run lint` pour la CI :
   ```json
   "lint": "eslint --max-warnings 10"
   ```

   La CI bloque toute PR qui introduit plus de 10 warnings. Tu protèges la dette future.

---

## Coût total

| Ticket | Effort | Priorité |
|---|---|---|
| chore/fix-critical-hook-deps | 20 min | ✅ Sprint 1 |
| chore/clean-dead-code-and-imports | 45 min | ⏰ Sprint 1 ou 2 |
| perf/replace-img-with-next-image | 30 min | ⏸️ Si besoin |
| Config ESLint strict (post-cleanup) | 10 min | 🛡️ Après cleanup |

**Total** : ~1h45 pour une base de code 100 % saine côté lint.
