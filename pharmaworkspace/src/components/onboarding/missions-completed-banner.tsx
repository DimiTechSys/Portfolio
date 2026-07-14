'use client'

import { Button } from '@/components/ui/button'

// Confetti en CSS pur (pseudo-particules animées), pas de lib JS dédiée.
const CONFETTI_COLORS = ['#0d9488', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6']

type MissionsCompletedBannerProps = {
  onFeedback: () => void
  onDismiss: () => void
}

export function MissionsCompletedBanner({
  onFeedback,
  onDismiss,
}: MissionsCompletedBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 text-center shadow-sm">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {CONFETTI_COLORS.map((color, i) => (
          <span
            key={color}
            className="absolute top-0 block h-2 w-2 rounded-sm motion-safe:animate-bounce"
            style={{
              left: `${12 + i * 19}%`,
              backgroundColor: color,
              animationDelay: `${i * 150}ms`,
              animationDuration: '1.8s',
            }}
          />
        ))}
      </div>

      <h3 className="text-lg font-semibold text-slate-900">
        🏆 Bravo ! Votre équipe est complètement activée.
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Vous avez débloqué les 8 missions d&apos;activation. À ce stade, vous
        êtes parmi les officines les plus engagées de la bêta. Continuez à
        explorer, et n&apos;hésitez pas à nous dire ce qu&apos;il vous manque.
      </p>
      <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Button onClick={onFeedback}>Donner mon avis</Button>
        <Button variant="ghost" onClick={onDismiss}>
          Masquer ce widget
        </Button>
      </div>
    </div>
  )
}
