# NOSOCLEAN Academy · Roadmap interne V1

> Document interne baseflow® · Confidentiel · **ne pas partager au client** (le planning externe est dans `TIMELINE-CLIENT.pdf`).
> Cadence : 6 semaines, **S1 = lundi 20 juillet 2026** → **Lancement V1 = vendredi 28 août 2026**. Bilan J+15 : lundi 14 septembre.

## Pré-semaine (13–17 juillet) · cette semaine

| Action | Owner | Note |
|---|---|---|
| Envoyer **gabarit article + structure fiche protocole** à Mme Boudeja | Mehdi | ⚠️ Bloque la production des 30 contenus · demandé explicitement dans leur réponse |
| Caler la **session de cadrage budget & partenaires** (leur « sous 15 jours » expire ~17/07) | Mehdi | Proposer créneau via hotline.baseflow.fr, viser le 22–23/07 |
| Caler le **point hebdo récurrent** (30 min, accepté par le client) | Mehdi | Proposer lundi 11h00 avec Mme Boudeja |
| Réceptionner et vérifier la **charte** (logo vecto, polices, licence Frutiger web) | Design | Fallback Calibri/Carlito si licence KO |
| Setup : monorepo Next.js 15 + Payload 3 (décision actée), Vercel (dev/staging/prod), Supabase, CI | Dev | Porter les composants du repo prototype nosoclean.vercel.app |
| Design tokens charte (couleurs, typo) + audit du prototype | Design/Dev | Glassmorphism validé, garder |

## S1 (20–24 juil) · Cadrage & fondations *(Phase 1)*

- Session de cadrage client : budget, partenaires, 10 use cases hospitaliers prioritaires, domaine (`academy.nosoclean.com`), rétention RGPD.
- Back-office Payload : collections Article / Fiche Protocole / Produit, workflow `brouillon → validation scientifique → validation DG → publié`, comptes pour la cellule (Boudeja, Zamoun, Lyna, Benyoucef, Timsiline en lecture/validation).
- Squelette PWA : shell, routing, manifest/SW, design system chartes.
- Rédaction de 10 contenus de démo (pour ne jamais être bloqué par le contenu réel).
- **Jalon interne S1 : back-office livré à la cellule contenu + brief de prise en main.**

## S2 (27–31 juil) · Bibliothèque *(Phase 1→2)*

- Bibliothèque : cartes dynamiques, filtrage temps réel par problématique métier, pages article (accès libre).
- Pipeline d'indexation RAG : publish → chunk → embed → pgvector ; panneau « Academy Intelligence » ; page « Academy Settings » (état index, log, resync, kill-switch).
- Génération des suggestions de questions par article (≤7, shuffle).
- Côté client : production des 30 contenus lancée (échéance critique S2 du kickoff) ; fiches produits transmises.
- **GO/NO-GO fin de Phase 1 (vendredi 31/07, avec client) : gabarits OK, back-office adopté, premiers contenus en production.**

## S3 (3–7 août) · Assistant IA *(Phase 2)*

- `/api/chat` Edge : streaming SSE, Claude Sonnet, prompt système scientifique (sources SF2H/ECDC/OMS…, refus hors-domaine, disclaimer).
- Overlay assistant : décomposition overlay baseflow® (messages, suggestions, sources, loader, toolbar), injection du contexte article, RAG retrieval.
- Dictée vocale (Web Speech + fallback) et visualisation fréquences.
- Inscription Pro (magic link) + table conversations + rattachement lead.
- Intégration des premiers contenus réels au fil de l'eau ; accès revues scientifiques (IGNES, Risques & Qualités) à obtenir du client.
- **GO/NO-GO fin de Phase 2 (vendredi 7/08, avec client) : démo bibliothèque + assistant sur contenus réels.**

## S4 (10–14 août) · Protocoles, conversion, dashboard *(Phase 3)*

- Fiches protocoles (use case / secteur / type de contamination) + connexion produits + CTA contact sans rupture.
- Dashboard leads : conversations, comptes, export CSV.
- Jeu de recette IA : 50 questions/réponses attendues, envoyé au Dr Zamoun pour validation.
- Client : liste bêta-testeurs confirmée (3–5 hospitaliers · échéance S4 du kickoff).
- **Jalon interne : feature-complete vendredi 14/08.**

## S5 (17–21 août) · QA & bêta fermée *(Phase 3)*

- Recette QA complète iOS/Android (Safari iOS en priorité), audit perf mobile (Lighthouse PWA ≥ 90), a11y de base.
- Bêta fermée 3–5 professionnels : onboarding QR code, recueil retours structuré.
- Corrections + validation du jeu de 50 questions par le Dr Zamoun.
- **GO/NO-GO lancement (vendredi 21/08, avec client + DG).**

## S6 (24–28 août) · Lancement *(Phase 4)*

- Ajustements post-bêta, optimisations finales.
- Mise en prod : domaine, monitoring, sauvegardes, mentions légales/RGPD.
- Distribution : QR codes, kit réseau Nosoclean (avec M. Benyoucef pour LinkedIn/réseaux).
- Activation dashboard leads pour la DG.
- **Lancement V1 : vendredi 28 août 2026.**

## Post-lancement

- Bilan J+15 : **lundi 14 septembre** · métriques d'usage, retours utilisateurs, backlog V1.1/V2 (résumé d'article, TTS, multilingue FR/AR/EN, stores natifs, forum expert, alertes réglementaires, assistant IA de rédaction back-office).

## Gouvernance & touchpoints (rappel)

| Rituel | Quand | Qui |
|---|---|---|
| Point hebdo 30 min | Chaque lundi 11h (S1→S6) | Mehdi + Mme Boudeja (DG en copie CR) |
| Revues GO/NO-GO | 31/07 · 7/08 · 21/08 | baseflow® + cellule + DG |
| Session cadrage budget/partenaires | ~22–23/07 | Mehdi + Dr Timsiline |
| Prise de RDV | https://hotline.baseflow.fr | Client en autonomie |
| Canal asynchrone | À acter en session de cadrage (WhatsApp/Slack/email) | Tous |

## Dépendances client (à surveiller chaque hebdo)

1. **30 contenus** · critique S2 ; relancer dès le 27/07 si <10 reçus.
2. Fiches produits · S2.
3. Accès revues scientifiques · S3.
4. Bêta-testeurs nominatifs · S4.
5. Validation du jeu de 50 questions par Dr Zamoun · S5.

Règle : tout glissement client >1 semaine sur les contenus décale le lancement d'autant · l'annoncer au point hebdo suivant, jamais après coup.
