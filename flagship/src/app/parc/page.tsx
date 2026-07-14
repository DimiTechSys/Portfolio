'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { getVehicles } from '@/lib/data/vehicles'
import { CAR_BRANDS } from '@/lib/brands'
import { formatPrice, formatKm } from '@/lib/utils'
import { Badge, Button, Plate, Input, Select, EmptyState } from '@/components/ui'
import { Plus, Search } from 'lucide-react'
import type { Vehicle } from '@/types'

export default function ParcPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('tous')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterType, setFilterType] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getVehicles({
        status: filterStatus,
        brand: filterBrand || undefined,
        type: filterType || undefined,
        search: search || undefined,
      })
      setVehicles(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, filterBrand, filterType])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  const counts = {
    tous: vehicles.length,
    disponible: vehicles.filter(v => v.status === 'disponible').length,
    réservé: vehicles.filter(v => v.status === 'réservé').length,
    vendu: vehicles.filter(v => v.status === 'vendu').length,
  }

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">Parc véhicules</h1>
        <Link href="/parc/nouveau">
          <Button variant="primary"><Plus size={14} /> Ajouter un véhicule</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2 text-gray-400" />
          <Input
            placeholder="Plaque, modèle, marque…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 w-52"
          />
        </div>
        <Select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="w-40">
          <option value="">Toutes marques</option>
          {CAR_BRANDS.map(b => <option key={b}>{b}</option>)}
        </Select>
        <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-36">
          <option value="">VO & VN</option>
          <option value="VO">Occasion (VO)</option>
          <option value="VN">Neuf (VN)</option>
        </Select>
        <div className="flex gap-1 ml-1">
          {(['tous', 'disponible', 'réservé', 'vendu'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize ${
                filterStatus === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === 'tous' ? 'Tous' : s.charAt(0).toUpperCase() + s.slice(1)}
              {' '}({counts[s as keyof typeof counts] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '90px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '55px' }} />
            <col style={{ width: '45px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '85px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
          </colgroup>
          <thead>
            <tr>
              {['Photo','Plaque','Modèle','Année','Type','Km','Carbu.','Couleur','Prix','Statut',''].map(h => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="py-12 text-center text-sm text-gray-400">Chargement…</td></tr>
            ) : vehicles.length === 0 ? (
              <tr><td colSpan={11}><EmptyState message="Aucun véhicule trouvé" /></td></tr>
            ) : (
              vehicles.map(v => (
                <tr key={v.id} className="tr-hover" onClick={() => window.location.href = `/parc/${v.id}`}>
                  <td className="td">
                    {v.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.photos[0]} alt={`${v.brand} ${v.model}`} className="h-14 w-20 rounded-lg border border-gray-200 object-cover" />
                    ) : (
                      <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">
                        Aucune
                      </div>
                    )}
                  </td>
                  <td className="td"><Plate>{v.plate}</Plate></td>
                  <td className="td font-medium">{v.brand} {v.model}</td>
                  <td className="td">{v.year}</td>
                  <td className="td"><span className="text-xs text-gray-400">{v.type}</span></td>
                  <td className="td">{formatKm(v.km)}</td>
                  <td className="td">{v.fuel}</td>
                  <td className="td text-gray-400">{v.color_ext}</td>
                  <td className="td font-medium">{formatPrice(v.price_sell)}</td>
                  <td className="td"><Badge status={v.status} /></td>
                  <td className="td">
                    <Link href={`/parc/${v.id}`} onClick={e => e.stopPropagation()}>
                      <Button size="sm">Fiche →</Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
