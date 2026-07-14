// CONSENT-01 : gestion du consentement cookies (conformité CNIL).
//
// `pw_cookie_consent` est un cookie technique 1st-party qui mémorise le choix
// du visiteur sur les cookies analytics. Il est strictement nécessaire au
// respect de ce choix → pas de consentement requis pour le poser (doctrine
// CNIL constante). Durée 13 mois (plafond CNIL pour un choix cookies).
//
// Règle d'init analytics (PostHog) :
//   - visiteur anonyme  → uniquement si choix explicite `accepted`
//   - utilisateur loggué → toujours (base légale : intérêt légitime
//     contractuel, cf. privacy.md art. 10), détecté par la présence du
//     cookie de session Supabase `sb-<ref>-auth-token`.

export type CookieConsent = 'accepted' | 'refused' | 'unknown'

export const COOKIE_CONSENT_NAME = 'pw_cookie_consent'

// 13 mois : durée de validité maximale d'un choix cookies selon la CNIL.
const CONSENT_MAX_AGE_S = 13 * 30 * 24 * 3600

/**
 * Event window qui déclenche l'init différée de PostHog (instrumentation-client
 * l'écoute quand l'init n'a pas eu lieu au boot). Émis par :
 *  - le bandeau cookies au clic « Accepter » (consentement) ;
 *  - la page /verify après un login OTP réussi (la navigation post-login est
 *    SPA, sans full reload ; donc sans cet event, PostHog resterait
 *    non-initialisé toute la session alors que la base légale a basculé sur
 *    l'intérêt légitime contractuel).
 */
export const CONSENT_ACCEPTED_EVENT = 'pw:consent-accepted'

/** À appeler quand l'analytics devient autorisée après le boot (accept / login). */
export function notifyAnalyticsAllowed(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CONSENT_ACCEPTED_EVENT))
}

export function getCookieConsent(): CookieConsent {
  if (typeof document === 'undefined') return 'unknown'
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_CONSENT_NAME}=(accepted|refused)`),
  )
  return (match?.[1] as CookieConsent | undefined) ?? 'unknown'
}

export function setCookieConsent(value: 'accepted' | 'refused'): void {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_CONSENT_NAME}=${value}; Max-Age=${CONSENT_MAX_AGE_S}; Path=/; SameSite=Lax`
}

export function clearCookieConsent(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_CONSENT_NAME}=; Max-Age=0; Path=/; SameSite=Lax`
}

/** Cookie de session Supabase présent = utilisateur authentifié. */
export function hasAuthSession(): boolean {
  if (typeof document === 'undefined') return false
  return /(?:^|;\s*)sb-[^=;]*-auth-token/.test(document.cookie)
}

export function shouldInitAnalytics(): boolean {
  if (hasAuthSession()) return true
  return getCookieConsent() === 'accepted'
}
