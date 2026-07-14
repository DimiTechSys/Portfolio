# Flagship — Backoffice concession automobile

Stack : **Next.js 15** · **Supabase** · **Tailwind CSS** · **Vercel**

---

## Démarrage rapide

### 1. Installer les dépendances
```bash
npm install
```

### 2. Créer le projet Supabase
1. Va sur [supabase.com](https://supabase.com) → New project
2. Dans **SQL Editor**, colle et exécute le fichier `supabase/migrations/001_schema.sql`
3. Récupère les clés dans **Settings → API**

### 3. Variables d'environnement
```bash
cp .env.local.example .env.local
# Remplis NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 4. Lancer en local
```bash
npm run dev
# → http://localhost:3000
```

---

## Déploiement Vercel

```bash
npm install -g vercel
vercel
# Ajoute les variables d'env dans le dashboard Vercel
```

---

## Structure du projet

```
src/
├── app/
│   ├── dashboard/       # Vue d'ensemble + alertes
│   ├── parc/            # Gestion du parc véhicules
│   │   ├── page.tsx     # Liste + filtres
│   │   ├── [id]/        # Fiche détaillée
│   │   └── nouveau/     # Formulaire d'ajout
│   ├── crm/             # Clients
│   ├── devis/           # Devis & factures
│   ├── social/          # Instagram automation
│   ├── veille/          # Prix concurrents
│   ├── financement/     # Simulateur mensualités
│   └── v/[plate]/       # Fiche publique client (lien partageable)
├── components/
│   ├── ui/              # Badge, Button, Card, Input...
│   └── layout/          # Sidebar
├── lib/
│   ├── supabase/        # client.ts + server.ts
│   ├── data/            # CRUD vehicles, clients, documents
│   └── utils.ts         # formatPrice, calcMargin, calcMonthlyPayment...
└── types/               # Types TypeScript complets
```

---

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/dashboard` | KPIs, alertes, activité récente |
| Parc | `/parc` | Liste, fiche, ajout véhicule |
| CRM | `/crm` | Clients, historique achats |
| Devis/Factures | `/devis` | Création, conversion, lien paiement |
| Réseaux sociaux | `/social` | Publication Instagram, automatisation |
| Veille | `/veille` | Comparaison prix concurrents |
| Financement | `/financement` | Simulateur mensualités multi-partenaires |
| Fiche publique | `/v/[plate]` | Page partageable côté client |

---

## Prochaines étapes (post-MVP)

- [ ] Auth Supabase (login page + middleware)
- [ ] Upload photos véhicules (Supabase Storage)
- [ ] Génération PDF des devis/factures
- [ ] Intégration Instagram Graph API
- [ ] Scraping concurrents (La Centrale, LeBonCoin)
- [ ] Notifications email (Resend)
- [ ] Multi-concessions (row-level par `dealership_id`)
