'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createDocument } from '@/lib/data/documents'
import { getClients } from '@/lib/data/clients'
import { getVehicles } from '@/lib/data/vehicles'
import { Button, Card, Input, Select, Textarea } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import type { Client, Vehicle, DocumentLine } from '@/types'

export default function NewDocumentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = (searchParams.get('type') ?? 'devis') as 'devis' | 'facture'
  const defaultClientId = searchParams.get('clientId') ?? ''
  const defaultVehicleId = searchParams.get('vehicleId') ?? ''

  const [type, setType] = useState<'devis' | 'facture'>(defaultType)
  const [clientId, setClientId] = useState(defaultClientId)
  const [vehicleId, setVehicleId] = useState(defaultVehicleId)
  const [tvaRate, setTvaRate] = useState(20)
  const [depositPercent, setDepositPercent] = useState(30)
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<DocumentLine[]>([
    { id: '1', description: '', quantity: 1, unit_price_ht: 0, total_ht: 0 },
  ])
  const [clients, setClients] = useState<Client[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getClients(), getVehicles()]).then(([c, v]) => {
      setClients(c)
      setVehicles(v)
      // Pre-fill from vehicle if provided
      if (defaultVehicleId) {
        const veh = v.find(x => x.id === defaultVehicleId)
        if (veh) {
          setLines([{
            id: '1',
            description: `${veh.brand} ${veh.model} ${veh.year} — ${veh.type}`,
            quantity: 1,
            unit_price_ht: Math.round(veh.price_sell / 1.2),
            total_ht: Math.round(veh.price_sell / 1.2),
          }])
        }
      }
    })
  }, [defaultVehicleId])

  const updateLine = (idx: number, key: keyof DocumentLine, val: string | number) => {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l
      const updated = { ...l, [key]: val }
      if (key === 'quantity' || key === 'unit_price_ht') {
        updated.total_ht = Math.round(Number(updated.quantity) * Number(updated.unit_price_ht))
      }
      return updated
    }))
  }

  const addLine = () => setLines(prev => [
    ...prev,
    { id: String(Date.now()), description: '', quantity: 1, unit_price_ht: 0, total_ht: 0 },
  ])

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const totalHT = lines.reduce((s, l) => s + l.total_ht, 0)
  const totalTTC = Math.round(totalHT * (1 + tvaRate / 100))

  const handleSubmit = async () => {
    if (!clientId) return
    setSaving(true)
    try {
      const doc = await createDocument({
        type, client_id: clientId,
        vehicle_id: vehicleId || undefined,
        lines, tva_rate: tvaRate, deposit_percent: depositPercent, notes,
      })
      router.push(`/devis/${doc.id}`)
    } catch (e) { console.error(e); setSaving(false) }
  }

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/devis" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Retour
      </Link>
      <h1 className="text-lg font-medium text-gray-900 mb-5">Nouveau document</h1>

      <Card className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Type">
            <Select value={type} onChange={e => setType(e.target.value as 'devis' | 'facture')}>
              <option value="devis">Devis</option>
              <option value="facture">Facture</option>
            </Select>
          </Field>
          <Field label="Client">
            <Select value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Sélectionner un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </Select>
          </Field>
          <Field label="Véhicule (optionnel)">
            <Select value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
              <option value="">Aucun</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate}</option>)}
            </Select>
          </Field>
        </div>
      </Card>

      {/* Lines */}
      <Card className="mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Lignes</p>
        <table className="w-full text-sm mb-3" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="th text-left" style={{ width: '45%' }}>Description</th>
              <th className="th text-right" style={{ width: '12%' }}>Qté</th>
              <th className="th text-right" style={{ width: '18%' }}>PU HT (€)</th>
              <th className="th text-right" style={{ width: '18%' }}>Total HT</th>
              <th style={{ width: '7%' }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.id}>
                <td className="px-3 py-1.5">
                  <Input value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Description…" />
                </td>
                <td className="px-1 py-1.5">
                  <Input type="number" value={l.quantity} onChange={e => updateLine(i, 'quantity', +e.target.value)} className="text-right" />
                </td>
                <td className="px-1 py-1.5">
                  <Input type="number" value={l.unit_price_ht} onChange={e => updateLine(i, 'unit_price_ht', +e.target.value)} className="text-right" />
                </td>
                <td className="px-3 py-1.5 text-right font-medium">{formatPrice(l.total_ht)}</td>
                <td className="py-1.5 text-center">
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button size="sm" onClick={addLine}><Plus size={12} /> Ajouter une ligne</Button>
      </Card>

      {/* Totals + settings */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Paramètres</p>
          <div className="space-y-3">
            <Field label="TVA (%)">
              <Input type="number" value={tvaRate} onChange={e => setTvaRate(+e.target.value)} />
            </Field>
            <Field label="Acompte (%)">
              <Input type="number" value={depositPercent} onChange={e => setDepositPercent(+e.target.value)} />
            </Field>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Récapitulatif</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Total HT</span><span>{formatPrice(totalHT)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">TVA {tvaRate}%</span><span>{formatPrice(totalTTC - totalHT)}</span></div>
            <div className="flex justify-between font-medium border-t border-gray-100 pt-2 mt-2">
              <span>Total TTC</span><span>{formatPrice(totalTTC)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Acompte {depositPercent}%</span>
              <span>{formatPrice(Math.round(totalTTC * depositPercent / 100))}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <Field label="Notes">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Conditions particulières, remarques…" />
        </Field>
      </Card>

      <div className="flex gap-2 justify-end">
        <Link href="/devis"><Button>Annuler</Button></Link>
        <Button variant="primary" onClick={handleSubmit} disabled={saving || !clientId}>
          {saving ? 'Enregistrement…' : `Créer le ${type}`}
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  )
}
