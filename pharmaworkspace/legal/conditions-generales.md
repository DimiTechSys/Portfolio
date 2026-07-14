---
title: Conditions Générales de Service (CGS)
version: "2026-06-12"
hash_placeholder: "sha256:TBD-à-calculer-via-scripts/hash-legal.ts"
last_review: "2026-06-12"
applies_to: "/conditions-generales"
---

# Conditions Générales de Service de PharmaWorkspace

**Version du 30 mai 2026.** En vigueur depuis le 30 mai 2026.

Les présentes Conditions Générales de Service (ci-après « **CGS** ») régissent l'utilisation du service PharmaWorkspace, accessible à l'adresse `https://pharmaworkspace.fr` (ci-après le « **Service** »), édité par [À COMPLÉTER : raison sociale, forme juridique (SAS / SARL / EURL / EI), capital social, immatriculée au RCS de [VILLE] sous le numéro [SIREN], dont le siège social est situé [ADRESSE], représentée par Mehdi BELMIHOUB en sa qualité de [titre]] (ci-après l'« **Éditeur** »).

L'acceptation des présentes CGS est matérialisée par la case à cocher au moment de la création du compte (« click-wrap »). Cette acceptation est horodatée, conservée avec un identifiant de version du présent document et l'adresse IP du Client, conformément à l'article 7 du Règlement (UE) 2016/679 (« RGPD »).

---

## 1. Définitions

Dans les présentes CGS, les termes suivants ont la signification ci-après :

- « **Éditeur** » : la société identifiée en tête des présentes, fournisseur du Service.
- « **Client** » : la personne morale (officine de pharmacie immatriculée en France) qui souscrit au Service ; représentée par le titulaire de l'officine ou son délégué dûment autorisé.
- « **Utilisateur** » : toute personne physique (titulaire, pharmacien adjoint, préparateur en pharmacie ou personnel administratif de l'officine) bénéficiant d'un accès au Service via un compte créé par le Client ou par invitation.
- « **Service** » : la plateforme logicielle PharmaWorkspace, accessible en ligne sur abonnement, permettant la gestion des transmissions internes, des ordonnances, des ruptures d'approvisionnement, des locations de matériel médical et des formations internes de l'officine.
- « **Compte** » : l'espace personnel d'un Utilisateur, accessible par authentification.
- « **Période d'essai** » : période de trente (30) jours calendaires à compter de l'activation du Compte par carte bancaire, pendant laquelle aucun montant n'est prélevé.
- « **Abonnement** » : engagement payant à durée mensuelle ou annuelle souscrit par le Client à l'issue de la Période d'essai.
- « **Données patient** » : toute donnée à caractère personnel relative à un patient de l'officine, dont les données concernant la santé au sens de l'article 4(15) du RGPD, susceptible d'être saisie par l'Utilisateur dans le Service (notamment : nom inscrit sur une ordonnance, médicaments prescrits, identifiant lié à une rupture de traitement).

---

## 2. Objet

Les présentes CGS ont pour objet de définir les conditions dans lesquelles l'Éditeur met à disposition du Client le Service en mode SaaS (Software-as-a-Service), accessible à distance via un navigateur web, sans installation logicielle locale.

Le Service est conçu spécifiquement pour les officines de pharmacie d'officine établies en France métropolitaine et soumises au Code de la santé publique.

---

## 3. Inscription et accès au Service

### 3.1 Création du compte

Le Client crée son compte via le formulaire d'inscription accessible à l'adresse `/signup`. L'inscription requiert :

1. La saisie d'une adresse électronique professionnelle valide ;
2. L'acceptation explicite des présentes CGS et de l'Accord de Sous-Traitance (DPA, voir `/dpa`) par cases à cocher distinctes ;
3. La validation de l'adresse électronique par lien de connexion à usage unique (OTP) envoyé par courriel ;
4. La complétion d'un parcours de configuration en quatre étapes : informations de l'officine, profil du titulaire, invitation des collaborateurs (facultatif), validation par carte bancaire.

### 3.2 Validation par carte bancaire

L'activation du Compte requiert la saisie d'une carte bancaire valide via le tiers de paiement Stripe (voir article 5). **Aucun montant n'est prélevé pendant la Période d'essai de 30 jours.** À l'issue de cette Période d'essai, le premier prélèvement est effectué automatiquement au tarif Early Adopter retenu, sauf annulation préalable par le Client.

### 3.3 Identifiants de connexion

Le Client est seul responsable de la confidentialité des accès à son Compte et de tous les accès créés pour ses Utilisateurs. Toute action effectuée depuis un Compte est réputée effectuée par son titulaire. En cas de suspicion d'accès non autorisé, le Client doit immédiatement notifier l'Éditeur à l'adresse `security@pharmaworkspace.fr` et réinitialiser ses accès.

### 3.4 Capacité juridique

Le Client garantit qu'il dispose de la capacité juridique pour souscrire au Service et qu'il représente valablement la personne morale exploitant l'officine bénéficiaire du Service.

---

## 4. Période d'essai gratuite

### 4.1 Durée et conditions

Le Client bénéficie d'une Période d'essai gratuite de trente (30) jours calendaires à compter de la validation de sa carte bancaire à l'étape quatre du parcours d'inscription. Pendant cette Période, l'accès au Service est complet et sans restriction fonctionnelle.

### 4.2 Aucun prélèvement pendant l'essai

L'Éditeur garantit qu'**aucun montant n'est prélevé sur la carte bancaire du Client pendant la Période d'essai**. La carte bancaire est uniquement validée (validation par autorisation à zéro euro) afin de pré-autoriser le premier prélèvement à l'issue de la Période d'essai.

### 4.3 Notifications avant prélèvement

Le Client est informé du prélèvement à venir par les moyens suivants :
- Courriel automatique envoyé par Stripe sept (7) jours avant la fin de la Période d'essai (« trial ending email ») ;
- Bandeau d'information affiché dans l'application à compter du 25ème jour de la Période d'essai.

### 4.4 Annulation pendant l'essai

Le Client peut annuler son abonnement à tout moment pendant la Période d'essai depuis l'espace de facturation Stripe Customer Portal, accessible depuis l'application via le menu « Gérer mon abonnement ». En cas d'annulation pendant la Période d'essai, **aucun montant ne sera prélevé**. L'accès au Service est maintenu jusqu'à la date de fin de la Période d'essai initiale, puis suspendu.

---

## 5. Tarifs, facturation et paiement

### 5.1 Tarifs Early Adopter

Pour les vingt (20) premières officines pilotes ayant souscrit au Service au cours de la phase bêta, les tarifs « Early Adopter » sont appliqués **à vie**, conformément à la grille suivante (HT) :

| Formule | Limite Utilisateurs | Tarif mensuel HT | Tarif annuel HT |
|---|---|---|---|
| Solo | ≤ 3 | 23,40 € | 234,00 € |
| Équipe | 4 à 8 | 47,40 € | 474,00 € |
| Grande équipe | 9 et plus | 77,40 € | 774,00 € |

À titre indicatif, les tarifs catalogue post-bêta sont de 39 € / 79 € / 129 € HT par mois. Les Clients « Early Adopter » conservent leur tarif réduit aussi longtemps qu'ils maintiennent un abonnement actif sans interruption supérieure à trente (30) jours.

### 5.2 TVA

Les tarifs ci-dessus sont exprimés hors taxes. La TVA française au taux légal en vigueur (20 % à la date d'entrée en vigueur des présentes) est appliquée en sus. Pour les Clients situés dans un autre État membre de l'Union européenne et disposant d'un numéro de TVA intracommunautaire valide, le mécanisme d'auto-liquidation s'applique.

### 5.3 Modalités de paiement

Le paiement est effectué exclusivement par carte bancaire, via le prestataire de services de paiement Stripe Payments Europe Limited (Stripe), conforme aux normes PCI-DSS de niveau 1. L'Éditeur ne stocke à aucun moment les données complètes de la carte bancaire du Client : seul un identifiant tokenisé fourni par Stripe est conservé en base de données.

### 5.4 Renouvellement automatique

L'abonnement se renouvelle automatiquement à l'échéance de chaque période (mensuelle ou annuelle), sauf annulation préalable par le Client via le Stripe Customer Portal. La facture est émise par Stripe et envoyée par courriel au Client à chaque échéance.

### 5.5 Échec de paiement

En cas d'échec de prélèvement (carte expirée, refusée ou plafond atteint), Stripe procède automatiquement à des tentatives de relance dans les conditions suivantes : jusqu'à quatre (4) tentatives sur deux (2) semaines. Pendant cette période, l'accès au Service est maintenu et le Client en est informé par courriel et par un bandeau d'alerte dans l'application. À l'issue de ces tentatives, en l'absence de paiement régularisé, l'abonnement est marqué « impayé » et l'accès au Service est suspendu jusqu'à régularisation via la mise à jour de la carte bancaire depuis le Stripe Customer Portal.

---

## 6. Durée, résiliation et conservation des données

### 6.1 Durée

L'abonnement est conclu pour une durée indéterminée. Il se renouvelle tacitement à chaque échéance (mensuelle ou annuelle) jusqu'à résiliation.

### 6.2 Résiliation par le Client

Le Client peut résilier son abonnement à tout moment, sans préavis ni justification, depuis le Stripe Customer Portal. La résiliation prend effet à la date de fin de la période en cours. Aucun remboursement au prorata temporis n'est dû pour la période entamée.

### 6.3 Résiliation par l'Éditeur

L'Éditeur se réserve le droit de résilier l'abonnement avec préavis de trente (30) jours en cas de manquement grave du Client à ses obligations contractuelles, notamment :
- Non-paiement persistant après suspension ;
- Utilisation du Service contraire aux présentes CGS, à la réglementation applicable ou aux règles déontologiques de la profession de pharmacien ;
- Atteinte à la sécurité du Service ou à celle d'autres Clients.

### 6.4 Conservation des données après résiliation

À compter de la date de résiliation effective, les données du Client sont conservées pendant une période de **quatre-vingt-dix (90) jours**, permettant au Client de réactiver son compte sans perte de données ou de demander une exportation complète. À l'issue de cette période, l'ensemble des données est définitivement supprimé des systèmes de production. Les sauvegardes sont purgées dans un délai maximal de trente (30) jours supplémentaires.

Certaines données peuvent être conservées au-delà de ce délai pour répondre à des obligations légales (notamment comptables : conservation des factures pendant dix ans conformément à l'article L.123-22 du Code de commerce).

---

## 7. Obligations et engagements du Client

### 7.1 Conformité réglementaire

Le Client garantit que son utilisation du Service est conforme à l'ensemble des dispositions législatives et réglementaires applicables à la profession de pharmacien d'officine, en particulier :
- Le Code de la santé publique, notamment ses dispositions relatives au secret professionnel applicable à toute personne intervenant dans le système de santé (article L.1110-4) et au Code de déontologie des pharmaciens (articles R.4235-1 et suivants, en particulier R.4235-5 relatif au secret professionnel) ;
- Le RGPD et la loi n° 78-17 du 6 janvier 1978 modifiée (« Loi Informatique et Libertés ») ;
- Le Code de déontologie des pharmaciens (articles R.4235-1 et suivants).

### 7.2 Statut de Responsable de traitement

Le Client reconnaît être **Responsable de traitement** au sens de l'article 4(7) du RGPD pour l'ensemble des Données patient qu'il choisit de saisir dans le Service. À ce titre, il lui appartient :
- D'informer ses patients du traitement de leurs données conformément aux articles 13 et 14 du RGPD ;
- De déterminer les finalités et les moyens de ce traitement ;
- De recueillir, le cas échéant, leur consentement ;
- De répondre aux demandes d'exercice de leurs droits (articles 15 à 22 du RGPD).

L'Éditeur agit en qualité de **Sous-traitant** au sens de l'article 4(8) du RGPD, dans les conditions définies par l'Accord de Sous-Traitance (DPA) accepté concomitamment aux présentes.

### 7.3 Sécurité des comptes Utilisateurs

Le Client est responsable de la gestion des accès qu'il accorde à ses Utilisateurs. Il s'engage à :
- N'inviter que des Utilisateurs ayant un besoin légitime d'accéder aux données de l'officine ;
- Révoquer sans délai les accès des Utilisateurs quittant l'officine ;
- Sensibiliser ses Utilisateurs aux bonnes pratiques de sécurité (notamment : ne pas partager d'identifiant, déconnexion en fin de poste sur un ordinateur partagé).

### 7.4 Usages prohibés

Le Client s'interdit, et interdit à ses Utilisateurs, d'utiliser le Service pour :
- Stocker ou traiter des données sans rapport avec l'activité de l'officine ;
- Effectuer des actions susceptibles de porter atteinte à la sécurité, à la disponibilité ou à l'intégrité du Service ;
- Tenter de contourner les mesures techniques de sécurité ou d'isolement multi-tenant ;
- Effectuer une rétro-ingénierie du Service ;
- Utiliser le Service à des fins commerciales tierces (notamment la revente du Service à un tiers).

---

## 8. Données patient et secret professionnel

### 8.1 Nature des données patient

Le Service est susceptible de traiter des Données patient, en particulier dans les modules suivants :
- **Ordonnances** : numérisation et reconnaissance optique de caractères (OCR) des ordonnances de patients, comprenant potentiellement le nom du patient, le nom du prescripteur, la date de prescription et la liste des médicaments prescrits ;
- **Ruptures de traitement** : identification d'un patient en attente d'un médicament en rupture d'approvisionnement.

### 8.2 Secret professionnel pharmacien

Les Utilisateurs Pharmaciens (titulaires, adjoints) sont tenus au secret professionnel en application de l'article L.1110-4 du Code de la santé publique et des articles R.4235-1 et suivants du Code de déontologie des pharmaciens (notamment R.4235-5). Le Client veille à ce que ses Utilisateurs respectent ce secret dans leur utilisation du Service.

### 8.3 Engagement de l'Éditeur

L'Éditeur met en œuvre, dans le cadre du DPA, les mesures techniques et organisationnelles appropriées pour garantir un niveau de sécurité adapté au caractère sensible des Données patient, conformément à l'article 32 du RGPD. Ces mesures sont détaillées dans la page sécurité (`/securite`) et dans l'annexe 3 du DPA.

### 8.4 Hébergement et localisation

L'ensemble des Données patient est hébergé sur des serveurs situés dans l'Union européenne (région France, Paris) et n'est jamais transféré hors de l'UE/EEE dans le cadre du traitement courant. La liste exhaustive des sous-traitants ultérieurs et de leur localisation est consultable dans le DPA.

---

## 9. Propriété intellectuelle

### 9.1 Propriété de l'Éditeur

L'Éditeur reste seul titulaire de tous les droits de propriété intellectuelle relatifs au Service, notamment : le code source, l'interface graphique, la base de données, les marques, les logos, la documentation technique et commerciale.

### 9.2 Licence d'utilisation

L'Éditeur concède au Client, pendant la durée de l'abonnement, un droit d'utilisation non exclusif, non cessible et non transférable du Service, dans la limite du nombre d'Utilisateurs autorisé par la formule souscrite.

### 9.3 Propriété des données du Client

Le Client reste seul propriétaire de l'ensemble des données qu'il saisit dans le Service (« Contenus Client »). L'Éditeur n'acquiert aucun droit sur ces données autre que celui strictement nécessaire à l'exécution du Service, conformément au DPA.

### 9.4 Améliorations du Service

L'Éditeur peut utiliser des données techniques agrégées et anonymisées (notamment des statistiques d'utilisation, des temps de réponse, des fréquences de fonctionnalités) à des fins d'amélioration du Service. Ces données ne contiennent aucune Donnée patient identifiable.

---

## 10. Confidentialité et protection des données

Les modalités de collecte, de traitement et de protection des données à caractère personnel sont précisées dans :
- La Politique de Confidentialité (`/privacy`), applicable aux Utilisateurs ;
- L'Accord de Sous-Traitance (`/dpa`), applicable aux relations B2B entre le Client (Responsable de traitement) et l'Éditeur (Sous-traitant) pour le traitement des Données patient.

Ces deux documents font partie intégrante du présent contrat.

---

## 11. Sous-traitants

L'Éditeur recourt à des sous-traitants ultérieurs pour la fourniture du Service. La liste exhaustive et à jour de ces sous-traitants, leur rôle et leur localisation est consultable à tout moment dans l'annexe 2 du DPA (`/dpa`). Toute modification substantielle de cette liste fait l'objet d'une information préalable au Client par courriel, avec faculté pour ce dernier de s'y opposer dans les conditions définies par le DPA.

---

## 12. Responsabilité

### 12.1 Engagement de moyens

L'Éditeur s'engage à fournir le Service avec diligence et conformément aux règles de l'art. Cette obligation est une obligation de moyens et non de résultat.

### 12.2 Disponibilité du Service

L'Éditeur s'efforce de maintenir le Service disponible 24h/24 et 7j/7, à l'exception des interruptions pour maintenance planifiée (annoncées au minimum 48 heures à l'avance par courriel) et des cas de force majeure. **Aucun engagement de disponibilité (SLA) ne fait l'objet d'un crédit ou d'une indemnisation pendant la phase bêta**, sauf accord écrit séparé entre les parties.

### 12.3 Limitation de responsabilité

Dans les limites permises par la loi applicable, la responsabilité totale cumulée de l'Éditeur au titre du présent contrat, tous préjudices confondus, est limitée au montant total des sommes effectivement perçues par l'Éditeur au titre de l'abonnement du Client au cours des douze (12) mois précédant le fait générateur. L'Éditeur ne saurait en aucun cas être tenu responsable des dommages indirects subis par le Client, notamment : perte de chiffre d'affaires, perte de clientèle, atteinte à l'image.

### 12.4 Exclusions

La responsabilité de l'Éditeur ne saurait être engagée dans les cas suivants :
- Utilisation du Service non conforme aux présentes CGS ou aux règles de l'art ;
- Saisie de données erronées ou contrevenant à la réglementation applicable par un Utilisateur du Client ;
- Conséquences d'une décision médicale ou pharmaceutique prise par un Utilisateur, le Service étant un outil d'organisation et non un système d'aide à la décision médicale ;
- Indisponibilité résultant d'une cause étrangère à l'Éditeur (notamment : défaillance d'un sous-traitant tiers, attaque informatique, cas de force majeure).

---

## 13. Force majeure

Aucune des parties ne pourra être tenue responsable d'un manquement à ses obligations contractuelles en cas de survenance d'un événement de force majeure au sens de l'article 1218 du Code civil, notamment : catastrophe naturelle, guerre, attentat, panne généralisée des infrastructures internet, décision d'une autorité publique rendant impossible l'exécution du contrat.

---

## 14. Modifications des CGS

L'Éditeur se réserve le droit de modifier les présentes CGS à tout moment, notamment pour tenir compte d'évolutions législatives, réglementaires, techniques ou commerciales. Toute modification substantielle est notifiée au Client par courriel au moins **trente (30) jours** avant son entrée en vigueur. Le Client dispose d'un droit de résiliation sans pénalité pendant cette période s'il n'accepte pas les modifications. À défaut de résiliation, le Client est réputé avoir accepté les modifications.

L'identifiant de version et l'empreinte cryptographique (sha256) de chaque version des CGS sont conservés dans la base de données de l'Éditeur en regard de l'acceptation horodatée du Client, conformément à l'article 7 du RGPD.

---

## 15. Loi applicable et juridiction compétente

Les présentes CGS sont régies par le droit français.

Tout litige relatif à la formation, l'interprétation, l'exécution ou la résiliation des présentes CGS, qui n'aurait pu être résolu à l'amiable dans un délai de soixante (60) jours à compter de sa notification écrite par lettre recommandée, sera soumis à la compétence exclusive des tribunaux du ressort de la cour d'appel de [À COMPLÉTER : ville du siège social], nonobstant pluralité de défendeurs ou appel en garantie.

---

## 16. Contact

Pour toute question relative aux présentes CGS, le Client peut contacter l'Éditeur :
- Par courriel : `support@pharmaworkspace.fr`
- Par voie postale : [À COMPLÉTER : adresse du siège social]
- Délégué à la Protection des Données (DPO) : `support@pharmaworkspace.fr`

---

*Document publié le 30 mai 2026. Version 2026-05-30.*
