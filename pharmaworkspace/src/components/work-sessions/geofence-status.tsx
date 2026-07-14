'use client'

import { MapPin, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GeofenceInfo } from '@/components/work-sessions/use-clock-in-geofence'

type Tone = 'green' | 'orange' | 'red' | 'gray'

export function describeGeofence(info: GeofenceInfo): { tone: Tone; label: string } {
  const d = info.distanceM
  const y = info.radiusM
  switch (info.status) {
    case 'checking':
      return { tone: 'gray', label: 'Localisation en cours…' }
    case 'inside':
      return { tone: 'green', label: 'Vous êtes à l’officine.' }
    case 'near':
      return {
        tone: 'orange',
        label: `À ${d} m de l’officine (limite ${y} m). Approchez-vous.`,
      }
    case 'outside':
      return { tone: 'red', label: `Hors zone (${d} m). Badgeage non autorisé d’ici.` }
    case 'denied':
      return { tone: 'gray', label: 'Autorisez l’accès à votre position pour badger.' }
    case 'unavailable':
      return { tone: 'gray', label: 'Position indisponible. Réessayez.' }
    case 'unsupported':
      return { tone: 'gray', label: 'Géolocalisation non supportée par ce navigateur.' }
  }
}

const TONE_CLASSES: Record<Tone, string> = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  orange: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-red-200 bg-red-50 text-red-700',
  gray: 'border-slate-200 bg-slate-50 text-slate-600',
}

export function GeofenceStatus({
  info,
  className,
}: {
  info: GeofenceInfo
  className?: string
}) {
  if (!info.enabled) return null

  const { tone, label } = describeGeofence(info)
  const canRetry =
    info.status === 'denied' ||
    info.status === 'unavailable' ||
    info.status === 'near' ||
    info.status === 'outside'

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium',
        TONE_CLASSES[tone],
        className
      )}
    >
      {info.status === 'checking' ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      ) : (
        <MapPin className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="flex-1">{label}</span>
      {canRetry && (
        <button
          type="button"
          onClick={info.refresh}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-black/5"
          aria-label="Réessayer la localisation"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
