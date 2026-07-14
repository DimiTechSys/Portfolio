import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatKm } from '@/lib/utils'
import { notFound } from 'next/navigation'

export default async function PublicVehiclePage({ params }: { params: { plate: string } }) {
  const supabase = await createClient()

  // Reconstruct plate: "dw415mk" → search insensitively
  const rawPlate = params.plate.toUpperCase()
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .neq('status', 'vendu')

  const vehicle = (vehicles ?? []).find(
    v => v.plate.replace(/-/g, '').toUpperCase() === rawPlate
  )

  if (!vehicle) notFound()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-medium text-gray-900">{vehicle.brand} {vehicle.model}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{vehicle.year} · {vehicle.type}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-medium text-gray-900">{formatPrice(vehicle.price_sell)}</div>
              <div className="text-xs text-gray-400 mt-0.5">Prix TTC</div>
            </div>
          </div>
        </div>

        {/* Specs grid */}
        <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-100">
          {[
            { label: 'Kilométrage', value: formatKm(vehicle.km) },
            { label: 'Carburant', value: vehicle.fuel },
            { label: 'Boîte', value: vehicle.gear },
            { label: 'Puissance', value: `${vehicle.power_hp} ch` },
            { label: 'Couleur', value: vehicle.color_ext },
            { label: 'DPE', value: vehicle.dpe },
            { label: 'Nb. portes', value: `${vehicle.doors} portes` },
            { label: 'CT', value: vehicle.ct_status },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-gray-400 mb-0.5">{label}</div>
              <div className="text-sm font-medium text-gray-800">{value || '—'}</div>
            </div>
          ))}
        </div>

        {vehicle.options && (
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="text-xs text-gray-400 mb-1.5">Équipements</div>
            <p className="text-sm text-gray-700">{vehicle.options}</p>
          </div>
        )}

        {/* CTA */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${vehicle.status === 'disponible' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
              {vehicle.status === 'disponible' ? 'Disponible' : 'Réservé'}
            </span>
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{vehicle.plate}</span>
          </div>
          <p className="text-xs text-gray-400">
            Fiche fournie par votre concessionnaire — informations à jour en temps réel.
          </p>
        </div>
      </div>
    </div>
  )
}
