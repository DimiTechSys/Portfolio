# La Mie Dorée — Boulangerie premium sur catalogue (Alger)

Application web à deux faces, partageant la même base de données.

### Langues (i18n)

Vitrine bilingue via **next-intl** (même approche que le projet `Capital_Transfer`) :
**français** (par défaut, à `/`) et **anglais** (`/en`). Le sélecteur de langue est dans la
barre de navigation. Les textes d'interface sont dans `messages/{fr,en}.json` ; le contenu
du catalogue (noms, descriptions) reste tel qu'il est saisi au back-office. **Le back-office
n'est pas traduit** (outil interne, en français, hors i18n).

### Vitrine publique (3 pages)

Devanture digitale haut de gamme (héros sombre & doré) :

- **Catalogue** (`/`) — page principale : héros + tous les produits par catégorie. Chaque
  carte mène à la page produit. Une section **« Être recontacté »** (prénom, nom, téléphone
  + message optionnel) + appel direct + WhatsApp clôt la page.
- **Page produit** (`/produit/[id]`) — visuel, nom, catégorie, prix, description, bouton
  **« Commander sur WhatsApp »** pré-rempli, appel direct, et la section de rappel.
- **Notre Maison** (`/maison`) — histoire et positionnement premium.
- **Espace gérant** (`/admin`) : protégé par authentification serveur. Quatre sections :
  - **Tableau de bord** — demandes à rappeler, chiffre d'affaires, bénéfice, marge moyenne.
  - **Demandes** — les formulaires reçus, avec statut (À rappeler / Rappelé / Converti /
    Sans suite) et boutons appel/WhatsApp.
  - **Catalogue** — ajout/modification des produits (nom, catégorie, photo, prix, **coût
    de production**, visibilité). Les coûts ne sont **jamais** exposés côté public.
  - **Commandes** — saisie des commandes validées et **calcul automatique** du CA, du
    coût et du bénéfice (`bénéfice = prix de vente − coût de production`).
  - **Paramètres** — nom de l'enseigne, accroche, WhatsApp, téléphone, ville, et
    changement de mot de passe.

## Stack

Next.js 16 (App Router) · React 19 · **next-intl** (fr/en) · Prisma 7 (adapter libSQL) ·
SQLite (dev) · Tailwind 4 · TypeScript.

Arborescence : `app/(site)/[locale]/…` pour la vitrine localisée, `app/(admin)/admin/…`
pour le back-office (root layouts séparés). Config i18n dans `i18n/`, `middleware.ts` et
`messages/`.

## Démarrage

```bash
npm install
npm run setup     # génère le client Prisma, crée la base et insère le catalogue d'exemple
npm run dev       # http://localhost:3000
```

Identifiants par défaut du back-office : mot de passe **`maison2026`** (à changer dans
*Espace gérant → Paramètres*). Modifiable au seed via la variable `ADMIN_PASSWORD`.

### Variables d'environnement (`.env`)

| Variable         | Rôle                                                              |
| ---------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`   | Connexion utilisée par la CLI Prisma (migrations). `file:./dev.db` |
| `SESSION_SECRET` | Secret de signature des cookies de session. **À changer en prod.** |
| `ADMIN_PASSWORD` | Mot de passe initial du back-office (utilisé uniquement au seed).  |

## Photos des produits

Les photos sont servies depuis `public/products/`. Pour les produits d'exemple, déposez
les fichiers avec **exactement** ces noms :

| Produit | Fichier à déposer |
| ------- | ----------------- |
| Éclair au café | `public/products/eclair-cafe.jpg` |
| Pain au chocolat | `public/products/pain-au-chocolat.jpg` |
| Plateau petit-déjeuner signature | `public/products/plateau-boulanger.jpg` |

Pour tout autre produit, renseignez le champ **Photo** au back-office : soit un chemin local
(`/products/mon-fichier.jpg` après dépôt du fichier dans `public/products/`), soit une URL
d'image complète (`https://…`).

## Calcul des marges

Le bénéfice est `prix de vente − coût de production`. Exemple : un croissant vendu
80 DA qui coûte 35 DA à produire dégage **45 DA** de bénéfice. Les prix et coûts sont
**figés (snapshot)** à la saisie de chaque commande, pour que l'historique des marges
reste juste même si le catalogue change ensuite.

## Sécurité & passage en production

- Le back-office est protégé **côté serveur** : mot de passe haché (scrypt) en base,
  session via cookie **httpOnly** signé HMAC. Les coûts/marges ne transitent jamais
  côté client public.
- Pour la mise en ligne : passez le `provider` Prisma de `sqlite` à `postgresql`
  (comme le projet `Capital_Transfer`), définissez un `SESSION_SECRET` aléatoire long,
  et servez en HTTPS (les cookies passent alors en `secure`).
- Le numéro WhatsApp se saisit au **format international sans `+`** (ex. `213555000000`).

## Scripts

| Script           | Action                                              |
| ---------------- | --------------------------------------------------- |
| `npm run dev`    | Serveur de développement.                           |
| `npm run setup`  | `prisma generate` + `db push` + seed.               |
| `npm run db:seed`| (Re)insère paramètres et catalogue d'exemple.       |
| `npm run build`  | Build de production.                                |
