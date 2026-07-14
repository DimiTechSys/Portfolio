'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getDocument, convertToInvoice, markAsPaid, generatePaymentLink } from '@/lib/data/documents'
import { Badge, Button, Card, CardTitle, Plate } from '@/components/ui'
import { formatPrice, formatDate } from '@/lib/utils'
import { ArrowLeft, Link2, Mail, CreditCard } from 'lucide-react'
import type { Document } from '@/types'

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [doc, setDoc] = useState<Document | null>(null)
  const [payLink, setPayLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocument(id).then(setDoc).catch(console.error).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 text-sm text-gray-400">Chargement…</div>
  if (!doc) return <div className="p-6 text-sm text-red-500">Document introuvable</div>

  const tva = doc.amount_ttc - doc.amount_ht
  const deposit = (doc.amount_ttc * doc.deposit_percent) / 100

  const handleConvert = async () => {
    const updated = await convertToInvoice(id)
    setDoc(updated)
  }

  const handlePaid = async () => {
    const updated = await markAsPaid(id)
    setDoc(updated)
  }

  const handlePayLink = async (type: 'deposit' | 'full') => {
    const link = await generatePaymentLink(id, type)
    setPayLink(link)
    navigator.clipboard.writeText(link).catch(() => {})
  }

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/devis" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Retour
      </Link>

      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium text-gray-900">{doc.reference}</h1>
            <Badge status={doc.status} />
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Créé le {formatDate(doc.created_at)}
            {doc.expires_at && ` · Expire le ${formatDate(doc.expires_at)}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button><Mail size={13} /> Envoyer par email</Button>
          {doc.type === 'devis' && doc.status !== 'payé' && (
            <Button onClick={handleConvert}><CreditCard size={13} /> Convertir en facture</Button>
          )}
          {doc.type === 'facture' && doc.status !== 'payé' && (
            <Button variant="primary" onClick={handlePaid}>Marquer comme payée</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <CardTitle>Client</CardTitle>
          {doc.client ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{doc.client.first_name} {doc.client.last_name}</p>
              <p className="text-sm text-gray-400 mt-1">{doc.client.email}</p>
              <p className="text-sm text-gray-400">{doc.client.phone}</p>
              {doc.client.address && <p className="text-sm text-gray-400 mt-1">{doc.client.address}, {doc.client.city}</p>}
            </div>
          ) : <p className="text-sm text-gray-400">—</p>}
        </Card>

        <Card>
          <CardTitle>Véhicule</CardTitle>
          {doc.vehicle ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{doc.vehicle.brand} {doc.vehicle.model} {doc.vehicle.year}</p>
              <div className="flex items-center gap-2 mt-2">
                <Plate>{doc.vehicle.plate}</Plate>
                <span className="text-xs text-gray-400">{doc.vehicle.km.toLocaleString('fr-FR')} km · {doc.vehicle.fuel}</span>
              </div>
            </div>
          ) : <p className="text-sm text-gray-400">—</p>}
        </Card>
      </div>

      {/* Lines */}
      <Card className="mb-4">
        <CardTitle>Détail</CardTitle>
        <table className="w-full text-sm mb-4" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="th text-left" style={{ width: '55%' }}>Description</th>
              <th className="th text-right" style={{ width: '15%' }}>Qté</th>
              <th className="th text-right" style={{ width: '15%' }}>PU HT</th>
              <th className="th text-right" style={{ width: '15%' }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {(doc.lines ?? []).map((l, i) => (
              <tr key={i}>
                <td className="td">{l.description}</td>
                <td className="td text-right text-gray-500">{l.quantity}</td>
                <td className="td text-right">{formatPrice(l.unit_price_ht)}</td>
                <td className="td text-right font-medium">{formatPrice(l.total_ht)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end">
          <div className="text-sm grid grid-cols-2 gap-x-8 gap-y-1.5">
            <span className="text-gray-500">Total HT</span><span className="text-right">{formatPrice(doc.amount_ht)}</span>
            <span className="text-gray-500">TVA {doc.tva_rate}%</span><span className="text-right">{formatPrice(tva)}</span>
            <span className="font-medium border-t border-gray-200 pt-1.5">Total TTC</span>
            <span className="font-medium text-right border-t border-gray-200 pt-1.5">{formatPrice(doc.amount_ttc)}</span>
          </div>
        </div>
      </Card>

      {/* Payment link */}
      <Card>
        <CardTitle>Lien de paiement</CardTitle>
        <p className="text-sm text-gray-500 mb-3">
          Envoyez un lien de paiement directement au client — sans terminal physique.
        </p>
        <div className="flex gap-2 mb-3">
          <Button variant="primary" onClick={() => handlePayLink('deposit')}>
            <Link2 size={13} /> Acompte {doc.deposit_percent}% ({formatPrice(deposit)})
          </Button>
          <Button onClick={() => handlePayLink('full')}>
            Solde total ({formatPrice(doc.amount_ttc)})
          </Button>
        </div>
        {payLink && (
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="font-mono text-xs text-gray-500 flex-1 truncate">{payLink}</span>
            <Button size="sm" onClick={() => navigator.clipboard.writeText(payLink)}>Copier</Button>
            <Button size="sm">SMS</Button>
          </div>
        )}
        {doc.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{doc.notes}</p>
          </div>
        )}
      </Card>
    </div>
  )
}
