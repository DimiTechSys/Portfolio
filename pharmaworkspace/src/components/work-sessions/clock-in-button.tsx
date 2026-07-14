'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSession } from '@/hooks/use-session'
import { useClockInGeofence } from '@/components/work-sessions/use-clock-in-geofence'
import { GeofenceStatus } from '@/components/work-sessions/geofence-status'
import { logAudit } from '@/lib/audit/log'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'

/** Détecte un refus côté serveur (trigger 0052) et renvoie un message FR. */
function geofenceMessage(error: string): string | null {
  if (error.includes('GEOFENCE_OUT_OF_ZONE')) {
    return "Vous êtes hors de la zone de l'officine. Le badgeage n'est pas autorisé d'ici."
  }
  if (error.includes('GEOFENCE_POSITION_REQUIRED')) {
    return 'Position requise pour badger. Autorisez la géolocalisation puis réessayez.'
  }
  return null
}

export function ClockInButton({
  className,
  label = 'Démarrer ma session',
  onStarted,
}: {
  className?: string
  label?: string
  onStarted?: () => void
}) {
  const { startSession, canManageSession } = useSession()
  const geofence = useClockInGeofence()
  const [starting, setStarting] = useState(false)

  const blockedByGeofence = geofence.enabled && !geofence.canClockIn
  const disabled = starting || !canManageSession || blockedByGeofence

  const handleClick = async () => {
    setStarting(true)
    try {
      const result = await startSession(geofence.geoForClockIn ?? undefined)
      if (result.ok) {
        void logAudit({
          action: AUDIT_ACTIONS.clockIn,
          target_type: AUDIT_TARGET_TYPES.workSession,
        })
        toast.success('Session démarrée')
        onStarted?.()
        return
      }

      const geoMsg = geofenceMessage(result.error)
      if (geoMsg) {
        void logAudit({
          action: AUDIT_ACTIONS.clockinGeofenceBlocked,
          target_type: AUDIT_TARGET_TYPES.workSession,
          metadata: {
            distance_m: geofence.distanceM,
            radius_m: geofence.radiusM,
            accuracy_m: geofence.accuracyM,
          },
        })
        toast.error(geoMsg)
      } else {
        toast.error(result.error)
      }
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      <GeofenceStatus info={geofence} />
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={disabled}
        className={cn(
          'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-60',
          className
        )}
      >
        {starting && <Loader2 className="h-4 w-4 animate-spin" />}
        {starting ? 'Démarrage…' : label}
      </button>
    </div>
  )
}
