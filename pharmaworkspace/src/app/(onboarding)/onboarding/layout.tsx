import type { ReactNode } from 'react'

// Layout imbriqué sous le layout de groupe (onboarding). La progression du
// parcours d'inscription est déjà portée par <OnboardingProgressBar /> (stepper)
// monté dans le layout de groupe — on n'affiche donc plus ici le widget de
// missions « wizard » qui en était un doublon visuel.
export default function OnboardingWizardLayout({
  children,
}: {
  children: ReactNode
}) {
  return <div className="space-y-6">{children}</div>
}
