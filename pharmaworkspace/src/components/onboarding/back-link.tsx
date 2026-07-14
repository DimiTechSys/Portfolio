'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Props = {
  /** Href de l'étape précédente du wizard (ex. /onboarding/profile). */
  href: string
  /** Libellé court de l'étape précédente (ex. "Profil"). */
  label: string
}

/**
 * Petit lien "← <Étape>" affiché en tête de page wizard pour permettre la
 * navigation arrière. Le middleware (src/proxy.ts) autorise la navigation
 * vers les étapes déjà complétées ; cf. la logique de back-navigation.
 */
export function WizardBackLink({ href, label }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3 w-3" aria-hidden="true" />
      {label}
    </Link>
  )
}
