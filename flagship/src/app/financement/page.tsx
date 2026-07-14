'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcMonthlyPayment, formatPrice } from '@/lib/utils'
import { Card, CardTitle, Button, MetricCard } from '@/components/ui'
import { CreditCard, Send } from 'lucide-react'
import type { Vehicle, FinancingPartner } from '@/types'

const PARTNERS: FinancingPartner[] = [
  { id: '1', name: 'BNP Paribas', rate_percent: 3.9, min_months: 12, max_months: 84 },
  { id: '2', name: 'Sofinco', rate_percent: 4.2, min_months: 12, max_months: 72 },
  { id: '3', name: 'La Centrale', rate_percent: 3.5, min_months: 24, max_months: 60 },
]

export default function FinancementPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [partnerId, setPartnerId] = useState('1')
  const [deposit, setDeposit] = useState(3000)
  const [months, setMonths] = useState(48)

  useEffect(() => {
    createClient()
      .from('vehicles')
      .select('id, brand, model, year, price_sell, plate')
      .eq('status', 'disponible')
      .order('brand')
      .then(({ data }) => {
        const v = data as Vehicle[] ?? []
        setVehicles(v)
        if (v.length > 0) setVehicleId(v[0].id)
      })
  }, [])

  const vehicle = vehicles.find(v => v.id === vehicleId)
  const partner = PARTNERS.find(p => p.id === partnerId)!
  const price = vehicle?.price_sell ?? 0
  const principal = Math.max(0, price - deposit)
  const monthly = price > 0 ? calcMonthlyPayment(price, deposit, months, partner.rate_percent) : 0
  const totalCost = monthly * months
  const totalInterest = totalCost - principal

  return (
    <div className="p-6">
      <h1 className="page-title mb-5">Simulateur de financement</h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Inputs */}
        <Card>
          <CardTitle>Paramètres</CardTitle>
          <div className="space-y-4">
            <Field label="Véhicule">
              <select
                value={vehicleId}
                onChange={e => setVehicleId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} {v.year} — {formatPrice(v.price_sell)}</option>
                ))}
              </select>
            </Field>

            <Field label="Partenaire financier">
              <select
                value={partnerId}
                onChange={e => setPartnerId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
              >
                {PARTNERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.rate_percent}%)</option>
                ))}
              </select>
            </Field>

            <Field label={`Apport : ${formatPrice(deposit)}`}>
              <input
                type="range"
                min={0}
                max={Math.max(0, price - 1000)}
                step={500}
                value={deposit}
                onChange={e => setDeposit(+e.target.value)}
                className="w-full accent-gray-800"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>0€</span><span>{formatPrice(Math.max(0, price - 1000))}</span>
              </div>
            </Field>

            <Field label={`Durée : ${months} mois`}>
              <input
                type="range"
                min={12}
                max={partner.max_months}
                step={12}
                value={months}
                onChange={e => setMonths(+e.target.value)}
                className="w-full accent-gray-800"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>12 m.</span><span>{partner.max_months} m.</span>
              </div>
            </Field>
          </div>
        </Card>

        {/* Result */}
        <Card>
          <CardTitle>Résultat</CardTitle>
          {price === 0 ? (
            <p className="text-sm text-gray-400">Sélectionnez un véhicule</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <MetricCard label="Montant financé" value={formatPrice(principal)} />
                <MetricCard label="Mensualité" value={`${formatPrice(monthly)}/m.`} />
                <MetricCard label="Coût total" value={formatPrice(totalCost)} />
                <MetricCard label="Coût du crédit" value={formatPrice(totalInterest)} />
              </div>

              {/* Visual bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Apport</span><span>Crédit</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-gray-800 rounded-l-full" style={{ width: `${(deposit / price) * 100}%` }} />
                  <div className="h-full bg-gray-300 flex-1" />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{Math.round((deposit / price) * 100)}%</span>
                  <span>{Math.round((principal / price) * 100)}%</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-4">
                Taux : {partner.rate_percent}% · Durée : {months} mois · Partenaire : {partner.name}<br />
                Calcul indicatif, offre soumise à acceptation du partenaire.
              </p>

              <div className="flex gap-2">
                <Button><Send size={13} /> Envoyer au client</Button>
                <Button variant="primary"><CreditCard size={13} /> Intégrer au devis</Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Partner comparison table */}
      <Card>
        <CardTitle>Comparaison des partenaires</CardTitle>
        {price === 0 ? (
          <p className="text-sm text-gray-400">Sélectionnez un véhicule pour comparer</p>
        ) : (
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {['Partenaire', 'Taux', `${months} mois`, '36 mois', '60 mois', '84 mois'].map(h => (
                  <th key={h} className="th text-left" style={{ width: '16.6%' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PARTNERS.map(p => (
                <tr key={p.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 ${p.id === partnerId ? 'bg-blue-50/40' : ''}`}>
                  <td className="td font-medium">{p.name}</td>
                  <td className="td text-gray-500">{p.rate_percent}%</td>
                  <td className="td font-medium text-blue-700">
                    {formatPrice(calcMonthlyPayment(price, deposit, months, p.rate_percent))}/m.
                  </td>
                  {[36, 60, 84].map(m => (
                    <td key={m} className="td text-gray-500">
                      {m <= p.max_months
                        ? `${formatPrice(calcMonthlyPayment(price, deposit, m, p.rate_percent))}/m.`
                        : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  )
}
