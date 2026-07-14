'use client'

import { Phone } from 'lucide-react'
import { capture } from '@/lib/analytics/posthog'
import { readStoredAcquisition } from '@/lib/analytics/acquisition'

type Props = {
  context: string
  variant?: 'ghost' | 'link' | 'primary' | 'secondary'
  label?: string
  className?: string
}

const DEFAULT_LABEL = 'Parler à notre équipe'

const VARIANT_CLASSES: Record<NonNullable<Props['variant']>, string> = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
  link:
    'inline-flex items-center gap-1 text-sm font-medium text-teal-700 underline-offset-4 transition-colors hover:text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 rounded-sm',
  // Pill clair pensé pour les bandes sombres (hero « night »).
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-medium text-[#213183] shadow-sm transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#213183]',
}

export function HotlineCTA({ context, variant = 'ghost', label, className }: Props) {
  const url = `https://hotline.baseflow.fr/?context=${encodeURIComponent(context)}`
  const classes = [VARIANT_CLASSES[variant], className].filter(Boolean).join(' ')

  // PostHog `capture()` est async fire-and-forget : on déclenche avant que le
  // navigateur n'ouvre le nouvel onglet, l'event est mis en queue et flush
  // automatiquement. Pas de risque de perte sur `target="_blank"` (la page
  // courante reste vivante).
  function handleClick() {
    const acquisition = readStoredAcquisition()
    capture('hotline_clicked', {
      context,
      utm_source: acquisition?.utm_source,
      utm_medium: acquisition?.utm_medium,
      utm_campaign: acquisition?.utm_campaign,
      source: acquisition?.source,
    })
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      onClick={handleClick}
      className={classes}
      data-ph-event="hotline_cta_click"
      data-ph-context={context}
    >
      {variant !== 'link' && <Phone className="h-4 w-4" aria-hidden="true" />}
      <span>{label ?? DEFAULT_LABEL}</span>
    </a>
  )
}
