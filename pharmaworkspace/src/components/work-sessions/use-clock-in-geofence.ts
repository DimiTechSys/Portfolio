'use client'

import { useCallback, useEffect, useState } from 'react'
import { useProfile } from '@/contexts/profile-context'
import { haversineDistanceMeters } from '@/lib/geofencing/haversine'
import { requestUserPosition } from '@/lib/geofencing/permissions'
import type { ClockInGeo } from '@/lib/queries/sessions'

export type GeofenceState =
  | 'checking' // position en cours d'acquisition
  | 'inside' // dans la zone → badgeage autorisé
  | 'near' // hors zone mais proche → s'approcher
  | 'outside' // hors zone, loin
  | 'denied' // permission refusée
  | 'unavailable' // position indisponible / timeout
  | 'unsupported' // navigateur sans géolocalisation

export type GeofenceInfo = {
  /** Geofence actif ET officine géocodée → un contrôle s'applique. */
  enabled: boolean
  status: GeofenceState
  distanceM: number | null
  accuracyM: number | null
  radiusM: number
  /** true quand le badgeage est autorisé (toujours true si geofence inactif). */
  canClockIn: boolean
  /** Position à transmettre au pointage (null si geofence inactif). */
  geoForClockIn: ClockInGeo | null
  /** Relance une acquisition de position. */
  refresh: () => void
}

export function useClockInGeofence(): GeofenceInfo {
  const { pharmacy } = useProfile()

  const lat = pharmacy?.address_latitude ?? null
  const lng = pharmacy?.address_longitude ?? null
  const radiusM = pharmacy?.clockin_geofence_radius_m ?? 100
  const enabled = Boolean(
    pharmacy?.clockin_geofence_enabled && lat !== null && lng !== null
  )

  const [status, setStatus] = useState<GeofenceState>('checking')
  const [distanceM, setDistanceM] = useState<number | null>(null)
  const [accuracyM, setAccuracyM] = useState<number | null>(null)
  const [geo, setGeo] = useState<ClockInGeo | null>(null)

  const acquire = useCallback(async () => {
    if (!enabled || lat === null || lng === null) return
    setStatus('checking')
    const pos = await requestUserPosition()
    if (!pos.ok) {
      setGeo(null)
      setDistanceM(null)
      setAccuracyM(null)
      setStatus(pos.reason === 'unsupported' ? 'unsupported' : pos.reason === 'denied' ? 'denied' : 'unavailable')
      return
    }

    const dist = haversineDistanceMeters(pos.lat, pos.lng, lat, lng)
    setGeo({ latitude: pos.lat, longitude: pos.lng, accuracy: pos.accuracy })
    setDistanceM(Math.round(dist))
    setAccuracyM(Math.round(pos.accuracy))

    // Tolérance imprécision GPS, alignée avec le trigger serveur (0052).
    const effective = dist - pos.accuracy
    if (effective <= radiusM) setStatus('inside')
    else if (effective <= radiusM * 2) setStatus('near')
    else setStatus('outside')
  }, [enabled, lat, lng, radiusM])

  useEffect(() => {
    if (!enabled) return
    const id = setTimeout(() => void acquire(), 0)
    return () => clearTimeout(id)
  }, [enabled, acquire])

  return {
    enabled,
    status,
    distanceM,
    accuracyM,
    radiusM,
    canClockIn: enabled ? status === 'inside' : true,
    geoForClockIn: enabled ? geo : null,
    refresh: () => void acquire(),
  }
}
