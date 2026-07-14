<h1 align="center">Portfolio — Dimitri Voissier</h1>

<p align="center">
  Développeur web full-stack. Je conçois et livre des <strong>applications web sur mesure</strong> :<br/>
  vitrines premium, back-offices métier et SaaS complets.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white" alt="Prisma"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python"/>
</p>

---

Ce dépôt regroupe une sélection de mes projets, chacun dans son propre dossier.

## 🚀 Projets

| Projet | En bref | Stack principale | Dossier |
|---|---|---|---|
| **PharmaWorkspace** | SaaS B2B pour officines : tâches, OCR d'ordonnances par IA, ruptures de stock, commandes fournisseurs — multi-tenant | Next.js 16 · Supabase · Stripe · Mistral OCR | [`/pharmaworkspace`](./pharmaworkspace) |
| **La Mie Dorée** | Catalogue premium + back-office pour une boulangerie de prestige (Alger), bilingue FR/EN | Next.js 16 · Prisma · next-intl | [`/boulangerie`](./boulangerie) |
| **Capital Transfer** | Réservation de chauffeur privé à Paris : tarif fixe, paiement, SMS de confirmation | Next.js 16 · Stripe · Twilio · Leaflet | [`/capital-transfer`](./capital-transfer) |
| **MBCZ Drive** | Vitrine + prise de contact pour un service de chauffeur privé Mercedes | React · Vite · Drizzle · Neon | [`/mbczdrive`](./mbczdrive) |
| **Flagship** | Back-office de concession automobile : stock, ventes, tableaux de bord | Next.js 15 · Supabase · Recharts | [`/flagship`](./flagship) |
| **Nosoclean** | Assistant IA en hygiène professionnelle : chat en streaming + reconnaissance vocale | Vite · React · Claude API | [`/nosoclean`](./nosoclean) |
| **Ostéopathe.pro** | Site vitrine pour un cabinet d'ostéopathie | Next.js 16 · Tailwind | [`/osteopathe`](./osteopathe) |
| **Occitanie Verte** | Site vitrine pour un paysagiste — statique, optimisé SEO | HTML · CSS · JS | [`/occitanie-verte`](./occitanie-verte) |
| **Robotique** | Portfolio académique « Futur Ingénieur en Robotique » (ESIEA) — projets Raspberry Pi & Arduino | React · Vite | [`/robotique`](./robotique) |

> 💡 *Ajoute ici les liens de démo (Vercel, etc.) quand tes projets sont déployés.*

---

## 🧩 En détail

### PharmaWorkspace — SaaS pour pharmacies
Plateforme SaaS **multi-tenant** (une officine = un espace isolé) qui digitalise le quotidien
d'une pharmacie : gestion des tâches, lecture d'ordonnances par **OCR IA**, suivi des **ruptures
de stock** (scan CIP13 + synchro ANSM), commandes fournisseurs, location de matériel médical,
agenda et notifications temps réel.
**Stack :** Next.js 16 (App Router) · Supabase (Auth, Postgres, Storage, Realtime) ·
TanStack Query · Stripe · OCR Mistral · Sentry · PostHog.

### La Mie Dorée — Boulangerie premium
Application à **deux faces** partageant la même base : une **vitrine bilingue** (héros sombre &
doré, catalogue, commande via WhatsApp pré-rempli) et un **back-office gérant** protégé
(tableau de bord CA/marge, gestion du catalogue et des coûts de production, suivi des commandes).
**Stack :** Next.js 16 · Prisma · next-intl (FR/EN) · Tailwind 4.

### Capital Transfer — Chauffeur privé Paris
Service de réservation VTC haut de gamme : sélection du trajet sur **carte interactive**,
**tarif fixe** confirmé avant départ, **paiement en ligne** et **SMS** de confirmation.
**Stack :** Next.js 16 · Stripe · Twilio · React-Leaflet · Resend.

### MBCZ Drive — Transferts Mercedes
Vitrine élégante et formulaire de contact validé pour un service de chauffeur privé haut de gamme
(transferts aéroport, événements, déplacements d'affaires).
**Stack :** React · Vite · Drizzle ORM · Neon · Radix UI.

### Flagship — Back-office concession auto
Outil interne pour une concession : gestion du stock de véhicules, suivi des ventes et
**tableaux de bord** graphiques.
**Stack :** Next.js 15 · Supabase · Recharts · Tailwind.

### Nosoclean — Assistant IA hygiène
Chatbot spécialisé en hygiène professionnelle : réponses **en streaming**, **reconnaissance
vocale** en français et contexte métier dédié.
**Stack :** Vite · React · API Claude (Anthropic) · Express.

### Ostéopathe.pro & Occitanie Verte — Sites vitrines
Deux sites vitrines orientés conversion : présentation des services, référencement soigné et
prise de contact. Ostéopathe.pro en **Next.js**, Occitanie Verte en **statique** ultra-léger et
optimisé SEO.

### Robotique — Portfolio académique
Page unique présentant mes projets robotique à l'ESIEA (prototype de camion de pompier sur
Raspberry Pi, maison intelligente sur Arduino).
**Stack :** React · TypeScript · Vite.

---

## 🛠️ Compétences

**Frontend** — React 19, Next.js (App Router), TypeScript, Tailwind CSS, Radix / shadcn/ui
**Backend** — Supabase, Prisma, Drizzle, PostgreSQL (Neon), API Routes, Stripe, Twilio, Resend
**IA** — Intégration Claude & Mistral (OCR, chat streaming, reconnaissance vocale)
**Outillage** — Vite, i18n (next-intl), Playwright, Python

---

## 📫 Contact

📧 **baseflow.fr@gmail.com**
