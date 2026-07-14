# Roadmap PharmaWorkspace — objectifs et jalons mesurables

*Document interne. Complément du widget de timeline parallèle. Ne contient volontairement **aucun délai calendaire** : les estimations passées ont systématiquement sous-estimé la réalité du terrain. Cette roadmap se lit comme une **séquence d'objectifs à atteindre**, chacun déclenchant le suivant. On avance objectif par objectif, on coche, on passe au suivant.*

---

## Comment lire ce document

Chaque objectif a quatre éléments :

- **Définition** : ce que l'objectif signifie concrètement
- **Critères de succès** : ce qu'il faut atteindre pour considérer l'objectif rempli
- **Prérequis** : ce qui doit être terminé avant de pouvoir y travailler
- **Sortie** : ce qui se débloque dès que l'objectif est coché

La roadmap est divisée en **4 phases**. On ne passe pas à la suivante sans avoir validé **tous les objectifs critiques** de la précédente. Les objectifs marqués 🟡 sont importants mais non bloquants pour le passage à la phase suivante.

---

## PHASE 1 — FONDATIONS

> Objectif global de la phase : avoir tous les actifs structurels (entité, produit, conformité) prêts à supporter une activité commerciale.

### Objectif 1.1 — Personnalité juridique opérationnelle 🔴

**Définition** : la société est immatriculée, capable de facturer et d'encaisser, et toutes ses informations sont remontées dans les documents publics et le compte Stripe.

**Critères de succès**
- K-bis reçu et archivé
- Numéro SIREN attribué
- Numéro de TVA intracommunautaire actif
- Compte bancaire pro ouvert et abondé du capital social
- Comptable connecté (Indy ou équivalent)
- Marque INPI déposée dans les classes 9, 35 et 42
- Compte Stripe basculé en mode LIVE avec les informations société à jour
- Toutes les pages publiques (`/conditions-generales`, `/privacy`, `/dpa`, `/securite`) mises à jour avec la raison sociale, le SIREN, le RCS et l'adresse du siège
- Hashes des documents juridiques recalculés et injectés dans `consent-versions.ts`

**Prérequis**
- Forme juridique tranchée (SAS ou SASU)
- Capital social décidé
- Adresse de domiciliation arrêtée (Nice personnelle ou prestataire Paris)

**Sortie**
- Capacité à signer un premier client payant en règle
- Déblocage des mémos juridiques internes (1.4)
- Déblocage du basculement Stripe LIVE
- Déblocage de l'impression de cartes de visite et 1-pagers avec les bonnes coordonnées

---

### Objectif 1.2 — Produit complet sur les 6 modules cibles 🔴

**Définition** : tous les modules attendus par le marché (validés par l'enquête 54 pharmaciens) sont livrés en production. L'utilisateur qui s'inscrit voit un produit complet, pas un MVP partiel.

**Critères de succès**
- Module Tâches & Transmissions opérationnel ✅ déjà mergé
- Module Ordonnances + OCR Mistral opérationnel ✅ déjà mergé
- Module Ruptures CIP13 + ANSM opérationnel ✅ déjà mergé
- Module Locations matériel avec photos (TECH-11) mergé
- Module Salon textuel équipe (CHAT-01) mergé
- Module Planning de présence + congés (PLAN-01) mergé
- Limite utilisateurs par tier enforcée (TECH-12) mergée
- Rôles étudiant + rayonniste ajoutés (TECH-10) mergés
- Système de missions d'activation (ONBOARD-01) mergé
- Geofencing badge optionnel (BADGE-01) mergé
- Test end-to-end personnel passé sur le funnel complet : signup → wizard → CB Stripe Test → dashboard → 6 modules accessibles → annulation depuis Customer Portal

**Prérequis**
- P2-01 wizard mergé ✅ déjà fait

**Sortie**
- Capacité à présenter le produit en démo sans devoir excuser des modules manquants
- Déblocage de la rédaction des supports commerciaux (objectif 2.1)
- Déblocage du démarrage du démarchage terrain (objectif 2.2)

---

### Objectif 1.3 — Conformité RGPD documentaire complète 🟡

**Définition** : tous les documents internes RGPD existent et sont signés, démontrant que l'entreprise est en règle en cas d'audit CNIL ou de demande client.

**Critères de succès**
- Mémo P3-01 « Auto-désignation DPO interne » rédigé et signé
- Mémo P3-03 « Registre des traitements art. 30 RGPD » à jour
- Mémo P3-07 « Décision HDS voie A pragmatique » formalisé
- Mémo P3-09 « Runbook incident 72h CNIL » écrit et testé sur 1 scénario blanc
- DPA des 8 sous-traitants ultérieurs collectés et archivés (P3-06)
- TIA (Transfer Impact Assessment) rédigées pour les sous-traitants à maison-mère US

**Prérequis**
- Personnalité juridique opérationnelle (1.1)

**Sortie**
- Capacité à répondre à une demande client « envoyez-moi votre DPA et vos pièces RGPD » sans délai
- Sérénité juridique en cas d'incident ou contrôle CNIL
- Argument de vente solide auprès des titulaires les plus prudents

---

### Objectif 1.4 — Pipeline opérationnel et instrumentation 🟡

**Définition** : les outils de pilotage, de suivi des prospects et de mesure des KPIs sont en place et fonctionnels avant le premier démarchage.

**Critères de succès**
- CRM Notion ou équivalent monté avec 4 statuts : `cold`, `warm`, `hot`, `pilot`, `payant`
- Dashboard PostHog du funnel d'acquisition créé et fonctionnel (8 étapes : visit → signup → confirmed → onboarded → activated → trial_end_minus_5 → first_charge → still_active_30d)
- Pages publiques de tracking fonctionnelles (UTM persistance vérifiée)
- P4-15 hotline source_context mergé côté repo baseflow-hotline (lien démo cross-tracké)
- Contacts du panel des 54 pharmaciens récupérés et importés dans le CRM
- Listes de prospection froide constituées : minimum 100 officines Paris + 50 officines Côte d'Azur, avec coordonnées vérifiables et statut pipeline initial

**Prérequis**
- Produit complet (1.2) pour avoir un événement `signup_completed` exploitable côté PostHog

**Sortie**
- Démarchage terrain pilotable et mesurable
- Décisions data-driven plutôt qu'instinct
- Capacité à montrer à un partenaire futur des chiffres de funnel

---

## PHASE 2 — MISE EN MARCHÉ

> Objectif global : passer du « produit prêt » au « produit présentable et présenté ».

### Objectif 2.1 — Supports commerciaux prêts et livrés 🔴

**Définition** : tous les supports nécessaires à un démarchage professionnel sont produits, livrés et physiquement en main du démarcheur.

**Critères de succès**

Supports dématérialisés
- Pages publiques relues et corrigées (COPY-01)
- Émail séquence automatisée Resend : 8 templates couvrant J0 confirmation, J+1 conseil, J+3 check-in, J+7 check-in usage, J+14 témoignage, J+25 pré-prélèvement, J+30 confirmation paiement, J+45 enquête NPS
- Démo Loom 90 secondes pour la landing et les emails
- Démo Loom 5 minutes « tour complet du produit » pour les prospects intéressés
- Page `/cas-clients` coquille vide prête à recevoir des témoignages

Supports palpables
- 1-pager PDF A4 recto-verso designé et imprimé (lot de 200 à 500 exemplaires)
- Plaquette tablette de démo (5-7 slides) chargée sur la ou les tablettes du démarcheur
- Cartes de visite designées et imprimées (lot de 100 minimum, avec QR code sourcé par démarcheur)

**Prérequis**
- Personnalité juridique opérationnelle pour les bonnes mentions légales (1.1)
- Produit complet pour les bonnes captures et la bonne démo (1.2)

**Sortie**
- Démarcheur Paris peut se mettre en marche
- Mehdi peut faire du terrain Côte d'Azur
- Crédibilité visuelle auprès du titulaire qui reçoit la visite

---

### Objectif 2.2 — Capacité de démarchage terrain opérationnelle 🔴

**Définition** : tu disposes de deux canaux de démarchage simultanés et briefés.

**Critères de succès**
- Démarcheur Paris recruté (CDD, freelance ou stagiaire selon arbitrage budget) avec un brief commercial structuré
- Brief commercial documenté : argumentaire, top 5 objections + réponses, script d'entrée, gestion du refus poli, qualification rapide
- Tu es disponible et opérationnel sur ta zone Côte d'Azur (Nice, Cap-Ferrat, Monaco, Antibes, Cannes, Mougins)
- Pack matériel constitué pour les deux démarcheurs (tablette pré-chargée, cartes de visite, 1-pagers, sac de portage)
- Sync hebdo prévu entre toi et le démarcheur Paris (30 minutes, par exemple le lundi matin)

**Prérequis**
- Supports commerciaux livrés (2.1)

**Sortie**
- Capacité de visiter en moyenne 20 à 30 officines par semaine cumulé Paris + Côte d'Azur
- Génération attendue d'un flux constant de leads warm

---

### Objectif 2.3 — Base de prospects qualifiés engagés 🟡

**Définition** : les leads chauds identifiés par l'enquête sont contactés individuellement, et le top 5 des groupements est approché en parallèle.

**Critères de succès**
- 12 leads chauds du panel relancés individuellement par email personnalisé
- 5 emails partenariat envoyés aux top groupements (Giphar, Aprium, Pharmavie, Totum, Pharmuni)
- Au moins 3 rappels de 15 minutes bookés via hotline.baseflow.fr
- Au moins 1 réponse reçue d'un groupement (positive ou négative explicite, pas du silence)

**Prérequis**
- Capacité de démarchage opérationnelle (2.2) pour pouvoir transformer les rappels visio en rendez-vous

**Sortie**
- Pipeline rempli, démarchage à froid n'est plus le seul canal
- Première lecture des objections groupement réelle

---

## PHASE 3 — CONVERSION

> Objectif global : transformer la mise en marché en signatures payantes.

### Objectif 3.1 — Première signature pilote validée 🔴

**Définition** : le premier titulaire externe au cercle proche a signé un essai PharmaWorkspace et activé son trial Stripe.

**Critères de succès**
- 1 titulaire d'officine externe a complété le funnel : signup → wizard 4 étapes → CB validée → `subscription_status='trialing'`
- Le pilote a effectué les 4 missions wizard sans intervention humaine
- Une mission post-wizard au moins a été cochée dans les 48h suivant la signature
- Le pilote a reçu les emails Resend de la séquence onboarding et les a ouverts

**Prérequis**
- Toutes les phases 1 et 2 validées

**Sortie**
- Première preuve que le funnel self-serve fonctionne sans assistance
- Première donnée d'usage en condition réelle
- Premier signal commercial : confirmer ou ajuster le pitch selon ce que le titulaire dit avoir aimé/pas aimé

---

### Objectif 3.2 — Cible d'officines pilotes actives atteinte 🔴

**Définition** : un nombre suffisant d'officines utilisent le produit pour produire des données statistiques et des témoignages.

**Critères de succès**
- 10 officines pilotes ont complété leur wizard et sont en `subscription_status='trialing'` ou `'active'`
- Au moins 7 d'entre elles ont au moins 50 % des membres invités actifs (% équipiers actifs ≥ 50)
- Diversification géographique : minimum 4 à Paris + 4 sur la Côte d'Azur, le reliquat indifférent
- Diversification structurelle : minimum 3 indépendants + 5 en groupement
- Au moins 1 pilote dans chacun des top 3 groupements approchés

**Prérequis**
- Première signature validée (3.1)

**Sortie**
- Critical mass atteinte pour parler aux groupements avec des chiffres
- Base de retours utilisateurs suffisante pour itérer le produit en confiance
- Cohorte exploitable pour la communication (témoignages, cas clients)

---

### Objectif 3.3 — Conversion trial → payant validée 🟡

**Définition** : le passage automatique de l'essai 30 jours au prélèvement Early Adopter fonctionne sans friction et sans churn massif.

**Critères de succès**
- Au moins 70 % des pilotes ayant terminé leur essai 30 jours sont passés en `subscription_status='active'` sans annulation
- 0 incident technique sur le prélèvement automatique J+30 (pas de webhook raté, pas de doublon, pas d'échec systémique)
- Premiers MRR remontés dans Stripe : minimum 200 € HT/mois cumulé

**Prérequis**
- Cible d'officines pilotes atteinte (3.2)

**Sortie**
- Validation du business model côté caisse
- Premier signal de revenu récurrent
- Confiance pour passer à la phase de capitalisation

---

## PHASE 4 — CAPITALISATION

> Objectif global : transformer les premiers pilotes payants en leviers de croissance.

### Objectif 4.1 — NPS et témoignages exploitables 🔴

**Définition** : tu as les retours qualitatifs et quantitatifs nécessaires pour piloter la communication et le produit.

**Critères de succès**
- Premier NPS envoyé à tous les pilotes ayant 30 jours d'usage
- NPS moyen calculé sur les 5 plus anciens pilotes ≥ 30 (échelle -100 à +100)
- Minimum 3 témoignages écrits récoltés et publiables sur la page `/cas-clients`
- Minimum 1 témoignage vidéo court (Loom 30s ou similaire) récolté

**Prérequis**
- Cible d'officines pilotes atteinte (3.2)

**Sortie**
- Page `/cas-clients` alimentée, plus de coquille vide
- Argumentaire commercial nourri par les mots des pilotes eux-mêmes
- Validation que le produit délivre sa promesse

---

### Objectif 4.2 — Premier partenariat groupement engagé 🟡

**Définition** : un groupement parmi le top 5 a manifesté un engagement formel ou informel à recommander PharmaWorkspace à son réseau.

**Critères de succès**
- Lettre d'intention signée OU email d'engagement reçu d'un groupement (Giphar, Aprium, Pharmavie, Totum ou Pharmuni)
- Conditions du partenariat formalisées : tarif négocié pour les officines du groupement, conditions de promotion, contrepartie éventuelle
- Au moins 1 communication interne du groupement vers ses officines mentionnant PharmaWorkspace est planifiée

**Prérequis**
- NPS et témoignages exploitables (4.1) pour avoir une preuve sociale à présenter au groupement

**Sortie**
- Effet de levier : 1 partenariat = potentiellement 50 à 500 officines exposées sans démarchage individuel
- Crédibilité accrue auprès des autres groupements pour de futures négociations

---

### Objectif 4.3 — Décision stratégique Phase D prise 🔴

**Définition** : avec les données récoltées, tu prends une décision documentée sur la suite : ouverture publique, recrutement, abandon, pivot.

**Critères de succès**
- Tableau de bord récapitulatif consolidé : nombre de pilotes actifs, MRR, NPS, % conversion trial → paid, coût d'acquisition par canal, taux de référral
- Décision documentée écrite : ouverture publique self-serve OUI/NON, recrutement second commercial OUI/NON, signature partenariat groupement déclencheur
- Roadmap de la Phase D rédigée et acceptée par toi

**Prérequis**
- Tous les objectifs précédents validés ou consciemment skippés

**Sortie**
- Direction claire pour les prochains 3 à 6 mois
- Fin de la roadmap actuelle, ouverture sur la suivante

---

## Récapitulatif visuel des dépendances

```
Phase 1 — FONDATIONS
   1.1 SAS opérationnelle ──────┬──► 1.3 Conformité RGPD
                                │
   1.2 Produit complet ─────────┼──► 2.1 Supports commerciaux
                                │
                                └──► 1.4 Pipeline & instrumentation
                                          │
Phase 2 — MISE EN MARCHÉ                  │
   2.1 Supports prêts ──────────┐         │
                                ▼         ▼
   2.2 Démarchage opérationnel ◄─────── 2.3 Base prospects engagés
                │
Phase 3 — CONVERSION
                ▼
   3.1 Première signature pilote
                │
                ▼
   3.2 Cible 10 pilotes actifs
                │
                ▼
   3.3 Conversion trial → payant validée
                │
Phase 4 — CAPITALISATION
                ▼
   4.1 NPS + témoignages ────────┐
                                 ▼
   4.2 Partenariat groupement engagé
                                 │
                                 ▼
   4.3 Décision Phase D prise
```

---

## Indicateurs transverses à monitorer en continu

Quelle que soit la phase en cours :

| Indicateur | Cible minimale acceptable |
|---|---|
| Couverture lint + typecheck + tests CI | 100 % verts sur develop |
| Sentry incidents critiques | 0 incident non triagé sous 48h |
| Disponibilité Vercel + Supabase | ≥ 99 % observée sur 30 jours glissants |
| Temps réponse réception support pilote | < 24h ouvrées |
| Webhooks Stripe traités avec succès | ≥ 99 % (les autres logged dans stripe_webhook_log) |
| Cash position | ≥ 3 mois de runway visible |

---

## Note importante sur la séquentialité

Les phases sont **séquentielles** mais les objectifs à l'intérieur d'une phase peuvent être travaillés en **parallèle** par différentes ressources (toi, Dim, démarcheur Paris, prestataires ponctuels). Le widget de timeline visuelle (HTML, sauvegardé en parallèle) montre cette parallélisation. La présente roadmap par objectifs montre l'**ordre logique** et les **critères de validation**.

Le bon réflexe à chaque fin de période de travail : ne pas se demander « combien de temps cela m'a pris ? » mais « quel objectif suis-je passé du statut pending au statut done aujourd'hui ? ». C'est la seule mesure qui compte.

---

*Fin du document. Document interne PharmaWorkspace. À mettre à jour à chaque objectif coché ou à chaque révision stratégique.*
