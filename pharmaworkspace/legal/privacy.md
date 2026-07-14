---
title: Politique de Confidentialité
version: "2026-06-12"
hash_placeholder: "sha256:TBD-à-calculer-via-scripts/hash-legal.ts"
last_review: "2026-06-12"
applies_to: "/privacy"
---

# Politique de Confidentialité de PharmaWorkspace

**Version du 12 juin 2026.** En vigueur depuis le 12 juin 2026.

La présente Politique de Confidentialité (ci-après la « **Politique** ») a pour objet d'informer les utilisateurs du site `https://pharmaworkspace.fr` et du service PharmaWorkspace (ci-après ensemble le « **Service** ») de la manière dont sont collectées, traitées, conservées et protégées les données à caractère personnel les concernant, conformément au Règlement (UE) 2016/679 du 27 avril 2016 (ci-après le « **RGPD** ») et à la loi n° 78-17 du 6 janvier 1978 modifiée relative à l'informatique, aux fichiers et aux libertés.

---

## 1. Identité du Responsable de traitement

Le Responsable de traitement au sens de l'article 4(7) du RGPD est :

**[À COMPLÉTER : raison sociale]**
Forme juridique : [SAS / SARL / EURL / EI]
Capital social : [montant] €
SIREN : [9 chiffres]
RCS : [Ville et numéro]
Siège social : [adresse postale complète]
Représentant légal : Mehdi BELMIHOUB
Adresse électronique : `support@pharmaworkspace.fr`

Pour les traitements relatifs aux Données patient saisies dans le Service par les officines clientes, **l'officine cliente est Responsable de traitement** et l'Éditeur agit en qualité de Sous-traitant au sens de l'article 4(8) du RGPD. Les modalités de ce traitement sont régies par l'Accord de Sous-Traitance (DPA), accessible à l'adresse `/dpa`.

---

## 2. Délégué à la Protection des Données (DPO)

Un Délégué à la Protection des Données (DPO) a été désigné en interne :

**Mehdi BELMIHOUB**
Adresse électronique : `support@pharmaworkspace.fr`
Adresse postale : [adresse du siège social, mention « À l'attention du DPO »]

Le DPO est l'interlocuteur privilégié pour toute question relative au traitement de vos données personnelles et à l'exercice de vos droits.

---

## 3. Catégories de données collectées

L'Éditeur collecte et traite trois catégories de données personnelles, selon votre interaction avec le Service :

### 3.1 Visiteurs du site (pages publiques)

Lorsque vous consultez les pages publiques du site (`/`, `/tarifs`, `/securite`, `/privacy`, `/dpa`, `/conditions-generales`), les données suivantes peuvent être collectées :

- **Données de navigation** : adresse IP, type de navigateur, système d'exploitation, langue, pages consultées, durée de la visite, source de provenance (referrer), paramètres UTM le cas échéant ;
- **Données d'événements** : clics sur les boutons d'appel à l'action, formulaires entamés mais non soumis, scrolls de page (via PostHog, voir article 10) ;
- **Données techniques d'incident** : traces d'erreurs JavaScript anonymisées (via Sentry, voir article 10).

Aucune donnée nominative n'est demandée pour la simple consultation du site.

### 3.2 Prospects (inscription)

Lorsque vous soumettez le formulaire d'inscription à l'adresse `/signup`, les données suivantes sont collectées :

- Adresse électronique professionnelle ;
- Langue préférée (fr/en) ;
- Identifiant de version des Conditions Générales de Service et de l'Accord de Sous-Traitance acceptés par case à cocher (« click-wrap »), avec leur empreinte cryptographique respective ;
- Horodatage de l'acceptation ;
- Adresse IP et agent utilisateur (user agent) au moment de l'acceptation ;
- Paramètres de provenance : source, campagne, médium, terme, contenu (UTM) ;
- Page de référence (referrer).

Ces données sont conservées à des fins probatoires (article 7 du RGPD : démonstration du consentement) et statistiques (mesure du parcours d'inscription).

### 3.3 Utilisateurs authentifiés

Lorsque vous créez votre compte Utilisateur dans le Service (après validation OTP du courriel d'inscription), les données suivantes sont collectées dans le cadre du parcours d'onboarding et de l'utilisation courante du Service :

**Données d'identification** :
- Prénom, nom ;
- Adresse électronique professionnelle ;
- Rôle dans l'officine (titulaire, pharmacien adjoint, préparateur, étudiant en pharmacie, rayonniste) ;
- Avatar (image de profil, facultatif) ;
- Identifiant unique généré par l'authentification Supabase (UUID).

**Données d'officine** :
- Nom de l'officine ;
- Adresse postale (champ libre, saisie facultative) ;
- Numéro FINESS (facultatif) ;
- Date de création du compte.

**Données métier** (saisies dans l'application) :
- Tâches de transmission, locations de matériel médical, contenus de formation interne ;
- Ordonnances scannées (images), texte extrait par OCR ;
- Ruptures de médicaments signalées (avec codes CIP13) ;
- Pièces jointes (fichiers PDF, images) téléversées par les Utilisateurs ;
- Messages de feedback envoyés depuis le bouton in-app.

**Données techniques et d'audit** :
- Historique de connexions (date, IP, agent utilisateur) ;
- Journal d'audit applicatif (opérations sensibles sur les ordonnances) ;
- Sessions actives (jetons d'authentification JWT) ;
- Préférences utilisateur (langue, paramètres d'affichage).

**Données de facturation** :
- Identifiant client Stripe ;
- Identifiant d'abonnement Stripe ;
- Tarif souscrit, billing (mensuel/annuel), date de fin de période d'essai, date de prochain prélèvement, statut de l'abonnement.

**L'Éditeur ne stocke à aucun moment les coordonnées complètes de la carte bancaire.** Seul un identifiant tokenisé Stripe est conservé.

### 3.4 Données particulières (« données de santé »)

Le Service est susceptible de contenir, parmi les données saisies par les Utilisateurs, des **données concernant la santé** au sens de l'article 4(15) du RGPD : noms de patients figurant sur des ordonnances scannées, médicaments prescrits, identification de patients en attente d'un traitement en rupture.

Le traitement de ces données est encadré par l'Accord de Sous-Traitance (DPA), dans lequel l'officine cliente conserve la qualité de Responsable de traitement. L'Éditeur agit comme Sous-traitant et met en œuvre les garanties techniques renforcées détaillées dans la page `/securite` et dans l'annexe 3 du DPA.

---

## 4. Finalités du traitement

Les données mentionnées ci-dessus sont traitées pour les finalités suivantes :

| Finalité | Donnée concernée | Base légale |
|---|---|---|
| Fournir le Service (gestion du compte, accès aux fonctionnalités) | 3.3 toutes | Exécution du contrat (CGS) |
| Authentification et sécurité (magic link OTP, JWT, journal de connexions) | 3.3 identification + technique | Exécution du contrat + intérêt légitime |
| Traitement des Données patient pour le compte du Client | 3.4 | Voir DPA (art. 28 RGPD) |
| Facturation et recouvrement | 3.3 facturation | Exécution du contrat + obligation légale (comptabilité) |
| Communications relatives au compte (mises à jour, incidents, mises à jour CGS) | Adresse électronique | Intérêt légitime |
| Mesure du parcours d'inscription et amélioration produit | 3.1 + 3.2 | Intérêt légitime (mesure d'audience, sans cookies tiers ni profilage avancé) |
| Démonstration du consentement aux CGS et DPA | 3.2 | Obligation légale (art. 7 RGPD) |
| Détection et correction d'incidents techniques | 3.1 + 3.3 technique | Intérêt légitime + sécurité du Service |
| Réponse aux demandes d'exercice des droits | Données nécessaires | Obligation légale (art. 15 à 22 RGPD) |
| Réponse aux demandes des autorités publiques | Données requises | Obligation légale |

Aucun traitement n'est effectué à des fins de prospection commerciale tierce, de profilage à des fins publicitaires ou de revente de données.

---

## 5. Destinataires des données

Les données collectées sont destinées :

- **En interne** : aux personnes habilitées chez l'Éditeur intervenant dans la fourniture, l'administration et la maintenance du Service ;
- **Aux sous-traitants techniques** listés à l'annexe 2 du DPA et résumés à l'article 6 ci-dessous ;
- **À l'autorité judiciaire ou administrative compétente** sur réquisition légale.

Aucune donnée n'est cédée à des tiers à des fins commerciales.

---

## 6. Sous-traitants ultérieurs

L'Éditeur recourt aux sous-traitants ultérieurs suivants pour la fourniture du Service. **Tous traitent les données dans l'Union européenne ou bénéficient de garanties contractuelles appropriées au sens des articles 44 et suivants du RGPD.** La liste exhaustive et à jour est consultable à l'annexe 2 du DPA.

| Sous-traitant | Service fourni | Localisation des données | Garanties |
|---|---|---|---|
| Supabase Inc. (États-Unis) | Hébergement base de données PostgreSQL, authentification, stockage de fichiers | Région `eu-west-3` (Paris, France) | Clauses contractuelles types (CCT) UE 2021 + DPA signé |
| Vercel Inc. (États-Unis) | Hébergement de l'application web (Edge + Serverless functions) | Régions UE (Paris, Francfort) | CCT UE 2021 + DPA Vercel |
| Mistral AI (France) | Reconnaissance optique de caractères (OCR) sur les ordonnances | France | Société française, soumise directement au RGPD ; DPA signé |
| Resend (États-Unis, option EU residency) | Envoi de courriels transactionnels (lien magic OTP, invitations, notifications) | Région UE (Allemagne) | CCT UE 2021 + DPA Resend |
| Stripe Payments Europe Limited (Irlande) | Traitement des paiements par carte bancaire et abonnement | UE (Irlande) | PCI-DSS Level 1 ; DPA Stripe |
| PostHog (États-Unis, instance EU) | Analytics produit, mesure d'audience, activation progressive de fonctionnalités | Région UE (Francfort, Allemagne) | CCT UE 2021 + DPA PostHog ; masquage intégral des champs et du texte rendu côté Session Replay |
| Functional Software, Inc. (Sentry) | Détection et journalisation des erreurs applicatives | Instance UE (Francfort, Allemagne) | CCT UE 2021 + DPA Sentry ; PII scrubbing actif |
| Baseflow (`hotline.baseflow.fr`) | Réservation de rendez-vous de support et démonstration | UE (Paris, France) | Société affiliée ; aucune Donnée patient transmise |

**Aucun transfert hors UE/EEE n'est effectué pour les Données patient.** Pour les sous-traitants dont la maison-mère est aux États-Unis, les CCT UE 2021 et les analyses d'impact transferts (TIA) sont en place ou en cours de formalisation.

Toute évolution de cette liste fait l'objet d'une information préalable au Client dans les conditions du DPA.

---

## 7. Durées de conservation

Les données sont conservées pour les durées suivantes :

| Catégorie | Durée de conservation |
|---|---|
| Données de visite anonymes (logs serveur) | 30 jours |
| Données d'inscription (formulaires complétés ou abandonnés) | 24 mois |
| Données de compte Utilisateur (3.3), compte actif | Pendant toute la durée de l'abonnement |
| Données de compte Utilisateur (3.3), après résiliation | 90 jours (permettant réactivation) puis suppression définitive |
| Journal d'audit applicatif | 5 ans (obligation traçabilité officine) |
| Données de facturation (Stripe) | 10 ans (obligation comptable, article L.123-22 du Code de commerce) |
| Sauvegardes | 30 jours en rotation (point-in-time recovery Supabase) |
| Sessions et jetons d'authentification | Maximum 24 heures puis renouvellement obligatoire |
| Données techniques Sentry | 90 jours |
| Données analytics PostHog | 12 mois |
| Demandes d'exercice de droits | 5 ans à compter de la clôture (obligation probatoire CNIL) |

Les Données patient sont conservées exclusivement pendant la durée de l'abonnement du Client, conformément aux finalités définies par celui-ci. À l'issue de l'abonnement, elles sont supprimées dans les conditions définies au DPA.

---

## 8. Vos droits

Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants sur les données vous concernant :

- **Droit d'accès** (art. 15) : obtenir confirmation que des données vous concernant sont traitées et en recevoir une copie ;
- **Droit de rectification** (art. 16) : demander la correction de données inexactes ou incomplètes ;
- **Droit à l'effacement** (art. 17, « droit à l'oubli ») : demander la suppression de vos données, sous réserve des obligations légales de conservation ;
- **Droit à la limitation du traitement** (art. 18) ;
- **Droit à la portabilité** (art. 20) : recevoir vos données dans un format structuré, couramment utilisé et lisible par machine (JSON) ;
- **Droit d'opposition** (art. 21) au traitement fondé sur l'intérêt légitime ;
- **Droit de retirer votre consentement** à tout moment, pour les traitements fondés sur ce consentement, sans que cela n'affecte la licéité des traitements antérieurs ;
- **Droit de définir des directives** relatives au sort de vos données après votre décès (art. 85 de la loi Informatique et Libertés).

### Comment exercer vos droits

Pour exercer vos droits, vous pouvez :

- Modifier directement certaines données depuis les paramètres de votre compte (profil, mot de passe, préférences) ;
- Annuler votre abonnement et purger votre compte depuis le Stripe Customer Portal ;
- Pour les autres demandes : adresser un courriel à `support@pharmaworkspace.fr` en précisant l'objet de votre demande et en joignant tout justificatif permettant de vous identifier.

L'Éditeur s'engage à répondre dans un délai maximal d'**un (1) mois**, susceptible d'être prolongé de deux mois en cas de demande complexe (avec information préalable du demandeur).

### Réclamation auprès de la CNIL

En cas de difficulté ou de désaccord, vous disposez du droit d'introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 PARIS CEDEX 07, ou en ligne sur `https://www.cnil.fr/fr/plaintes`.

---

## 9. Sécurité

L'Éditeur met en œuvre les mesures techniques et organisationnelles appropriées pour garantir un niveau de sécurité adapté au risque, conformément à l'article 32 du RGPD et tenant compte du caractère particulier des données de santé.

Le détail de ces mesures est exposé dans la page `/securite` et dans l'annexe 3 du DPA. Les mesures principales comprennent :

- Chiffrement en transit (TLS 1.3) et au repos (AES-256) ;
- Cloisonnement multi-tenant strict (RLS PostgreSQL) ;
- Authentification par lien magique à usage unique (OTP) ;
- Jetons de session JWT à durée limitée ;
- Journalisation des accès et opérations sensibles ;
- Détection d'anomalies et monitoring 24/7 via Sentry ;
- Sauvegardes automatiques en point-in-time recovery ;
- Procédure documentée de gestion d'incident (notification CNIL sous 72h en cas de violation).

---

## 10. Cookies et technologies de mesure d'audience

### 10.1 Inventaire des cookies

| Cookie | Domaine | Finalité | Durée | Base légale |
|---|---|---|---|---|
| `sb-<projectref>-auth-token` (et dérivés) | `pharmaworkspace.fr` | Session d'authentification Supabase (JWT) | Session (renouvellement auto) | Strictement nécessaire au service (art. 82 al. 1 loi 78-17) |
| `pw_cookie_consent` | `pharmaworkspace.fr` | Mémorisation du choix de l'utilisateur sur les cookies analytics | 13 mois | Strictement nécessaire au respect du choix |
| `ph_<token>_posthog` | `pharmaworkspace.fr` | Mesure d'audience produit et analyse comportementale via PostHog Cloud EU | 12 mois | Consentement (visiteurs anonymes) / Intérêt légitime contractuel (utilisateurs authentifiés) |
| Cookies Stripe | `stripe.com` (tiers) | Sécurisation paiement et lutte contre la fraude lors de Checkout et Customer Portal | Variable, voir politique Stripe | Strictement nécessaire au service de paiement |

L'inventaire détaillé et le réglage de votre choix sont disponibles à tout moment sur la page dédiée `https://pharmaworkspace.fr/cookies`.

### 10.2 Recueil du consentement (visiteurs non authentifiés)

Lors de la première visite d'un visiteur non authentifié, un bandeau propose d'**accepter** ou de **refuser** le dépôt des cookies de mesure d'audience (PostHog). Tant que le visiteur n'a pas exprimé de choix, **aucun cookie analytics n'est déposé**. Le refus n'affecte en rien l'accès au site ou au Service. Le choix est mémorisé pendant 13 mois dans le cookie technique `pw_cookie_consent` et peut être révoqué à tout moment depuis la page `/cookies` (bouton « Modifier mon choix »), avec la même simplicité que son octroi.

Pour les utilisateurs **authentifiés**, la mesure d'audience repose sur l'intérêt légitime contractuel de l'Éditeur (amélioration du Service fourni au titre des CGS) ; le bandeau n'est pas affiché.

### 10.3 Mesure d'audience (PostHog)

L'Éditeur utilise PostHog Cloud EU pour mesurer l'utilisation du Service et améliorer l'expérience produit. La configuration est la suivante :

- Aucun cookie tiers publicitaire ;
- **Capture automatique désactivée** (les événements sont déclenchés explicitement par le code applicatif) ;
- **Session Replay configuré en masquage intégral** : tous les champs `<input>` sont masqués, tout le texte rendu est masqué par défaut. Aucun nom, médicament, donnée patient ne peut apparaître dans un replay ;
- **Heatmaps désactivés** ;
- Région de stockage : Francfort (Allemagne) ;
- Données identifiables associées au compte uniquement après authentification (`person_profiles: 'identified_only'`).

### 10.4 Détection d'erreurs (Sentry)

Sentry collecte les traces d'erreurs applicatives à des fins de diagnostic. Configuration :

- Instance Sentry EU (Francfort) ;
- PII scrubbing actif (les courriels, noms et toute donnée probablement identifiante sont automatiquement filtrés avant envoi) ;
- Conservation limitée à 90 jours.

### 10.5 Stripe

Stripe peut déposer des cookies techniques nécessaires à la prévention de la fraude lors des opérations de paiement, conformément à sa propre politique : `https://stripe.com/fr/privacy`.

---

## 11. Décisions automatisées et profilage

L'Éditeur **ne prend aucune décision produisant des effets juridiques ou affectant significativement le Client ou les Utilisateurs sur la base d'un traitement automatisé**. Aucun profilage au sens de l'article 22 du RGPD n'est effectué.

La reconnaissance optique de caractères (OCR) opérée par Mistral AI sur les ordonnances constitue une opération automatisée mais ne produit pas de décision : le résultat est restitué à l'Utilisateur Pharmacien qui contrôle, modifie et valide les données extraites avant toute action.

---

## 12. Hors-UE

L'Éditeur s'efforce de n'effectuer aucun transfert de données personnelles hors de l'Union européenne. Les Données patient sont hébergées exclusivement en France (région `eu-west-3` Paris) et ne sortent pas de l'UE.

Pour les sous-traitants dont la maison-mère est située aux États-Unis (Supabase, Vercel, Resend, PostHog, Sentry), les opérations de traitement courantes sont effectuées dans leurs régions UE respectives. Les éventuels accès aux données par les équipes support de ces sous-traitants sont encadrés par les Clauses Contractuelles Types (CCT) UE 2021 et, le cas échéant, par des analyses d'impact transferts (TIA).

---

## 13. Modifications de la Politique

La présente Politique peut être modifiée à tout moment pour tenir compte d'évolutions législatives, réglementaires ou techniques. Toute modification substantielle est notifiée aux Utilisateurs par courriel au moins **trente (30) jours** avant son entrée en vigueur. Les versions antérieures sont conservées et accessibles sur demande à `support@pharmaworkspace.fr`.

---

## 14. Contact

- **Délégué à la Protection des Données** : `support@pharmaworkspace.fr`
- **Contact général** : `support@pharmaworkspace.fr`
- **Contact sécurité** : `security@pharmaworkspace.fr`
- **Adresse postale** : [À COMPLÉTER : adresse du siège social]
- **CNIL** : 3 place de Fontenoy, TSA 80715, 75334 PARIS CEDEX 07 (`https://www.cnil.fr`)

---

*Document publié le 30 mai 2026, mis à jour le 12 juin 2026. Version 2026-06-12.*
