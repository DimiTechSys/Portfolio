'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, CardTitle, MetricCard } from '@/components/ui'
import { Instagram, Zap } from 'lucide-react'
import type { Vehicle } from '@/types'

export default function SocialPage() {
  const [unpublished, setUnpublished] = useState<Vehicle[]>([])
  const [published, setPublished] = useState<Vehicle[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('vehicles')
      .select('*')
      .eq('instagram_published', false)
      .neq('status', 'vendu')
      .order('created_at', { ascending: false })
      .then(({ data }) => setUnpublished(data ?? []))

    supabase.from('vehicles')
      .select('*')
      .eq('instagram_published', true)
      .order('updated_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setPublished(data ?? []))
  }, [])

  const markPublished = async (id: string) => {
    const supabase = createClient()
    await supabase.from('vehicles').update({ instagram_published: true }).eq('id', id)
    const v = unpublished.find(x => x.id === id)!
    setUnpublished(prev => prev.filter(x => x.id !== id))
    setPublished(prev => [{ ...v, instagram_published: true }, ...prev])
  }

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="page-title">Réseaux sociaux</h1>
        <Button variant="primary"><Instagram size={14} /> Connecter Instagram</Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <MetricCard label="Posts ce mois" value={14} sub="8 automatiques" />
        <MetricCard label="Abonnés Instagram" value="2 840" sub="+120 ce mois" />
        <MetricCard label="Véhicules à publier" value={unpublished.length} sub="Ajoutés sans post" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <CardTitle>À publier</CardTitle>
          {unpublished.length === 0 ? (
            <p className="text-sm text-gray-400">Tout est publié ✓</p>
          ) : (
            <div className="space-y-0">
              {unpublished.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{v.brand} {v.model} — {v.year}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.color_ext} · {v.plate}</p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => markPublished(v.id)}>
                    <Instagram size={12} /> Publier
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Derniers posts publiés</CardTitle>
          {published.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun post publié</p>
          ) : (
            <div className="space-y-0">
              {published.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{v.brand} {v.model} — {v.year}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.status === 'vendu' ? 'Vendu après publication' : 'En ligne'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${v.status === 'vendu' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    {v.status === 'vendu' ? 'Vendu' : 'Publié'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Automatisation</CardTitle>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 font-medium text-gray-800 mb-1.5">
              <Zap size={14} className="text-amber-500" /> Publication automatique
            </div>
            <p className="text-gray-500">Chaque nouveau véhicule ajouté au parc génère automatiquement un post Instagram avec photo et description.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 font-medium text-gray-800 mb-1.5">
              <Zap size={14} className="text-amber-500" /> Suppression automatique
            </div>
            <p className="text-gray-500">Lorsqu'un véhicule est marqué Vendu, le post est archivé et une story « Vendu ! » est publiée automatiquement.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="primary"><Instagram size={13} /> Connecter Instagram</Button>
          <Button>Modifier les templates</Button>
        </div>
      </Card>
    </div>
  )
}
