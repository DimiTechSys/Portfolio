// Helper d'acquisition (P4-14 minimal).
//
// Problème résolu : aujourd'hui /signup lit les `utm_*` directement dans
// `useSearchParams()` au moment du submit. Si l'utilisateur arrive sur `/`
// avec des UTMs, navigue vers `/tarifs` puis vers `/signup`, les UTMs sont
// perdus (présents seulement sur l'URL initiale).
//
// Solution : `captureAcquisitionFromUrl()` est appelé au 1er hit côté client
// (idéalement depuis un composant `LandingViewTracker` ou équivalent). Il
// stocke les UTMs en sessionStorage pour la durée de la visite. `SignupForm`
// appelle `readStoredAcquisition()` au mount pour ré-injecter les UTMs même
// si la page courante n'en porte plus.
//
// sessionStorage (pas localStorage) : on veut une attribution par session
// (l'utilisateur qui revient 2 semaines plus tard sans UTMs n'est plus
// attribué à la même source : c'est le comportement attendu).

const STORAGE_KEY = 'pw_acquisition_v1'

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const

type UtmKey = (typeof UTM_KEYS)[number]

export type AcquisitionPayload = {
  source?: string
  referrer?: string
} & Partial<Record<UtmKey, string>>

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

/**
 * À appeler au 1er hit landing côté client. Lit `utm_*` + `source` + le
 * document.referrer, et écrit le payload résultant en sessionStorage si au
 * moins une UTM est présente. Sinon, ne touche pas à un éventuel payload
 * stocké lors d'une page précédente (additif, jamais destructif).
 */
export function captureAcquisitionFromUrl(): void {
  if (!isBrowser()) return

  const url = new URL(window.location.href)
  const params = url.searchParams

  const payload: AcquisitionPayload = {}
  let hasUtm = false

  for (const key of UTM_KEYS) {
    const value = params.get(key)
    if (value) {
      payload[key] = value
      hasUtm = true
    }
  }

  const sourceParam = params.get('source')
  if (sourceParam) payload.source = sourceParam

  // document.referrer = page externe d'origine si arrivée depuis un autre
  // domaine (Google, lien direct depuis un email, etc.). Vide pour navigation
  // interne : on ne l'écrase pas dans ce cas.
  if (typeof document !== 'undefined' && document.referrer) {
    try {
      const referrerHost = new URL(document.referrer).host
      if (referrerHost !== url.host) {
        payload.referrer = document.referrer
      }
    } catch {
      // referrer non parseable, on ignore.
    }
  }

  if (!hasUtm && !payload.source && !payload.referrer) return

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // sessionStorage peut être bloqué (mode privé strict). Échec silencieux.
  }
}

/**
 * Lit le payload d'acquisition stocké. Retourne `null` si rien n'est stocké.
 * Côté SSR, retourne toujours `null`.
 */
export function readStoredAcquisition(): AcquisitionPayload | null {
  if (!isBrowser()) return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as AcquisitionPayload
  } catch {
    return null
  }
}

/**
 * Supprime le payload stocké. À appeler après un signup confirmé pour éviter
 * que les UTMs ressortent dans une session ultérieure.
 */
export function clearStoredAcquisition(): void {
  if (!isBrowser()) return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
