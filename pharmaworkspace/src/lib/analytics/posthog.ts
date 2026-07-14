// Wrappers PostHog client-side.
//
// PostHog est initialisé dans `src/instrumentation-client.ts` avec session
// replay masking intégral (obligatoire RGPD : noms patients, médicaments, contacts
// ne doivent jamais apparaître dans les replays). Ces helpers exposent une
// surface stable pour les composants UI sans qu'ils importent directement
// `posthog-js` (couche d'abstraction pour swap si besoin + sécurité SSR).

import posthog from 'posthog-js'

/**
 * Émet un event PostHog avec des properties optionnelles.
 *
 * Naming convention (cf. COORDINATION.md §B6) :
 *  - `snake_case` strict.
 *  - Verbe au passé pour les actions (ex. `signup_completed`).
 *  - Verbe à l'infinitif pour les états (ex. `landing_view`).
 *  - Pas de noms qui peuvent collisionner avec les events serveur déjà câblés
 *    par Mehdi dans `src/lib/posthog-server.ts` (ex. `prescription_ocr_completed`).
 */
export function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.capture(event, properties)
}

/**
 * Associe un user authentifié au profil PostHog courant. À appeler une fois
 * après le login OTP (côté `auth/callback` ou au mount du dashboard si déjà
 * loggué). `traits` est optionnel : email, pharmacy_id, role…
 *
 * Note : `person_profiles: 'identified_only'` est set dans instrumentation ;
 * tant qu'on n'appelle pas `identify()`, aucun profil PostHog n'est créé.
 */
export function identify(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.identify(userId, traits)
}

/**
 * Réinitialise l'identification (à appeler au logout pour éviter qu'un user
 * suivant hérite du distinctId du précédent).
 */
export function resetIdentity() {
  if (typeof window === 'undefined') return
  posthog.reset()
}
