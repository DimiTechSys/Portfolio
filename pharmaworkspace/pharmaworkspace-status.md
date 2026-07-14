# PharmaWorkspace — État du projet (Mis à jour le 2 mai 2026)

## Vue d'ensemble

PharmaWorkspace est une plateforme SaaS B2B de nouvelle génération conçue spécifiquement pour les officines pharmaceutiques françaises. Elle transforme la gestion quotidienne de l'équipe officine en centralisant les flux critiques : tâches, ordonnances, commandes, locations de matériel, ruptures de stock et documentation qualité.

**Stack Technique Ultra-Moderne** : 
- **Framework** : Next.js 16.2 (App Router)
- **UI** : React 19 + Tailwind CSS 4 + shadcn/ui + Framer Motion
- **Backend & Auth** : Supabase (PostgreSQL + Auth OTP Email + Real-time)
- **Intelligence** : OpenAI GPT-4o-mini (OCR & Analyse)
- **Déploiement** : Vercel (Edge Runtime)

---

## Fonctionnalités Complétées

### 1. Dashboard Intelligent & Pilotage
- **KPIs en Temps Réel** : Visualisation immédiate des tâches urgentes, ordonnances en attente, ruptures critiques et locations en retard.
- **Notes de Transmission** : Système de post-it numériques pour assurer la continuité entre les équipes (matin/après-midi).
- **Sessions de Travail** : Suivi des présences et des activités en cours.
- **Alerte ANSM** : Flux direct des dernières ruptures nationales critiques.

### 2. Gestion du Profil Utilisateur (Nouveau) 👤
- **Interface Dédiée** : Espace personnel pour gérer les informations (nom, prénom, nom d'affichage).
- **Photo de Profil (Avatar)** : Support de l'upload d'images vers Supabase Storage avec redimensionnement automatique.
- **Synchronisation en Temps Réel** : Les changements sont répercutés instantanément sur le Dashboard et la Header bar.
- **Accès Mobile** : Trigger intégré dans le Header mobile via une barre flottante profilée.

### 3. Agenda Global 📅
- **Vue Unifiée** : Un calendrier unique regroupant les tâches, les retours de location prévus, les livraisons de commandes et les résolutions de ruptures.
- **Coordination d'Équipe** : Permet au titulaire de visualiser la charge de travail hebdomadaire en un coup d'œil.

### 4. Annuaire Officinal 📖
- **Gestion des Contacts** : Base de données centralisée des fournisseurs, médecins locaux, laboratoires, EHPAD et infirmiers.
- **Catégorisation** : Recherche rapide par métier ou type de partenaire.

### 5. Qualité & Procédures 🎓
- **Centre de Formation** : Hébergement de vidéos tutorielles pour l'utilisation du matériel ou les protocoles de soins.
- **Base Documentaire** : Gestion des mémos, procédures SOP (Standard Operating Procedures) et documents PDF/Images.
- **Gestion de Publication** : Contrôle de la visibilité des ressources pour l'équipe.

### 6. Ordonnances & OCR Haute Précision
- **Extraction IA** : OCR automatisé via GPT-4o-mini extrayant le nom du patient, les médicaments, dosages et quantités.
- **Suivi Prescription** : Liaison automatique avec la base médicaments BDPM.
- **Archivage** : Historique complet avec filtres avancés et export CSV.

### 7. Ruptures de Stock & Scanner
- **Scanner CIP13** : Utilisation de la caméra (mobile/desktop) pour scanner les boîtes en rupture.
- **Intelligence BDPM** : Résolution automatique du nom du médicament via le code CIP13 (base de 20 744 références).
- **Synchronisation ANSM** : Détection automatique si la rupture est déclarée au niveau national (1 031 ruptures officielles suivies).

### 8. Gestion des Commandes & Fournisseurs
- **Flux Complet** : De la création de la liste de besoins à la réception.
- **Multi-Lignes** : Gestion de paniers produits complexes avec suivi des statuts.

### 9. Locations de Matériel
- **Suivi E2E** : Date de sortie, date de retour prévue, et alertes automatiques en cas de retard ("Overdue").
- **Tarification** : Calcul automatique basé sur les daily rates.

### 10. Centre de Notifications 🔔
- **Alertes Contextuelles** : Notifications immédiates pour les tâches assignées, les nouvelles ruptures signalées et les rappels de location.
- **Système de Lecture** : Marquage individuel ou global pour une gestion fluide.

---

## Intelligence & Données Officinales

- **OCR Engine** : Architecture abstraite supportant OpenAI (actif), avec stubs pour Claude Vision et Ollama.
- **Base Médicaments (BDPM)** : Intégration de l'intégralité des médicaments commercialisés en France (20k+ entrées).
- **Drug Shortages (ANSM)** : Base de données synchronisée des ruptures de stock nationales pour un conseil patient optimisé.

---

## Infrastructure & Sécurité

- **Authentification sans mot de passe** : Sécurité renforcée via OTP Email (Magic Links / Codes).
- **Sécurité des données (RLS)** : Row Level Security activé sur Supabase — isolation stricte des données entre officines.
- **Performance** : Utilisation intensive du `ProfileContext` et de `React Query` pour une interface instantanée (0ms latency perçue).
- **Conformité** : Codebase validée avec 0 erreurs ESLint, build de production optimisé.

---

## Architecture Logicielle

```text
src/
├── app/
│   ├── (auth)/          # Flux de connexion OTP
│   ├── (onboarding)/    # Création d'officine et profil
│   ├── (app)/           # Cœur de l'app (Dashboard, Agenda, Ruptures...)
│   └── api/             # Endpoints OCR, Invitations, Webhooks
|   |── profile/         # Gestion du profil (Nouveau)
├── components/
│   ├── shared/          # Composants UI génériques (DataTable, Drawer)
│   ├── layout/          # Navigation (Desktop Sidebar, Mobile BottomBar)
│   ├── profile/         # Formulaires et gestion d'avatar (Nouveau)
│   └── [module]/        # Composants spécifiques par métier
├── features/            # Logique métier encapsulée (Hooks + Types)
├── lib/
│   ├── queries/         # Requêtes Supabase optimisées
│   └── supabase/        # Configuration client/serveur
└── types/               # Typage TypeScript strict
```

---

## Roadmap & Prochaines Étapes

### Court Terme (Pilote Terrain)
- [x] Finalisation de la version mobile (Bottom Navigation Bar).
- [x] Optimisation de la hiérarchie typographique.
- [x] Gestion complète du profil utilisateur et avatar.
- [ ] Tests de charge sur l'OCR multi-pages.

### V1.2 (Post-Lancement)
- **Mises à jour automatiques** : Script hebdomadaire pour rafraîchir la base BDPM/ANSM sans intervention.
- **Export Comptable** : Liaison des commandes avec des exports formatés pour les logiciels de comptabilité.

### V2.0 (Vision Future)
- **PILL Chat** : Assistant IA permettant de poser des questions en langage naturel sur les données de l'officine ("Combien de locations en retard ?", "Qui a fini ses tâches ?").
- **Intégration LGO** : Connecteurs avec les principaux logiciels de gestion d'officine (SmartRx, LGPI, Winpharma).

---

*Dernière révision : 2 mai 2026 par Antigravity AI*
