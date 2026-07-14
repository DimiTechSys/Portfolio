'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getVehicles } from '@/lib/data/vehicles'
import { Badge, Card, CardTitle, MetricCard, Plate } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import type { Vehicle, PublicationStatus, VehiclePublication } from '@/types'
import { getPublications, upsertPublication } from '@/lib/data/publications'

const STATUSES: PublicationStatus[] = ['brouillon', 'prêt', 'publié', 'retiré']

function computePublishStatus(vehicle: Vehicle): PublicationStatus {
  if (!vehicle.photos || vehicle.photos.length < 3) return 'brouillon'
  if (vehicle.status === 'vendu') return 'prêt'
  return 'publié'
}

export default function GestionPublicationsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [publications, setPublications] = useState<VehiclePublication[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [vehicleRows, publicationRows] = await Promise.all([getVehicles(), getPublications()])
      setVehicles(vehicleRows)
      setPublications(publicationRows)
    } catch (error) {
      console.error(error)
      setVehicles([])
      setPublications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(console.error)
  }, [])

  const publicationByVehicle = new Map(publications.map(p => [p.vehicle_id, p]))
  const rows = vehicles.map(v => ({
    ...v,
    publishStatus: publicationByVehicle.get(v.id)?.status ?? computePublishStatus(v),
  }))
  const draft = rows.filter(v => v.publishStatus === 'brouillon').length
  const ready = rows.filter(v => v.publishStatus === 'prêt').length
  const published = rows.filter(v => v.publishStatus === 'publié').length

  const onStatusChange = async (vehicle: Vehicle, status: PublicationStatus) => {
    try {
      await upsertPublication({
        vehicle_id: vehicle.id,
        status,
        title: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
      })
      await load()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">Publications stock</h1>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="Brouillons" value={draft} sub="Photos / infos à compléter" />
        <MetricCard label="Prêts à publier" value={ready} sub="Véhicules prêts pour le site" />
        <MetricCard label="Publiés" value={published} sub="Annonces actuellement en ligne" />
      </div>

      <Card padding={false}>
        <div className="border-b border-gray-100 px-6 py-5">
          <CardTitle className="mb-0">Centre de publication</CardTitle>
        </div>
        <table className="w-full">
          <thead>
            <tr>{['Plaque', 'Véhicule', 'Date entrée', 'Statut parc', 'Statut publication', ''].map(h => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {!loading && rows.slice(0, 20).map(v => (
              <tr key={v.id} className="tr-hover">
                <td className="td"><Plate>{v.plate}</Plate></td>
                <td className="td font-medium">{v.brand} {v.model}</td>
                <td className="td text-gray-500">{formatDate(v.created_at)}</td>
                <td className="td"><Badge status={v.status} /></td>
                <td className="td capitalize text-gray-600">
                  <select
                    value={v.publishStatus}
                    onChange={e => onStatusChange(v, e.target.value as PublicationStatus)}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                  >
                    {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
                <td className="td">
                  <Link href={`/parc/${v.id}`} className="text-sm text-blue-700 hover:underline">
                    Ouvrir la fiche
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-400">Aucun véhicule</td></tr>
            )}
            {loading && (
              <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-400">Chargement…</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
