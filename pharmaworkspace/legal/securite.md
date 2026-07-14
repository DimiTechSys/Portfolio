---
title: Sécurité & Conformité
version: "2026-06-12"
hash_placeholder: "sha256:TBD-à-calculer-via-scripts/hash-legal.ts"
last_review: "2026-06-12"
applies_to: "/securite"
---

# Sécurité & Conformité de PharmaWorkspace

**Mis à jour le 12 juin 2026.**

PharmaWorkspace traite quotidiennement des données sensibles : transmissions internes d'équipe, ordonnances scannées, ruptures de médicaments, locations de matériel. Le secret professionnel du pharmacien et les obligations RGPD imposent un haut niveau de sécurité.

Cette page décrit en transparence les mesures techniques, organisationnelles et contractuelles que nous mettons en œuvre pour protéger vos données et celles de vos patients.

---

## 1. Hébergement et localisation des données

**Vos données ne quittent pas l'Union européenne.**

| Service | Fournisseur | Région | Type de données |
|---|---|---|---|
| Base de données PostgreSQL | Supabase | `eu-west-3` Paris (France) | Toutes les données métier et patient |
| Stockage de fichiers (pièces jointes, images d'ordonnances, avatars) | Supabase Storage | `eu-west-3` Paris (France) | Fichiers binaires |
| Application web (Next.js) | Vercel | Paris (CDG1) + Francfort (FRA1) | Aucune donnée persistée (stateless) |
| Reconnaissance OCR sur ordonnances | Mistral AI | France métropolitaine | Image d'ordonnance lors du traitement OCR uniquement (non conservée par Mistral) |
| Authentification | Supabase Auth | `eu-west-3` Paris (France) | Comptes utilisateurs, jetons OTP |
| Courriels transactionnels | Resend | Allemagne (UE) | Adresses, contenus des courriels (magic link, invitations, alertes) |
| Paiement | Stripe Payments Europe Ltd. | Irlande (UE) | Token de carte bancaire (jamais la CB en clair) |
| Analytics produit | PostHog Cloud EU | Francfort, Allemagne | Événements utilisateur (texte applicatif masqué, voir §5) |
| Détection d'erreurs | Sentry EU | Francfort, Allemagne | Traces d'erreurs anonymisées (PII scrubbing) |
| Réservation de support / démonstration | Baseflow (hotline.baseflow.fr) | Paris (France) | Nom + courriel + contexte d'origine (aucune Donnée patient) |

**Aucun transfert hors UE/EEE n'est effectué pour les Données patient.** Les sous-traitants dont la maison-mère est aux États-Unis (Supabase, Vercel, Resend, PostHog, Sentry) opèrent dans leurs régions UE et sont contractuellement liés par les Clauses Contractuelles Types UE 2021.

---

## 2. Chiffrement

### 2.1 En transit (TLS 1.3)

L'ensemble des communications est chiffré en TLS 1.3, sans exception :

- Entre le navigateur de votre équipe et l'application (`pharmaworkspace.fr`) ;
- Entre l'application et la base de données (Supabase) ;
- Entre l'application et chaque sous-traitant (Mistral, Resend, Stripe, PostHog, Sentry).

Les protocoles TLS antérieurs (1.0, 1.1, 1.2) sont désactivés sur nos endpoints. La configuration est testable publiquement via SSL Labs.

### 2.2 Au repos (AES-256)

- Base de données PostgreSQL : chiffrement AES-256 transparent par Supabase ;
- Stockage des fichiers (ordonnances, pièces jointes) : chiffrement AES-256 transparent par Supabase Storage ;
- Sauvegardes : chiffrées par les mêmes algorithmes que les données source.

---

## 3. Authentification et gestion des accès

### 3.1 Connexion par lien magique (OTP)

L'authentification PharmaWorkspace repose sur des **liens magiques à usage unique** (One-Time Password par courriel) :

- Aucun mot de passe à mémoriser ou à stocker ;
- Lien valable pendant une durée limitée (typiquement 1 heure) ;
- Usage unique : chaque lien est révoqué après utilisation ;
- Génération via Supabase Auth, transmis via Resend EU.

L'authentification à deux facteurs (2FA) basée sur application sera ajoutée dans une prochaine version.

### 3.2 Sessions et jetons

Les sessions utilisateur sont matérialisées par des **jetons signés cryptographiquement (JWT)**, qui portent l'identifiant de l'officine et le rôle de l'Utilisateur.

- Durée maximale d'une session : 24 heures (renouvellement automatique pendant l'activité) ;
- Révocation immédiate à la déconnexion ;
- Aucune réutilisation possible des jetons révoqués.

### 3.3 Modèle de droits

Chaque Utilisateur est associé à un rôle :

| Rôle | Permissions |
|---|---|
| Titulaire | Création/modification/suppression sur tous les modules, gestion des invitations, configuration de l'officine |
| Pharmacien adjoint | Lecture/écriture sur les modules métier, pas de modification des paramètres officine |
| Préparateur | Lecture/écriture sur les modules métier confiés (tâches, locations) selon configuration |
| Étudiant en pharmacie | Mêmes droits que le préparateur (profil dédié pour le registre de traitement) |
| Rayonniste | Mêmes droits que le préparateur (profil dédié pour le registre de traitement) |

Le principe de **moindre privilège** est appliqué par défaut : un Utilisateur n'a accès qu'aux opérations strictement nécessaires à son rôle.

### 3.4 Cloisonnement multi-tenant (isolation pharmacie)

L'isolation entre officines est garantie au niveau de la base de données par **Row-Level Security (RLS) PostgreSQL** :

- Chaque table contenant des données métier est protégée par une politique RLS qui vérifie l'identifiant d'officine porté par le jeton de session de l'Utilisateur ;
- Il est cryptographiquement impossible qu'une requête issue d'un Utilisateur de l'officine A accède aux données de l'officine B, même en cas de faille applicative.

Les politiques RLS sont :
- Versionnées dans le code source (migrations SQL) ;
- Testées automatiquement à chaque déploiement ;
- Auditées manuellement à chaque modification du schéma.

---

## 4. Audit et journalisation

### 4.1 Journal d'audit applicatif

Les opérations sensibles sont enregistrées dans un **journal d'audit applicatif** dédié, immuable côté Utilisateur, conservé 5 ans :

- Création, modification, suppression d'ordonnances ;
- Accès en lecture aux ordonnances (déploiement progressif) ;
- Modification des invitations et des rôles ;
- Connexions et tentatives échouées.

### 4.2 Journal de connexions

Chaque connexion enregistre : date, heure, adresse IP, agent utilisateur. Ces données sont accessibles à l'Utilisateur pour vérifier l'absence d'accès non autorisé à son compte.

### 4.3 Journaux techniques

Les journaux serveur (requêtes API, erreurs, événements système) sont conservés **30 jours** pour les besoins de diagnostic et de sécurité.

---

## 5. Confidentialité des analytics

PharmaWorkspace utilise PostHog Cloud EU pour mesurer l'usage du produit et améliorer l'expérience. **La configuration est privacy-first par défaut** :

- **Aucun cookie tiers publicitaire** ;
- **Capture automatique désactivée** : les événements sont déclenchés explicitement par le code applicatif, jamais par sniffing automatique ;
- **Session Replay configuré en masquage intégral** : l'ensemble des champs de saisie et du texte affiché est masqué avant tout enregistrement. Concrètement, **aucun nom, médicament ou donnée patient ne peut apparaître dans un enregistrement de session**. Les replays montrent uniquement la structure de l'interface et les interactions (clics, navigations), pas le contenu textuel ;
- **Heatmaps désactivés** ;
- **Région de stockage** : Francfort, Allemagne (PostHog Cloud EU) ;
- **Identification** : aucun utilisateur n'est identifié de manière nominative dans PostHog avant authentification ; après authentification, le hash de son identifiant interne est utilisé (pas de courriel en clair).

---

## 6. Détection d'erreurs (Sentry)

Sentry collecte les traces d'erreurs applicatives à des fins de diagnostic. Configuration :

- **Instance EU** (Francfort) ;
- **PII scrubbing actif** : Sentry filtre automatiquement, avant envoi, les courriels, noms, identifiants et tout champ susceptible de contenir des données identifiantes ;
- **CSP** : les ressources Sentry sont autorisées explicitement dans la Content Security Policy de l'application ;
- **Sample rates** : taux d'échantillonnage ajustés pour limiter la collecte au strict diagnostic ;
- **Rétention** : 90 jours.

---

## 7. Sauvegardes et restauration

- **Point-in-time recovery (PITR)** : Supabase opère des sauvegardes continues permettant de restaurer la base à n'importe quel point dans les 7 derniers jours minimum ;
- **Sauvegardes hebdomadaires** : rétention 30 jours par rotation automatique ;
- **Tests de restauration** : procédure testée à fréquence trimestrielle ;
- **Chiffrement** : les sauvegardes sont chiffrées au repos.

---

## 8. Procédure d'incident

### 8.1 Détection

- **Monitoring 24/7** via Sentry, sondes Vercel et Supabase ;
- **Alerting automatique** sur les seuils critiques (taux d'erreurs, latence, échec de webhook) ;
- **Signalement utilisateur** : bouton in-app de feedback + courriel `security@pharmaworkspace.fr`.

### 8.2 Triage et réponse

- Triage initial sous 2 heures ouvrées ;
- Containment immédiat des incidents critiques (révocation d'accès, blocage IP, rollback) ;
- Communication aux clients impactés en cas d'incident user-facing.

### 8.3 Notification CNIL et clients

En cas de violation de Données à caractère personnel au sens de l'article 4(12) du RGPD :

- **Notification au Responsable de traitement (l'officine cliente)** sous 48 heures, conformément à l'article 6 du DPA ;
- **Notification à la CNIL** sous 72 heures lorsque la violation est susceptible d'engendrer un risque pour les droits et libertés des personnes (article 33 du RGPD) ;
- **Notification aux personnes concernées** si la violation est susceptible d'engendrer un risque élevé (article 34 du RGPD).

### 8.4 Retour d'expérience

Chaque incident significatif fait l'objet d'un post-mortem documenté en interne, partagé avec les clients impactés.

---

## 9. Politique sur les Données de santé : voie pragmatique

Le Service est susceptible de contenir des **données concernant la santé** au sens de l'article 4(15) du RGPD (noms de patients sur ordonnances, médicaments prescrits, ruptures liées à un patient).

À ce jour, PharmaWorkspace **n'est pas certifié HDS (Hébergement de Données de Santé)** au sens de l'article L.1111-8 du Code de la santé publique. Notre posture, **transparente avec nos clients**, est la suivante :

### 9.1 Mesures compensatoires renforcées

- Hébergement exclusif en France (Supabase région Paris) ;
- OCR confié exclusivement à **Mistral AI** (société française) ;
- Aucun transfert des Données patient hors UE ;
- Mesures techniques et organisationnelles renforcées (Annexe 3 du DPA) ;
- DPO interne désigné, joignable à `support@pharmaworkspace.fr` ;
- Engagement contractuel formalisé dans le DPA (article 10) ;
- Journal d'audit applicatif sur les ordonnances avec rétention 5 ans.

### 9.2 Responsabilité partagée et information du Client

L'officine cliente, en tant que Responsable de traitement, garde la décision d'utiliser ou non PharmaWorkspace pour traiter des Données patient, en pleine connaissance de cause :

- Le DPA précise (article 10) que le Client reconnaît expressément l'absence de certification HDS ;
- Le Client est libre, à tout moment, de demander une migration vers un hébergeur HDS certifié sous réserve d'un délai raisonnable et d'un avenant éventuel ;
- Le Client est invité à n'utiliser le Service que pour les données strictement nécessaires à l'organisation interne de l'officine (sans systématisation de la collecte de noms patient lorsque ce n'est pas indispensable).

### 9.3 Évolution vers HDS

Une migration vers un hébergeur certifié HDS est envisagée à moyen terme, dès lors que la base installée de PharmaWorkspace le justifie économiquement. Cette évolution sera notifiée aux clients par avance, sans rupture de service, et fera l'objet d'une communication transparente.

---

## 10. Conformité réglementaire

| Texte | Application |
|---|---|
| RGPD (Règlement UE 2016/679) | Applicable à l'ensemble du traitement : DPO désigné, registre tenu, droits des personnes mis en œuvre |
| Loi Informatique et Libertés (loi 78-17 modifiée) | Applicable en complément du RGPD pour les spécificités françaises |
| Code de la santé publique : secret professionnel applicable au système de santé (art. L.1110-4) et Code de déontologie des pharmaciens (art. R.4235-1 et s.) | Respecté côté Sous-traitant ; rappelé contractuellement au Client |
| Code de la santé publique : hébergeur de données de santé (art. L.1111-8) | Voie pragmatique décrite au §9 ci-dessus |
| Code de commerce : conservation des factures (art. L.123-22) | Conservation 10 ans des factures |
| PCI-DSS Level 1 | Conformité héritée de Stripe (aucune donnée CB en clair côté PharmaWorkspace) |

---

## 11. Sous-traitants et chaîne de confiance

L'ensemble des sous-traitants ultérieurs est listé à l'**Annexe 2 du DPA** (`/dpa`). Toute évolution fait l'objet d'une notification préalable aux clients avec faculté d'opposition.

Pour chaque sous-traitant, un DPA est signé avec les engagements de :

- Localisation des données dans l'UE/EEE ;
- Mesures de sécurité au moins équivalentes aux nôtres ;
- Notification immédiate de toute violation ;
- Restitution ou suppression des données en fin de contrat ;
- Audit possible sur demande raisonnable.

---

## 12. Tests et qualité logicielle

- **Intégration continue (CI)** : chaque Pull Request déclenche automatiquement les vérifications lint, typecheck et build, dont l'échec bloque la fusion ;
- **Tests automatisés** : la mise en place d'une suite de tests unitaires sur la logique métier critique et d'une suite de tests de bout en bout sur les parcours essentiels (connexion, création de tâche, scan d'ordonnance, signalement de rupture, levée de rupture) est en cours ;
- **Politique de fusion (branch protection)** : toute modification du code de production passe par une Pull Request soumise à une politique de protection de branche (revue préalable obligatoire avant toute fusion) ;
- **Mise à jour des dépendances** : veille automatisée sur les dépendances avec proposition automatique des correctifs de sécurité ; revue régulière des vulnérabilités signalées par les outils d'audit ;
- **Headers de sécurité HTTP** : CSP, X-Frame-Options, Referrer-Policy, Strict-Transport-Security, Permissions-Policy configurés selon les recommandations OWASP.

---

## 13. Engagement de transparence

Nous nous engageons à communiquer ouvertement sur notre dispositif de sécurité. Toute modification substantielle de cette page est publiée avec un identifiant de version permettant de tracer son évolution dans le temps.

Nous publierons à terme une page d'état (status page) publique reflétant en temps réel la disponibilité du Service et les incidents en cours.

---

## 14. Contact sécurité

Pour toute question, signalement de vulnérabilité, demande d'audit ou inquiétude relative à la sécurité :

- **Contact général sécurité** : `security@pharmaworkspace.fr`
- **DPO** : `support@pharmaworkspace.fr`
- **Adresse postale** : [À COMPLÉTER : adresse du siège social, mention « Sécurité » ou « DPO »]

Les signalements responsables de vulnérabilités sont les bienvenus et seront traités avec célérité et discrétion. Nous nous engageons à ne pas poursuivre les chercheurs en sécurité agissant de bonne foi conformément aux principes du « responsible disclosure ».

---

*Document publié le 12 juin 2026. Version 2026-06-12.*
