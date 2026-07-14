'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardTitle, MetricCard, Button } from '@/components/ui'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PriceComparison {
  model: string
  ourPrice: number
  competitorPrice: number
  competitorName: string
  marketCount: number
}

const MOCK_DATA: PriceComparison[] = [
  { model: 'Peugeot 308 SW 2021', ourPrice: 16800, competitorPrice: 15900, competitorName: 'AutoPlus', marketCount: 23 },
  { model: 'Renault Clio V 2020', ourPrice: 13500, competitorPrice: 13900, competitorName: 'OccasAuto 78', marketCount: 41 },
  { model: 'BMW Série 3 2022', ourPrice: 34500, competitorPrice: 35200, competitorName: 'PremiumCar', marketCount: 12 },
  { model: 'Tesla Model 3 2023', ourPrice: 38900, competitorPrice: 37500, competitorName: 'ElectrAuto', marketCount: 8 },
  { model: 'Audi A4 2.0 TDI 2020', ourPrice: 23900, competitorPrice: 24500, competitorName: 'PrestigeCar', marketCount: 17 },
  { model: 'Citroën C5 2022', ourPrice: 28400, competitorPrice: 27900, competitorName: 'DrivePlus78', marketCount: 9 },
]

export default function VeillePage() {
  const data = MOCK_DATA

  const alerts = data.filter(d => d.ourPrice > d.competitorPrice * 1.03)
  const avgDiff = data.reduce((s, d) => s + ((d.ourPrice - d.competitorPrice) / d.competitorPrice) * 100, 0) / data.length

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">Veille concurrence</h1>
        <Button variant="primary">+ Ajouter un concurrent</Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <MetricCard label="Concurrents suivis" value={6} sub="Dans un rayon de 30 km" />
        <MetricCard label="Alertes prix" value={alerts.length} sub="Prix au-dessus du marché" />
        <MetricCard
          label="Écart prix moyen"
          value={`${avgDiff > 0 ? '+' : ''}${avgDiff.toFixed(1)}%`}
          sub={avgDiff > 2 ? 'Attention — au-dessus du marché' : 'Vous êtes compétitif'}
        />
      </div>

      <Card>
        <CardTitle>Comparaison par modèle</CardTitle>
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="th text-left" style={{ width: '22%' }}>Modèle</th>
              <th className="th text-right" style={{ width: '12%' }}>Notre prix</th>
              <th className="th text-left" style={{ width: '20%' }}>Concurrent le + bas</th>
              <th className="th text-right" style={{ width: '10%' }}>Écart</th>
              <th className="th text-right" style={{ width: '14%' }}>Annonces marché</th>
              <th className="th text-center" style={{ width: '12%' }}>Alerte</th>
              <th style={{ width: '10%' }}></th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => {
              const diff = ((d.ourPrice - d.competitorPrice) / d.competitorPrice) * 100
              const isAbove = diff > 2
              const isBelow = diff < -2
              return (
                <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="td font-medium">{d.model}</td>
                  <td className="td text-right">{d.ourPrice.toLocaleString('fr-FR')}€</td>
                  <td className="td text-gray-500">{d.competitorPrice.toLocaleString('fr-FR')}€ ({d.competitorName})</td>
                  <td className="td text-right">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${isAbove ? 'bg-red-50 text-red-700' : isBelow ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isAbove ? <TrendingUp size={10} /> : isBelow ? <TrendingDown size={10} /> : <Minus size={10} />}
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                    </span>
                  </td>
                  <td className="td text-right text-gray-500">{d.marketCount} ann.</td>
                  <td className="td text-center">
                    {isAbove
                      ? <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">Revoir</span>
                      : <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 font-medium">OK</span>}
                  </td>
                  <td className="td"><Button size="sm">Voir →</Button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
