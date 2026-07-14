'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { HotlineCTA } from '@/components/marketing/hotline-cta'
import { capture } from '@/lib/analytics/posthog'

export function ReactivateActions() {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    capture('reactivate_portal_clicked')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({ error: 'unknown' }))) as {
          error?: string
        }
        if (error === 'no_stripe_customer') {
          toast.error('Aucun abonnement Stripe rattaché à votre officine. Contactez le support.')
        } else {
          toast.error('Impossible d’ouvrir le portail Stripe. Réessayez dans un instant.')
        }
        setLoading(false)
        return
      }
      const { portal_url } = (await res.json()) as { portal_url: string }
      window.location.href = portal_url
    } catch {
      toast.error('Erreur réseau. Vérifiez votre connexion et réessayez.')
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? 'Ouverture…' : 'Mettre à jour mon IBAN / réactiver'}
      </button>
      <HotlineCTA context="billing_reactivate" variant="link" label="Parler à notre équipe" />
    </div>
  )
}
