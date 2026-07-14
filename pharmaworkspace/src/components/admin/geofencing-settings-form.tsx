'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, MapPinned, Crosshair } from 'lucide-react'
import { useProfile } from '@/contexts/profile-context'
import { updatePharmacySettings } from '@/lib/queries/admin'
import { geocodeAddress } from '@/lib/geofencing/geocode'
import { requestUserPosition } from '@/lib/geofencing/permissions'
import { haversineDistanceMeters } from '@/lib/geofencing/haversine'

export function GeofencingSettingsForm() {
  const { pharmacy } = useProfile()

  const [enabled, setEnabled] = useState(false)
  const [radius, setRadius] = useState(100)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [geocodedAt, setGeocodedAt] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!pharmacy) return
    const id = setTimeout(() => {
      setEnabled(pharmacy.clockin_geofence_enabled ?? false)
      setRadius(pharmacy.clockin_geofence_radius_m ?? 100)
      setLat(pharmacy.address_latitude ?? null)
      setLng(pharmacy.address_longitude ?? null)
      setGeocodedAt(pharmacy.address_geocoded_at ?? null)
    }, 0)
    return () => clearTimeout(id)
  }, [pharmacy])

  const handleSave = async () => {
    if (!pharmacy) return
    setSaving(true)
    const { error } = await updatePharmacySettings(pharmacy.id, {
      clockin_geofence_enabled: enabled,
      clockin_geofence_radius_m: radius,
    })
    setSaving(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Réglages de zone de badgeage enregistrés.')
    setDirty(false)
  }

  const handleGeocode = async () => {
    if (!pharmacy?.address?.trim()) {
      toast.error("Renseignez d'abord l'adresse de l'officine.")
      return
    }
    setGeocoding(true)
    const coords = await geocodeAddress(pharmacy.address)
    if (!coords) {
      setGeocoding(false)
      toast.error("Adresse introuvable. Vérifiez qu'elle est complète.")
      return
    }
    const nowIso = new Date().toISOString()
    const { error } = await updatePharmacySettings(pharmacy.id, {
      address_latitude: coords.lat,
      address_longitude: coords.lng,
      address_geocoded_at: nowIso,
    })
    setGeocoding(false)
    if (error) {
      toast.error(error)
      return
    }
    setLat(coords.lat)
    setLng(coords.lng)
    setGeocodedAt(nowIso)
    toast.success("Adresse géolocalisée.")
  }

  const handleTestPosition = async () => {
    if (lat === null || lng === null) {
      toast.error("Géolocalisez d'abord l'adresse de l'officine.")
      return
    }
    setTestResult('Localisation en cours…')
    const pos = await requestUserPosition()
    if (!pos.ok) {
      setTestResult(
        pos.reason === 'denied'
          ? 'Permission de localisation refusée.'
          : 'Position indisponible.'
      )
      return
    }
    const dist = Math.round(haversineDistanceMeters(pos.lat, pos.lng, lat, lng))
    const inside = dist - pos.accuracy <= radius
    setTestResult(
      `Vous êtes à ${dist} m de l'officine (précision ±${Math.round(pos.accuracy)} m, rayon ${radius} m) : ${
        inside ? 'dans la zone ✅' : 'hors zone ❌'
      }`
    )
  }

  const isGeocoded = lat !== null && lng !== null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPinned className="h-5 w-5" />
          Zone de badgeage
        </CardTitle>
        <CardDescription>
          Limitez le démarrage de session à la présence physique à l&apos;officine.
          C&apos;est un garde-fou d&apos;usage, pas une preuve juridique (la position
          peut être falsifiée).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="geofence-enabled">Activer le contrôle de zone</Label>
            <p className="text-xs text-muted-foreground">
              Le badgeage sera refusé hors du rayon configuré.
            </p>
          </div>
          <Switch
            id="geofence-enabled"
            checked={enabled}
            onCheckedChange={(v) => {
              setEnabled(v)
              setDirty(true)
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="geofence-radius">Rayon autorisé</Label>
            <span className="text-sm font-medium text-slate-700">{radius} m</span>
          </div>
          <input
            id="geofence-radius"
            type="range"
            min={25}
            max={1000}
            step={25}
            value={radius}
            onChange={(e) => {
              setRadius(Number(e.target.value))
              setDirty(true)
            }}
            className="w-full accent-teal-600"
          />
          <p className="text-xs text-muted-foreground">
            75–100 m est recommandé (couvre l&apos;officine + imprécision GPS).
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-700">Adresse géolocalisée</p>
          {isGeocoded ? (
            <p className="text-xs text-slate-600">
              {lat?.toFixed(5)}, {lng?.toFixed(5)}
              {geocodedAt
                ? ` · le ${new Date(geocodedAt).toLocaleDateString('fr-FR')}`
                : ''}
            </p>
          ) : (
            <p className="text-xs text-amber-600">
              Adresse non géolocalisée : le contrôle de zone restera inactif tant que les
              coordonnées ne sont pas calculées.
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGeocode}
              disabled={geocoding}
            >
              {geocoding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Géolocaliser l&apos;adresse
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestPosition}
              disabled={!isGeocoded}
            >
              <Crosshair className="mr-2 h-4 w-4" />
              Tester ma position
            </Button>
          </div>
          {testResult && (
            <p className="pt-1 text-xs text-slate-600">{testResult}</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end border-t px-3 pt-4 sm:px-4 sm:pt-6">
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les réglages
        </Button>
      </CardFooter>
    </Card>
  )
}
