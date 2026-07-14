// Client Sentry (équivalent sentry.client.config.ts du wizard Next.js).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { sentryBeforeSend } from "@/lib/sentry/before-send";
import posthog from "posthog-js";
import {
  CONSENT_ACCEPTED_EVENT,
  shouldInitAnalytics,
} from "@/lib/consent/cookie-consent";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      // === Session Replay : masquage INTÉGRAL OBLIGATOIRE (RGPD + santé) ===
      // Contexte officines : noms patients, médicaments, contacts pro visibles à
      // l'écran ne DOIVENT JAMAIS quitter le navigateur. Par défaut Sentry ne
      // masque que les inputs ; on force aussi le masquage du texte et le blocage
      // des médias (même posture que le Session Replay PostHog plus bas).
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    // Limite les breadcrumbs console aux erreurs (évite de logger des données
    // métier), à l'identique des configs server/edge. NB : consoleIntegration
    // n'existe pas dans le SDK navigateur Sentry (intégration Node-only) ; côté
    // client on filtre les breadcrumbs console non-error via beforeBreadcrumb.
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "console" && breadcrumb.level !== "error") {
        return null;
      }
      return breadcrumb;
    },
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    sendDefaultPii: false,
    // Scrubbe body/headers/cookies (donc le JWT) et l'email avant envoi,
    // comme côté server/edge (cf. src/lib/sentry/before-send.ts).
    beforeSend: sentryBeforeSend,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// === CONSENT-01 : opt-in CNIL ===
// PostHog ne s'initialise (et ne pose son cookie ph_<token>_posthog) que si :
//   - l'utilisateur est authentifié (intérêt légitime contractuel), OU
//   - le visiteur anonyme a cliqué « Accepter » sur le bandeau cookies.
// Sinon, l'init est différée : le bandeau dispatch CONSENT_ACCEPTED_EVENT au
// clic « Accepter » et l'init se fait à ce moment-là, sans reload.
function initPostHog() {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://eu.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  // Pas de profil pour chaque visiteur anonyme : on n'identifie qu'au login.
  // Économise du quota PostHog et minimise le RGPD côté visiteurs landing.
  person_profiles: "identified_only",
  // P4-06 : on capture les pageviews manuellement (event `landing_view`,
  // futur `signup_view`, etc.) pour éviter les doublons et garder le contrôle.
  capture_pageview: false,
  // === Session Replay : masquage INTÉGRAL OBLIGATOIRE (RGPD + santé) ===
  // Contexte officines : noms patients, médicaments, contacts pro visibles à
  // l'écran ne DOIVENT JAMAIS apparaître dans les replays PostHog.
  // Ne pas relâcher ce bloc sans validation explicite Mehdi (cf. P4-06).
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: "*",
    maskInputOptions: {
      password: true,
      email: true,
      text: true,
      textarea: true,
      number: true,
    },
    blockSelector: ".ph-no-record",
  },
  debug: process.env.NODE_ENV === "development",
  });
}

if (shouldInitAnalytics()) {
  initPostHog();
} else if (typeof window !== "undefined") {
  window.addEventListener(CONSENT_ACCEPTED_EVENT, initPostHog, { once: true });
}
