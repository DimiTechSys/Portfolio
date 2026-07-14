---
title: Registre des activités de traitement
version: "2026-06-01"
hash_placeholder: "sha256:TBD-à-calculer-via-scripts/hash-legal.ts"
last_review: "2026-06-01"
applies_to: "interne — produit sur demande à la CNIL ou à une officine cliente"
gdpr_article: "30"
---

# Registre des activités de traitement — PharmaWorkspace

**Version du 1er juin 2026.**
**Document interne** établi en application de l'article 30 du RGPD.

Ce registre est tenu par l'Éditeur de PharmaWorkspace et tient compte des deux qualités dans lesquelles l'Éditeur intervient :

- **Responsable de traitement** pour les traitements relatifs à son propre fonctionnement commercial et au service rendu à ses Utilisateurs en tant qu'inscrits (prospects, comptes, facturation, analytics, communications, support, sécurité applicative). Ces traitements sont décrits en **Partie I** ci-après.
- **Sous-traitant** au sens de l'article 28 du RGPD pour les traitements opérés pour le compte des officines clientes (Responsables de traitement) sur les données métier saisies dans le Service. Ces traitements sont décrits en **Partie II** ci-après.

Conformément à la pratique CNIL pour les SaaS B2B, les deux registres sont consolidés dans le présent document tout en restant distincts par leur partie.

---

## Identité commune aux deux registres

| Champ | Valeur |
|---|---|
| Responsable de traitement / Sous-traitant | **[À COMPLÉTER PAR MEHDI : raison sociale]**, forme juridique [SAS / SARL / EURL / EI], capital [montant] €, SIREN [9 chiffres], RCS [Ville et numéro], siège social [adresse], représentée par Mehdi BELMIHOUB. |
| Délégué à la Protection des Données (DPO) | Mehdi BELMIHOUB — `dpo@pharmaworkspace.fr` — [adresse postale siège] |
| Contact général | `contact@pharmaworkspace.fr` |
| Contact sécurité | `security@pharmaworkspace.fr` |
| Date de la dernière revue | 1er juin 2026 |

> 📌 Ce document est conservé en interne. Il est communicable à la CNIL sur demande (article 30.4 RGPD) et aux officines clientes qui en font la demande dans le cadre de l'audit du DPA (article 9 du DPA — `legal/dpa.md`).

---

# Partie I — Registre du Responsable de traitement

Recense les traitements pour lesquels l'Éditeur détermine seul (ou conjointement, le cas échéant) les finalités et les moyens.

---

## 1. Acquisition de prospects (formulaire signup `/signup`)

| Champ | Détail |
|---|---|
| **Finalité** | Permettre à un titulaire d'officine de demander la création d'un compte sur le Service, recueillir et conserver l'horodatage du consentement aux CGS et au DPA (click-wrap art. 7 RGPD), et mesurer la performance du funnel d'acquisition. |
| **Base légale** | Mesure préalable à un contrat à la demande de la personne concernée (art. 6.1.b RGPD) + intérêt légitime de l'éditeur à mesurer son funnel d'acquisition (art. 6.1.f). |
| **Catégories de personnes concernées** | Prospects (personnes ayant initié le formulaire d'inscription). |
| **Catégories de données** | Adresse électronique professionnelle, langue préférée, identifiant et empreinte cryptographique sha256 des versions CGS et DPA acceptées, horodatage de l'acceptation, adresse IP, agent utilisateur, paramètres UTM (source, campagne, médium, terme, contenu), referrer, étape funnel atteinte, raison d'abandon le cas échéant. |
| **Catégories de destinataires** | Personnel habilité de l'Éditeur ; Supabase Inc. (hébergement). |
| **Transferts hors UE** | Aucun. Données hébergées en région `eu-west-3` Paris. |
| **Durée de conservation** | 24 mois (signup complétés ou abandonnés) — table `pharmacy_acquisition`. |
| **Mesures de sécurité** | TLS 1.3 en transit, AES-256 au repos, RLS Postgres, accès interne tracé. Cf. Annexe 3 DPA. |

---

## 2. Authentification et gestion du compte utilisateur

| Champ | Détail |
|---|---|
| **Finalité** | Identifier l'Utilisateur (lien magique OTP), maintenir une session sécurisée, gérer le profil (prénom, nom, avatar, rôle) et le rattachement à une officine. |
| **Base légale** | Exécution du contrat (art. 6.1.b — CGS) + intérêt légitime à la sécurité du Service (art. 6.1.f). |
| **Catégories de personnes concernées** | Utilisateurs Pharmaciens et personnels de l'officine titulaires d'un compte. |
| **Catégories de données** | Adresse électronique, prénom, nom, avatar (facultatif), rôle (titulaire / adjoint / préparateur), identifiant unique (UUID Supabase), historique de connexions (date, IP, agent utilisateur), jetons de session JWT. |
| **Catégories de destinataires** | Personnel habilité de l'Éditeur ; Supabase Auth (eu-west-3) ; Resend (envoi du courriel OTP, instance Allemagne). |
| **Transferts hors UE** | Aucun en routine. Pour les sous-traitants à maison-mère US : CCT UE 2021 (cf. Annexe 2 DPA). |
| **Durée de conservation** | Pendant la durée de l'abonnement de l'officine + 90 jours après résiliation (période de grâce CGS §6.4) puis suppression définitive. Sauvegardes purgées sous 30 jours supplémentaires. Sessions JWT : 24 heures maximum. |
| **Mesures de sécurité** | OTP unique court (≤ 1h), JWT signé avec rotation, RLS multi-tenant par `pharmacy_id`, journalisation des connexions, monitoring d'anomalies Sentry. |

---

## 3. Facturation et abonnement Stripe

| Champ | Détail |
|---|---|
| **Finalité** | Souscription à un abonnement payant (Early Adopter ou tarif catalogue), traitement des prélèvements automatiques, émission des factures, gestion du Customer Portal (annulation / mise à jour de la carte). |
| **Base légale** | Exécution du contrat (art. 6.1.b) + obligation légale (art. 6.1.c — conservation comptable). |
| **Catégories de personnes concernées** | Utilisateurs titulaires (responsables financiers de l'officine). |
| **Catégories de données** | Identifiant Stripe (customer + subscription), tarif souscrit, mode de facturation (mensuel / annuel), date de fin de période d'essai, date de prochain prélèvement, statut de l'abonnement, jeton tokenisé de la carte bancaire. **Aucune coordonnée complète de carte bancaire n'est stockée par l'Éditeur** (PCI-DSS hérité Stripe). |
| **Catégories de destinataires** | Personnel habilité de l'Éditeur ; Stripe Payments Europe Limited (Irlande). |
| **Transferts hors UE** | Aucun. Stripe opère en Irlande pour les clients européens. |
| **Durée de conservation** | 10 ans pour les factures (article L.123-22 du Code de commerce). Les identifiants Stripe sont supprimés à la suppression du compte. |
| **Mesures de sécurité** | Stripe PCI-DSS Level 1, vérification cryptographique des webhooks (`stripe.webhooks.constructEvent`), table `stripe_webhook_log` d'idempotence, jamais d'écriture cross-pharmacie. |

---

## 4. Communications transactionnelles (Resend)

| Champ | Détail |
|---|---|
| **Finalité** | Envoyer aux Utilisateurs les courriels nécessaires au fonctionnement du Service : lien magique d'authentification (OTP), invitations à rejoindre une officine, notifications de compte (mise à jour CGS, fin de période d'essai imminente, échec de paiement, etc.). |
| **Base légale** | Exécution du contrat (art. 6.1.b — communications opérationnelles indispensables à l'usage du Service). |
| **Catégories de personnes concernées** | Utilisateurs (existants ou invités). |
| **Catégories de données** | Adresse électronique destinataire, nom, sujet et contenu du courriel, identifiant de pharmacie associée, statut de délivrance, tag de catégorisation (slugifié ASCII). |
| **Catégories de destinataires** | Personnel habilité de l'Éditeur ; Resend, Inc. (instance UE Allemagne). |
| **Transferts hors UE** | Aucun en routine (instance EU residency Resend). Maison-mère US encadrée par CCT UE 2021. |
| **Durée de conservation** | 30 jours de journaux côté Resend, puis purge. Les invitations en base sont supprimées à la résiliation du compte + période de grâce. |
| **Mesures de sécurité** | API key serveur uniquement, DKIM/SPF/DMARC sur le domaine `pharmaworkspace.fr`, tags ASCII-safe. |

---

## 5. Mesure du funnel d'acquisition et amélioration produit (PostHog)

| Champ | Détail |
|---|---|
| **Finalité** | Mesurer la performance du parcours d'acquisition (landing → signup → onboarding → activation), comprendre les usages produit, identifier les goulots, faire évoluer le Service. |
| **Base légale** | Intérêt légitime de l'éditeur à améliorer le Service et son funnel (art. 6.1.f) — sans cookies tiers ni profilage publicitaire ni revente de données. |
| **Catégories de personnes concernées** | Visiteurs du site, prospects, Utilisateurs (après authentification, identifiés par leur identifiant interne hashé). |
| **Catégories de données** | Événements de navigation (page consultée, durée, source), événements applicatifs explicitement déclenchés (clics CTA, étapes funnel atteintes), métadonnées techniques (langue, taille d'écran). **Aucune capture automatique** : tous les événements sont déclenchés explicitement par le code. **Session Replay configuré en masquage intégral** (`maskAllInputs: true`, `maskTextSelector: "*"`) — aucun texte applicatif, nom ou donnée patient ne peut apparaître. |
| **Catégories de destinataires** | Personnel habilité de l'Éditeur ; PostHog Inc. (instance EU Francfort). |
| **Transferts hors UE** | Aucun en routine (PostHog Cloud EU). Maison-mère US encadrée par CCT UE 2021. |
| **Durée de conservation** | 12 mois côté PostHog. |
| **Mesures de sécurité** | `person_profiles: 'identified_only'` (pas d'identification avant auth), heatmaps désactivés, autocapture désactivé. |

---

## 6. Détection et journalisation des erreurs (Sentry)

| Champ | Détail |
|---|---|
| **Finalité** | Détecter les erreurs applicatives en production, prioriser les correctifs, alerter en cas d'incident. |
| **Base légale** | Intérêt légitime de l'éditeur à maintenir la fiabilité et la sécurité du Service (art. 6.1.f). |
| **Catégories de personnes concernées** | Utilisateurs ayant rencontré une erreur applicative. |
| **Catégories de données** | Trace technique de l'erreur (stack trace, URL, navigateur, version applicative). **PII scrubbing actif** : courriels, noms et toute donnée probablement identifiante sont filtrés automatiquement avant envoi (regex + liste documentée). |
| **Catégories de destinataires** | Personnel habilité de l'Éditeur ; Functional Software, Inc. (Sentry, instance UE Francfort). |
| **Transferts hors UE** | Aucun en routine. Maison-mère US encadrée par CCT UE 2021. |
| **Durée de conservation** | 90 jours. |
| **Mesures de sécurité** | Sample rates ajustés, PII scrubbing actif, CSP autorise explicitement les ressources Sentry. |

---

## 7. Réservation de support / démonstration (Baseflow Hotline)

| Champ | Détail |
|---|---|
| **Finalité** | Permettre à un prospect ou Utilisateur de prendre rendez-vous pour une démonstration commerciale ou un support technique. |
| **Base légale** | Mesure préalable à un contrat (art. 6.1.b) pour les prospects ; exécution du contrat (art. 6.1.b) pour les Utilisateurs en cours. |
| **Catégories de personnes concernées** | Prospects, Utilisateurs. |
| **Catégories de données** | Nom, adresse électronique, contexte d'origine du booking (page d'appel, CTA cliqué). **Aucune Donnée patient transmise**. |
| **Catégories de destinataires** | Personnel habilité de l'Éditeur (filiale Baseflow). |
| **Transferts hors UE** | Aucun. |
| **Durée de conservation** | 24 mois après la réservation. |
| **Mesures de sécurité** | Endpoint HTTPS, journalisation des accès, validation côté serveur. |

---

## 8. Audit légal applicatif (journal art. 30 RGPD + traçabilité officine)

| Champ | Détail |
|---|---|
| **Finalité** | Tracer les opérations sensibles effectuées par les Utilisateurs sur les ordonnances (lecture, création, modification, suppression) à des fins de conformité, de traçabilité officinale et de défense en cas de litige. |
| **Base légale** | Intérêt légitime de l'éditeur et obligation réglementaire des officines clientes en matière de traçabilité (art. 6.1.c + 6.1.f). |
| **Catégories de personnes concernées** | Utilisateurs effectuant des opérations sur des ordonnances ; indirectement, patients dont l'ordonnance est consultée. |
| **Catégories de données** | Identifiant Utilisateur acteur, identifiant pharmacie, type d'opération (`action`), type de cible (`target_type`), identifiant de la cible, métadonnées (jsonb), adresse IP, agent utilisateur, horodatage. **Aucun contenu en clair de l'ordonnance n'est dupliqué dans l'audit** : seul un identifiant de référence (uuid). |
| **Catégories de destinataires** | Personnel habilité de l'Éditeur (titulaire de l'officine concernée, le cas échéant — politique RLS `audit_log_select_titulaire`). |
| **Transferts hors UE** | Aucun. Données hébergées en région `eu-west-3` Paris. |
| **Durée de conservation** | 5 ans (obligation de traçabilité officinale rappelée dans la politique de confidentialité §7). |
| **Mesures de sécurité** | Table dédiée non modifiable par les Utilisateurs (RLS `audit_log_insert` strict), index `pharmacy_id + created_at desc`, intégrité référentielle avec `pharmacy_id` FK CASCADE. |

---

## 9. Feedback in-app

| Champ | Détail |
|---|---|
| **Finalité** | Recueillir les retours utilisateurs sur le Service (bugs, suggestions, satisfaction). |
| **Base légale** | Intérêt légitime de l'éditeur à améliorer le Service (art. 6.1.f). |
| **Catégories de personnes concernées** | Utilisateurs ayant soumis un feedback. |
| **Catégories de données** | Identifiant Utilisateur (FK vers `auth.users` avec `ON DELETE SET NULL`), pharmacie associée, contenu textuel libre, horodatage. |
| **Catégories de destinataires** | Personnel habilité de l'Éditeur. |
| **Transferts hors UE** | Aucun. Données hébergées en région `eu-west-3` Paris. |
| **Durée de conservation** | Pendant la durée de l'abonnement + 90 jours, puis anonymisation (le contenu reste pour analyse, le lien à l'Utilisateur est rompu via `ON DELETE SET NULL`). |
| **Mesures de sécurité** | RLS `feedback_select_own` (un Utilisateur ne voit que ses propres feedbacks ; l'éditeur via service role). |

---

# Partie II — Registre du Sous-traitant (art. 28 RGPD)

Recense les activités de traitement opérées par l'Éditeur **pour le compte des officines clientes**, qui sont Responsables de traitement au sens de l'article 4(7) RGPD pour leurs propres données métier et celles de leurs patients.

Pour ces traitements, les **finalités** et la **base légale** sont déterminées par le Client (l'officine). L'Éditeur n'agit que sur instructions documentées (cadre fixé par les CGS et le DPA).

> **Référence détaillée** : ces traitements sont décrits en Annexe 1 du DPA (`legal/dpa.md`). Les informations ci-dessous en sont l'extrait synthétique conforme à l'article 30.2 RGPD.

---

## 10. Gestion des ordonnances (incluant OCR)

| Champ | Détail |
|---|---|
| **Nature et finalité** | Sur instructions du Client : permettre à ses Utilisateurs Pharmaciens de numériser une ordonnance papier, en extraire automatiquement les informations par OCR (nom du patient, prescripteur, date, médicaments prescrits), suivre l'état de service de l'ordonnance, journaliser les opérations. |
| **Catégories de personnes concernées** | Patients de l'officine (données concernant la santé au sens de l'article 4(15) RGPD) ; Utilisateurs Pharmaciens. |
| **Catégories de données** | Image numérisée de l'ordonnance, texte extrait par OCR, nom du patient, nom du prescripteur, date de prescription, date d'expiration, liste des médicaments, statut de service, commentaires, pièces jointes, identifiant de l'Utilisateur ayant créé/modifié. |
| **Catégories de destinataires** | Utilisateurs de l'officine cliente (politique RLS par `pharmacy_id`) ; Supabase (hébergement) ; Mistral AI (OCR, France métropolitaine). |
| **Transferts hors UE** | Aucun. Mistral AI est une société française. |
| **Durée de conservation** | Pendant la durée de l'abonnement, suivant les instructions du Client. À l'issue de l'abonnement : 90 jours de période de grâce puis suppression (DPA §8). Le journal d'audit applicatif est conservé 5 ans. |
| **Mesures de sécurité** | Mesures renforcées Annexe 3 DPA. Chiffrement TLS 1.3 + AES-256, RLS, journalisation, OCR confié exclusivement à Mistral AI France (aucun envoi hors UE), pas de retraitement par Mistral après l'opération OCR. |

---

## 11. Gestion des tâches et transmissions internes

| Champ | Détail |
|---|---|
| **Nature et finalité** | Sur instructions du Client : organiser les tâches de transmission entre les membres de l'équipe officinale (board Kanban, assignations, priorités, notes, échéances). |
| **Catégories de personnes concernées** | Utilisateurs de l'officine cliente. Indirectement, mention de patients possible dans les commentaires (à n'utiliser que sur strict besoin opérationnel — cf. DPA §10.4). |
| **Catégories de données** | Titre, description, priorité (low/medium/high), statut (todo/done/cancelled), échéance, identifiant de l'Utilisateur créateur, identifiant de l'Utilisateur assigné, pièces jointes éventuelles. |
| **Catégories de destinataires** | Utilisateurs de l'officine cliente (RLS). |
| **Transferts hors UE** | Aucun. |
| **Durée de conservation** | Pendant la durée de l'abonnement, sur instructions du Client. À la résiliation : 90 jours puis suppression. |
| **Mesures de sécurité** | RLS multi-tenant, contrôle d'accès par rôle, journalisation. |

---

## 12. Gestion des commandes fournisseurs

| Champ | Détail |
|---|---|
| **Nature et finalité** | Sur instructions du Client : gérer le cycle de vie des commandes auprès des fournisseurs (création, envoi, réception, articles, statuts), centraliser la communication avec les fournisseurs. |
| **Catégories de personnes concernées** | Utilisateurs de l'officine cliente ; correspondants chez les fournisseurs (nom, courriel, téléphone professionnel). |
| **Catégories de données** | Identifiant fournisseur, articles commandés (produit, quantité), notes, dates d'envoi et de réception, statut (draft/sent/received), pièces jointes (bons de commande, bordereaux). |
| **Catégories de destinataires** | Utilisateurs de l'officine cliente (RLS). Les fournisseurs ne reçoivent que ce que le Client choisit explicitement de leur communiquer. |
| **Transferts hors UE** | Aucun. |
| **Durée de conservation** | Pendant la durée de l'abonnement, sur instructions du Client. À la résiliation : 90 jours puis suppression. |
| **Mesures de sécurité** | RLS multi-tenant, journal d'audit pour les opérations financières sensibles. |

---

## 13. Gestion des locations de matériel médical

| Champ | Détail |
|---|---|
| **Nature et finalité** | Sur instructions du Client : suivre les locations de matériel médical confiées par l'officine à ses patients (prises, retours, retards, prolongations, facturation). |
| **Catégories de personnes concernées** | Patients de l'officine (loueurs) ; Utilisateurs Pharmaciens. |
| **Catégories de données** | Identité du patient (nom, prénom, coordonnées), description du matériel, dates de prise et de retour prévues / effectives, durée, statut (active/returned/overdue), tarification, notes opérationnelles. |
| **Catégories de destinataires** | Utilisateurs de l'officine cliente (RLS). |
| **Transferts hors UE** | Aucun. |
| **Durée de conservation** | Pendant la durée de l'abonnement, sur instructions du Client. La durée légale propre à la facturation se cumule (10 ans pour les factures émises). |
| **Mesures de sécurité** | RLS, journalisation des modifications. |

---

## 14. Gestion des ruptures de médicaments

| Champ | Détail |
|---|---|
| **Nature et finalité** | Sur instructions du Client : signaler une rupture d'approvisionnement, identifier les patients concernés en attente d'un médicament, suivre la résolution (substitut trouvé, fin de rupture). Synchronisation avec la base ANSM (référentiel public). |
| **Catégories de personnes concernées** | Patients en attente d'un médicament en rupture ; Utilisateurs Pharmaciens. |
| **Catégories de données** | Identifiant CIP13 du médicament, source de la rupture (ANSM ou interne), patient concerné (nom, contact), statut (open/substitute_found/resolved), substitut éventuel, commentaires. |
| **Catégories de destinataires** | Utilisateurs de l'officine cliente (RLS) ; ANSM (lecture seule du référentiel public, pas de transmission de données patient). |
| **Transferts hors UE** | Aucun. |
| **Durée de conservation** | Pendant la durée de l'abonnement, sur instructions du Client. À la résiliation : 90 jours puis suppression. |
| **Mesures de sécurité** | RLS multi-tenant, scan CIP13 côté client uniquement, journalisation. |

---

## 15. Annuaire interne (contacts)

| Champ | Détail |
|---|---|
| **Nature et finalité** | Sur instructions du Client : centraliser les contacts utiles à l'officine (médecins prescripteurs, fournisseurs, partenaires, prestataires). |
| **Catégories de personnes concernées** | Contacts professionnels de l'officine. |
| **Catégories de données** | Nom, prénom, organisation, téléphone, courriel, catégorie, notes. |
| **Catégories de destinataires** | Utilisateurs de l'officine cliente (RLS). |
| **Transferts hors UE** | Aucun. |
| **Durée de conservation** | Pendant la durée de l'abonnement, sur instructions du Client. |
| **Mesures de sécurité** | RLS multi-tenant. |

---

## 16. Formation interne (procédures et ressources)

| Champ | Détail |
|---|---|
| **Nature et finalité** | Sur instructions du Client : mettre à disposition de son équipe des ressources de formation (procédures qualité, documents, vidéos, mémos PDF). |
| **Catégories de personnes concernées** | Utilisateurs de l'officine cliente. |
| **Catégories de données** | Titre, description, URL ou fichier, catégorie, identifiant Utilisateur créateur. |
| **Catégories de destinataires** | Utilisateurs de l'officine cliente (RLS). |
| **Transferts hors UE** | Aucun. |
| **Durée de conservation** | Pendant la durée de l'abonnement, sur instructions du Client. |
| **Mesures de sécurité** | RLS multi-tenant, contrôle d'écriture limité aux rôles titulaire et adjoint. |

---

## 17. Sessions de travail et présence

| Champ | Détail |
|---|---|
| **Nature et finalité** | Sur instructions du Client : mesurer le temps de présence des Utilisateurs au sein du Service (sessions de travail actives, segments, durée cumulée par jour). |
| **Catégories de personnes concernées** | Utilisateurs de l'officine cliente. |
| **Catégories de données** | Identifiant Utilisateur, horodatages de début et fin de session, segments d'activité, durée cumulée par jour. |
| **Catégories de destinataires** | Utilisateurs de l'officine cliente (RLS) ; titulaire pour la consultation managériale. |
| **Transferts hors UE** | Aucun. |
| **Durée de conservation** | Pendant la durée de l'abonnement, sur instructions du Client. |
| **Mesures de sécurité** | RLS, suppression cascade à la suppression de l'Utilisateur, FK `ON DELETE CASCADE`. |

---

## 18. Notifications applicatives

| Champ | Détail |
|---|---|
| **Nature et finalité** | Sur instructions du Client : notifier les Utilisateurs d'événements pertinents (assignation de tâche, ordonnance prête, signalement de rupture, etc.) en temps réel via Realtime Supabase. |
| **Catégories de personnes concernées** | Utilisateurs de l'officine cliente. |
| **Catégories de données** | Type de notification, identifiant destinataire, contenu textuel, état lu / non lu, horodatage. |
| **Catégories de destinataires** | Utilisateur destinataire uniquement (RLS `user_id = auth.uid()`). |
| **Transferts hors UE** | Aucun (Supabase Realtime sur instance Paris). |
| **Durée de conservation** | Pendant la durée de l'abonnement, sur instructions du Client. À la résiliation : 90 jours puis suppression. |
| **Mesures de sécurité** | RLS strict par destinataire, WebSocket TLS 1.3. |

---

# Sous-traitants ultérieurs communs

L'ensemble des traitements (Parties I et II) repose sur les mêmes sous-traitants ultérieurs, dont la liste exhaustive et à jour est tenue en **Annexe 2 du DPA** (`legal/dpa.md`) :

| Sous-traitant ultérieur | Service | Localisation | Encadrement |
|---|---|---|---|
| Supabase Inc. | DB PostgreSQL + Auth + Storage | `eu-west-3` Paris (France) | DPA + CCT UE 2021 |
| Vercel Inc. | Hébergement application web | Paris (CDG1) + Francfort (FRA1) | DPA + CCT UE 2021 |
| Mistral AI | OCR ordonnances | France métropolitaine | Société française, DPA |
| Resend, Inc. | Courriels transactionnels | UE (Allemagne) | DPA + CCT UE 2021 |
| Stripe Payments Europe Ltd. | Paiements et abonnements | Irlande | DPA Stripe |
| PostHog Inc. | Analytics produit | UE (Francfort) | DPA + CCT UE 2021 |
| Functional Software, Inc. (Sentry) | Détection d'erreurs | Instance UE (Francfort) | DPA + CCT UE 2021 |
| Baseflow | Réservation support | UE (Paris) | Filiale interne, aucune Donnée patient |

---

# Mesures de sécurité générales (résumé)

L'ensemble des traitements bénéficie des mesures techniques et organisationnelles décrites en **Annexe 3 du DPA** (`legal/dpa.md`), résumées ici :

- Chiffrement en transit (TLS 1.3) et au repos (AES-256) ;
- Cloisonnement multi-tenant Row-Level Security PostgreSQL strict ;
- Authentification renforcée par lien magique à usage unique (OTP) ;
- Jetons de session JWT à durée limitée (24h max) ;
- Journal d'audit applicatif (5 ans) pour les opérations sensibles ;
- Détection d'anomalies et monitoring 24/7 (Sentry) ;
- Sauvegardes en point-in-time recovery (7+ jours) ;
- Procédure d'incident formalisée + notification CNIL sous 72h en cas de violation susceptible d'engendrer un risque pour les droits et libertés ;
- DPO interne désigné, revue annuelle des mesures et des sous-traitants ;
- Branch protection GitHub + revue préalable obligatoire sur les modifications de production.

---

# Mise à jour du registre

Conformément à l'article 30 RGPD, ce registre est mis à jour à chaque évolution substantielle :

- Ajout / suppression d'un traitement (par exemple : nouveau module fonctionnel) ;
- Ajout / remplacement / suppression d'un sous-traitant ultérieur ;
- Modification des durées de conservation ;
- Modification des bases légales ;
- Évolution réglementaire (CEPD, CNIL, jurisprudence européenne).

La version courante est conservée à la racine du dépôt (`legal/registre-traitements.md`) et son historique est tracé en git.

---

*Document publié le 1er juin 2026. Version 2026-06-01.*
*Empreinte cryptographique : `sha256:[à calculer via scripts/hash-legal.ts au moment du gel de la version]`.*
