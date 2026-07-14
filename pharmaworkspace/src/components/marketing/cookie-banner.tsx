'use client'

// CONSENT-01 : recueil du consentement cookies CNIL, UX calquée sur les CMP
// du marché (Didomi, Axeptio, Cookiebot) :
//
//  - 1er niveau : modal centrée, « Tout refuser » / « Tout accepter » de même
//    niveau (exigence CNIL : refuser aussi simple qu'accepter, sinon le
//    consentement est invalide) + « Personnaliser » en action secondaire ;
//  - 2e niveau : préférences par catégorie avec interrupteurs (nécessaires =
//    toujours actifs, mesure d'audience = au choix) ;
//  - widget cookie flottant en bas à droite après un choix, pour rouvrir ses
//    préférences à tout moment (révocation aussi simple que l'octroi,
//    RGPD art. 7.3), à droite car le coin bas-gauche est occupé par
//    l'indicateur de l'overlay Next.js en dev ;
//  - sur /cookies, le 1er niveau est une barre basse non-bloquante pour que
//    le visiteur puisse lire la politique pointée par « En savoir plus ».
//
// « Accepter » dispatch l'event d'init différée → instrumentation-client.ts
// initialise PostHog immédiatement, sans reload. Le passage accepté → refusé
// recharge la page : c'est le seul moyen sûr d'arrêter un PostHog déjà
// initialisé.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, BarChart3, Cookie, ShieldCheck, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  getCookieConsent,
  hasAuthSession,
  notifyAnalyticsAllowed,
  setCookieConsent,
  type CookieConsent,
} from '@/lib/consent/cookie-consent'

const BANNER_TEXT =
  "Nous utilisons des cookies pour mesurer l'audience de notre site et améliorer notre produit. Vous pouvez accepter ou refuser : votre choix n'affecte pas l'accès au service."

type View = 'choice' | 'prefs'

export function CookieBanner() {
  const pathname = usePathname()
  const [consent, setConsent] = useState<CookieConsent>('unknown')
  const [authenticated, setAuthenticated] = useState(true)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('choice')
  const [analyticsOn, setAnalyticsOn] = useState(false)

  useEffect(() => {
    // Lecture du cookie uniquement au mount (évite le mismatch SSR/client).
    const timeoutId = setTimeout(() => {
      const current = getCookieConsent()
      const auth = hasAuthSession()
      setConsent(current)
      setAuthenticated(auth)
      setOpen(current === 'unknown' && !auth)
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [])

  // Les utilisateurs authentifiés ne relèvent pas du régime du consentement
  // (intérêt légitime contractuel) : ni modal, ni widget.
  if (authenticated) return null

  const firstVisit = consent === 'unknown'

  const applyChoice = (value: 'accepted' | 'refused') => {
    const previous = consent
    setCookieConsent(value)
    if (value === 'accepted') {
      notifyAnalyticsAllowed()
    }
    if (value === 'refused' && previous === 'accepted') {
      window.location.reload()
      return
    }
    setConsent(value)
    setOpen(false)
    setView('choice')
  }

  const openPrefs = () => {
    setAnalyticsOn(consent === 'accepted')
    setView('prefs')
    setOpen(true)
  }

  // ── Widget flottant de réouverture (après choix) ─────────────────────────
  if (!open) {
    if (firstVisit) return null
    return (
      <button
        type="button"
        onClick={openPrefs}
        data-testid="cookie-widget"
        aria-label="Gérer mes préférences cookies"
        title="Gérer mes préférences cookies"
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-lg transition-all hover:scale-105 hover:text-teal-700"
      >
        <Cookie className="h-5 w-5" aria-hidden="true" />
      </button>
    )
  }

  // border-transparent sur les boutons sans bordure visible : sans ça, le
  // bouton bordé fait 2 px de plus et les hauteurs ne s'alignent pas.
  const refuseAllButton = (
    <button
      type="button"
      onClick={() => applyChoice('refused')}
      className="flex-1 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
    >
      Tout refuser
    </button>
  )

  const acceptAllButton = (
    <button
      type="button"
      onClick={() => applyChoice('accepted')}
      className="flex-1 rounded-full border border-transparent bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
    >
      Tout accepter
    </button>
  )

  // ── 1er niveau sur /cookies : barre basse pour laisser lire la politique ──
  if (view === 'choice' && pathname === '/cookies') {
    return (
      <div
        role="region"
        aria-label="Consentement aux cookies"
        data-testid="cookie-banner"
        className="fixed inset-x-0 bottom-0 z-50 animate-in fade-in border-t border-slate-200 bg-slate-50/95 shadow-[0_-2px_12px_rgba(15,23,42,0.06)] backdrop-blur duration-200"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="flex-1 text-sm text-slate-600">{BANNER_TEXT}</p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openPrefs}
              className="rounded-full border border-transparent px-4 py-2.5 text-sm font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline"
            >
              Personnaliser
            </button>
            {refuseAllButton}
            {acceptAllButton}
          </div>
        </div>
      </div>
    )
  }

  // ── Modal centrée (1er niveau partout ailleurs + 2e niveau partout) ──────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      data-testid="cookie-banner"
    >
      {/* Backdrop. Pas de onClick : le choix doit être explicite, pas par
          clic accidentel à côté. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-in fade-in bg-slate-900/40 backdrop-blur-[2px] duration-200"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-banner-title"
        className="relative w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl duration-200"
      >
        {view === 'choice' ? (
          <>
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-teal-600" aria-hidden="true" />
              <h2
                id="cookie-banner-title"
                className="text-base font-semibold text-slate-900"
              >
                Cookies et mesure d&apos;audience
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {BANNER_TEXT}{' '}
              <Link
                href="/cookies"
                className="font-medium text-teal-700 underline-offset-4 hover:underline"
              >
                En savoir plus
              </Link>
            </p>
            <div className="mt-5 flex items-center gap-3">
              {refuseAllButton}
              {acceptAllButton}
            </div>
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={openPrefs}
                className="text-sm font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline"
              >
                Personnaliser mes choix
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {firstVisit ? (
                  <button
                    type="button"
                    onClick={() => setView('choice')}
                    aria-label="Retour"
                    className="-ml-1 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
                <h2
                  id="cookie-banner-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Personnaliser mes choix
                </h2>
              </div>
              {/* Fermeture sans changement, uniquement quand un choix existe
                  déjà (réouverture via le widget). Au premier visit, le choix
                  doit être explicite. */}
              {!firstVisit && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setView('choice')
                  }}
                  aria-label="Fermer sans modifier"
                  className="-mr-1 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <ul className="mt-4 space-y-3">
              <li className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck
                    className="mt-0.5 h-5 w-5 shrink-0 text-teal-600"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Strictement nécessaires
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Authentification et mémorisation de votre choix cookies.
                      Indispensables au fonctionnement du service.
                    </p>
                  </div>
                </div>
                <span className="mt-0.5 shrink-0 text-xs font-medium text-teal-700">
                  Toujours actifs
                </span>
              </li>
              <li className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div className="flex gap-3">
                  <BarChart3
                    className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Mesure d&apos;audience
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      PostHog Cloud EU (données hébergées à Francfort). Nous
                      aide à comprendre l&apos;usage du produit pour
                      l&apos;améliorer.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={analyticsOn}
                  onCheckedChange={setAnalyticsOn}
                  aria-label="Activer la mesure d'audience"
                  className="mt-0.5"
                />
              </li>
            </ul>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => applyChoice(analyticsOn ? 'accepted' : 'refused')}
                className="w-full rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Enregistrer mes préférences
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              <Link
                href="/cookies"
                // Repli vers la barre basse : sans ça, la modal resterait
                // au-dessus de la page /cookies qu'on vient d'ouvrir.
                onClick={() => setView('choice')}
                className="underline-offset-4 hover:text-slate-600 hover:underline"
              >
                Détail des cookies et durées de conservation
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
