'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getClient, getClientDocuments } from '@/lib/data/clients'
import { Avatar, Badge, Button, Card, CardTitle, MetricCard, Plate } from '@/components/ui'
import { formatPrice, formatDate } from '@/lib/utils'
import { ArrowLeft, FileText, Mail, Phone, MapPin } from 'lucide-react'
import type { Client } from '@/types'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getClient(id), getClientDocuments(id)])
      .then(([c, d]) => { setClient(c); setDocs(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 text-sm text-gray-400">Chargement…</div>
  if (!client) return <div className="p-6 text-sm text-red-500">Client introuvable</div>

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/crm" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Retour CRM
      </Link>

      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <Avatar firstName={client.first_name} lastName={client.last_name} size="lg" />
          <div>
            <h1 className="text-lg font-medium text-gray-900">{client.first_name} {client.last_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-400">{client.city}</span>
              <Badge status={client.status} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button><Mail size={13} /> Envoyer email</Button>
          <Link href={`/devis/nouveau?clientId=${id}`}>
            <Button variant="primary"><FileText size={13} /> Nouveau devis</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <CardTitle>Coordonnées</CardTitle>
          <div className="space-y-2.5">
            <ContactRow icon={Mail} label={client.email || '—'} />
            <ContactRow icon={Phone} label={client.phone || '—'} />
            <ContactRow icon={MapPin} label={[client.address, client.postal_code, client.city].filter(Boolean).join(', ') || '—'} />
          </div>
        </Card>

        <Card>
          <CardTitle>Historique commercial</CardTitle>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Achats" value={client.total_purchases ?? 0} />
            <MetricCard label="CA total" value={client.total_revenue ? formatPrice(client.total_revenue) : '—'} />
          </div>
          {client.notes && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{client.notes}</p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Devis & factures</CardTitle>
        {docs.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun document</p>
        ) : (
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {['Réf.', 'Véhicule', 'Montant TTC', 'Date', 'Statut'].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((d: any) => (
                <tr key={d.id} className="tr-hover" onClick={() => window.location.href = `/devis/${d.id}`}>
                  <td className="td"><Plate>{d.reference}</Plate></td>
                  <td className="td">{d.vehicle ? `${d.vehicle.brand} ${d.vehicle.model}` : '—'}</td>
                  <td className="td font-medium">{formatPrice(d.amount_ttc)}</td>
                  <td className="td text-gray-400">{formatDate(d.created_at)}</td>
                  <td className="td"><Badge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function ContactRow({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon size={13} className="text-gray-400 flex-shrink-0" />
      <span className="text-gray-700">{label}</span>
    </div>
  )
}
