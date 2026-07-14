# BUSINESS_CONTEXT.md — PharmaWorkspace

> Document de cadrage **produit & business** pour itérer sur la stratégie, le business plan et les prochaines actions.
> Complémentaire de `CLAUDE.md` (technique). À jour au 18 mai 2026 — phase **MVP → bêta privée**.
> Ce qui est marqué **[À valider]** est une hypothèse non encore validée terrain.

---

## 1. Identité produit

**PharmaWorkspace** est un **outil de coordination opérationnelle** pour l'équipe d'une officine pharmaceutique française. Ce n'est **pas** :

- un LGO (logiciel de gestion d'officine type Winpharma, LGPI, SmartRx, LeoPharma) — il ne fait pas la vente, la facturation Sécu, ni la gestion du stock à la boîte.
- un outil d'e-prescription (type Mon Espace Santé, Ségur).
- un CRM patient.

C'est **la couche "back-office équipe"** qui manque entre le LGO et les outils génériques (WhatsApp, post-it, Excel, cahier de transmission) que les équipes utilisent aujourd'hui pour se coordonner.

### Promesse de valeur (1 phrase)
> "Remplacer le cahier de transmission, les post-it et les groupes WhatsApp de l'officine par un seul espace partagé, accessible mobile et desktop, qui centralise tâches, ordonnances en attente, ruptures, locations et commandes."

### Promesse de valeur (3 angles)
1. **Continuité d'équipe** — note de transmission, sessions de travail, agenda partagé, notifications. *Le sujet n°1 dans une officine multi-pharmaciens.*
2. **Productivité** — OCR ordonnance, scan CIP13, base BDPM/ANSM intégrée. *Gain de minutes par acte répété 50×/jour.*
3. **Conformité & qualité** — procédures SOP, formation, traçabilité des ruptures. *Cocher des cases que les ARS / inspections demandent.*

---

## 2. Marché cible

### Cible primaire — officines françaises
- **~21 000 officines** en France (DREES, ordre des pharmaciens).
- **Équipe type** : 1 titulaire + 1–3 adjoints + 1–5 préparateurs + apprentis.
- **Concentration** : ~70 % indépendantes ou en groupement (Giropharm, Pharmavie, Forum Santé, Univers Pharmacie, Lafayette…). Les groupements sont un canal d'entrée à part entière.

### Segmentation interne
| Segment | Volume | Pertinence | Why |
|---|---|---|---|
| Officine rurale (1–3 pers.) | ~30 % | **Faible** | Coordination peu nécessaire, équipe réduite, budget logiciel serré. |
| Officine urbaine moyenne (4–8 pers.) | ~50 % | **Forte** | Cœur de cible : multi-équipiers, rotation matin/aprèm, volume d'ordonnances. |
| Officine centre commercial / grande surface (>10 pers.) | ~15 % | **Très forte** | Coordination complexe, flux élevé, mais cycles de décision plus longs (groupement). |
| EHPAD / PUI / hospitalier | <5 % | **Hors scope V1** | Réglementation et workflow différents. |

### Bénéficiaires intra-officine
| Persona | Pain point principal | Ce que PharmaWorkspace résout |
|---|---|---|
| **Titulaire** (admin) | Visibilité sur ce qui est fait / pas fait, conformité, charge de travail | Dashboard, KPIs, RH, agenda, procédures |
| **Adjoint** | Coordination quotidienne, ordonnances en attente | Ordonnances, ruptures, transmission |
| **Préparateur** | Tâches à faire, commandes, locations | Tâches, kanban, commandes, scan CIP13 |
| **Apprenti / stagiaire** | Formation, procédures, autonomie | Centre de formation, SOP |

---

## 3. État fonctionnel (mai 2026)

Échelle de maturité : **🟢 prêt prod** | **🟡 fonctionnel mais à durcir** | **🔴 fragile / incomplet**.

| Module | Maturité | Commentaire business |
|---|---|---|
| Auth OTP email + onboarding pharmacie | 🟡 | Marche, flux invitation **à valider de bout en bout** avant bêta. |
| Profil utilisateur + avatar | 🟢 | OK, livré récemment. |
| Dashboard (KPIs + note de transmission) | 🟢 | Pilier différenciant — c'est l'écran que le titulaire ouvre le matin. |
| Tâches (liste + kanban + agenda) | 🟢 | Solide, attachments + audio livrés. |
| Ordonnances + OCR (GPT-4o-mini) | 🟡 | OCR fonctionne. **Tests de charge multi-pages** non faits. Reconnaissance prescripteur/date d'exécution **manquante** (impact réel sur l'usage). |
| Commandes fournisseurs | 🟡 | CRUD complet. Pas d'export comptable ni d'EDI laboratoire (= pas un remplaçant LGO). |
| Locations matériel médical | 🟢 | Tarification daily_rate réintroduite. Use case bien servi. |
| Ruptures (scan CIP13 + BDPM + ANSM) | 🟢 | **Différenciant fort**. 20 744 médicaments + 1 031 ruptures officielles synchronisées. |
| Annuaire (contacts) | 🟢 | Médecins, EHPAD, infirmiers, laboratoires. |
| Procédures & formation (SOP, vidéos) | 🟡 | Hébergement OK, pas de tracking de lecture / certification. |
| Agenda global | 🟢 | Desktop only assumé. |
| Notifications | 🟡 | Système OK, **déclencheurs métier** (tâches en retard, locations overdue) à compléter. |
| Admin (membres, paramètres officine) | 🟢 | OK. |

### Fonctionnalités absentes explicites (positionnement assumé)
- Pas de vente / caisse / facturation.
- Pas de DP (Dossier Pharmaceutique).
- Pas d'intégration LGO (cible V2).
- Pas de paiement / abonnement clients (Stripe pas encore intégré).
- Pas de mode hors-ligne.

---

## 4. Différenciation

### Vs cahier / post-it / WhatsApp
- **Centralisé, recherchable, traçable, persistant** entre sessions.
- **Rôles & permissions** (titulaire vs préparateur).
- **Notifications** → ne dépend plus de "qui était présent ce matin".

### Vs LGO
- **Complémentaire, pas concurrent.** Le LGO reste indispensable pour la vente. PharmaWorkspace est l'outil "à côté" de l'ordi de comptoir.
- **Mobile-first.** Les LGO sont des logiciels Windows desktop. PharmaWorkspace marche sur le téléphone du titulaire pendant qu'il est dans la réserve ou hors officine.
- **Moderne.** UI 2026 vs UI 2005 des LGO.

### Vs outils SaaS adjacents
- **Smart RX, Pharmavie tools** : verticaux mais focalisés vente / fidélité, pas coordination équipe.
- **Notion / Trello / Slack** : génériques, demandent à l'officine de tout configurer + pas de BDPM/ANSM/CIP13.
- **Pharmagest "Mon LGPI Mobile"** : extension d'un LGO, pas un outil indépendant.

### Moats potentiels (à construire)
1. **Base BDPM/ANSM enrichie + scan CIP13** — barrière technique modérée mais set-up time réel.
2. **OCR ordonnance affiné** — entraîné sur retours terrain, marge d'amélioration vs GPT-4o-mini brut.
3. **Effet réseau intra-officine** — plus l'équipe est dessus, plus dur de partir.
4. **Intégrations LGO V2** — barrière à l'entrée très forte si négociées avec les éditeurs (mais long cycle de vente).
5. **Conformité / qualité packagée** — un bibliothèque de SOP prêts pour ARS = valeur perçue >> coût pour nous.

---

## 5. Hypothèses business à valider en bêta

### Pricing **[À valider]**
Hypothèse : **abonnement par officine**, pas par utilisateur (frottement à l'onboarding équipe = principal frein).
- Tier "Solo" : ~29 €/mois — officine ≤ 3 personnes, sans modules formation/SOP.
- Tier "Équipe" : ~59 €/mois — officine 4–8 personnes, tout inclus.
- Tier "Grande équipe" : ~99 €/mois — officine 9+ personnes, support prioritaire.
- Onboarding payant ou freemium ? **À trancher** — pousse pour un essai gratuit 30 jours avec data réelle (l'usage crée la rétention).

Ces chiffres sont à benchmarker contre :
- **Pharmavie Connect, OCP Web, Cerp** (services pros gratuits financés par les répartiteurs).
- **Outils QSE** (Pharmastat, QualiPharma) : 50–150 €/mois.
- **Pharmagest "Smart RX"** : licences perpétuelles, modèle hybride.

### Willingness to pay
- Une officine moyenne fait **~1,5–2 M€** de CA / an avec **~12 %** de marge brute → **180 k€** de marge.
- Un outil à 59 €/mois = 708 €/an = **0,4 % de la marge brute**. Justifiable s'il économise ne serait-ce que **30 min/jour à l'équipe**.
- Benchmark Slack/Notion équipes pro : 7–15 €/utilisateur/mois → un per-seat équivalent serait 35–75 € pour 5 personnes (cohérent avec le tier Équipe).

### Acquisition **[À valider]**
Hypothèses canaux par ordre de plausibilité :
1. **Bouche-à-oreille local** entre titulaires (réseau dense, voisinage).
2. **Groupements** — accord cadre avec 1–2 groupements pour pousser l'outil au catalogue.
3. **Salons** — PharmagoraPlus (mars), Salon de la Pharmacie d'Officine.
4. **Influenceurs pharma** — quelques pharmaciens sur LinkedIn / Instagram.
5. **SEO / contenu** — long terme, sujets "rupture de stock CIP13", "transmission équipe officine".
6. **Pub Meta ciblée "titulaire d'officine"** — précis grâce au métier.

### Rétention
- À mesurer dès la bêta : **DAU/MAU**, sessions ouvertes par utilisateur, % d'équipiers actifs par officine.
- Risque majeur : si seul le titulaire l'utilise, on retombe sur un outil personnel = churn à 6 mois.

---

## 6. Phase actuelle — bêta self-serve avec CB validée (pivot mai 2026, révision 2)

> 🔄 **Pivot mai 2026 (révision 2).** Deux pivots successifs :
>
> **Pivot 1** : sales-led (form bêta + kickoff call + Calendly + coupon -100 %) → self-serve sans CB.
>
> **Pivot 2** : self-serve sans CB → **self-serve avec CB obligatoire en fin de wizard onboarding** (pattern Linear / Vercel Pro / Loom Business). L'utilisateur warm (intro PHARMA ou lien organique) arrive sur `/signup`, valide email + click-wrap CGS/DPA, démarre le wizard onboarding 4 étapes (pharmacie / profil / équipe / **activation CB Stripe Checkout setup intent**), puis accède au produit avec 30 jours gratuits (€0 prélevés). À J+30, Stripe facture automatiquement la CB enregistrée au tarif Early Adopter -40 % à vie. Annulable à tout moment depuis le Customer Portal Stripe. L'humain n'intervient plus systématiquement à J0, seulement (a) sur signal d'abandon PostHog (notamment abandon entre step 3 et step 4 du wizard), (b) sur réservation explicite via `<HotlineCTA />` (notre outil booking maison `hotline.baseflow.fr` cross-tracké au funnel produit).
>
> **Rationale du pivot 2** : conversion trial→paid attendue **60-70 %** pour trial-with-CB vs **15-25 %** pour trial-no-CB (benchmarks ChartMogul/OpenView 2023-24). On perd ~30 % de signups en haut de funnel mais on multiplie par 3 le bas. Pour une cible warm pré-qualifiée par PHARMA, c'est le bon arbitrage. Code aussi plus simple : Stripe gère le trial→paid en auto-renouvellement, donc plus de page `/paywall` à construire.

### Objectif explicite
**Faire entrer 10 officines pilotes en self-serve** sur ~6–8 semaines pour :
1. Valider le PMF (Product-Market Fit) sur les modules cœur (tâches + ordonnances + ruptures).
2. Identifier les 2–3 frictions qui bloquent l'adoption équipe (pas seulement titulaire).
3. Itérer sur l'onboarding self-serve (le moment où on perd 80 % des inscrits dans tout SaaS).
4. Calibrer le pricing en conditions réelles (paywall J+30 → conversion).

### Critères de sélection des pilotes (warm intros PHARMA en priorité)
- Officine 4–8 personnes (cœur de cible).
- Mix urbain + semi-urbain.
- Au moins 1 pilote dans un groupement (canal partenariat).
- Au moins 1 titulaire "tech-friendly" pour itérer vite + 1 "réfractaire" pour stress-tester l'UX self-serve sans aide.
- Pas de pilote en zone sans 4G/wifi correcte (mode hors-ligne pas livré).

### Le funnel self-serve (8 étapes mesurées dans PostHog)
1. **Entry** — landing pharmaworkspace.fr (warm direct, organic, ou lien intro PHARMA `?source=warm_<nom>`).
2. **Signup** — `/signup` : email + OTP + click-wrap CGS/DPA, consentements stockés dans `pharmacy_acquisition` (audit RGPD art. 7).
3. **Onboarding step 1-3** — wizard pharmacie / profil / équipe (Dim P2-01) en < 3 min.
4. **CB activation** — `/onboarding/activate` : Stripe Checkout setup intent en `mode: 'subscription'` avec `trial_period_days: 30` et `payment_method_collection: 'always'`. €0 prélevés, CB validée, `subscription_status='trialing'`.
5. **Produit** — 30 jours d'accès libre, dashboard avec checklist first-run (créer 1ʳᵉ tâche / scanner 1 ordo / signaler 1 rupture / inviter 1 collègue), `<HotlineCTA context="app_header" />` toujours visible.
6. **Pré-prélèvement J-5** — `<TrialBanner />` soft en haut de l'app : "Prochain prélèvement le [date] : [tier_price] HT/mois. [Gérer mon abonnement]" + email Stripe natif "trial ending" à J-7.
7. **Prélèvement auto J+30** — Stripe facture automatiquement la CB enregistrée au tarif Early Adopter -40 %. `subscription_status: trialing → active`. Webhook met à jour DB. Pas d'action utilisateur requise.
8. **Client payant** — `subscription_status='active'`, accès complet, suivi NPS J+60. Annulable à tout moment via Customer Portal Stripe.

**Scénarios alternatifs gérés** :
- CB échoue à J+30 → `past_due` → banner orange in-app, Stripe retry 7j → si toujours échec `unpaid` → middleware redirige `/billing/reactivate` avec Customer Portal.
- Annulation pendant le trial → accès maintenu jusqu'à J+30 puis `canceled` → `/billing/reactivate`.

### Pourquoi self-serve avec CB plutôt que sans CB
- **Conversion trial→paid 60-70 % vs 15-25 %** (benchmarks SaaS B2B 2023-24). Compense largement la perte de signups (~30 % au max sur cible warm).
- **Cible warm pré-qualifiée** : la friction CB est acceptable car PHARMA a déjà filtré l'intérêt en amont.
- **Code plus simple** : Stripe gère le trial→paid en auto-renouvellement, pas de page `/paywall` à construire, Customer Portal Stripe pour annulation/update CB.
- **Pas de "fantômes" en base** : les comptes sans CB restent en `subscription_status='incomplete'` et sont bloqués au step 4 du wizard, donc pas de consommation de ressources produit.
- **Standard SaaS B2B** : Linear, Vercel Pro, Loom Business, Cal.com Pro fonctionnent tous comme ça. Les pharmaciens ne seront pas surpris.
- **Économie de temps Mehdi** : pas de kickoff call 45 min × 10 pilotes = ~8 h récupérées pour le travail produit/juridique/Stripe.
- **Légalité DPA click-wrap** : CNIL et art. 7 RGPD acceptent l'acceptation par case à cocher avec horodatage + hash version + IP + UA stockés. Audit-proof.

### Pré-requis techniques avant bêta (extrait de `CLAUDE.md` §10)
1. **RLS** complet sur `pharmacies` + `profiles` (sécurité multi-tenant non négociable).
2. **Flux invitation** validé E2E (sinon le pilote ne peut pas s'inviter mutuellement).
3. **Tests de charge OCR** (sinon un pilote enthousiaste fait tomber la route /api/ocr).
4. **Monitoring / observabilité** minimum (Sentry + PostHog EU) pour réagir vite aux bugs pilote et détecter les signaux d'abandon (notamment au step 4 du wizard onboarding).
5. **Backup Supabase** configuré + procédure de restauration testée.
6. **Funnel self-serve livré** : `/signup` (Mehdi P4-05, mergée) + wizard onboarding 4 étapes (Dim P2-01) + trial intégré Stripe (Mehdi P4-13, reste à coder) + setup Stripe + Customer Portal (Mehdi P4-13a) + tracking PostHog (Mehdi P4-14, mergée) + hotline.baseflow.fr cross-trackée (Mehdi P4-15).

---

## 7. Prochaines actions

### Court terme (4–6 semaines, avant bêta)
**Produit**
- [ ] Polish onboarding : créer pharmacie + inviter 3 collègues en <5 min sans aide.
- [ ] Compléter OCR : extraire `prescriber_name`, `prescribed_date`, `expiry_date` (les 3 champs manquants identifiés dans `analyse-critique-mvp.md`).
- [ ] Recherche dans les listes (ordonnances + ruptures en priorité) — bloquant à 100+ items.
- [ ] Notifications "tâches en retard" + "location overdue" (les triggers manquent côté DB ou job).

**Technique**
- [ ] Cf. `CLAUDE.md` §10 — RLS, typecheck CI, drift migration 0017, monitoring.

**Business**
- [ ] Rédiger 1 pager + démo vidéo 90 s pour démarchage groupements.
- [ ] Recruter 5 officines pilotes (cible : 10 contacts pour 5 oui).
- [ ] Mettre en place un CRM léger (Notion ou Airtable) pour suivre les pilotes.
- [ ] Construire un Loom / Calendly d'onboarding pour le 1er rdv pilote.

### Moyen terme (3 mois, post-bêta initiale)
**Produit**
- [ ] Pricing & paiement (Stripe). Facturer ne serait-ce que 1 € symbolique change la psychologie d'usage.
- [ ] Export comptable / SAGE / Coala (demandé par les titulaires probablement dans les premiers retours).
- [ ] Mise à jour automatique BDPM/ANSM (job hebdo) — aujourd'hui manuelle.
- [ ] Mobile : passer en PWA installable + push notifications.

**Business**
- [ ] Décider modèle : freemium très limité OU essai gratuit 30 jours.
- [ ] Cadrer 1er partenariat groupement (objectif : signature pilote avec un groupement régional).
- [ ] Préparer présence salon mars 2027 (PharmagoraPlus).

**Équipe / structure**
- [ ] **[À valider]** Définir besoin recrutement : un dev senior + un commercial / customer success ?
- [ ] Statut juridique cible (SAS ?), levée de fonds vs bootstrap.

### Long terme (6–12 mois)
**Produit V2**
- [ ] **PILL Chat** (assistant IA RAG sur les données officine) — c'est *le* hook marketing.
- [ ] Intégration LGO (au moins 1 lecteur — SmartRx ou LGPI le plus probable).
- [ ] Module patient (annuaire patient + suivi observance) — élargit le marché aux ehpad/maintien à domicile.

**Business**
- [ ] Atteindre 100 officines payantes (= ~5–10 k€ MRR).
- [ ] Étudier les marchés adjacents : Belgique (mêmes contraintes), Espagne (réglementation différente), Pharmacies hospitalières (PUI).
- [ ] Évaluer ARR / valuation pour lever ou non.

---

## 8. KPIs à instrumenter

### Acquisition
- Officines inscrites / mois.
- Coût d'acquisition par canal.

### Activation
- % d'inscrits qui complètent l'onboarding (création pharmacie + 1ʳᵉ tâche/ordonnance).
- Time-to-first-action (depuis signup jusqu'à 1ʳᵉ action métier).

### Engagement
- DAU / MAU global.
- DAU / MAU **par officine** (proxy de l'effet équipe).
- Sessions par utilisateur / semaine.
- Modules utilisés par officine (1 = adoption faible, 4+ = adoption forte).

### Rétention
- W1/W4/W12 retention par cohorte.
- Churn officines.
- NPS / CSAT (à mettre en place côté app : un widget dans /profile ou un mail trimestriel).

### Revenu (post-paywall)
- MRR, ARR.
- ARPA (Average Revenue Per Account).
- LTV / CAC.

### Produit
- Latence OCR moyenne / médiane / p95.
- Taux d'erreur OCR (corrections manuelles post-extraction).
- Volume scans CIP13 / officine / semaine (très bon signal d'usage profond).

**Outillage** : à câbler — PostHog (recommandé : free tier généreux + couvre product analytics + feature flags), ou Plausible + Mixpanel.

---

## 9. Risques & questions ouvertes

### Risques produit
- **R1 — OCR insuffisamment précis** sur ordonnances manuscrites / mal scannées. Mitigation : laisser édition rapide + collecter les corrections pour fine-tuning V2.
- **R2 — Adoption titulaire-only**. Si seuls les titulaires utilisent l'app, on est un outil personnel = churn. Mitigation : KPI explicite "% équipe active", onboarding qui force l'invitation.
- **R3 — Concurrence d'un LGO qui sort un module équipe**. Mitigation : aller vite, signer des partenariats / intégrations qui rendent un revirement coûteux.

### Risques tech
- **R4 — Coût OpenAI sur le scan d'ordonnances**. Si 10 officines × 30 OCR/jour × 0,01 $ = 90 $/mois → OK. Si 100 × 100/jour → 30 k$/an. Mitigation : tracker, basculer sur self-hosted (Ollama) au-delà d'un seuil.
- **R5 — Dépendance Supabase**. Bascule de plan / outage / lock-in. Mitigation : exports réguliers, plan B sur Postgres managé (Neon, Railway) documenté.

### Risques business
- **R6 — Cycles de décision longs des groupements** (6–12 mois). Ne pas baser le revenu pilote dessus.
- **R7 — Régulation données santé**. PharmaWorkspace stocke des noms patients (via OCR ordonnance) → potentiellement **données de santé à caractère personnel** = hébergement HDS recommandé. À clarifier juridiquement avant facturation. **[À valider — sujet bloquant si pas adressé]**
- **R8 — RGPD / consentement patient**. L'officine est responsable du traitement, nous sous-traitants → DPA à fournir aux clients.

### Questions stratégiques ouvertes
1. **Bootstrap ou levée ?** Le marché (~21 k officines × ~700 €/an = 15 M€ TAM strict France) ne justifie pas une grosse Série A, mais une seed légère + bootstrap est cohérent.
2. **Vente directe ou via groupement ?** Vitesse vs marge — un groupement prendra 20–30 % de commission mais ouvre 200–1 000 officines d'un coup.
3. **Saas pur ou bundle avec services ?** (Audit conformité ARS payant, formation continue créditée DPC…). Augmente ARPA mais alourdit l'opération.
4. **Quand recruter le 1er commercial ?** Avant 20 ou après 50 officines payantes ?
5. **Faut-il un nom de marque différent** une fois sorti du marché pharma (vision long terme "officine 2.0" multi-pays) ?

---

## 10. Ce qu'il faut donner à un agent business pour itérer

Quand tu lances une session "stratégie / business plan" sur PharmaWorkspace :

1. **Toujours** : faire lire ce fichier + `pharmaworkspace-status.md`.
2. **Souvent** : `analyse-critique-mvp.md` pour la lucidité sur le produit.
3. **Si question tech** : renvoyer vers `CLAUDE.md`.
4. **Ne pas inventer** : le pricing, la liste pilote, les chiffres officines sont **[À valider]** — l'agent doit le rappeler à l'utilisateur, pas trancher seul.
5. **Questions de cadrage à toujours poser à l'utilisateur** :
   - Quel est ton horizon de temps (semaines / mois / années) ?
   - Quel est ton objectif financier (bootstrap rentable / levée / vente) ?
   - Combien de pilotes signés à date et qui sont-ils ?
   - Quel est ton budget cash mensuel actuel (OpenAI, Supabase, Vercel, marketing) ?
   - Es-tu solo ou en équipe ? Si équipe, combien et avec quels rôles ?

Ces réponses doivent vivre dans **`PILOT_NOTES.md`** (à créer au fur et à mesure des conversations avec les pilotes) plutôt que dans ce document de cadrage.
