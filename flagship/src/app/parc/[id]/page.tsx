'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getVehicle, getVehicleHistory, updateVehicleStatus } from '@/lib/data/vehicles'
import { formatPrice, formatKm, formatDate, calcMargin } from '@/lib/utils'
import { Badge, Button, Card, CardTitle, Plate } from '@/components/ui'
import { ArrowLeft, Share2, FileText, Pencil, Link2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Vehicle, VehicleHistory } from '@/types'

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [history, setHistory] = useState<VehicleHistory[]>([])
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getVehicle(id), getVehicleHistory(id)])
      .then(([v, h]) => { setVehicle(v); setHistory(h) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    setActivePhoto(0)
  }, [id])

  if (loading) return <div className="p-6 text-sm text-gray-400">Chargement…</div>
  if (!vehicle) return <div className="p-6 text-sm text-red-500">Véhicule introuvable</div>

  const { margin, pct } = calcMargin(vehicle.price_sell, vehicle.price_buy ?? 0)
  const photos = vehicle.photos ?? []
  const currentPhoto = photos[activePhoto] ?? photos[0] ?? null

  const generateLink = () => {
    const link = `${window.location.origin}/v/${vehicle.plate.toLowerCase().replace(/-/g, '')}`
    setShareLink(link)
    navigator.clipboard.writeText(link).catch(() => {})
  }

  const showPrevPhoto = () => {
    if (photos.length <= 1) return
    setActivePhoto(prev => (prev - 1 + photos.length) % photos.length)
  }

  const showNextPhoto = () => {
    if (photos.length <= 1) return
    setActivePhoto(prev => (prev + 1) % photos.length)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <Link href="/parc" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Retour au parc
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              {vehicle.brand} {vehicle.model} — {vehicle.year}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <Plate>{vehicle.plate}</Plate>
              <Badge status={vehicle.status} />
              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-sm text-gray-500">{vehicle.type}</span>
              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-sm text-gray-500">DPE {vehicle.dpe}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/parc/${id}/modifier`}>
              <Button><Pencil size={13} /> Modifier</Button>
            </Link>
            <Button onClick={generateLink}><Link2 size={13} /> Partager fiche client</Button>
            <Link href={`/devis/nouveau?vehicleId=${id}`}>
              <Button variant="primary"><FileText size={13} /> Créer un devis</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Gallery */}
        <Card>
          <CardTitle>Photos</CardTitle>
          {currentPhoto ? (
            <div>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentPhoto}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="h-80 w-full rounded-2xl border border-gray-200 object-cover"
                />
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrevPhoto}
                      aria-label="Photo précédente"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/45"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={showNextPhoto}
                      aria-label="Photo suivante"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/45"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
              {photos.length > 1 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {photos.map((photo, idx) => (
                    <button
                      key={`${photo.slice(0, 24)}-${idx}`}
                      type="button"
                      onClick={() => setActivePhoto(idx)}
                      className={`overflow-hidden rounded-lg border ${
                        idx === activePhoto ? 'border-gray-900' : 'border-gray-200'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt={`Photo ${idx + 1}`} className="h-16 w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-400">
              Aucune photo disponible
            </div>
          )}
        </Card>

        {/* Technical specs */}
        <Card>
          <CardTitle>Caractéristiques techniques</CardTitle>
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Carburant', value: vehicle.fuel },
              { label: 'Boîte', value: vehicle.gear },
              { label: 'Puissance', value: `${vehicle.power_hp} ch` },
              { label: 'Kilométrage', value: formatKm(vehicle.km) },
              { label: 'Nb. portes', value: `${vehicle.doors} portes` },
              { label: 'CT', value: vehicle.ct_status },
              { label: 'Couleur ext.', value: vehicle.color_ext || '—' },
              { label: 'Couleur int.', value: vehicle.color_int || '—' },
              { label: 'DPE', value: vehicle.dpe },
            ].map(({ label, value }) => (
              <div key={label} className="border-b border-gray-100 py-3 pr-3 last:border-0">
                <div className="mb-1 text-sm font-medium uppercase tracking-[0.05em] text-gray-400">{label}</div>
                <div className="text-[1.05rem] font-semibold leading-snug text-slate-800">{value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pricing */}
        <Card>
          <CardTitle>Prix & marge</CardTitle>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <PriceBox label="Prix de vente" value={formatPrice(vehicle.price_sell)} />
            <PriceBox label="Prix d'achat" value={vehicle.price_buy ? formatPrice(vehicle.price_buy) : '—'} />
            <PriceBox label="Marge brute" value={formatPrice(margin)} />
            <PriceBox label="Marge %" value={`${pct}%`} />
          </div>
          <p className="text-sm text-gray-400">Marge visible uniquement en interne.</p>

          {/* Status change */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <CardTitle>Changer le statut</CardTitle>
            <div className="flex flex-wrap gap-2">
              {(['disponible', 'réservé', 'vendu'] as const).filter(s => s !== vehicle.status).map(s => (
                <Button
                  key={s}
                  size="sm"
                  onClick={async () => {
                    await updateVehicleStatus(id, s)
                    setVehicle(prev => prev ? { ...prev, status: s } : null)
                  }}
                >
                  → {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Options */}
      <Card className="mb-4">
        <CardTitle>Options & équipements</CardTitle>
        <p className="text-base text-gray-700">{vehicle.options || 'Aucun équipement renseigné'}</p>
        {vehicle.notes_internal && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3">
            <p className="mb-0.5 text-sm font-medium text-amber-600">Note interne</p>
            <p className="text-base text-amber-800">{vehicle.notes_internal}</p>
          </div>
        )}
      </Card>

      {/* Share link */}
      <Card className="mb-4">
        <CardTitle>Lien fiche client</CardTitle>
        <p className="mb-3 text-base text-gray-500">
          Partagez un lien direct vers la fiche publique du véhicule — toujours à jour en temps réel.
        </p>
        {shareLink ? (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
            <span className="flex-1 truncate font-mono text-sm text-gray-500">{shareLink}</span>
            <Button size="sm" onClick={() => navigator.clipboard.writeText(shareLink)}>Copier</Button>
            <Button size="sm">Envoyer SMS</Button>
          </div>
        ) : (
          <Button onClick={generateLink}><Share2 size={13} /> Générer le lien</Button>
        )}
      </Card>

      {/* History */}
      <Card>
        <CardTitle>Historique</CardTitle>
        {history.length === 0 ? (
          <p className="text-base text-gray-400">Aucun événement</p>
        ) : (
          <div className="space-y-0">
            {history.map(h => (
              <div key={h.id} className="flex gap-3 border-b border-gray-100 py-3 last:border-0">
                <span className="mt-0.5 w-24 flex-shrink-0 text-sm text-gray-400">
                  {formatDate(h.created_at)}
                </span>
                <span className="text-base text-gray-700">{h.event}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function PriceBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="mb-1 text-sm font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</div>
      <div className="truncate text-4xl font-semibold tracking-tight text-slate-900">{value}</div>
    </div>
  )
}
