'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { capture } from '@/lib/analytics/posthog'
import { Loader2, Check } from 'lucide-react'

type Status = 'incomplete' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | null

type Props = {
  pharmacyId: string | null
  sessionId: string | null
  initialStatus: string | null
  initialTrialEnd: string | null
  tier: string | null
  billing: string | null
}

const POLL_INTERVAL_MS = 2_000
const POLL_TIMEOUT_MS = 10_000
const AUTO_REDIRECT_MS = 3_000

const TIER_LABELS: Record<string, string> = {
  po: 'Petite officine',
  otm: 'Officine de taille moyenne',
  go: 'Grande officine',
}

const BILLING_LABELS: Record<string, string> = {
  monthly: 'mensuel',
  yearly: 'annuel',
}

function isSuccessStatus(status: string | null): boolean {
  return status === 'trialing' || status === 'active'
}

function formatTrialEnd(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

async function syncCheckoutSession(sessionId: string): Promise<{
  status: string | null
  trialEnd: string | null
}> {
  const res = await fetch('/api/stripe/confirm-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })
  if (!res.ok) return { status: null, trialEnd: null }
  const json = (await res.json()) as {
    subscription_status?: string
    trial_end?: string | null
  }
  return {
    status: json.subscription_status ?? null,
    trialEnd: json.trial_end ?? null,
  }
}

// Fallback sans session_id : resynchro directe depuis Stripe via le customer de
// la pharmacie. Couvre le cas où la session a sauté au retour de Stripe (URL sans
// session_id après re-login) et/ou le webhook en retard.
async function syncSubscriptionByCustomer(): Promise<{
  status: string | null
  trialEnd: string | null
  unauthorized: boolean
}> {
  const res = await fetch('/api/stripe/sync-subscription', { method: 'POST' })
  if (!res.ok) {
    // 401 = aucune session côté serveur, même sur une requête same-origin :
    // l'utilisateur est réellement déconnecté → on proposera une reconnexion.
    return { status: null, trialEnd: null, unauthorized: res.status === 401 }
  }
  const json = (await res.json()) as {
    subscription_status?: string | null
    trial_end?: string | null
  }
  return {
    status: json.subscription_status ?? null,
    trialEnd: json.trial_end ?? null,
    unauthorized: false,
  }
}

export function ActivationSuccessClient({
  pharmacyId,
  sessionId,
  initialStatus,
  initialTrialEnd,
  tier,
  billing,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>((initialStatus as Status) ?? null)
  const [trialEnd, setTrialEnd] = useState<string | null>(initialTrialEnd)
  const [timeoutReached, setTimeoutReached] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [pollGeneration, setPollGeneration] = useState(0)
  const [needsLogin, setNeedsLogin] = useState(false)
  const captureFired = useRef(false)

  const applyStatus = useCallback((nextStatus: string | null, nextTrialEnd: string | null) => {
    if (!nextStatus) return
    setStatus(nextStatus as Status)
    if (nextTrialEnd) setTrialEnd(nextTrialEnd)
  }, [])

  useEffect(() => {
    if (captureFired.current) return
    captureFired.current = true
    capture('checkout_completed', {
      session_id: sessionId,
      initial_status: initialStatus,
      tier,
      billing,
    })
  }, [sessionId, initialStatus, tier, billing])

  useEffect(() => {
    if (isSuccessStatus(status)) return

    const supabase = createClient()
    const startedAt = Date.now()
    let cancelled = false

    const pollOnce = async () => {
      if (sessionId) {
        const synced = await syncCheckoutSession(sessionId)
        if (cancelled) return
        if (synced.status && isSuccessStatus(synced.status)) {
          applyStatus(synced.status, synced.trialEnd)
          return true
        }
      }

      // Resynchro directe depuis Stripe (via le customer), sans dépendre du
      // session_id ni du webhook. Requête same-origin : le cookie de session est
      // envoyé même si le rendu serveur initial ne l'avait pas.
      const byCustomer = await syncSubscriptionByCustomer()
      if (cancelled) return false
      if (byCustomer.unauthorized) {
        // Session réellement absente (même en same-origin) → reconnexion requise.
        setNeedsLogin(true)
        return true
      }
      if (byCustomer.status) {
        applyStatus(byCustomer.status, byCustomer.trialEnd)
        if (isSuccessStatus(byCustomer.status)) return true
      }

      // Lecture DB directe (filet) seulement si on connaît la pharmacie (session
      // serveur présente au rendu). Sinon on s'appuie sur les routes API ci-dessus.
      if (pharmacyId) {
        const { data } = await supabase
          .from('pharmacies')
          .select('subscription_status, trial_end')
          .eq('id', pharmacyId)
          .maybeSingle()

        if (cancelled) return false

        if (data?.subscription_status) {
          applyStatus(data.subscription_status as string, (data.trial_end as string | null) ?? null)
          if (isSuccessStatus(data.subscription_status)) return true
        }
      }
      return false
    }

    void pollOnce()

    const interval = setInterval(async () => {
      const done = await pollOnce()
      if (done) {
        clearInterval(interval)
        return
      }
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setTimeoutReached(true)
        clearInterval(interval)
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pharmacyId, status, sessionId, pollGeneration, applyStatus])

  useEffect(() => {
    if (!isSuccessStatus(status)) return
    capture('onboarding_completed', {
      pharmacy_id: pharmacyId,
      tier,
      billing,
    })
    // Le dashboard consomme ce flag pour afficher la bannière de transition
    // wizard → missions d'activation une seule fois (ONBOARD-01).
    try {
      sessionStorage.setItem('pw_missions_transition', '1')
    } catch {
      // sessionStorage indisponible (navigation privée stricte), pas bloquant.
    }
    const timer = setTimeout(() => router.push('/'), AUTO_REDIRECT_MS)
    return () => clearTimeout(timer)
  }, [status, pharmacyId, tier, billing, router])

  const handleRetry = async () => {
    setRetrying(true)
    setTimeoutReached(false)

    if (sessionId) {
      const synced = await syncCheckoutSession(sessionId)
      if (synced.status) {
        applyStatus(synced.status, synced.trialEnd)
        if (isSuccessStatus(synced.status)) {
          setRetrying(false)
          return
        }
      }
    }

    const byCustomer = await syncSubscriptionByCustomer()
    if (byCustomer.unauthorized) {
      setNeedsLogin(true)
      setRetrying(false)
      return
    }
    if (byCustomer.status) {
      applyStatus(byCustomer.status, byCustomer.trialEnd)
      if (isSuccessStatus(byCustomer.status)) {
        setRetrying(false)
        return
      }
    }

    setPollGeneration((n) => n + 1)
    setRetrying(false)
  }

  // URL de reconnexion qui conserve le session_id pour reprendre l'activation
  // pile où elle en était après le retour dans l'app.
  const loginHref = `/login?next=${encodeURIComponent(
    `/onboarding/activate/success${sessionId ? `?session_id=${sessionId}` : ''}`,
  )}`

  const tierLabel = tier ? TIER_LABELS[tier] ?? tier : null
  const billingLabel = billing ? BILLING_LABELS[billing] ?? billing : null
  const trialEndLabel = formatTrialEnd(trialEnd)

  if (needsLogin) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
          <Check className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            Paiement bien reçu
          </h1>
          <p className="text-sm text-muted-foreground">
            Votre mandat SEPA est enregistré. Reconnectez-vous pour finaliser
            l&apos;accès à votre espace — votre abonnement est déjà en place.
          </p>
        </div>
        <a
          href={loginHref}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          Me reconnecter
        </a>
      </div>
    )
  }

  if (isSuccessStatus(status)) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
          <Check className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            Votre essai 30 jours est activé
          </h1>
          <p className="text-sm text-muted-foreground">
            {tierLabel && billingLabel && trialEndLabel
              ? `Plan ${tierLabel} ${billingLabel} : premier prélèvement le ${trialEndLabel}.`
              : 'Votre abonnement est en place. Annulable à tout moment depuis votre espace.'}
          </p>
          <p className="text-xs text-muted-foreground">
            Redirection vers votre espace dans quelques secondes…
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          Accéder à mon espace
        </button>
      </div>
    )
  }

  if (timeoutReached) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-amber-100 p-3 text-amber-600">
          <Loader2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            On finalise votre activation…
          </h1>
          <p className="text-sm text-muted-foreground">
            Stripe nous renvoie la confirmation sous quelques secondes. Si rien
            ne se passe, réessayez.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRetry()}
          disabled={retrying}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
        >
          {retrying ? 'Vérification…' : 'Vérifier à nouveau'}
        </button>
        <p className="text-xs text-muted-foreground">
          Si le problème persiste, contactez{' '}
          <a className="underline" href="mailto:support@pharmaworkspace.fr">
            support@pharmaworkspace.fr
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-600">
        <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          Finalisation de votre activation…
        </h1>
        <p className="text-sm text-muted-foreground">
          Stripe confirme votre paiement, ça prend généralement moins de 5
          secondes.
        </p>
      </div>
    </div>
  )
}
