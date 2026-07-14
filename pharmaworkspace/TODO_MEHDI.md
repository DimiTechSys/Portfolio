# TODO MEHDI — PharmaWorkspace Bêta Sprint 1

> **Pour qui** : Mehdi (founder / lead dev).
> **Comment** : ouvre Claude Code à la racine du repo `pharmaworkspace/`, lis chaque ticket dans l'ordre, copie le prompt suggéré, valide, commit.
> **Principe** : tu gardes pour toi tout ce qui touche **auth, OCR, RLS, données patients, paiement, et juridique**. Ton collègue prend le reste (voir `TODO_DEV.md`).
> **Légende des emojis** : 🔴 = ce ticket attend qu'un ticket du dev soit terminé. Si tu vois 🔴 sur un ticket, tu ne peux pas le démarrer en autonomie.
> Mis à jour : 18 mai 2026.

---

## Setup session Claude Code

À chaque nouvelle session, démarre avec ce prompt système :

```
Tu travailles sur PharmaWorkspace, SaaS B2B pour officines françaises.

Lis d'abord :
1. CLAUDE.md (conventions techniques absolues)
2. BUSINESS_CONTEXT.md (cadrage produit)
3. ROADMAP_BETA.md (plan d'ensemble)
4. TODO_MEHDI.md (mes tickets en cours)

Règles non négociables :
- Pas de refactor prématuré. Trois lignes similaires > une mauvaise abstraction.
- Respecte les conventions §8 de CLAUDE.md (imports, queries, components).
- Ne crée AUCUN fichier de doc supplémentaire sans demande explicite.
- Ne touche AUCUN fichier en dehors du périmètre du ticket.
- Réponds en français, code en anglais.
- À chaque modif : `npm run lint` puis `npm run build` doivent passer.
- Si tu hésites entre deux approches, demande-moi.
```

---

## Conventions Git

- **Modèle de branches** :
  - `main` = prod (auto-deploy Vercel sur ton domaine prod, pilotes dessus).
  - `develop` = staging (auto-deploy Vercel sur preview URL staging).
  - Tu branches tes propres tickets depuis `develop` (genre `feat/p1-04-switch-ocr-mistral`), tu PR sur `develop`.
  - Tu promeus `develop` → `main` toi-même quand un batch est prêt (cf. `COORDINATION.md` §0).
- **Une branche par ticket** : `feat/p1-01-ocr-auth`, `fix/p1-02-ocr-logs`, etc.
- **Commit message** : `[P1-01] ajoute auth sur /api/ocr`.
- **Avant de pusher** : `npm run lint && npm run build` (les deux doivent être verts).
- **Migration SQL** : numérotée selon l'allocation dans `COORDINATION.md` §5 (toi : 0029, 0030, 0032, 0033, 0034, 0035).

---

## Ordre d'exécution recommandé Sprint 1 (2 semaines)

Tickets critiques à enchaîner dans cet ordre exact :

1. ✅ **P1-02** — Nettoyer console.log OCR (mergé)
2. ✅ **P1-03** — Nettoyer console.log invitations (mergé)
3. ✅ **P1-01** — Auth + rate limit sur /api/ocr (mergé)
4. **🚨 TECH-01** — Fix bug UX prolongement location (15 min — **À FAIRE TOUT DE SUITE**, vrai bug fonctionnel détecté lors du diagnostic lint)
5. **P1-04** — Switch OCR vers Mistral (½j — déjà réécrit pour Mistral, plus de masking patient)
6. **P1-06** 🔴 — Signed URLs (attend que dev finisse P1-05)
7. **P1-07** 🔴 — Migration paths (attend P1-06)
8. **P1-08** — Hash tokens invitations (½j)

Tickets tech debt (à interleaver entre les P1, quand tu as 30 min) :
- **TECH-02** — Fix React hook missing deps (20 min — 2 vrais bugs latents)
- **TECH-03** — Cleanup dead code + unused imports (45 min — environ 50 warnings d'un coup)
- **TECH-04** — `<img>` → `<Image>` Formation module (30 min, optionnel selon LCP PostHog)
- **TECH-05** — Migrer Realtime onboarding/waiting vers broadcast côté serveur (~2-3h, optionnel — déclencheur : > 1K invités simultanés ou ajout de colonnes sensibles à `pharmacies`)

Ensuite tu attaques **P3** (juridique, en parallèle) et **P2-07 / P2-08** (RLS perf + Auth Hooks).

---

# TICKETS DÉTAILLÉS

---

## P1-02 — Nettoyer les console.log dans /api/ocr

### Pourquoi ce ticket
Aujourd'hui, chaque ordonnance scannée crache le **nom du patient et la liste de ses médicaments** dans des logs hébergés aux États-Unis (Vercel). C'est une fuite de données médicales — à la fois une violation RGPD et un risque concret si quelqu'un compromet ton compte Vercel. C'est le premier geste de mise en conformité, il prend 30 minutes et te coûte rien.

**Branche** : `fix/p1-02-ocr-logs`
**Estimation** : 30 min
**Risque** : nul (suppression de logs).

### Fichiers à modifier
- `src/app/api/ocr/route.ts` (uniquement)

### À faire
1. Ligne 124 : remplacer `console.log('[OCR][Ollama] raw:', ollamaResponse.response)` par `console.log('[OCR][Ollama] ok', { length: raw.length })`.
2. Ligne 152 : remplacer `console.log('[OCR][OpenAI] starting call, key present:', !!process.env.OPENAI_API_KEY)` par `console.log('[OCR][OpenAI] start', { has_key: !!process.env.OPENAI_API_KEY })`.
3. Ligne 194 : supprimer `console.log('[OCR][OpenAI] raw content:', content)`.
4. Ligne 204 : `console.error('[OCR][OpenAI] error:', error)` → conserver mais s'assurer que `error` ne contient pas l'image (`error?.message` au pire).

### Ne PAS toucher
- Le prompt OCR.
- La structure de `normalizeResult`.
- Les normalizers `normalizeMedicationItem`.

### Acceptance
- [ ] `grep -n "raw:" src/app/api/ocr/route.ts` → 0 résultat sur du contenu OCR.
- [ ] `grep -n "content" src/app/api/ocr/route.ts` dans les `console.log` → 0 résultat.
- [ ] `npm run lint && npm run build` passent.

### Prompt Claude Code
```
Lis CLAUDE.md, puis src/app/api/ocr/route.ts.

Objectif : supprimer toute fuite PII dans les console.log du fichier OCR.
Voir TODO_MEHDI.md ticket P1-02 pour les lignes exactes.

Contraintes :
- Ne touche QUE src/app/api/ocr/route.ts.
- Conserve la logique métier intacte.
- À la fin : npm run lint && npm run build.

Montre-moi le diff avant de commit.
```

---

## P1-03 — Nettoyer le console.log du token invitation

### Pourquoi ce ticket
Quand quelqu'un crée une invitation pour un collaborateur, le code log actuellement **le token UUID complet + l'email du destinataire** dans les logs Vercel. N'importe qui qui accède à tes logs (ton équipe, mais aussi en cas de compromission de ton compte Vercel) peut **intercepter l'invitation** et créer un compte à la place du collaborateur, prenant ainsi un siège dans la pharmacie. Pareil que P1-02 : on nettoie en 30 minutes.

**Branche** : `fix/p1-03-invite-logs`
**Estimation** : 30 min
**Risque** : nul.

### Fichiers à modifier
- `src/app/api/invitations/create-native/route.ts`
- `src/app/api/auth/callback/route.ts` (vérifier aussi)

### À faire
1. Remplacer le `console.log('[invitations/create-native] Invite link context', { ... invitationToken: String(invitation.token), ... })` lignes 125-133 par un log court : `console.log('[invitations/create-native] invite_created', { pharmacy_id: profile.pharmacy_id, role })`. **Ne plus logger le token ni l'email destinataire.**
2. Idem ligne 147 : `console.log('[invitations/create-native] invite_sent', { role })`.
3. Idem ligne 237-240 : enlever `inviteeEmail` du log.
4. Dans `auth/callback/route.ts` : vérifier qu'aucun `console.log` n'expose `invitationToken` ni email. Si oui, retirer.

### Ne PAS toucher
- La logique d'invitation elle-même.
- Les retours JSON.

### Acceptance
- [ ] `grep -n "invitationToken\|invitation.token\|inviteeEmail" src/app/api/invitations/ src/app/api/auth/` → uniquement dans la logique métier, jamais dans un `console.log`.

### Prompt Claude Code
```
Lis CLAUDE.md, puis :
- src/app/api/invitations/create-native/route.ts
- src/app/api/auth/callback/route.ts

Objectif : supprimer toute donnée sensible (email destinataire, token invitation) des console.log de ces deux fichiers.

Voir TODO_MEHDI.md ticket P1-03 pour les lignes concernées.

Contraintes : ne change AUCUNE logique métier. Seuls les console.log changent.

Montre-moi le diff. Lance npm run lint && npm run build.
```

---

## P1-01 — Auth + rate limit sur /api/ocr

### Pourquoi ce ticket
L'endpoint qui fait l'OCR (le scan d'ordonnance) est aujourd'hui **complètement ouvert** : n'importe qui sur internet peut envoyer des requêtes dessus sans être connecté. Conséquences concrètes : (a) quelqu'un peut bombarder ton serveur pendant la nuit et te faire **une facture OpenAI à 4 chiffres** d'ici le matin ; (b) un script kiddie peut tester ton OCR sur ses propres images et abuser de ton compte. On ferme la porte (auth obligatoire), on limite le débit (10 scans/min/pharmacie) — un coût classique pour ne pas se faire vider la caisse.

**Branche** : `feat/p1-01-ocr-auth-ratelimit`
**Estimation** : 1 jour
**Risque** : moyen (route critique, peut casser le scan d'ordonnance).
**Prerequisites** : P1-02 mergée.

### Fichiers à modifier
- `src/app/api/ocr/route.ts`
- Nouveau : `src/lib/rate-limit/upstash.ts`

### Stack à ajouter
**Upstash Redis** = service Redis serverless gratuit (10 000 commandes/jour gratuites, suffisant pour bêta).
1. Crée un compte sur https://upstash.com (gratuit).
2. Crée une "Redis database" région **eu-west-1** (Irlande, données UE — important pour RGPD).
3. Récupère `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, ajoute-les dans `.env.local` et dans Vercel env vars.
4. `npm i @upstash/ratelimit @upstash/redis`.

### À faire
1. Créer `src/lib/rate-limit/upstash.ts` :
```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ocrRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'rl:ocr',
})
```
2. Dans `src/app/api/ocr/route.ts`, en tête du handler POST :
```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json(
    { success: false, patient_name: null, items: [], error: 'unauthorized' },
    { status: 401 }
  )
}
const { data: profile } = await supabase
  .from('profiles')
  .select('pharmacy_id')
  .eq('id', user.id)
  .maybeSingle()
if (!profile?.pharmacy_id) {
  return NextResponse.json(
    { success: false, patient_name: null, items: [], error: 'no_pharmacy' },
    { status: 403 }
  )
}
const { success } = await ocrRateLimit.limit(profile.pharmacy_id)
if (!success) {
  return NextResponse.json(
    { success: false, patient_name: null, items: [], error: 'rate_limited' },
    { status: 429 }
  )
}
```

### Ne PAS toucher
- La logique d'extraction OCR (callOpenAI, runOllama).
- Les normalizers.

### Acceptance
- [ ] `curl -X POST https://localhost:3000/api/ocr -F image=@test.jpg` sans cookie → 401.
- [ ] Avec cookie valide, 10 requêtes en 1 min OK, 11e → 429.
- [ ] Test manuel scan ordonnance dans l'UI fonctionne toujours.

### Prompt Claude Code
```
Lis CLAUDE.md, BUSINESS_CONTEXT.md (§3 ligne OCR), et src/app/api/ocr/route.ts.

Objectif (TODO_MEHDI.md P1-01) : ajouter auth + rate limit sur /api/ocr.

Étapes :
1. npm i @upstash/ratelimit @upstash/redis
2. Crée src/lib/rate-limit/upstash.ts avec un Ratelimit slidingWindow(10, "1 m") avec prefix "rl:ocr".
3. Dans le handler POST de /api/ocr, au TOUT DÉBUT (après try{) :
   - getUser() via createClient @/lib/supabase/server
   - 401 si pas user
   - Récupère pharmacy_id du profil
   - 403 si pas de pharmacy_id
   - ocrRateLimit.limit(pharmacy_id) → 429 si !success
4. Conserve TOUTE la logique d'extraction OCR existante intacte.

Ne touche AUCUN autre fichier. Montre-moi le diff avant commit.
npm run lint && npm run build doivent passer.
```

---

## P1-04 — Switch OCR vers Mistral (provider EU) + retrait dépendance OpenAI

### Pourquoi ce ticket
**Le seul moyen propre de sortir du transfert de données de santé hors UE.** Aujourd'hui, quand un préparateur scanne une ordonnance, l'image (qui contient typiquement le nom du patient + ses médicaments) transite vers les serveurs **OpenAI aux États-Unis**. Au sens RGPD c'est un **transfert international de données de santé identifiantes** — bloqueur juridique pointé dans l'audit du 18/05/2026 et qu'aucun pilote pharmacien sérieux n'acceptera dans son DPA.

**Solution** : on switche vers **Mistral AI** (Paris, GDPR-native, serveurs OVHcloud France). Le modèle Pixtral est compétitif avec GPT-4o-mini pour l'OCR d'ordonnances françaises (souvent meilleur sur le français natif). **Aucune donnée ne quitte l'UE.**

**Trade-off honnête** : ce ticket règle la couche "transfert OCR" (couche 1), mais **pas la couche "stockage"** — le nom patient continuera d'être stocké dans Supabase Paris non-HDS. Acceptable pendant la bêta privée (≤ 30 pilotes, DPA explicite, contractuel) ; à reconsidérer pour la suite. Voir le doc `legal/decision-hds.md` à rédiger dans P3-07.

**Branche** : `feat/p1-04-switch-ocr-mistral`
**Estimation** : ½ jour
**Risque** : moyen (touche le coeur du parcours ordonnance, mais le code a déjà un stub `mistral` qui facilite le switch).
**Prerequisites** : P1-01 mergée ✅ (auth + rate limit sur /api/ocr — ne dépend pas du provider, donc on locks down la route avant de changer ce qui passe dedans).

### Contexte technique
Le fichier `src/app/api/ocr/route.ts` a déjà une fonction `runMistral()` qui est un **stub `notConfigured`**. On l'implémente sur le modèle de `callOpenAI()` en pointant l'API Mistral.

- **Modèle Mistral** : `pixtral-12b-2409` (vision LLM, OCR).
- **API endpoint** : `https://api.mistral.ai/v1/chat/completions` (compatible OpenAI-style payload).
- **Région** : EU (servers Mistral en France, OVHcloud).
- **Pricing** : ~0,15 €/M input tokens, plan gratuit 500 req/jour suffisant pour la bêta.

### Setup compte Mistral (10 min)

1. https://console.mistral.ai → Sign up (OAuth GitHub ou email).
2. **Workspace settings** → confirme la région **EU** (par défaut, mais vérifie).
3. **API Keys** → **Create new key** → nomme-la `pharmaworkspace-prod`. Copie-la.
4. (Optionnel mais recommandé) Crée une 2ᵉ clé `pharmaworkspace-staging` plafonnée — Settings → Limits → set monthly limit à 5 €.
5. Vercel → Environment Variables :
   - Ajoute `MISTRAL_API_KEY` pour **Production** = clé prod.
   - Ajoute `MISTRAL_API_KEY` pour **Preview** = clé staging.
   - Modifie `OCR_PROVIDER` → passe de `openai` à `mistral` pour Production ET Preview.
6. Ajoute aussi dans ton `.env.local` (et envoie le nouveau `.env` staging à ton dev).

### Fichiers à modifier
- `src/app/api/ocr/route.ts` (implémenter `callMistral`, ajouter dispatch, retirer dépendance OpenAI optionnelle).
- `.env.local` (côté toi), `.env.example` si tu en as un.
- `package.json` : retirer la dep `openai` si on ne s'en sert plus (économise un sous-traitant US dans ton DPA).

### À faire — étape par étape

**Étape 1 : implémenter `callMistral`**

Dans `src/app/api/ocr/route.ts`, remplacer le stub `runMistral` par :

```ts
async function callMistral(base64: string, mimeType: string): Promise<OcrResult> {
  if (!process.env.MISTRAL_API_KEY) {
    return { success: false, patient_name: null, items: [], error: 'provider_not_configured' }
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: `data:${mimeType};base64,${base64}` },
            { type: 'text', text: OCR_PROMPT },
          ],
        }],
      }),
    })

    if (!response.ok) {
      return { success: false, patient_name: null, items: [], error: 'extraction_failed' }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, patient_name: null, items: [], error: 'extraction_failed' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    return normalizeResult(parsed, content)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    console.error('[OCR][Mistral] error', { message })
    return { success: false, patient_name: null, items: [], error: 'extraction_failed' }
  }
}
```

**Étape 2 : dispatcher**

Dans le handler `POST`, remplacer le bloc :
```ts
} else if (provider === 'claude') {
  result = await runClaude()
} else {
  result = await runMistral()  // était un stub
}
```
Par :
```ts
} else if (provider === 'mistral') {
  result = await callMistral(base64, mimeType)
} else if (provider === 'claude') {
  result = await runClaude()
} else {
  result = await runOllama(base64)  // fallback dev local
}
```

**Étape 3 : retirer la dep OpenAI (optionnel mais propre)**

Si tu ne veux plus du tout d'OpenAI dans le projet :
1. Retire `import OpenAI from 'openai'` en haut de `route.ts`.
2. Retire la fonction `callOpenAI` entière (ou commente-la pour fallback futur).
3. `npm uninstall openai`.
4. Retire `OPENAI_API_KEY` de Vercel Env Vars (Production + Preview).
5. Retire la mention OpenAI de ton futur DPA et registre art. 30 (P3-03, P3-05, P3-06).

**Si tu préfères garder OpenAI en backup au cas où** : laisse le code en place, juste passe `OCR_PROVIDER=mistral` par défaut. Tu peux switcher si Mistral plante.

### Tests manuels obligatoires
- [ ] Scanner **5 ordonnances types** différentes (génériques, longue ordonnance, photo floue, ordonnance manuscrite, ordonnance imprimée).
- [ ] Pour chaque, vérifier dans DevTools → Network :
  - Aucune requête sortante vers `api.openai.com`.
  - Une requête vers `api.mistral.ai/v1/chat/completions`.
- [ ] La réponse Mistral est aussi pertinente qu'OpenAI sur les médicaments (compare 2-3 cas avant/après si tu peux).
- [ ] Le formulaire prescription se remplit correctement avec patient_name + items.

### Ne PAS toucher
- La logique `normalizeResult` et `normalizeMedicationItem` (parsing standard quel que soit le provider).
- Le prompt `OCR_PROMPT` (déjà bien rodé sur français, change pas).
- La structure DB `prescriptions` ni les types.

### Acceptance
- [ ] `OCR_PROVIDER=mistral` dans Vercel Production et Preview.
- [ ] `MISTRAL_API_KEY` configurée (2 clés idéalement : prod + staging plafonnée).
- [ ] `callMistral` implémentée et testée sur 5 ordonnances réelles.
- [ ] Réponse OCR équivalente en qualité à l'ancien OpenAI (acceptance subjective — si Mistral est nettement moins bon, rollback `OCR_PROVIDER=openai`).
- [ ] Aucune requête vers `api.openai.com` lors d'un scan d'ordonnance.
- [ ] `npm run lint && npm run build` verts.

### Note pour la suite — décision masking patient

Le masking patient (l'ancienne approche P1-04 via cropper UI) est **non implémenté** dans ce ticket. Conséquences :
- ✅ Plus de transfert hors UE (couche 1 réglée).
- ⚠️ Le nom patient est toujours **stocké dans Supabase Paris (non-HDS)** — zone grise juridique tolérable en bêta privée (≤ 30 officines + DPA explicite).
- ⚠️ Risque à reconsidérer le jour où tu :
  - Passes au-delà de 30 officines actives.
  - Souhaites lever des fonds (un investisseur va auditer).
  - Vises un partenariat groupement (ils auditeront aussi).

**Si à un moment tu décides de re-attaquer le masking patient** : crée un nouveau ticket `P1-09 — Crop UI patient masking` qui implémente la stratégie cropper. Mais ne le fais pas maintenant, ça t'économise 2-3 jours pour aller plus vite sur la bêta.

### Prompt Claude Code
```
Lis CLAUDE.md, BUSINESS_CONTEXT.md (§3 ligne OCR + §9 R7 risque RGPD), TODO_MEHDI.md P1-04, et src/app/api/ocr/route.ts.

Objectif : remplacer le provider OCR OpenAI (US) par Mistral AI (EU, GDPR-native) pour éliminer le transfert international de données de santé.

Avant de coder, confirme-moi :
1. La fonction runMistral() actuelle est bien un stub `notConfigured`.
2. La structure de callOpenAI() que tu vas reproduire pour callMistral().
3. La variable d'env MISTRAL_API_KEY doit être ajoutée dans .env.local + Vercel (je m'en occupe en parallèle).

Une fois validé, on fait étape par étape :
1. Implémenter callMistral() avec fetch vers api.mistral.ai (modèle pixtral-12b-2409, payload chat completion OpenAI-style).
2. Brancher le dispatch dans le handler POST.
3. (Optionnel) Retirer la dépendance OpenAI : import, callOpenAI(), package.json — confirme avec moi avant.

Pour chaque étape : diff, je valide, on commit.

Contraintes :
- Ne touche QUE src/app/api/ocr/route.ts (et package.json si on retire openai).
- Conserve la logique normalizeResult / normalizeMedicationItem intacte.
- Le prompt OCR_PROMPT reste identique.
- À la fin : npm run lint && npm run build verts.
```

---

## 🔴 P1-06 — Refactor uploads vers createSignedUrl

### Pourquoi ce ticket
Une fois que ton dev a fermé les buckets de stockage (P1-05 côté dev), **tous les fichiers de l'app deviennent inaccessibles par leur URL publique** : pièces jointes des tâches, mémos vocaux, images d'ordonnances, vidéos de formation. Tu dois refactorer le code qui affiche ces fichiers pour qu'il **génère à la volée une URL signée temporaire** (valide 1h) au moment où le user demande à voir le fichier. **C'est urgent** : entre le moment où ton dev merge P1-05 et le moment où tu finis P1-06, l'app est cassée pour l'affichage des fichiers. D'où la coordination obligatoire — pas de merge le vendredi soir sans un samedi de dispo derrière.

**Branche** : `refactor/p1-06-signed-urls`
**Estimation** : 1 jour
**Risque** : moyen (touche tous les uploads attachments).
**🔴 Prerequisites** : **P1-05 (côté dev) mergée**. Tu ne peux pas démarrer ce ticket avant.

### Fichiers à modifier
- `src/lib/storage/upload-attachment.ts`
- `src/lib/queries/training.ts` (ligne 140)
- `src/features/prescriptions/services/prescriptions.service.ts` (ligne 48, ligne 55 déjà signed)
- `src/components/shared/audio-recorder.tsx` (ligne 112)
- `src/components/shared/file-uploader.tsx` (si refactor nécessaire)
- Composants qui affichent les attachments (à identifier via grep `attachment.url`)

### À faire
1. **Décide du modèle de stockage** : tu as deux options :
   - **Option A (simple)** : tu stockes le `path` (pas l'URL) dans la jsonb `attachments`. À l'affichage, tu re-signes via `createSignedUrl`. Avantage : pas d'URL périmée en base. Inconvénient : refactor de tous les composants d'affichage.
   - **Option B (rapide)** : tu stockes une URL signée 7 jours dans la jsonb. Tu rafraîchis quand le `Date.now()` dépasse `expires_at`. Avantage : moins de refactor. Inconvénient : URLs périmées si pas accédées depuis 7j.
   
   **Recommandation : Option A** — c'est plus robuste, ça vaut la journée d'effort.

2. **Refactor `Attachment` type** dans `src/components/shared/file-uploader.tsx` :
   ```ts
   export type Attachment = {
     path: string   // ex: "{pharmacy_id}/tasks/123/file.pdf"
     name: string
     type: 'image' | 'document'
   }
   ```
3. **Dans `uploadAttachmentFile`** : retire `getPublicUrl`, retourne juste `{ path, name, type }`.
4. **Ajoute un helper** `src/lib/storage/get-signed-url.ts` :
   ```ts
   export async function getSignedAttachmentUrl(path: string): Promise<string | null> {
     const supabase = createClient()
     const { data, error } = await supabase.storage
       .from('attachments')
       .createSignedUrl(path, 3600)
     if (error || !data) return null
     return data.signedUrl
   }
   ```
5. **Dans les composants d'affichage** (TaskDrawer, OrderDrawer, etc.) : remplacer `<img src={attachment.url} />` par un composant qui résout l'URL à l'affichage via React Query (cache 50 min, < 1h pour éviter d'expirer).

### Ne PAS toucher
- Les migrations SQL (déjà gérées par P1-05 côté dev).
- La structure des données existantes (P1-07 fera la migration de paths).

### Acceptance
- [ ] Aucun appel à `.getPublicUrl(` dans tout `src/` (sauf si c'est intentionnel pour un asset public).
- [ ] Upload d'une pièce jointe sur une tâche → affichage fonctionne.
- [ ] Test croisé : un user de la pharmacie A ne peut pas accéder à un fichier de la pharmacie B (URL signée valide uniquement avec un user authentifié dans la bonne pharmacie).

### Prompt Claude Code
```
Lis CLAUDE.md et TODO_MEHDI.md P1-06.

Contexte : les buckets storage viennent de passer en privé (P1-05 mergée par le collègue). Tous les getPublicUrl ne marchent plus.

Objectif : basculer sur Option A (stocker path, re-signer à l'affichage).

Avant de coder, fais l'inventaire :
1. Liste tous les fichiers qui appellent .getPublicUrl( ou qui consomment attachment.url.
2. Propose un plan en 4 étapes : (a) helper get-signed-url.ts, (b) refactor Attachment type, (c) refactor uploadAttachmentFile, (d) refactor composants d'affichage.

Je valide le plan, puis on fait étape par étape avec diff à chaque fois.
```

---

## 🔴 P1-07 — Migration des chemins attachments existants

### Pourquoi ce ticket
Les fichiers que vos utilisateurs ont déjà uploadés **avant** la migration P1-05 ont peut-être des chemins de stockage qui ne respectent pas le nouveau format de cloisonnement par `pharmacy_id`. Conséquence : ces fichiers historiques deviennent inaccessibles aux utilisateurs (les policies ne matchent pas). Un petit script qui balaie l'existant, déplace les fichiers vers le bon préfixe et met à jour les références en base. **Sans ce ticket, ton premier pilote perd l'accès à toutes les pièces jointes qu'il avait avant.**

**Branche** : `chore/p1-07-migrate-attachment-paths`
**Estimation** : ½ jour
**Risque** : élevé (data migration).
**🔴 Prerequisites** : **P1-06 mergée**.

### À faire
1. **Audit préalable** :
   ```sql
   SELECT id, pharmacy_id, attachments
   FROM public.tasks
   WHERE attachments::text NOT LIKE '%' || pharmacy_id::text || '%'
     AND jsonb_array_length(attachments) > 0;
   ```
   Idem pour `orders.attachments`. Si 0 résultat partout : skip ce ticket, t'es déjà clean.
2. **Si résultats** : script Node `scripts/migrate-attachment-paths.ts` qui :
   - Liste les rows à migrer.
   - Pour chaque attachment, `supabase.storage.from('attachments').move(oldPath, newPath)`.
   - Update la jsonb avec les nouveaux paths.
3. **Backup** : fais un dump Supabase AVANT (`supabase db dump > backup-pre-p1-07.sql`).

### Acceptance
- [ ] Aucun attachment orphelin (la query d'audit retourne 0).
- [ ] Test manuel : ouvrir 3 tâches/commandes anciennes → les pièces jointes s'affichent.


### Prompt Claude Code
```
Ticket P1-07 — Migration paths attachments.

D'abord : exécute la query d'audit (TODO_MEHDI.md P1-07 étape 1) via Supabase MCP ou en me la donnant à exécuter.

Si 0 résultat : skip et marque le ticket terminé.

Sinon : écris scripts/migrate-attachment-paths.ts qui fait le move + update jsonb. Avant de l'exécuter, fais-moi un dry-run qui PRINT ce qu'il aurait fait, sans rien modifier. Je valide, on lance.
```

---

## P1-08 — Hash SHA-256 des tokens invitation

### Pourquoi ce ticket
**Ceinture-bretelles sécurité.** Les tokens d'invitation sont stockés en clair en base. Si un jour ta base fuite (backup mal protégé, bug Supabase, erreur d'admin), les invitations encore valides peuvent être utilisées par un attaquant pour rejoindre une pharmacie qui ne l'a pas invité. En stockant le **hash SHA-256** du token au lieu du clair, même une fuite de la table `invitations` ne donne **aucune information exploitable**. Le clair reste uniquement dans l'email du destinataire, c'est suffisant. C'est une bonne pratique standard, pas une exigence absolue, mais ça coûte ½ journée pour fermer définitivement un vecteur d'attaque.

**Branche** : `feat/p1-08-hash-invite-tokens`
**Estimation** : ½ jour
**Risque** : moyen (touche le flow d'invitation).
**Prerequisites** : P1-03 mergée.

### À faire
1. **Migration `0028_invitations_token_hash.sql`** :
   ```sql
   ALTER TABLE public.invitations
     ADD COLUMN IF NOT EXISTS token_hash text;
   
   UPDATE public.invitations
     SET token_hash = encode(digest(token::text, 'sha256'), 'hex')
     WHERE token_hash IS NULL;
   
   ALTER TABLE public.invitations
     ALTER COLUMN token_hash SET NOT NULL;
   
   CREATE INDEX IF NOT EXISTS invitations_token_hash_idx
     ON public.invitations (token_hash);
   ```
   Note : nécessite l'extension `pgcrypto` (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`).

2. **Dans `src/app/api/invitations/create-native/route.ts`** : après création de l'invitation, hasher le token côté code Node (`crypto.createHash('sha256').update(token).digest('hex')`) et update la row. Ou utiliser un trigger SQL au lieu.

3. **Dans `src/app/api/invite/complete/route.ts`** : remplacer `.eq('token', token)` par `.eq('token_hash', sha256(token))`.

4. **Phase de transition** : garder la colonne `token` jusqu'à expiration des invitations en cours (30 jours), puis migration `0029` qui DROP la colonne `token`.

### Ne PAS toucher
- Le format d'invitation dans le mail Supabase (le token clair part toujours dans l'email, c'est normal).
- L'expiration des invitations.

### Acceptance
- [ ] `SELECT token_hash FROM invitations LIMIT 1` retourne un hash hex de 64 chars.
- [ ] Flux d'invitation E2E fonctionne (créer invite → recevoir email → accepter → finalisation).

### Prompt Claude Code
```
Lis TODO_MEHDI.md P1-08 et CLAUDE.md §7 (schema invitations).

Plan en 4 étapes :
1. Migration 0028 (ajout colonne token_hash + index, requires pgcrypto).
2. Helper src/lib/invite/hash-token.ts (Node crypto.createHash sha256).
3. Modif create-native pour hasher après création.
4. Modif invite/complete pour matcher sur token_hash.

Garde la colonne `token` clair pour 30j (migration de transition).

Diff par étape, je valide à chaque fois.
```

---

# TICKETS TECH DEBT (issus du diagnostic lint du 21/05/2026)

Cf. `docs/lint-diagnostic-2026-05-21.md` pour le diagnostic complet des 66 warnings.

---

## 🚨 TECH-01 — Fix bug UX prolongement location (rental form)

### Pourquoi ce ticket
**Vrai bug fonctionnel découvert lors du diagnostic lint.** Quand un titulaire édite une location existante et change la date `expected_return` pour la prolonger, le compteur affiché à l'écran `{paid_units} / {total_units}` reste figé sur la valeur initiale (snapshot DB au moment de l'ouverture du drawer). Conséquence : si la location passe de 2 → 3 semaines et que `paid_units` est déjà à 2, le bouton "+" pour incrémenter le paiement reste désactivé tant que le user ne save pas + ne rouvre pas le drawer. Mauvaise UX, exactement le genre de bug qu'un pilote te signalera dans 3 semaines avec "le prolongement bugue".

**Cause racine** : `totalUnits` est un `useState` initialisé au mount avec `defaultValues?.total_units`, jamais mis à jour quand `expectedReturn` ou `billingType` change. Le `setTotalUnits` est déclaré mais jamais appelé (d'où le warning lint `setTotalUnits is assigned a value but never used`).

**Fix** : transformer `totalUnits` en valeur dérivée, calculée à chaque render à partir des dates + billing_type.

**Branche** : `fix/tech-01-rental-totalunits-derived`
**Estimation** : 15 min
**Risque** : faible (1 composant, 1 modif locale, test manuel rapide).

### Fichiers à modifier
- `src/components/rentals/rental-form.tsx` (uniquement)

### À faire
1. **Supprimer** la ligne 56 :
   ```ts
   const [totalUnits, setTotalUnits] = useState(defaultValues?.total_units ?? 1)
   ```
2. **Remplacer** par une valeur dérivée (à mettre juste après `dailyRate` ou avant `notes`) :
   ```ts
   const totalUnits = expectedReturn
     ? calculateTotalUnits(
         isEdit ? defaultValues!.started_at : new Date().toISOString().split('T')[0],
         expectedReturn,
         billingType
       )
     : (defaultValues?.total_units ?? 1)
   ```
3. **Vérifier** que `calculateTotalUnits` est défini avant cette ligne (regarde l'ordre du code, déplace si besoin).
4. **Ne PAS toucher** au `handleSubmit` — il continue d'utiliser `calculateTotalUnits(...)` directement dans le payload, c'est déjà bon.

### Test manuel obligatoire
- [ ] Créer une location 7 jours avec billing weekly → vérifier que le compteur affiche `0 / 1` à la création.
- [ ] Éditer la location, prolonger à 14 jours → vérifier que le compteur passe instantanément à `0 / 2` (avant de save).
- [ ] Tester avec billing daily : 5 jours → `0/5`, prolongement à 10 → `0/10`.
- [ ] Sauvegarder, rouvrir le drawer → la nouvelle valeur est bien persistée en DB.

### Acceptance
- [ ] `npm run lint` ne montre plus `setTotalUnits is assigned a value but never used` ni `totalUnits` warning.
- [ ] `npm run typecheck && npm run build` verts.
- [ ] Test manuel des 4 scénarios ci-dessus OK.

### Prompt Claude Code
```
Lis docs/lint-diagnostic-2026-05-21.md catégorie 6.3 et TODO_MEHDI.md TECH-01 pour le contexte complet.

Le fichier à modifier : src/components/rentals/rental-form.tsx

Objectif : transformer la variable d'état totalUnits en valeur dérivée pour fixer un bug UX (compteur stale en mode édition prolongement de location).

À faire :
1. Supprimer ligne 56 : const [totalUnits, setTotalUnits] = useState(...)
2. Ajouter au même endroit (ou juste après les autres useState) : const totalUnits = expectedReturn ? calculateTotalUnits(...) : (defaultValues?.total_units ?? 1)
3. Vérifier que la fonction calculateTotalUnits (définie ligne ~76) est accessible avant la nouvelle ligne. Si non, la déplacer plus haut.

Contraintes :
- Ne touche QUE rental-form.tsx.
- Conserve calculateTotalUnits dans handleSubmit (lignes 114, 135).
- À la fin : npm run lint (doit virer les 2 warnings totalUnits) + npm run build (vert).

Montre-moi le diff avant commit.
```

---

## TECH-02 — Fix React hook missing dependencies

### Pourquoi ce ticket
Le diagnostic lint a identifié **2 vrais bugs latents** où des hooks React ne re-fire pas correctement quand une dépendance change. Symptôme classique : UI obsolète sans erreur visible. Le genre de bug pénible à reproduire mais frustrant pour les pilotes.

**Branche** : `fix/tech-02-hook-deps`
**Estimation** : 20 min
**Risque** : faible (4 modifs localisées).

### Fichiers à modifier
- `src/components/shared/data-table.tsx`
- `src/components/prescriptions/prescription-form.tsx`
- `src/components/prescriptions/prescription-table.tsx`
- `src/components/shortages/shortage-table.tsx`

### À faire

1. **`data-table.tsx:114`** — ajouter `sorted` aux deps du `useLayoutEffect` :
   ```ts
   }, [highlightRowId, page, loading, sorted]);
   ```
   Sans ça, si l'utilisateur trie une table puis suit un lien `?highlight=X`, le scroll-to-row vise le mauvais index.

2. **`prescription-form.tsx:337`** — ajouter les 5 deps manquantes au `useCallback` du `handleSubmit` :
   ```ts
   [
     patientRef, status, priority, pharmacy, imageFile, medicationItems,
     onCancel,
     defaultValues, executionDate, isEditing, onCreated, onSubmit  // ← ajouter ces 5
   ]
   ```
   Sans ça, closure stale possible en mode édition prescription si le parent change les props sans unmount.

3. **`prescription-table.tsx:253`** — retirer la dep inutile :
   ```ts
   }, [/* sans handleQuickProcess */])
   ```
   Le callback ne réfère pas `handleQuickProcess`, dep inutile.

4. **`shortage-table.tsx:279`** — retirer la dep inutile `resolveDrugName` du `useCallback`. Le callback ne l'utilise pas.

### Test manuel
- [ ] Trier une table avec highlight → vérifier que le scroll vise la bonne row.
- [ ] Éditer une prescription, naviguer dans le drawer, soumettre → données cohérentes avec l'état actuel.

### Acceptance
- [ ] `npm run lint` → 4 warnings hooks/exhaustive-deps en moins (passe de ~9 à ~5).
- [ ] `npm run build` vert.

### Prompt Claude Code
```
Lis docs/lint-diagnostic-2026-05-21.md catégorie 1 (vrais bugs) et 4 (cosmétique deps) et TODO_MEHDI.md TECH-02.

4 fichiers à modifier dans l'ordre :
1. src/components/shared/data-table.tsx ligne 114 — ajouter `sorted` aux deps
2. src/components/prescriptions/prescription-form.tsx ligne 337 — ajouter 5 deps manquantes (defaultValues, executionDate, isEditing, onCreated, onSubmit)
3. src/components/prescriptions/prescription-table.tsx ligne 253 — retirer handleQuickProcess (dep inutile)
4. src/components/shortages/shortage-table.tsx ligne 279 — retirer resolveDrugName (dep inutile)

Contraintes :
- Ne touche QUE ces 4 fichiers.
- Conserve la logique des callbacks/effects intacte.
- npm run lint doit montrer 4 warnings en moins.
- npm run build vert.

Diff par fichier, je valide chacun avant commit.
```

---

## TECH-03 — Cleanup dead code + unused imports

### Pourquoi ce ticket
Environ 50 warnings cosmétiques (imports/variables non utilisés) qui révèlent **2 vrais sujets** :
1. **Dead feature code** dans `order-drawer.tsx` : helpers `handleAudioUpload`, `handleAudioDelete`, `mapDocToDeleteIndex` définis mais aucun bouton UI ne les appelle. Soit on finit la feature (audio sur commandes), soit on supprime les helpers. Pour MVP : on supprime.
2. **Refactor crumbs** : 9 imports inutiles dans `prescription-drawer.tsx` (Input, Select*, etc.), résidus d'un ancien drawer qui faisait l'édition inline. À nettoyer.

Plus 2 fixes spécifiques :
- `tasks/page.tsx` : sortir `sortByPriority` du composant (constante module-level) pour éliminer les 3 warnings hooks/deps.
- `session-context.tsx` : `eslint-disable-next-line` avec commentaire explicite sur les 2 cas où ignorer `session` (vs `session?.id`) est intentionnel.

**Branche** : `chore/tech-03-cleanup-lint`
**Estimation** : 45 min
**Risque** : moyen (touche beaucoup de fichiers mais avec auto-fix).

### À faire

1. **Auto-fix les imports/variables non utilisés** :
   ```bash
   npx eslint --fix --ext .ts,.tsx src/
   ```
   Revoir le diff (~50 lignes supprimées). Si quelque chose disparaît qui ne devrait pas, restaurer manuellement.

2. **Décider sur `order-drawer.tsx`** :
   - Option A (recommandée) : supprimer `handleAudioUpload`, `handleAudioDelete`, `mapDocToDeleteIndex`, `audioAttachmentIndex`, `hasAudio`, `audioAttachmentUrl`, `documentAttachments` s'ils ne sont vraiment utilisés nulle part dans le JSX. **Cherche d'abord** avec un grep dans le JSX du même fichier que ces variables ne sont pas référencées.
   - Option B : finir la feature audio sur commandes (mettre les boutons UI). Mais ça mérite un ticket dédié, pas un cleanup.

3. **Sortir `sortByPriority` de `tasks/page.tsx`** :
   ```ts
   // À mettre tout en haut du fichier, en dehors du composant :
   const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }
   
   function sortByPriority(a: Task, b: Task) {
     const prioDiff = (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)
     if (prioDiff !== 0) return prioDiff
     const aDate = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER
     const bDate = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER
     return aDate - bDate
   }
   ```
   Puis retirer la définition à l'intérieur du composant. Les `useMemo` qui appellent `sortByPriority` n'ont plus de warning car la fonction n'est plus dans le scope du composant.

4. **Documenter les 2 hooks/deps de `session-context.tsx`** :
   ```ts
   // Ligne 149 et 239, au-dessus du }, [session?.id]) :
   // eslint-disable-next-line react-hooks/exhaustive-deps -- on veut re-démarrer uniquement quand l'id de session change, pas les autres champs (accumulated_minutes, ended_at)
   ```

### Acceptance
- [ ] `npm run lint` → reste **≤ 10 warnings** (seulement perf `<img>` + 1 React Compiler).
- [ ] `npm run build` vert.
- [ ] L'app marche pareil (test rapide : login → dashboard → tâches → ordonnances → ruptures).

### Prompt Claude Code
```
Lis docs/lint-diagnostic-2026-05-21.md catégories 2, 3, 6 (sauf 6.3 qui est TECH-01) et TODO_MEHDI.md TECH-03.

Plan en 4 étapes :

1. npx eslint --fix --ext .ts,.tsx src/ → revoir diff, valider avec moi.
2. Vérifier order-drawer.tsx : grep dans le JSX que handleAudioUpload, handleAudioDelete, mapDocToDeleteIndex ne sont vraiment pas appelés. Si pas appelés, supprimer ces helpers + variables associées (audioAttachmentIndex, hasAudio, audioAttachmentUrl, documentAttachments).
3. Sortir sortByPriority de tasks/page.tsx en constante module-level.
4. Ajouter les 2 commentaires eslint-disable + explication dans session-context.tsx lignes 149 et 239.

Contraintes :
- À la fin, npm run lint ≤ 10 warnings.
- npm run build vert.
- Test manuel rapide après : login + navigation 5 pages app.

Diff par étape, je valide chacune avant commit.
```

---

## TECH-04 — `<img>` → `<Image>` Formation module (optionnel)

### Pourquoi ce ticket
5 warnings perf `@next/next/no-img-element` dans le module Formation. Chaque `<img>` charge l'image au format/taille brut sans lazy loading ni WebP. Sur mobile, peut grimper le LCP (Largest Contentful Paint) à 3-5 s sur les pages procédures/formation.

**Quand le faire** : seulement si tu observes un LCP > 2,5 s sur ces pages dans PostHog Web Vitals après le go-live bêta. Sinon, dette acceptable.

**Branche** : `perf/tech-04-img-to-image`
**Estimation** : 30 min
**Risque** : faible (module Formation peu utilisé).

### Fichiers à modifier
- `src/components/formation/training-card.tsx:166`
- `src/components/formation/training-form.tsx:286, 337`
- `src/components/formation/training-upload-recorder.tsx:290`
- `src/components/formation/training-video-player.tsx:186`

### À faire
Pour chaque `<img>`, remplacer par `<Image>` de `next/image` :

```tsx
// Avant :
<img src={url} alt="..." className="w-full h-48 object-cover" />

// Après :
import Image from 'next/image'

<Image src={url} alt="..." width={400} height={192} className="w-full h-48 object-cover" />
```

Puis ajouter dans `next.config.ts` les remote patterns Supabase si pas déjà fait :
```ts
images: {
  remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
},
```

### Acceptance
- [ ] Les 5 pages Formation chargent correctement les images.
- [ ] `npm run lint` ne montre plus de warnings `@next/next/no-img-element`.
- [ ] Test LCP sur PostHog Web Vitals après deploy preview → confirme l'amélioration.

### Prompt Claude Code
```
Lis docs/lint-diagnostic-2026-05-21.md catégorie 5 et TODO_MEHDI.md TECH-04.

Objectif : remplacer 5 <img> par <Image> de next/image dans le module Formation.

Fichiers :
- src/components/formation/training-card.tsx ligne 166
- src/components/formation/training-form.tsx lignes 286, 337
- src/components/formation/training-upload-recorder.tsx ligne 290
- src/components/formation/training-video-player.tsx ligne 186

Pour chaque <img> : déterminer width/height (regarder les classes Tailwind type w-XX, h-XX pour estimer en px).

Vérifier next.config.ts : si remotePatterns ne contient pas '**.supabase.co', l'ajouter.

Acceptance :
- npm run lint ne montre plus @next/next/no-img-element.
- npm run build vert.
- Manuel : ouvrir les pages /procedures et /training et vérifier que les images chargent (Network tab : doit être un /_next/image URL).

Diff par fichier, je valide chacun.
```

---

## TECH-05 — Migrer Realtime onboarding/waiting vers broadcast côté serveur (scaling)

### Pourquoi ce ticket
**À traiter quand on dépasse ~5K invités simultanés sur `/onboarding/waiting`.** L'architecture actuelle (Realtime `postgres_changes` sur `pharmacies` avec RLS) marche très bien pour la bêta et les premières années, mais a 2 limites à grande échelle :

1. **Write amplification DB** : chaque UPDATE sur `pharmacies` déclenche un trigger logique qui re-vérifie les RLS pour chaque subscriber pour décider si le push doit lui être envoyé. À fort volume d'UPDATE et de subscribers concurrents, ça met de la charge sur le Postgres.
2. **Information leak (mineur)** : le payload Realtime contient toutes les colonnes de la row `pharmacies` (incluant `stripe_customer_id`, `stripe_subscription_id`, etc.). Les invités ont déjà la permission RLS de les lire — pas exploitable directement — mais pas idéal niveau principe du moindre privilège. Risque qui augmente le jour où on ajoute des colonnes vraiment sensibles à `pharmacies` (notes admin, scores risque, etc.).

### Refactor proposé : broadcast côté serveur + Realtime Authorization

Dans le webhook handler `/api/stripe/webhook` (handler `checkout.session.completed` + `customer.subscription.updated`) :

```ts
// Après l'UPDATE DB :
const channel = supabase.channel(`pharmacy-${pharmacyId}`)
await channel.send({
  type: 'broadcast',
  event: 'subscription_status_changed',
  payload: { status: newStatus }, // ← uniquement le strict nécessaire
})
```

Côté client `waiting-client.tsx` : remplacer `.on('postgres_changes', ...)` par `.on('broadcast', { event: 'subscription_status_changed' }, ...)`.

**Sécurité** : configurer la **Realtime Authorization** côté Supabase Dashboard (Settings → Authentication → Realtime) pour définir une policy qui restreint l'accès au channel `pharmacy-${pharmacyId}` aux membres de cette pharmacie. Sans cette policy, n'importe quel user authentifié peut joindre n'importe quel channel — sécurité plus faible que les RLS standards.

### Critères pour déclencher ce ticket
- **Métrique principale** : nombre d'invités simultanés sur `/onboarding/waiting` > 1000 (à monitorer via PostHog event `onboarding_waiting_viewed` qu'on n'a pas encore câblé)
- **OU** : on ajoute une colonne vraiment sensible à `pharmacies` qu'on ne veut pas leak via Realtime
- **OU** : Supabase facture nous explose à cause des events Realtime (à monitorer Settings → Usage → Realtime messages)

### Estimation
- ~2-3h de boulot incluant la policy Realtime Authorization + tests cross-pharmacy (anti-spoof channel name)
- Migration optionnelle : retirer `pharmacies` de la publication `supabase_realtime` si plus nécessaire ailleurs

### Lien
- Migration originale 0048 : `supabase/migrations/0048_pharmacies_realtime.sql`
- Code actuel : `src/app/(onboarding)/onboarding/waiting/waiting-client.tsx`

---

# PHASE 3 — JURIDIQUE (à attaquer en parallèle de Phase 2)

Tout est rédigeable toi-même à partir des templates **gratuits CNIL + CEPD**. Pas de cabinet d'avocat nécessaire pour la bêta. Tu auras le temps de faire relire par un pro le jour où tu lèveras / passeras à 50 officines.

---

## P3-01 — Auto-désignation DPO interne

### Pourquoi ce ticket
Le RGPD impose un **Délégué à la Protection des Données (DPO)** dans certains cas — notamment "traitement de données de santé à grande échelle". À ta taille bêta (5-10 officines) tu n'es pas dans ce cas, l'obligation tombe. **MAIS** : avoir un DPO désigné est un **argument de vente massif** auprès des titulaires d'officine prudents qui te demanderont "qui est votre DPO ?". Réponse : "C'est moi, voici le récépissé CNIL." Tu te désignes toi-même, tu notifies via le formulaire CNIL gratuit, tu publies l'adresse `dpo@pharmaworkspace.fr` sur la landing. 1 heure de travail.

**Estimation** : 1h.

### À faire
1. Rédiger une lettre de désignation interne (1 page) — modèle CNIL : https://www.cnil.fr/fr/designer-un-dpo
2. Notifier la CNIL via le formulaire en ligne (gratuit, 5 min) : https://www.cnil.fr/fr/designer-un-dpo (formulaire en bas de page).
3. Mettre le contact DPO sur la landing : `dpo@pharmaworkspace.fr` (alias email).

### Livrable
- `legal/lettre-designation-dpo.md`
- Réception du récépissé CNIL.

---

## P3-03 — Registre des traitements (art. 30 RGPD)

### Pourquoi ce ticket
L'article 30 du RGPD t'oblige à tenir un **registre des activités de traitement** : un document Excel où tu listes chaque traitement de données personnelles que ton SaaS opère, avec sa finalité, sa base légale, les destinataires, les durées, etc. **Sans ce registre, tu es en infraction directe** — c'est un des premiers documents demandés en cas de contrôle CNIL ou de demande d'une officine cliente. La CNIL fournit un modèle Excel officiel gratuit. ½ journée à remplir.

**Estimation** : ½ jour.

### À faire
1. Télécharger le **modèle officiel CNIL** : https://www.cnil.fr/fr/RGDP-le-registre-des-activites-de-traitement (Excel gratuit).
2. Remplir 8-10 lignes correspondant aux traitements PharmaWorkspace :
   - Authentification utilisateurs
   - Gestion ordonnances (incl. OCR)
   - Gestion tâches/kanban équipe
   - Gestion commandes fournisseurs
   - Gestion locations matériel
   - Gestion ruptures de stock
   - Annuaire contacts
   - Notifications/Realtime
3. Pour chaque ligne : finalité, base légale (intérêt légitime / contrat), catégories de données, destinataires (sous-traitants Supabase/Vercel/OpenAI/Upstash), durées de conservation, mesures de sécurité.

### Livrable
- `legal/registre-traitements.xlsx`

### Prompt Claude (pas Claude Code, plutôt cette session Cowork)
```
Sur la base du modèle CNIL téléchargé, je veux remplir le registre art. 30 pour PharmaWorkspace. Voici les 8 traitements à documenter [...]. Pour chacun, génère-moi une ligne complète : finalité, base légale, catégories de personnes concernées, catégories de données, destinataires, transferts hors UE, durée de conservation, mesures de sécurité techniques et organisationnelles.
```

---

## P3-04 — Politique de confidentialité publique

### Pourquoi ce ticket
La page `/privacy` qui explique aux utilisateurs ce que tu fais de leurs données (et de celles de leurs patients), légalement obligatoire en France (art. 13/14 RGPD). **Sans cette page, ton site n'est pas conforme et tu ne peux pas légalement opérer**. C'est aussi le contenu que ton dev affichera sur la page sécurité de la landing (page `/securite`) — donc en livrant ce texte, tu débloques son ticket P4-04. Modèle CNIL gratuit, tu adaptes en 4h.

**Estimation** : ½ jour.

### À faire
1. Partir du **modèle CNIL "Information des personnes"** : https://www.cnil.fr/fr/RGPD-comment-informer-les-personnes-concernees
2. Adapter à PharmaWorkspace :
   - Identité responsable de traitement (toi / ta société).
   - DPO (toi).
   - Finalités (cf. registre P3-03).
   - Bases légales.
   - Destinataires (Supabase, Vercel, OpenAI, Upstash).
   - Transferts hors UE (OpenAI US → clauses contractuelles types).
   - Durées de conservation.
   - Droits (accès, rectification, effacement, portabilité, opposition, limitation).
   - Réclamation CNIL.
3. Page `/privacy` à publier (à coder dans P4-04 — ton collègue s'en charge).

### Livrable
- `legal/politique-confidentialite.md` (source markdown).

---

## P3-05 — DPA template signable

### Pourquoi ce ticket
Le **DPA (Data Processing Agreement)** est un contrat obligatoire entre toi (sous-traitant de données, art. 28 RGPD) et chaque officine cliente (responsable du traitement). **Sans DPA signé, aucune officine sérieuse ne signera avec toi** — c'est l'équivalent d'une facture pro forma manquante : sans le doc, pas de transaction. C'est LE document qu'un titulaire d'officine prudent demandera avant même de cliquer sur "souscrire". Le CEPD (autorité européenne) fournit un modèle officiel français gratuit.

**Estimation** : 1 jour.

### À faire
1. Partir du **modèle CEPD "Standard Contractual Clauses for processors"** (gratuit, version FR officielle) : https://www.cnil.fr/fr/contrat-type-CNIL-rt-st
2. Adapter en cadre client B2B : tu es sous-traitant, l'officine est responsable.
3. Sections obligatoires : objet du traitement, durée, nature, finalité, types de données, catégories de personnes, instructions documentées, confidentialité, sécurité, sous-traitants ultérieurs (avec annexe listant Supabase/Vercel/Mistral/Upstash), assistance droits des personnes, notification violations 72h, retour/suppression données, audits.
4. Signature : utilise **PandaDoc free** (3 docs/mois gratuits) ou simplement DPA scanné/contre-signé manuellement les 10 premiers pilotes.
5. **Écrire `scripts/hash-legal.ts`** : script Node qui (a) lit `legal/politique-confidentialite.md` (livré par P3-04) et `legal/dpa-pharmaworkspace.md` (livré ici), (b) calcule leur hash SHA-256 via `crypto.createHash`, (c) patch `src/lib/legal/consent-versions.ts` en remplaçant les placeholders `'sha256:TBD-Mehdi-injectera-via-script'` par les vraies valeurs `'sha256:<hex>'`, et (d) bump `CGS_VERSION` + `DPA_VERSION` à la date du jour (format `YYYY-MM-DD`).
6. **Lancer le script** : `npx tsx scripts/hash-legal.ts`. Vérifier que `src/lib/legal/consent-versions.ts` n'a plus aucun `'TBD'`. Commit le diff (script + docs source `.md` + `consent-versions.ts` patché).

⚠️ **Pourquoi ces 2 étapes — risque RGPD art. 7 connu** : sans cela, `src/lib/legal/consent-versions.ts` continue de stocker `'sha256:TBD-Mehdi-injectera-via-script'` dans `pharmacy_acquisition.cgs_hash`/`dpa_hash` à chaque signup. L'audit RGPD art. 7 (preuve individualisée de ce qui a été accepté) est cassé tant que ce script n'a pas tourné une fois sur les vrais docs. **Bloqueur Live mode**.

### Livrable
- `legal/dpa-pharmaworkspace.md` (source markdown qui sera hashé)
- `legal/dpa-pharmaworkspace.docx` + `legal/dpa-pharmaworkspace.pdf` (versions signables)
- `scripts/hash-legal.ts` (script de calcul des hashes consent)
- `src/lib/legal/consent-versions.ts` patché avec les vraies valeurs hex (plus de `'TBD'`)

---

## P3-06 — Récupérer les DPA fournisseurs

### Pourquoi ce ticket
L'envers de P3-05 : **Supabase, Vercel, OpenAI et Upstash sont TES sous-traitants**. Ils doivent te fournir leur DPA standard à eux (gratuit, pré-rempli, déjà signé de leur côté, tu contre-signes). Tu en auras besoin le jour où un titulaire d'officine te demandera **la chaîne de sous-traitance complète** (et ils la demandent, surtout les groupements). 1 heure cumulée pour télécharger les 4 PDF.

**Estimation** : 1h.

### À faire
- Supabase : https://supabase.com/dpa (téléchargeable, déjà signé Supabase, à contre-signer toi).
- Vercel : https://vercel.com/legal/dpa
- OpenAI : https://openai.com/policies/data-processing-addendum
- Upstash : https://upstash.com/trust → demande par email.

Archive les 4 dans `legal/sous-traitants/`.

---

## P3-07 — Décision HDS documentée

### Pourquoi ce ticket
Tu actes **par écrit** la stratégie HDS retenue (voie A retenue : switch OCR vers Mistral EU via P1-04 + stockage Supabase Paris non-HDS toléré en bêta privée). Pourquoi écrire ça ? Parce que le jour où un client, un avocat, un investisseur ou un contrôleur CNIL te demande "pourquoi n'êtes-vous pas hébergeur HDS ?", tu réponds avec ce document. Sans, tu improvises, tu trembles, tu perds le client. 2 heures pour rédiger un doc défendable.

**Estimation** : 2h.

### À faire
Rédige un document de décision 1-2 pages dans `legal/decision-hds.md` qui explique :

- Pourquoi tu retiens la **voie A (provider OCR EU Mistral + stockage Supabase Paris non-HDS toléré en bêta)** plutôt que B (full HDS) ou C (hybride Scaleway HDS pour les ordonnances).
- Quelles données identifiantes patients sont stockées dans Supabase (le `patient_name` extrait par l'OCR Mistral et stocké en clair dans la table `prescriptions`).
- Pourquoi cette donnée seule, sans contexte clinique étendu, ne constitue pas un traitement HDS au sens strict (à argumenter avec prudence).
- À quel seuil tu basculeras vers une voie hybride (par exemple : > 30 officines actives, ou > 1000 ordonnances/mois).
- Plan B si interprétation HDS contestée : migration Scaleway HDS (~50 €/mois) pour la table `prescriptions` et le bucket prescriptions seuls.

### Livrable
- `legal/decision-hds.md`

---

## P3-08 — Endpoints droits RGPD (export + erase)

### Pourquoi ce ticket
Le RGPD donne **3 droits clés aux utilisateurs** : voir leurs données (droit d'accès, art. 15), les rectifier (art. 16), les effacer (droit à l'oubli, art. 17). **Tu dois pouvoir techniquement répondre à ces demandes**, sans quoi tu es en infraction et exposé à une plainte CNIL. Deux endpoints à créer : un qui exporte toutes les données d'un user en ZIP, un qui anonymise un user (on n'efface jamais "complètement" — on remplace les champs identifiants par "Utilisateur supprimé" pour préserver l'historique d'audit). Sans ces endpoints, chaque demande RGPD devient un casse-tête manuel qui te prend une journée.

**Branche** : `feat/p3-08-rgpd-endpoints`
**Estimation** : 2 jours
**Risque** : moyen.

### À faire
1. `GET /api/legal/export` : retourne un JSON ZIP avec toutes les données de l'utilisateur connecté (profil, tâches créées, ordonnances créées, etc.).
2. `DELETE /api/legal/erase` : anonymise (replace nom/email) plutôt que de supprimer (préservation des données d'audit).
3. Endpoint réservé au user lui-même OU au titulaire de la pharmacie pour effacer un membre.

### Acceptance
- [ ] Test manuel : un user peut télécharger ses données.
- [ ] Un titulaire peut "effacer" un membre → ses entrées historiques restent mais sont `display_name = 'Utilisateur supprimé'`.

---

## P3-09 — Procédure incident (runbook 72h CNIL)

### Pourquoi ce ticket
Si demain ta base Supabase fuite, ou que ton OCR plante de manière critique en exposant des données, **tu as 72 heures pour notifier la CNIL** (art. 33 RGPD). Au-delà → amende. Ce runbook c'est la **checklist à dérouler dans la panique** quand l'alerte tombe à 2h du matin : qui appeler, quel template de mail utilisateur, quels logs collecter, comment notifier la CNIL via leur téléprocédure. À écrire à froid maintenant pour pouvoir l'utiliser à chaud quand ça arrivera (ça arrivera).

**Estimation** : 1h.

### À faire
Rédige `legal/runbook-incident.md` (2 pages max) :
1. Détection : alertes Sentry + monitoring Supabase.
2. Évaluation gravité (échelle : faible / modérée / élevée).
3. Notification CNIL si données personnelles concernées : 72h via https://notifications.cnil.fr.
4. Notification utilisateurs concernés si risque élevé.
5. Logs à collecter, template de mail utilisateur.

---

# PHASE 2 — TICKETS CRITIQUES MEHDI

---

## P2-07 — Optimisation RLS `(select get_pharmacy_id())`

### Pourquoi ce ticket
Tes policies de sécurité au niveau base de données (**RLS — Row Level Security**) sont écrites de manière naïve : Postgres ré-évalue la fonction `get_pharmacy_id()` **pour chaque ligne lue**. À 1000 ordonnances dans une pharmacie : invisible. À 10 000 : ça commence à ramer. À 100 000 (cumul plusieurs officines × 6 mois d'historique) : inutilisable, les listes mettent 5-10 secondes à charger. Petite réécriture qui force Postgres à évaluer la fonction **une seule fois** au début de la query → tes requêtes sur grosses tables deviennent **10 à 100× plus rapides**. C'est une bonne pratique Supabase officielle qu'on a oubliée d'appliquer.

**Branche** : `perf/p2-07-rls-initplan`
**Estimation** : 1 jour
**Risque** : élevé (touche TOUTES les policies RLS — si une syntaxe foire, plus personne ne voit ses données).

### À faire
1. **Backup** : `supabase db dump > backup-pre-p2-07.sql`.
2. **Migration `0030_rls_initplan_optim.sql`** : pour chaque table métier, DROP + CREATE policy avec `(select public.get_pharmacy_id())` au lieu de `public.get_pharmacy_id()`. Idem `get_user_role()`.
3. **Tester en staging d'abord** (si tu as un projet Supabase staging) sinon test sur ta DB de dev.
4. **Validation EXPLAIN** :
   ```sql
   EXPLAIN ANALYZE SELECT * FROM tasks LIMIT 1000;
   ```
   Doit montrer un `InitPlan` en haut du plan d'exécution.

### Ne PAS toucher
- Les fonctions `get_pharmacy_id()` et `get_user_role()` (juste le wrapping en `(select ...)`).

### Prompt Claude Code
```
Ticket P2-07. Lis CLAUDE.md §7 et 0001_init.sql + 0002_enable_rls.sql.

Objectif : générer une migration 0030 qui re-crée TOUTES les policies RLS sur les tables métier en utilisant (select public.get_pharmacy_id()) au lieu de public.get_pharmacy_id().

Avant d'écrire la migration : liste-moi toutes les policies existantes (cherche dans les migrations 0001 à 0025). Je veux une checklist exhaustive pour ne rien oublier. Une fois la liste validée, on écrit la migration.
```

---

## P2-08 — Auth Hooks JWT (custom claims pharmacy_id + role)

### Pourquoi ce ticket
Aujourd'hui, **chaque navigation dans ton app** déclenche une requête SQL sur la table `profiles` pour récupérer la `pharmacy_id` et le `role` de l'utilisateur (le middleware le fait à chaque page). À 200 utilisateurs actifs = ~33 req/s = saturation du pool Postgres Supabase (limite 60 connexions sur le plan Pro). Tu as **deux fois plus de capacité de scale** si tu déplaces ces deux infos directement dans le JWT (le token d'authentification que le navigateur envoie déjà à chaque requête). 0 hit DB, lecture instantanée. C'est l'optimisation qui te fait passer de "5 pilotes ça tient" à "50 officines ça tient".

**Branche** : `feat/p2-08-auth-hooks-jwt`
**Estimation** : 2-3 jours
**Risque** : élevé (touche le login flow et le middleware).

### Doc référence
https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook

### À faire
1. Créer une fonction Postgres `public.custom_access_token_hook(event jsonb) returns jsonb` qui ajoute `pharmacy_id` et `role` aux `app_metadata` du JWT.
2. Activer le hook dans Supabase Dashboard → Auth → Hooks.
3. Refactor `src/proxy.ts` pour lire `user.app_metadata.pharmacy_id` au lieu de query `profiles`.
4. Refactor `src/contexts/profile-context.tsx` : garder la query `profiles` pour les détails (avatar, names) mais pas pour pharmacy_id/role.

### Acceptance
- [ ] Network tab : aucun `SELECT` sur `profiles` à chaque navigation.
- [ ] Test : changer le role d'un user dans la table profiles → il doit re-login pour que le changement prenne effet (limitation acceptée).

### Prompt Claude Code
```
Ticket P2-08. Doc à lire AVANT toute action :
https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook

Lis aussi CLAUDE.md, src/proxy.ts (middleware actuel), src/contexts/profile-context.tsx, src/lib/supabase/middleware.ts.

Plan en 4 étapes :
1. Migration 0031 : function custom_access_token_hook qui add pharmacy_id + role aux app_metadata.
2. Activer hook côté Supabase (manuel, je te donne les instructions).
3. Refactor proxy.ts pour lire app_metadata.
4. Refactor profile-context pour ne plus dépendre du DB hit pour pharmacy_id.

Pour chaque étape : diff, je valide. Sois TRÈS prudent — c'est le login flow.
```

---

## P2-16 — Audit log applicatif

### Pourquoi ce ticket
**Traçabilité réglementaire ET commerciale.** Côté réglementaire : l'ARS et la CNIL exigent en cas de contrôle de pouvoir répondre à "qui a vu telle ordonnance, à quelle heure ?". Côté pratique support : ton client titulaire te dira "je suis sûr que mon préparateur n'a pas modifié cette commande" — tu réponds avec le log d'audit. C'est aussi une **fonctionnalité produit visible** (un onglet "Journal d'activité" pour le titulaire) qui rassure les clients prudents. Une table SQL + un helper applicatif + 4-5 lignes à ajouter dans les endpoints sensibles.

**Branche** : `feat/p2-16-audit-log`
**Estimation** : 2 jours
**Risque** : moyen.

### À faire
1. Migration `0032_audit_log.sql` :
   ```sql
   CREATE TABLE public.audit_log (
     id uuid primary key default gen_random_uuid(),
     pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
     user_id uuid not null references auth.users(id),
     action text not null,
     target_type text not null,
     target_id uuid,
     metadata jsonb default '{}'::jsonb,
     ip_address inet,
     user_agent text,
     created_at timestamptz not null default now()
   );
   
   CREATE INDEX audit_log_pharmacy_idx ON public.audit_log(pharmacy_id, created_at desc);
   ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY audit_log_select_titulaire ON public.audit_log
     FOR SELECT USING (
       pharmacy_id = (select public.get_pharmacy_id())
       AND (select public.get_user_role()) = 'titulaire'
     );
   ```
2. Helper `src/lib/audit/log.ts` :
   ```ts
   export async function logAudit(params: {
     action: string
     target_type: string
     target_id?: string
     metadata?: Record<string, unknown>
   }) {
     // insert into audit_log via Supabase client
   }
   ```
3. Appelle `logAudit` aux endroits sensibles : `getPrescription`, `updatePrescription`, `deletePrescription`, `exportLegalData`, `eraseLegalData`.

### Acceptance
- [ ] Ouvrir une ordonnance → 1 ligne `audit_log` avec `action = 'prescription.read'`.
- [ ] Page Admin → "Journal d'audit" visible seulement par titulaire.

---

# 🆕 NOUVEAUX TICKETS MEHDI — Critique bêta + spécifications produit pour Dim

> Ajoutés le 30 mai 2026. Le ticket COPY-01 est critique avant ouverture aux pilotes. Les 3 PROD-* sont des notes de spécification que Mehdi doit acter avant que Dim attaque PLAN-01, CHAT-01 et BADGE-01 (voir TODO_DEV.md).

---

## 🔴 COPY-01 — Revue copywriting complète (CRITIQUE BÊTA)

### Pourquoi ce ticket
Tu as accumulé des dizaines de phrases UI rédigées par moi, par Claude Code et par toi sur des dizaines de PRs. Le ton n'est pas uniforme, certaines formulations sont étranges, certains anglicismes sont passés en production, des verbes au mauvais temps subsistent. Avant que le premier pilote ne voie le produit, **tu dois faire une passe éditoriale complète**. C'est ce qui fait la différence entre « ça a l'air pro » et « ça a l'air bricolé ». 4h de relecture concentrée = 12h gagnées en première impression et en confiance pilote.

**Estimation** : ½ jour (4h en bloc avec une feuille de papier à côté).
**Risque** : nul (modifications de string uniquement).
**Branche** : `chore/copy-01-editorial-review` (une seule grosse PR avec une checklist).

### Périmètre — pages publiques à relire (priorité 1)
- `/` landing complète — chaque section + chaque CTA
- `/tarifs` — titres, descriptifs des tiers, FAQ tarifaire
- `/securite` — vérifier que la traduction du `legal/securite.md` est fluide en lecture
- `/privacy` — idem `legal/privacy.md`
- `/conditions-generales` — idem `legal/conditions-generales.md`
- `/dpa` — idem `legal/dpa.md`
- `/signup` — labels, placeholders, messages d'erreur, libellés des cases click-wrap CGS + DPA

### Périmètre — onboarding (priorité 1)
- `/onboarding/create` — labels et helper text pour nom officine / adresse / FINESS
- `/onboarding/profile` — prénom / nom / avatar
- `/onboarding/invite` — sélecteur rôle (libellés FR), copy "Inviter X" / "Passer cette étape", message vide
- `/onboarding/activate` — la copy CB ("€0 prélevés pendant 30 jours", "Premier prélèvement le [date]", rassurance annulation)
- `/onboarding/activate/success` — message d'attente webhook + redirection

### Périmètre — produit interne (priorité 2)
- Sidebar — libellés items (Dashboard, Tâches, Ordonnances, Ruptures, Locations, Agenda → Calendrier, etc.)
- Page `/dashboard` — widgets, KPIs, checklist first-run
- Pages modules — états vides ("Pas encore de tâche, créez la première"), tooltips, breadcrumbs
- Modales de confirmation — boutons "Supprimer" / "Annuler" cohérence, copy d'avertissement
- Notifications toasts — formuler "Tâche créée" plutôt que "Task created" ou "Tâche a été créée avec succès" (trop long)

### Périmètre — emails Resend (priorité 2)
- Magic link OTP signup (envoyé par Supabase Auth — vérifier le template configurable Dashboard Supabase)
- Email d'invitation collaborateur (template `src/lib/email/templates/invitation.tsx`)
- Email confirmation paiement Stripe (template Stripe par défaut — peut être personnalisé Dashboard)
- Email trial ending J-7 (template Stripe par défaut — vérifier le wording français)

### Périmètre — Stripe Customer Portal (priorité 3)
- Branding + libellés du portal côté Stripe Dashboard (Settings → Billing → Customer portal → Customize)

### Méthode recommandée
1. Ouvre un nouveau Google Doc / Notion "Copy review 30/05".
2. Démarre `npm run dev`, parcours systématique page par page dans cette ordre :
   - Public : `/` → `/tarifs` → `/securite` → `/privacy` → `/cgs` → `/dpa` → `/signup`
   - Inscription : signup → magic link reçu → callback → onboarding 4 étapes → dashboard
   - Produit : sidebar item par item
3. Pour chaque page, prends 5-10 min : lis à voix haute. Ce qui sonne bizarre à l'oreille est bizarre à l'écrit. Note dans le doc.
4. Vérifie les `i18n` si en place : `messages/fr/*.json` (chercher si configuré). Sinon, c'est des strings inline dans les composants TSX.
5. Une fois le tour fait, ouvre la PR `chore/copy-01-editorial-review` avec **toutes** les corrections dans un seul commit. Reviewable d'un coup.

### Règles éditoriales à appliquer
- **Ton** : tutoyer ou vouvoyer ? **Choisir une fois et s'y tenir**. Pour B2B pharma, je recommande le **vous** (respectueux, plus institutionnel). Si tu choisis le tu, propage partout.
- **Verbes d'action** : préfère l'impératif présent court ("Inviter", "Valider", "Annuler") aux verbes longs ("Confirmer la suppression de l'élément").
- **Anglicismes** : remplace "user", "dashboard", "trial", "feedback" par "utilisateur", "tableau de bord", "essai", "retour" si le contexte le permet. Garde l'anglicisme s'il est mainstream dans le métier (genre "OCR" ou "SaaS").
- **États vides** : ne dis jamais "Aucune donnée disponible". Préfère "Vous n'avez pas encore [X]. Créez-en un pour démarrer."
- **Erreurs** : ne dis jamais "Une erreur est survenue". Préfère "On n'a pas pu enregistrer votre tâche. Réessayez ou contactez-nous."
- **Dates relatives** : "il y a 3 min" plutôt que "il y a 3 minutes" en interface, plutôt que le timestamp absolu si récent.
- **Sigles** : la première occurrence d'un sigle dans une page → entre parenthèses la signification. "OCR (reconnaissance optique de caractères)", "FINESS (identifiant officine)".

### Checklist par page (modèle, à dupliquer dans ton doc)
- [ ] Ton uniforme (tu/vous) ?
- [ ] Anglicismes inutiles supprimés ?
- [ ] CTAs en impératif court ?
- [ ] Messages d'erreur compréhensibles ?
- [ ] États vides accueillants ?
- [ ] Cohérence avec le reste des pages ?
- [ ] Lecture à voix haute fluide ?

### Acceptance
- [ ] Doc Notion/Google avec toutes les corrections listées par page.
- [ ] PR ouverte avec toutes les corrections en un seul commit.
- [ ] Test rapide : faire relire la page `/signup` et la landing par une personne tierce (non technique, idéalement ton partenaire pharmacien) → "Tu comprends tout ?", "Y a un truc qui te paraît bizarre ?".

---

## PROD-PLAN-01 — Spécifications produit pour le module Planning de présence + congés

### Pourquoi ce ticket
Avant que Dim attaque PLAN-01 (TODO_DEV.md, gros module ~5-6 jours), tu dois acter 5 décisions produit. Sans ces décisions, le module risque d'être codé deux fois.

### Décisions à acter (1 page de doc Notion suffit)

**1. Types de congés à supporter dans le MVP** — recommandation :
- ✅ CP (congé payé) — obligatoire
- ✅ RTT — utile pour officines >35h/sem
- ✅ Maladie — obligatoire (justificatif géré hors app pour l'instant)
- ✅ Formation — fréquent en officine, à séparer des CP
- ✅ Jour férié — pour planning visuel
- ✅ Congé sans solde — moins fréquent mais simple à ajouter
- ✅ Autre — fallback
- 🤔 Maternité / paternité ? — peuvent rentrer dans "Autre" pour MVP, à dédier si demande forte

**2. Workflow validation** — recommandation :
- MVP : **titulaire seul valide**. L'adjoint peut consulter mais ne valide pas.
- Phase 2 : déléguer à l'adjoint via réglage titulaire.

**3. Visibilité du planning équipe** — recommandation :
- **Transparent** : tous les membres voient l'intégralité du planning de présence de tous les collaborateurs (cohérent avec la culture officine).
- Phase 2 : option titulaire pour anonymiser les motifs de congé (afficher juste "Absent" sans dire pourquoi).

**4. Période de planification** — recommandation :
- Vue par défaut : **semaine glissante (7 jours)**.
- Navigation semaine précédente/suivante + bouton "Aujourd'hui".
- Phase 2 : vue mois + trimestre + export PDF.

**5. Notifications** — recommandation :
- Demande créée → email au titulaire (template Resend).
- Validation/refus → email au requester.
- Banner in-app sur le dashboard si demande pending qui te concerne.
- Pas de SMS/Slack en MVP.

**6. Soldes congés** — décision difficile à différer ou non :
- **MVP sans solde** : on ne compte pas les jours restants par collaborateur, c'est juste une demande qui est validée ou non. Le titulaire suit hors app.
- Phase 2 : ajout du capital CP + RTT par collaborateur, calcul automatique du solde après chaque validation, blocage si solde insuffisant. Plus juridiquement correct mais beaucoup plus complexe (acquisition mensuelle des congés, période de référence juin-mai, jours ouvrés vs ouvrables, etc.). À éviter pour MVP.

### Livrable
Un mémo de 1 page dans `prod/legal/internal/PROD-PLAN-01-decisions.md` (à créer) qui tranche les 6 points + écris le prompt à donner à Claude Code en pointant explicitement « cf. mémo PROD-PLAN-01 pour les décisions ».

---

## PROD-CHAT-01 — Spécifications produit pour le salon textuel équipe

### Pourquoi ce ticket
Mehdi décide 4 points avant que Dim attaque CHAT-01 :

**1. Nombre de canaux en MVP** — recommandation : **1 seul canal "Général"** créé automatiquement. Phase 2 : titulaire peut créer des canaux thématiques (#transmission, #commandes, #ruptures, #pause).

**2. Pièces jointes** — recommandation : **non en MVP**. Le pattern existant attachments + storage est connu, l'ajout sera trivial en Phase 2. En MVP, juste du texte.

**3. Édition / suppression** — recommandation :
- Auteur peut éditer son message dans les 15 minutes après envoi.
- Auteur peut supprimer son message à tout moment (soft delete + texte "Message supprimé").
- Titulaire peut supprimer n'importe quel message (modération).
- Pas de "report" système en MVP (équipe restreinte, confiance forte).

**4. Notifications hors app** — recommandation :
- **Aucune notification email** pour un message chat (volume potentiel trop élevé, spam garanti).
- Badge unread sidebar in-app uniquement.
- Phase 2 : web push notifications opt-in.

### Livrable
Mémo `prod/legal/internal/PROD-CHAT-01-decisions.md` qui tranche les 4 points + signal vert à Dim.

---

## PROD-BADGE-01 — Spécifications produit pour le geofencing du badgeage

### Pourquoi ce ticket
Mehdi décide 4 points avant que Dim attaque BADGE-01 (1,5 jour) :

**1. Activation par défaut** — recommandation : **désactivé** pour les pharmacies existantes (rétrocompat). Le titulaire active explicitement depuis `/admin/settings/geofencing`.

**2. Rayon par défaut** — recommandation : **100 m**. Couvre l'officine + son trottoir + son parking immédiat sans frustration en cas d'imprécision GPS. Réglable 25-1000m.

**3. Posture en cas de refus** — recommandation : bouton de badgeage **grisé + tooltip explicatif** plutôt que masqué. Le collaborateur comprend pourquoi il ne peut pas badger ("Vous êtes à 230m de l'officine — limite 100m").

**4. Trace des refus** — recommandation : **audit log applicatif** (P2-16) trace chaque tentative refusée avec position et distance. Le titulaire peut consulter dans `/admin/audit-log` (à étendre).

**Important point juridique** : le geofencing du badgeage est **encadré par le RGPD et le droit du travail**. La géolocalisation des salariés sur leur lieu de travail nécessite :
- **Information préalable claire** des salariés (mentionner dans la fiche de poste ou un avenant).
- **Consultation du CSE** si l'entreprise en a un (officine ≥ 11 salariés). Sinon, simple information.
- **Pas de tracking en continu** : on ne capture la position **qu'au moment du badgeage**, pas en arrière-plan. Précise-le dans la doc admin.
- **Pas de stockage des positions historiques** au-delà de la session : on stocke `clockin_distance_m` et `clockin_accuracy_m` à l'instant T, pas la lat/lng exacte du salarié.

→ Ajoute une **page d'information** courte (½ page) dans le module admin, à imprimer/signer par chaque salarié au déploiement. Template à fournir dans le mémo.

### Livrable
Mémo `prod/legal/internal/PROD-BADGE-01-decisions.md` qui tranche les 4 points + template d'information salarié à intégrer dans le module admin.

---

# COMMERCIAL & PRICING (Phase 4)

> 📥 **Tickets repris du scope ex-Billy / frontend commercial** (rôle indispo depuis le 28/05/2026, repris en solo). Les 3 tickets restants ont été migrés ici : P4-03 (page tarifs à finir), P4-04 (page sécurité à finir), P4-13 (trial intégré Stripe, le seul VRAI bloqueur code restant du funnel).

---

## P4-03 — Page `/tarifs` détaillée (FINISH)

> 🟡 **État au 29/05/2026** : skeleton mergé (PR #53, commit `7ea421c`) — page + `pricing-table.tsx` + `pricing-faq.tsx` créés. **Reste à faire** : remplacer le lorem ipsum par le copy final + injecter les vrais price IDs/montants. Pricing déjà tranché (catalogue 39/99/129 € HT, EA -40 % à vie sur les 20 premières officines).

### Pourquoi ce ticket
Page `/tarifs` détaillée avec les 3 tiers, FAQ tarifs, bandeau Early Adopter. C'est la page que les prospects parcourent après avoir vu la landing pour décider de leur tier. Skeleton OK, manque le copy définitif.

**Branche** : `feat/p4-03-tarifs-finish`
**Estimation** : ½ jour (skeleton existe, reste copy + données réelles).
**Risque** : faible (UI seulement).

### Vérification préalable
- [x] Pricing tranché : 39 / 99 / 129 € HT catalogue, EA -40 % à vie → 23,40 / 59,40 / 77,40 € mensuel, 234 / 594 / 774 € annuel (= 10× mensuel, 2 mois offerts).
- [x] 6 price IDs Stripe créés sur le compte dédié PharmaWorkspace (cf. mémoire `stripe-price-ids-early-adopter`).
- [x] Cible par tier : PO ≤ 3 personnes, OTM 4-8, GO 9+.

### Fichiers à modifier
- `src/app/(marketing)/tarifs/page.tsx` (existe en lorem)
- `src/components/marketing/pricing-table.tsx` (existe en lorem)
- `src/components/marketing/pricing-faq.tsx` (existe en lorem)

### À faire

1. **Hero `/tarifs`** :
   - Titre : "Tarifs PharmaWorkspace"
   - Sous-titre : "30 jours d'essai. Annulable à tout moment. Premier prélèvement seulement après les 30 jours."
   - Bandeau : "🎯 Bêta : -40 % à vie pour les 20 premières officines. Plus que [X] places disponibles."

2. **3 cartes tier** dans `pricing-table.tsx` :
   - **Petite officine (PO)** — ≤ 3 personnes — ~~39 €~~ **23,40 €/mois** HT (mensuel) / 234 €/an HT (annuel = 2 mois offerts)
   - **Officine moyenne (OTM)** — 4-8 personnes — ~~99 €~~ **59,40 €/mois** HT — badge "Recommandé"
   - **Grande officine (GO)** — 9+ personnes — ~~129 €~~ **77,40 €/mois** HT

   Toggle mensuel/annuel au-dessus des cartes (annuel = 2 mois offerts).

3. **Features par tier** : pour la bêta, **tous les modules sont inclus dans tous les tiers** (le différenciant = nombre d'utilisateurs/comptes par officine, pas les features). Décrire ça clairement.

4. **CTA "Démarrer l'essai 30 jours"** → `/signup?tier=po|otm|go&source=tarifs_<tier>` (P4-13b lira ce param pour pré-sélectionner le tier au step 4 du wizard).

5. **FAQ** dans `pricing-faq.tsx` — réécrire avec le copy aligné pivot 2 (CB obligatoire / 30j essai / annulable à tout moment). Source du copy : ticket P4-13 ci-dessous + composant `src/components/marketing/faq.tsx` mergé par P4-02.

### Acceptance
- [ ] Page `/tarifs` propre, lisible mobile + desktop, plus aucun lorem ipsum.
- [ ] Les 3 prix EA affichés correspondent aux montants Stripe (23,40 / 59,40 / 77,40 €).
- [ ] Toggle mensuel/annuel fonctionnel (annuel = 234 / 594 / 774 €).
- [ ] CTA mène à `/signup?tier=...&source=tarifs_...`.
- [ ] `npm run lint && npm run typecheck && npm run build` verts.

---

## P4-04 — Page `/securite` RGPD + `/privacy` + `/conditions-generales` + `/dpa` (FINISH)

> 🟡 **État au 29/05/2026** : skeleton mergé (PR #53, commit `e2c1508`) — pages `/securite`, `/privacy`, `/conditions-generales`, `/dpa` créées, composant `security-section.tsx` créé, **tout en lorem ipsum**. **Reste à faire** : remplacer par le contenu définitif issu de **P3-04** (politique confidentialité) et **P3-05** (DPA). Bloquant pour Live mode (juridique obligatoire).

### Pourquoi ce ticket
Pages publiques de transparence RGPD. Ce qu'un titulaire d'officine prudent va lire avant de signer.

**Branche** : `feat/p4-04-securite-finish`
**Estimation** : ½ jour après que P3-04 + P3-05 sont livrés.
**Risque** : faible (intégration de contenu).

### Vérification préalable
- [ ] `legal/politique-confidentialite.md` rédigé et finalisé (P3-04).
- [ ] `legal/dpa-pharmaworkspace.md` rédigé et finalisé (P3-05).
- [ ] Sous-traitants confirmés : Supabase Paris, Vercel Frankfurt, Mistral Paris, Upstash Irlande, Sentry, PostHog EU.
- [ ] Script `scripts/hash-legal.ts` exécuté (cf. P3-05) → `consent-versions.ts` ne contient plus de `'TBD'`.

### Fichiers à modifier
- `src/app/(marketing)/securite/page.tsx`
- `src/app/(marketing)/privacy/page.tsx`
- `src/app/(marketing)/conditions-generales/page.tsx`
- `src/app/(marketing)/dpa/page.tsx`
- `src/components/marketing/security-section.tsx`

### À faire

**Page `/securite`** — 7 sections résumées :
1. Hébergement (Supabase Paris)
2. OCR (Mistral AI EU)
3. Chiffrement (TLS + at-rest + RLS)
4. Sous-traitants (liste complète)
5. Vos droits (lien vers `/api/legal/{export,erase}` une fois P3-08 livré)
6. DPO (`dpo@pharmaworkspace.fr`)
7. CTA "Lire la politique de confidentialité complète" → `/privacy`

**Page `/privacy`** — Rendre `legal/politique-confidentialite.md` via `react-markdown`.

**Page `/conditions-generales`** — Rendre les CGS rédigées (à créer dans P3-05 ou un livrable adjacent `legal/cgs.md`).

**Page `/dpa`** — Rendre `legal/dpa-pharmaworkspace.md` via `react-markdown`. Ajouter un lien "Télécharger PDF signable" → `/legal/dpa-pharmaworkspace.pdf` (le PDF sera servi statiquement depuis `public/legal/`).

### Acceptance
- [ ] Pages rendent le contenu finalisé issu de `legal/*.md`, plus aucun lorem.
- [ ] Liens internes (vers `/privacy`, `/dpa`, `mailto:dpo@`) fonctionnels.
- [ ] PDF DPA téléchargeable depuis `/dpa`.
- [ ] Mobile + desktop OK.

---

## 🔴 P4-13 — Trial intégré Stripe (CB obligatoire fin onboarding, €0 prélevés 30j, auto-prélèvement J+30)

> 🔄 **Pivot 2 — mai 2026.** On supprime le paywall séparé J+30 et le coupon `BETA2026`. La CB est désormais **obligatoire en 4ᵉ étape du wizard onboarding** (Dim P2-01). Stripe gère le trial→paid en automatique avec `trial_period_days=30`. Le compte est en `subscription_status='incomplete'` tant que la CB n'est pas saisie ; après Checkout, il passe `'trialing'` ; à J+30 Stripe facture automatiquement au tarif Early Adopter -40 % et passe `'active'`. Si paiement échoue → `'past_due'` puis `'canceled'` après les retries Stripe (1 semaine). Pas de page `/paywall` à construire — le middleware redirige juste vers l'étape 4 du wizard ou vers `/billing/reactivate` selon le statut.

> ⬜ **État au 29/05/2026** : aucun code Stripe dans le repo. Migration 0042 absente. C'est le **seul ticket code bloquant du funnel** restant.

### Pourquoi ce ticket
**Pivot 2 — CB validée à l'inscription, trial 30j auto-renouvelé.** L'utilisateur termine le wizard onboarding en saisissant sa CB via Stripe Checkout setup intent. €0 prélevés pendant 30 jours. À J+30 Stripe facture automatiquement le price Early Adopter -40 % à vie sélectionné. Annulable à tout moment depuis le Stripe Customer Portal.

**Pourquoi ce changement par rapport au paywall différé** :
- **Conversion trial→paid 60-70 %** vs 15-25 % en no-CB (benchmarks ChartMogul/OpenView). Compense largement la perte de signups (~30 % au max sur une cible warm).
- **Pas de paywall à construire** : Stripe gère trial→paid auto, code plus simple.
- **Pas de "fantômes" en base** : les comptes incomplete sans CB ne consomment pas de ressources (pas d'accès produit, donc pas de tâches/ordos créées).
- **Standard SaaS B2B** : Linear, Vercel Pro, Loom Business, Cal.com Pro fonctionnent tous comme ça → les pharmaciens ne seront pas surpris.

**Branche** : `feat/p4-13-trial-integrated-stripe`
**Estimation** : 3 jours
**Risque** : moyen-fort (paiement, sensible, plusieurs webhooks à gérer).

### Prérequis Stripe (état au 29/05/2026)

P4-13a setup côté Mehdi — état au 31/05/2026 sur compte dédié `acct_BYa4g24tgM` (test mode, **setup test mode complet**) :
- [x] Compte Stripe FR créé (compte dédié PharmaWorkspace, non activé Live pour l'instant)
- [x] 3 produits (PO/OTM/GO) avec 6 prix Early Adopter -40 % créés en test mode (cf. mémoire `stripe-price-ids-early-adopter`)
- [x] `tax_behavior=exclusive` set sur les 6 prices via Stripe CLI
- [x] Customer Portal Stripe activé (annulation, update CB, switch entre les 6 prices) + URL "After they're done" configurée
- [x] Wizard Billing onboarding complété (Checkout sélectionné)
- [x] Email branding test mode configuré (logo + couleur primaire)
- [x] Webhook endpoint staging configuré sur Stripe Dashboard + signing secret récupéré
- [x] Vercel env vars (Preview + Production) avec keys nouveau compte + 6 price IDs

**Reste pour activation Live (= launch prep, pas P4-13a)** :
- [ ] Trancher statut juridique SAS vs auto-entrepreneur (cf. décisions semaine ligne 1712)
- [ ] KYC business activation Stripe (exige SIRET)
- [ ] Stripe Tax — activation + configuration retenues fiscales par défaut (impossible avant KYC)
- [ ] Re-créer les 6 prices en Live mode (les test prices ne migrent pas) + push env vars Live

### Vérification préalable AVANT de coder
- [ ] `STRIPE_SECRET_KEY` dans `.env.local` (test mode, **nouveau** compte)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` dans `.env.local` (test mode, **nouveau** compte)
- [ ] `STRIPE_WEBHOOK_SECRET` dans `.env.local` (récupéré via Stripe CLI `stripe listen --forward-to localhost:3000/api/stripe/webhook` ou via webhook endpoint configuré)
- [ ] 6 env vars `STRIPE_PRICE_*` configurées (PO/OTM/GO × MONTHLY/YEARLY)

Si manquant → STOP, pousse les env vars d'abord (cf. mémoire `stripe-price-ids-early-adopter` pour les valeurs).

### Fichiers à créer
- `supabase/migrations/0042_pharmacies_stripe_columns.sql`
- `src/lib/stripe/server.ts` (client Stripe SDK)
- `src/lib/stripe/price-ids.ts` (mapping tier+billing → price ID via env vars)
- `src/lib/subscription.ts` (helpers : `canAccessApp`, `getDaysUntilCharge`, `shouldShowTrialBanner`, `shouldShowPastDueBanner`)
- `src/app/api/stripe/checkout-setup/route.ts` (créer session Checkout trial 30j — appelé par `/onboarding/activate` de Dim)
- `src/app/api/stripe/webhook/route.ts` (recevoir événements Stripe)
- `src/app/api/stripe/portal/route.ts` (créer session Customer Portal — pour réactivation + gestion CB)
- `src/app/(app)/onboarding/activate/success/page.tsx` (callback success Stripe — redirect vers `/`)
- `src/app/(app)/billing/reactivate/page.tsx` (page après cancel/unpaid — propose Customer Portal pour réactiver)
- `src/components/app/trial-banner.tsx` (banner soft J-5 dans le dashboard — "pré-prélèvement")

### À faire

**Étape 1** : `npm i stripe @stripe/stripe-js`

**Étape 2** : Migration `0042_pharmacies_stripe_columns.sql`

```sql
-- 0042_pharmacies_stripe_columns.sql
-- Colonnes Stripe pour la gestion trial intégré + auto-prélèvement J+30.

ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- subscription_status reflète l'état Stripe directement :
--   NULL ou 'incomplete' : CB pas encore saisie → onboarding step 4 bloquant
--   'trialing'           : CB saisie, 30j gratuits en cours → accès produit OK
--   'active'             : prélèvement J+30 réussi, abonnement en cours → accès produit OK
--   'past_due'           : prélèvement échoué, Stripe en retry → accès produit OK avec banner alerte
--   'canceled'           : annulé par user via Customer Portal OU retries Stripe épuisés → accès bloqué
--   'unpaid'             : retries Stripe terminés sans succès → accès bloqué (équivalent à canceled)
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS subscription_status text
  CHECK (subscription_status IS NULL OR subscription_status IN (
    'incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
  ));

ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS subscription_tier text
  CHECK (subscription_tier IS NULL OR subscription_tier IN ('po', 'otm', 'go'));

ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS subscription_billing text
  CHECK (subscription_billing IS NULL OR subscription_billing IN ('monthly', 'yearly'));

-- Date où Stripe prélèvera la 1ère facture (= fin du trial). Copié depuis Stripe au webhook.
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS trial_end timestamptz;

-- Date du prochain prélèvement (post-trial). Utile pour afficher "prochain prélèvement le X" en UI.
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- Init : nouvelles pharmacies créées par Dim P2-01 step 1 démarrent en 'incomplete'.
-- L'endpoint /api/onboarding/create-pharmacy de Dim doit setter : subscription_status='incomplete'.
-- (Sinon le middleware ne bloquera pas et l'utilisateur passera la step 4.)

CREATE INDEX IF NOT EXISTS pharmacies_subscription_status_idx
  ON public.pharmacies(subscription_status)
  WHERE subscription_status IN ('incomplete', 'past_due', 'canceled', 'unpaid');

CREATE INDEX IF NOT EXISTS pharmacies_trial_end_idx
  ON public.pharmacies(trial_end)
  WHERE subscription_status = 'trialing';

-- Table d'idempotence webhook : on log chaque event Stripe reçu (signature vérifiée) pour
-- éviter de retraiter le même event si Stripe retry. Clé unique = stripe event id.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  pharmacy_id uuid REFERENCES public.pharmacies(id) ON DELETE SET NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb
);

ALTER TABLE public.stripe_webhook_log ENABLE ROW LEVEL SECURITY;
-- Pas de policy : seul service_role accède (depuis le webhook handler).
```

**Coordination avec Dim P2-01 (§B8 COORDINATION.md)** :
- L'endpoint `/api/onboarding/create-pharmacy` de Dim doit faire `INSERT ... subscription_status='incomplete'`.
- Le helper `getWizardStep()` de Dim lit `pharmacies.subscription_status` pour déterminer si l'étape 4 est nécessaire (`'incomplete'` ou `NULL` → step `'activate'`, sinon `'done'`).
- L'init `trial_end` est faite par Stripe (au webhook `customer.subscription.created`), pas par Dim. Dim ne touche pas `trial_end`.

**Étape 3** : Helpers `src/lib/subscription.ts`

```ts
import type { Pharmacy } from '@/types/pharmacy'

export type SubStatus = 'incomplete' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'

/** Le user peut-il accéder aux routes produit ? */
export function canAccessApp(pharmacy: Pharmacy | null): boolean {
  if (!pharmacy) return false
  const s = pharmacy.subscription_status
  return s === 'trialing' || s === 'active' || s === 'past_due'
}

/** Nombre de jours avant le prochain prélèvement (positif = futur, négatif = passé). */
export function getDaysUntilCharge(pharmacy: Pharmacy): number | null {
  const target = pharmacy.subscription_status === 'trialing'
    ? pharmacy.trial_end
    : pharmacy.current_period_end
  if (!target) return null
  const targetDate = new Date(target)
  const now = new Date()
  return Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/** Faut-il afficher le banner pré-prélèvement (J-5 à J0 du trial end) ? */
export function shouldShowTrialBanner(pharmacy: Pharmacy): boolean {
  if (pharmacy.subscription_status !== 'trialing') return false
  const days = getDaysUntilCharge(pharmacy)
  return days !== null && days >= 0 && days <= 5
}

/** Faut-il afficher l'alerte "paiement échoué" ? */
export function shouldShowPastDueBanner(pharmacy: Pharmacy): boolean {
  return pharmacy.subscription_status === 'past_due'
}
```

**Étape 4** : Modif `src/proxy.ts` — bloc redirect selon wizard step + subscription_status

```ts
// Pseudo-code à intégrer dans src/proxy.ts après l'auth check existant
const wizardStep = await getWizardStep(supabase, userId) // Helper Dim P2-01 (à coordonner)

// Cas 1 : wizard incomplet → redirige vers l'étape courante
if (wizardStep !== 'done'
    && !pathname.startsWith('/onboarding')
    && !pathname.startsWith('/api/stripe')
    && !pathname.startsWith('/auth')) {
  return NextResponse.redirect(new URL(`/onboarding/${wizardStep}`, request.url))
}

// Cas 2 : subscription canceled/unpaid → redirige vers reactivation
const subStatus = pharmacy?.subscription_status
if ((subStatus === 'canceled' || subStatus === 'unpaid')
    && !pathname.startsWith('/billing')
    && !pathname.startsWith('/api/stripe')
    && !pathname.startsWith('/auth')) {
  return NextResponse.redirect(new URL('/billing/reactivate', request.url))
}

// Cas 3 : past_due → on laisse passer mais le TrialBanner affichera l'alerte
// Cas 4 : trialing / active → accès libre
```

**Étape 5** : Page `/onboarding/activate/success` (callback Stripe)

Page minimaliste :
- Titre : "Votre essai 30 jours est activé !"
- Texte : "Premier prélèvement le [trial_end] au tarif Early Adopter -40 % à vie. Vous pouvez annuler à tout moment depuis votre espace facturation."
- Bouton "Accéder à mon espace" → `/`

À l'arrivée :
1. Vérifie que `?session_id` est présent.
2. Vérifie via API que la session Stripe est `complete` et que le webhook a bien tourné (poll `pharmacies.subscription_status` jusqu'à voir `'trialing'`, max 10s avec backoff).
3. Si succès → redirect `/` après 3s ou clic bouton. Si timeout webhook → affiche une banner "On finalise votre activation…" + bouton retry.
4. Émet PostHog `checkout_succeeded` + `onboarding_completed`.

**Étape 6** : Page `/billing/reactivate`

Page pour les utilisateurs en `canceled` ou `unpaid` :
- Titre : "Réactivez votre abonnement"
- Sous-titre : "Votre abonnement a été annulé / suspendu. Réactivez en mettant à jour votre carte ou en souscrivant à nouveau."
- Bouton primaire "Mettre à jour ma carte" → POST `/api/stripe/portal` → redirect Customer Portal Stripe.
- Bouton secondaire `<HotlineCTA context="billing_reactivate" />`.

**Étape 7** : Endpoint `/api/stripe/checkout-setup`

Appelé depuis `/onboarding/activate` (Dim). Reçoit `{ tier, billing }`. Retourne `{ checkout_url }`.

```ts
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { getPriceId } from '@/lib/stripe/price-ids'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })

const BodySchema = z.object({
  tier: z.enum(['po', 'otm', 'go']),
  billing: z.enum(['monthly', 'yearly']),
})

export async function POST(request: Request) {
  // auth check (Supabase getUser)
  const { user, pharmacy, error: authError } = await getAuthedPharmacy(request)
  if (authError || !user || !pharmacy) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = BodySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 422 })

  const priceId = getPriceId(parsed.data.tier, parsed.data.billing)
  if (!priceId) return NextResponse.json({ error: 'Unknown tier/billing' }, { status: 400 })

  const admin = createServiceClient()

  // Crée/récupère le Stripe Customer
  let customerId = pharmacy.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: pharmacy.name,
      metadata: { pharmacy_id: pharmacy.id, user_id: user.id },
    })
    customerId = customer.id
    await admin.from('pharmacies').update({ stripe_customer_id: customerId }).eq('id', pharmacy.id)
  }

  // Crée la session Checkout en mode subscription avec trial 30j et CB obligatoire
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_collection: 'always', // ← CB OBLIGATOIRE pendant le trial
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 30,
      trial_settings: {
        end_behavior: { missing_payment_method: 'cancel' },
      },
      metadata: {
        pharmacy_id: pharmacy.id,
        tier: parsed.data.tier,
        billing: parsed.data.billing,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/activate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/activate`,
    locale: 'fr',
  })

  return NextResponse.json({ checkout_url: session.url })
}
```

**Étape 8** : Endpoint `/api/stripe/webhook`

Events à gérer **dans cet ordre de priorité** :

| Event | Action |
|---|---|
| `checkout.session.completed` | Récupère `subscription_id` de la session → update `pharmacies` avec `stripe_subscription_id`, `subscription_status='trialing'`, `subscription_tier`, `subscription_billing`, `trial_end` (depuis sub.trial_end), `current_period_end` (depuis sub.current_period_end). PostHog `checkout_succeeded`. UPDATE `pharmacy_acquisition.subscribed_at=now()`. |
| `customer.subscription.updated` | Sync `subscription_status`, `trial_end`, `current_period_end` depuis l'event. Couvre les transitions `trialing→active` (prélèvement J+30 réussi), `active→past_due` (échec ponctuel), `past_due→active` (retry réussi), `active→canceled` (annulation via Portal), etc. |
| `customer.subscription.deleted` | `subscription_status='canceled'`. PostHog `subscription_canceled`. |
| `invoice.payment_failed` | `subscription_status='past_due'`. Email alerte à Mehdi (Resend, à câbler plus tard). |
| `invoice.payment_succeeded` | Si c'est le 1er prélèvement post-trial → PostHog `subscription_first_charge_succeeded` (signal fort conversion). |
| `customer.subscription.trial_will_end` | Stripe l'envoie 3 jours avant la fin du trial. Optionnel : envoyer un email custom Resend (Phase 6 P6-01). Pour l'instant, on laisse Stripe gérer son email "trial ending" natif. |

**Important** :
- Vérifie la signature Stripe (`stripe.webhooks.constructEvent`) avant toute action.
- Idempotence : Stripe peut retry. Stocke `stripe_event_id` dans `stripe_webhook_log` (migration 0042) — `INSERT ... ON CONFLICT (stripe_event_id) DO NOTHING` puis check `rowCount` pour skipper si déjà traité.
- DB writes via `createServiceClient` (RLS bypass).

**Étape 9** : Endpoint `/api/stripe/portal`

```ts
const portalSession = await stripe.billingPortal.sessions.create({
  customer: pharmacy.stripe_customer_id!,
  return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/reactivate`,
})
return NextResponse.json({ portal_url: portalSession.url })
```

**Étape 10** : Composant `TrialBanner` (`src/components/app/trial-banner.tsx`)

Composant client en haut du layout `(app)/layout.tsx` (à coordonner avec Dim si layout déjà custom). Affiche selon `subscription_status` :

| État | Banner |
|---|---|
| `trialing` + `days > 5` | Pas de banner. |
| `trialing` + `days <= 5` | **Bleu** : "🗓️ Votre essai se termine dans {days} jours. Premier prélèvement le {trial_end} : {tier_price} HT/mois. [Gérer mon abonnement]" |
| `past_due` | **Orange** : "⚠️ Votre paiement a échoué. Mettez à jour votre carte pour ne pas perdre l'accès. [Mettre à jour]" |
| `active` | Pas de banner. |

PostHog : `trial_banner_shown` (au mount), `trial_banner_clicked` (au clic).

### Test obligatoire (Stripe Test Mode + carte test `4242 4242 4242 4242`)
- [ ] Nouvelle pharmacie via Dim P2-01 → `subscription_status='incomplete'`, middleware bloque sur `/onboarding/activate`.
- [ ] Cliquer "Saisir ma carte" → Stripe Checkout s'ouvre avec trial 30j affiché + price Early Adopter -40 %.
- [ ] Saisir CB test 4242 → redirect `/onboarding/activate/success` → webhook `checkout.session.completed` fired → DB updated en `'trialing'` + trial_end fixé → redirect `/` dashboard.
- [ ] Accès libre au produit pendant le trial.
- [ ] Manipuler `trial_end` à J-5 → banner pré-prélèvement apparaît avec date + montant.
- [ ] Avancer artificiellement la date Stripe (test clock) → événement `customer.subscription.updated` avec `status='active'` → DB sync, banner disparaît.
- [ ] Tester avec CB qui échoue (`4000 0000 0000 0341`) → `past_due` → banner orange affiché → utilisateur peut accéder mais avec alerte.
- [ ] Annuler depuis Customer Portal → `canceled` → next nav redirige sur `/billing/reactivate`.
- [ ] Réactiver via Portal → retour `active` → accès rendu.

### Acceptance
- [ ] Migration `0042` mergée + table `stripe_webhook_log` créée pour idempotence.
- [ ] Endpoint `/api/stripe/checkout-setup` retourne un Checkout valide avec trial 30j et CB obligatoire.
- [ ] Webhook handler gère les 6 events listés + idempotence via `stripe_webhook_log` + signature verify.
- [ ] Middleware redirige correctement selon `subscription_status` (incomplete → activate, canceled/unpaid → reactivate).
- [ ] Pages `/onboarding/activate/success` + `/billing/reactivate` rendent.
- [ ] Banner J-5 (pré-prélèvement) + banner past_due affichés correctement.
- [ ] Tous les events PostHog émis (cf. P4-14 catalogue mergé).
- [ ] `npm run lint && npm run typecheck && npm run build` verts.

### Doc référence
- Stripe trial subscription : https://docs.stripe.com/billing/subscriptions/trials
- Stripe Checkout : https://docs.stripe.com/payments/checkout
- Stripe webhooks : https://docs.stripe.com/webhooks
- Stripe Test Clock : https://docs.stripe.com/billing/testing/test-clocks

---

## Décisions à prendre cette semaine

- [ ] **Pricing final** : confirmer 39/79/129 € HT ou ajuster ? (data : form responses willingness-to-pay médiane ≈ 14,95 € × 5 employés = 75 € → tier Équipe 79 € OK). **🔴 BLOQUE DEV P4-03 (page tarifs)**.
- [ ] **Stack landing** : route group `(marketing)` Next.js OK ? (recommandé).
- [ ] **Modèle financier 12 mois** : bootstrap rentable visé ou seed VC ? Tu peux trancher ça plus tard mais ça impacte la communication landing.
- [ ] **Statut juridique** : SAS créée ou auto-entrepreneur ? Impact Stripe + DPA + facturation.

---

## Setups externes à faire le PREMIER JOUR (débloque DEV)

Ces 4 setups prennent ~30 min cumulées et **débloquent 4 tickets de ton dev**. À faire avant qu'il commence quoi que ce soit qui en dépend.

- [x] ~~**Sentry**~~ — ✅ compte créé, librairie installée, `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` dans `.env.local`. P2-11 débloqué.
- [ ] **GitHub Secrets Supabase** : repo GitHub → Settings → Secrets and variables → Actions → ajouter `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **Débloque DEV P2-10 (build CI)**.
- [x] ~~**PostHog Cloud EU**~~ — ✅ compte créé (région EU), librairie installée, `NEXT_PUBLIC_POSTHOG_KEY` dans `.env.local`, produits activés (Product Analytics + Session Replay + Web Analytics + Surveys + Feature Flags, autocapture/heatmaps OFF). P4-06 débloqué.
- [ ] **Activation `pg_cron`** : Supabase Dashboard → Database → Extensions → activer `pg_cron`. **Débloque DEV P2-05/P2-06 (cron notifs)**.

---

## Recap : ce qui ne TE concerne PAS (à laisser au dev)

Pour info — tickets dans `TODO_DEV.md` :
- Setup CI GitHub Actions (P2-09, P2-10)
- Sentry intégration (P2-11)
- Tests Vitest + Playwright (P2-12, P2-13)
- Headers de sécurité (P2-14)
- Dependabot (P2-15)
- Buckets privés migration (P1-05) — il fait la SQL, toi tu fais le refactor consommateur (P1-06)
- Notification cron jobs (P2-05, P2-06)
- Recherche full-text (P2-03)
- Pagination keyset (P2-04)
- Polish onboarding UI (P2-01)
- work_sessions hors Realtime (P2-17)
- Landing skeleton (P4-01 à P4-05)
- PostHog instrumentation (P4-06)
- 1-pager + landing copy structure (P4-07)
- Feedback in-app (P5-06)

Tu valides chaque PR de ton dev avant merge. Tu lui fais tourner `npm run lint && npm run build` localement, tu lis le diff, tu testes manuellement le golden path.

---

## 🔴 CONSENT-01 — Bandeau cookies + opt-in PostHog (conformité CNIL avant pilote)

> ⚠️ **Section restaurée le 2026-06-11** : l'originale (modification locale non commitée) a été perdue lors d'un `git reset --hard` pendant une session Claude Code. Reconstruite quasi verbatim depuis le contexte de la session. Quelques lignes de fin (après le message de commit du prompt) peuvent manquer.
> **Statut : ✅ FAIT — mergé sur develop (PR #81 + rattrapage PR #83). Modal centrée + widget en cours (PR suivante).**

### Pourquoi ce ticket

Aujourd'hui PostHog dépose le cookie 1st-party `ph_<token>_posthog` sur le domaine `pharmaworkspace.fr` dès la première visite, **sans consentement préalable du visiteur**. Pour les visiteurs non authentifiés sur la landing, cela ne tient pas la recommandation CNIL 2024 :

- Le cookie PostHog n'est pas « strictement nécessaire au service » (exemption ePrivacy art. 82 loi 78-17).
- L'exemption « mesure d'audience » ne s'applique pas, car le Session Replay (même en `replaysSessionSampleRate: 0`) est explicitement considéré par la CNIL comme allant au-delà d'une simple mesure d'audience.

Pour les visiteurs **authentifiés**, c'est OK : cookies Supabase = strictement nécessaires, cookies PostHog = base légale « intérêt légitime » dans le cadre du contrat CGS, mentionnés en privacy policy.

Le risque CNIL d'un contrôle aujourd'hui est faible (premier manquement = avertissement, pas sanction), mais il croît à mesure qu'on ouvre des pilotes — surtout sur la cible pharmaciens, hyper-sensibles aux questions RGPD. Avant le premier pilote signé, on doit être propre.

**Estimation** : 2-3 jours.
**Risque** : moyen (touche `instrumentation-client.ts`, page privacy, landing layout, et toute la mécanique d'init PostHog).
**Branche** : `feat/consent-01-cookie-banner`.

### Architecture cible

Mécanique 2 boutons « Accepter » / « Refuser », apparaît au premier visit non-loggué, mémorise le choix dans un cookie technique 1st-party.

1. **Cookie technique de consentement** `pw_cookie_consent` (1st-party, 13 mois, httpOnly: false côté client lisible) — valeurs `accepted` ou `refused`. C'est un cookie strictement nécessaire au respect du choix de l'utilisateur → pas besoin de consentement pour le poser (jurisprudence CNIL constante).

2. **Bandeau React** `<CookieBanner />` injecté dans `(marketing)/layout.tsx`. Apparaît si `pw_cookie_consent` absent ET utilisateur non authentifié. Style discret (footer fixe, non-bloquant), 2 boutons, lien vers `/cookies` pour détails.

3. **Init PostHog conditionnelle dans `instrumentation-client.ts`** :
   - Si `pw_cookie_consent === 'accepted'` → init PostHog comme aujourd'hui (`localStorage+cookie`).
   - Si `pw_cookie_consent === 'refused'` → ne pas init PostHog du tout (économise quota + zéro cookie analytics posé).
   - Si cookie absent → ne pas init PostHog tant que l'utilisateur n'a pas tranché.
   - Si utilisateur authentifié (cookie Supabase présent) → init PostHog peu importe `pw_cookie_consent`, base légale intérêt légitime contractuel.

4. **Page `/cookies` dédiée** (nouveau fichier `src/app/(marketing)/cookies/page.tsx`) avec tableau exhaustif cookie/finalité/durée/base légale + bouton « Modifier mon choix » qui efface `pw_cookie_consent` et recharge la page (le bandeau réapparaît).

5. **Lien dans le footer** marketing vers `/cookies` (à côté de `/privacy`, `/conditions-generales`, `/dpa`).

6. **Section dédiée dans `legal/privacy.md` et `src/app/(marketing)/privacy/page.tsx`** — article 11 « Cookies et traceurs » avec le même tableau que `/cookies`.

7. **Sentry inchangé** — Sentry ne pose pas de cookies, garde tel quel.

8. **Stripe Checkout / Customer Portal** — cookies posés par stripe.com sur leur domaine, hors de notre périmètre. Mentionner dans le tableau cookies de `/cookies` que des cookies tiers peuvent être posés par Stripe lors d'une visite sur leur domaine (transparence).

### Fichiers à créer

1. **`src/components/marketing/cookie-banner.tsx`** — composant client `'use client'`, lit/écrit le cookie `pw_cookie_consent` via `js-cookie` ou directement via `document.cookie`. Anime apparition depuis le bas. Pas de modal bloquant.

2. **`src/app/(marketing)/cookies/page.tsx`** — page publique avec tableau cookies + bouton « Modifier mon choix ».

3. **`src/lib/consent/cookie-consent.ts`** — utilitaires :
   - `getCookieConsent(): 'accepted' | 'refused' | 'unknown'`
   - `setCookieConsent(value: 'accepted' | 'refused')`
   - `clearCookieConsent()`
   - `shouldInitAnalytics(): boolean` — true si `accepted` OU si user authentifié

4. **`docs/cookies-audit.md`** (interne) — pièce documentaire à présenter en cas de contrôle CNIL : inventaire complet des cookies, justification base légale pour chacun, capture du bandeau, version du composant, date de mise en production.

### Fichiers à modifier

5. **`src/instrumentation-client.ts`** — encapsuler l'init PostHog dans un `if (shouldInitAnalytics())`. Si refus à un moment T, et si l'utilisateur revient et accepte plus tard, déclencher `posthog.init(...)` à ce moment-là via un event custom dispatch depuis `<CookieBanner />` (ou simplement `window.location.reload()` pour rester simple).

6. **`src/app/(marketing)/layout.tsx`** — injecter `<CookieBanner />` en bas.

7. **`src/components/marketing/marketing-footer.tsx`** — ajouter le lien `/cookies`.

8. **`src/app/(marketing)/privacy/page.tsx`** et **`prod/legal/privacy.md`** — ajouter l'article 11 « Cookies et traceurs ».

### Tableau cookies à intégrer dans `/cookies` et `privacy.md`

| Cookie | Domaine | Finalité | Durée | Base légale |
|---|---|---|---|---|
| `sb-<projectref>-auth-token` (et dérivés) | `pharmaworkspace.fr` | Session d'authentification Supabase (JWT) | Session (renouvellement auto) | Strictement nécessaire au service (art. 82 al. 1 loi 78-17) |
| `pw_cookie_consent` | `pharmaworkspace.fr` | Mémorisation du choix de l'utilisateur sur les cookies analytics | 13 mois | Strictement nécessaire au respect du choix |
| `ph_<token>_posthog` | `pharmaworkspace.fr` | Mesure d'audience produit et analyse comportementale via PostHog Cloud EU | 12 mois | Consentement (visiteurs anonymes) / Intérêt légitime contractuel (utilisateurs authentifiés) |
| Cookies Stripe | `stripe.com` (tiers) | Sécurisation paiement et lutte contre la fraude lors de Checkout et Customer Portal | Variable, voir politique Stripe | Strictement nécessaire au service de paiement |

### Texte du bandeau (à utiliser tel quel)

**Texte court** :
> Nous utilisons des cookies pour mesurer l'audience de notre site et améliorer notre produit. Vous pouvez accepter ou refuser — votre choix n'affecte pas l'accès au service. [En savoir plus](/cookies)
>
> [ Accepter ] [ Refuser ]

**Style** : bandeau fixe en bas de page, fond blanc cassé, bordure haute fine, padding aéré, boutons à droite. Ne masque pas le contenu (non-bloquant).

### Acceptance

- [x] Bandeau cookies apparaît au premier visit non-loggué sur n'importe quelle page publique.
- [x] Cliquer « Accepter » → bandeau disparaît, cookie `pw_cookie_consent=accepted` posé, PostHog init au prochain navigateur event.
- [x] Cliquer « Refuser » → bandeau disparaît, cookie `pw_cookie_consent=refused` posé, AUCUN cookie PostHog posé (vérifier dans DevTools → Application → Cookies).
- [x] Page `/cookies` accessible publiquement, tableau exhaustif visible, bouton « Modifier mon choix » fonctionnel.
- [x] Footer marketing inclut le lien `/cookies`.
- [x] `legal/privacy.md` et `src/app/(marketing)/privacy/page.tsx` contiennent l'article 11 (intégré à l'article 10 existant).
- [x] `docs/cookies-audit.md` créé avec inventaire complet.
- [ ] Test : ouvrir navigation privée → visiter `/` → vérifier que SEUL `pw_cookie_consent` (et éventuellement les Supabase si on a forcé un login) sont posés tant qu'on n'a pas accepté.
- [ ] Test : utilisateur authentifié → bandeau jamais affiché (cookie Supabase détecté).
- [ ] Test : utilisateur a accepté puis veut révoquer → `/cookies` → « Modifier mon choix » → cookie effacé → bandeau réapparaît au reload.
- [x] `npm run lint && npm run typecheck && npm run build` verts.
- [x] Test Playwright `e2e/cookie-consent.spec.ts` : couvre les 3 scénarios accept / refuse / revoke (+ 4ᵉ : parcours anonyme complet sans choix).
