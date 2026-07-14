'use client'

// CONSENT-01 (révocation du choix cookies) : efface pw_cookie_consent puis
// recharge la page, le bandeau réapparaît (CNIL : retrait du consentement
// aussi simple que son octroi).

import { clearCookieConsent } from '@/lib/consent/cookie-consent'

export function CookieChoiceButton() {
  return (
    <button
      type="button"
      data-testid="cookie-choice-reset"
      onClick={() => {
        clearCookieConsent()
        window.location.reload()
      }}
      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
    >
      Modifier mon choix
    </button>
  )
}
