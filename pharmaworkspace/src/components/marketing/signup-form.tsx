'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { capture } from '@/lib/analytics/posthog'
import { readStoredAcquisition } from '@/lib/analytics/acquisition'

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [cgs, setCgs] = useState(false)
  const [dpa, setDpa] = useState(false)
  const [loading, setLoading] = useState(false)
  // `emailExists` = email déjà associé à un compte (cf. /api/signup/start 409).
  // On garde la valeur pour afficher la cartouche + bouton "Aller à la connexion".
  const [emailExists, setEmailExists] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!cgs || !dpa) {
      toast.error('Vous devez accepter les CGS et le DPA pour continuer.')
      return
    }
    setEmailExists(null)
    setLoading(true)

    // P4-14 minimal. Précédence : URL courante > sessionStorage > undefined.
    // L'URL gagne pour permettre un override manuel (ex. lien marketing direct
    // /signup?utm_source=X). Le sessionStorage prend le relais quand
    // l'utilisateur a navigué landing → /tarifs → /signup et perdu les UTMs.
    const stored = readStoredAcquisition()
    const pick = (key: string) =>
      searchParams.get(key) ??
      (stored?.[key as keyof typeof stored] as string | undefined) ??
      undefined

    const source = pick('source') ?? 'direct'
    const normalizedEmail = email.trim().toLowerCase()

    const res = await fetch('/api/signup/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        locale: 'fr', // TODO P4-10 i18n
        cgs_accepted: true,
        dpa_accepted: true,
        source,
        utm_source: pick('utm_source'),
        utm_medium: pick('utm_medium'),
        utm_campaign: pick('utm_campaign'),
        utm_term: pick('utm_term'),
        utm_content: pick('utm_content'),
        referrer:
          stored?.referrer ??
          (typeof document !== 'undefined' && document.referrer
            ? document.referrer
            : undefined),
      }),
    })

    if (res.status === 409) {
      setLoading(false)
      const payload = (await res
        .json()
        .catch(() => ({}))) as { code?: string; error?: string }
      if (payload.code === 'email_exists' || payload.error === 'email_exists') {
        setEmailExists(normalizedEmail)
        toast.error(
          'Cet email a déjà un compte. Connectez-vous plutôt que de créer un nouveau compte.'
        )
        return
      }
    }

    if (!res.ok) {
      setLoading(false)
      const { error } = await res
        .json()
        .catch(() => ({ error: 'Erreur, réessayez.' }))
      toast.error(error ?? 'Erreur, réessayez.')
      return
    }

    const payload = (await res
      .json()
      .catch(() => ({}))) as { acquisition_id?: string }

    // Tracking funnel (P4-14) : naming snake_case, verbe au passé.
    capture('signup_email_submitted', { source })

    // Supabase envoie un **code OTP 8 chiffres** (pas un magic link cliquable
    // configurable côté projet). On redirige donc vers /verify pour saisir
    // le code, en propageant l'acquisition_id pour debug funnel si besoin.
    const params = new URLSearchParams({
      email: normalizedEmail,
      next: '/onboarding/create',
    })
    if (payload.acquisition_id) params.set('acq', payload.acquisition_id)
    router.push(`/verify?${params.toString()}`)
  }

  if (emailExists) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Un compte existe déjà avec cet email.</p>
          <p className="mt-1 text-amber-800">
            <span className="font-medium text-amber-900">{emailExists}</span> est
            déjà enregistré. Connectez-vous pour accéder à votre officine.
          </p>
        </div>
        <Link
          href={`/login?email=${encodeURIComponent(emailExists)}`}
          className="block w-full rounded-lg bg-teal-600 px-4 py-3 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          Aller à la connexion
        </Link>
        <button
          type="button"
          onClick={() => setEmailExists(null)}
          className="block w-full text-center text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Utiliser un autre email
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <label className="block">
        <span className="text-sm font-medium text-slate-900">Email pro</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          placeholder="vous@officine.fr"
          autoComplete="email"
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={cgs}
          onChange={(e) => setCgs(e.target.checked)}
          required
          className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600/40"
        />
        <span>
          J&apos;accepte les{' '}
          <a
            href="/conditions-generales"
            target="_blank"
            rel="noopener"
            className="font-medium text-teal-700 underline-offset-4 hover:underline"
          >
            Conditions Générales de Service
          </a>
          .
        </span>
      </label>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={dpa}
          onChange={(e) => setDpa(e.target.checked)}
          required
          className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600/40"
        />
        <span>
          J&apos;accepte le{' '}
          <a
            href="/dpa"
            target="_blank"
            rel="noopener"
            className="font-medium text-teal-700 underline-offset-4 hover:underline"
          >
            Data Processing Agreement
          </a>{' '}
          (RGPD art. 28) pour le traitement des données patient.
        </span>
      </label>

      <button
        type="submit"
        disabled={loading || !cgs || !dpa}
        className="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Envoi…' : 'Recevoir mon code de connexion'}
      </button>

      <p className="text-center text-xs text-slate-500">
        30 jours d&apos;essai · €0 prélevés avant J+30 · Annulable à tout moment
      </p>
    </form>
  )
}
