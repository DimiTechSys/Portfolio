# Audit cookies — pièce documentaire CNIL (interne)

> Document interne (CONSENT-01). Ne pas linker depuis les pages publiques.
> À présenter en cas de contrôle CNIL : inventaire exhaustif des cookies,
> justification des bases légales, description du mécanisme de recueil du
> consentement. À tenir à jour à chaque ajout/suppression de traceur.

- **Date de rédaction** : 2026-06-10
- **Date de mise en production** : à compléter au déploiement de CONSENT-01 (merge PR + deploy Vercel)
- **Composant bandeau** : `src/components/marketing/cookie-banner.tsx` (version initiale CONSENT-01)
- **Logique de consentement** : `src/lib/consent/cookie-consent.ts`
- **Gate d'init analytics** : `src/instrumentation-client.ts`
- **Pages publiques d'information** : `/cookies` (inventaire + révocation), `/privacy` art. 10

---

## 1. Inventaire exhaustif des cookies

### 1.1 Cookies 1st-party (domaine pharmaworkspace.fr)

| Cookie | Posé par | Finalité | Durée | Base légale | Consentement requis |
|---|---|---|---|---|---|
| `sb-<projectref>-auth-token` (+ chunks `.0`, `.1`…) | Supabase (`@supabase/ssr`) | Session d'authentification (JWT). Sans lui, impossible de se connecter au service. | Session, renouvellement automatique | Strictement nécessaire au service expressément demandé (art. 82 al. 1 loi 78-17) | Non (exemption) |
| `pw_cookie_consent` | PharmaWorkspace (`cookie-consent.ts`) | Mémorisation du choix accepter/refuser sur les cookies analytics | 13 mois (plafond CNIL) | Strictement nécessaire au respect du choix de l'utilisateur (doctrine CNIL constante) | Non (exemption) |
| `ph_<token>_posthog` | PostHog JS (`posthog-js`) | Mesure d'audience produit + analyse comportementale (PostHog Cloud EU, Francfort) | 12 mois | **Visiteur anonyme : consentement** (art. 82 al. 2). **Utilisateur authentifié : intérêt légitime contractuel** (amélioration du service au titre des CGS, mentionné privacy.md art. 10) | Oui pour visiteurs anonymes — recueilli via le bandeau |

### 1.2 Cookies tiers

| Cookie | Domaine | Contexte | Base légale |
|---|---|---|---|
| Cookies Stripe (`__stripe_mid`, `__stripe_sid`, etc.) | `stripe.com` | Posés uniquement lors d'une visite des pages Stripe (Checkout, Customer Portal) — hors périmètre technique du site | Strictement nécessaires à la sécurisation du paiement et à la lutte contre la fraude (politique Stripe) |

### 1.3 Services sans cookie

- **Sentry** (détection d'erreurs, instance EU Francfort) : aucun cookie déposé. PII scrubbing actif (`src/lib/sentry/before-send.ts`).

## 2. Justification de la non-exemption PostHog

L'exemption « mesure d'audience » (délibération CNIL 2020-091/092) ne s'applique pas car :
1. Le SDK PostHog embarque le **Session Replay** (même avec masquage intégral et `replaysSessionSampleRate` à 0 côté Sentry, la capacité de rejeu PostHog est active) — la CNIL considère le replay comme excédant la stricte mesure d'audience.
2. Les events produit alimentent des analyses comportementales (funnels d'activation, missions ONBOARD-01) au-delà de la statistique de fréquentation anonyme.

D'où le choix **opt-in préalable** pour tout visiteur non authentifié.

## 3. Mécanisme de recueil du consentement

1. **Premier hit anonyme** sur une page publique : aucun cookie analytics déposé. PostHog n'est **pas initialisé** (gate dans `instrumentation-client.ts` : `shouldInitAnalytics()`).
2. **Modal centrée à deux niveaux** (pattern CMP standard — Didomi/Cookiebot) :
   - 1er niveau : texte neutre, deux boutons de même niveau et même taille « Tout refuser » / « Tout accepter » (un seul clic chacun, pas de dark pattern), action secondaire « Personnaliser mes choix », lien « En savoir plus » vers `/cookies`. Pas de fermeture par clic sur le backdrop : le choix doit être explicite.
   - 2e niveau (préférences) : catégories avec interrupteurs — « Strictement nécessaires » (toujours actifs, non désactivables) et « Mesure d'audience » (PostHog, désactivé par défaut au premier visit) + « Enregistrer mes préférences ».
   - Sur la page `/cookies` elle-même, le 1er niveau est une barre basse non-bloquante afin que le visiteur puisse lire la politique avant de choisir.
   - **Widget cookie flottant** (bas gauche) affiché en permanence après un choix : rouvre les préférences à tout moment (révocation aussi simple que l'octroi, RGPD art. 7.3). Le passage accepté → refusé recharge la page pour stopper le PostHog déjà initialisé.
3. **Accepter** → `pw_cookie_consent=accepted` (13 mois) + init PostHog immédiate (event `pw:consent-accepted`).
4. **Refuser** → `pw_cookie_consent=refused` (13 mois), PostHog jamais initialisé, zéro cookie analytics.
5. **Révocation** : page `/cookies`, bouton « Modifier mon choix » → efface `pw_cookie_consent`, reload, le bandeau réapparaît. Retrait aussi simple que l'octroi (RGPD art. 7.3).
6. **Utilisateur authentifié** (cookie `sb-*-auth-token` présent) : bandeau non affiché, PostHog initialisé sur la base de l'intérêt légitime contractuel (information en privacy.md art. 10.2).

## 4. Texte du bandeau (version en production)

> **🍪 Cookies et mesure d'audience**
>
> Nous utilisons des cookies pour mesurer l'audience de notre site et améliorer notre produit. Vous pouvez accepter ou refuser — votre choix n'affecte pas l'accès au service. En savoir plus.
>
> [ Refuser ] [ Accepter ]

## 5. Preuves et vérifications

- Test Playwright `e2e/cookie-consent.spec.ts` : scénarios accept / refuse / revoke (vérifie l'absence de cookie `ph_*` tant que pas d'acceptation).
- Vérification manuelle navigation privée : seuls `pw_cookie_consent` (après choix) et les éventuels cookies Supabase (après login) sont présents.
- Capture d'écran du bandeau : à archiver dans ce dossier au déploiement (`docs/cookie-banner-screenshot-<date>.png`).

## 6. Historique des versions

| Date | Changement |
|---|---|
| 2026-06-10 | Version initiale (CONSENT-01) : bandeau opt-in, gate PostHog, page /cookies, privacy.md art. 10 enrichi |
