// Client Stripe SDK : usage SERVEUR UNIQUEMENT.
//
// Ne JAMAIS importer ce module depuis un Client Component (`'use client'`).
// `STRIPE_SECRET_KEY` est volontairement non-NEXT_PUBLIC_ → ce code ne fonctionne
// que côté Node (route handlers, server actions, RSC).
//
// Init paresseuse : si `STRIPE_SECRET_KEY` n'est pas défini (cas d'un environnement
// staging/preview pas encore branché, ou d'un developer sans clé locale), on log
// un warn et on retourne null plutôt que de crash au boot. Les appelants doivent
// gérer le `null` (typiquement : retourner 503 Service Unavailable).
//
// API version épinglée sur la dernière supportée par stripe@22.x au moment de
// l'install (cf. node_modules/stripe/esm/apiVersion.d.ts). À bumper consciemment
// avec les release notes Stripe quand on upgrade le SDK.

import Stripe from 'stripe'

const STRIPE_API_VERSION = '2026-05-27.dahlia' as const

let cached: Stripe | null | undefined

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    console.warn('[stripe/server] STRIPE_SECRET_KEY missing: Stripe disabled')
    cached = null
    return null
  }

  cached = new Stripe(key, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  })
  return cached
}
