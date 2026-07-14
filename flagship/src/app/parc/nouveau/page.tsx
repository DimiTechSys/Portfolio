'use client'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createVehicle } from '@/lib/data/vehicles'
import { CAR_BRANDS } from '@/lib/brands'
import { Button, Card, Input, Select, Textarea } from '@/components/ui'
import { ArrowLeft, X } from 'lucide-react'

export default function NewVehiclePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'VO' as 'VO' | 'VN',
    km: 0,
    fuel: 'Essence' as const,
    gear: 'Manuelle' as const,
    color_ext: '',
    color_int: '',
    power_hp: 0,
    doors: 5,
    price_sell: 0,
    price_buy: 0,
    dpe: 'C' as const,
    ct_status: 'Valide',
    ct_date: '',
    options: '',
    notes_internal: '',
    status: 'disponible' as const,
    instagram_published: false,
    instagram_post_id: null,
    photos: [] as string[],
  })

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const handlePhotosChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const remainingSlots = Math.max(0, 8 - form.photos.length)
    const nextFiles = files.slice(0, remainingSlots)
    const oversizedFile = nextFiles.find(file => file.size > 2 * 1024 * 1024)
    if (oversizedFile) {
      setErrorMessage(`Image trop lourde: "${oversizedFile.name}". Maximum 2 Mo par photo.`)
      event.target.value = ''
      return
    }
    const dataUrls = await Promise.all(nextFiles.map(fileToDataUrl))
    set('photos', [...form.photos, ...dataUrls])
    setErrorMessage(null)

    // Let users select the same file twice if needed.
    event.target.value = ''
  }

  const removePhoto = (index: number) => {
    set(
      'photos',
      form.photos.filter((_, i) => i !== index)
    )
  }

  const handleSubmit = async () => {
    if (!form.plate || !form.brand || !form.model) {
      setErrorMessage('Merci de renseigner au moins la plaque, la marque et le modèle.')
      return
    }
    setErrorMessage(null)
    setSaving(true)
    try {
      const payload = {
        ...form,
        plate: form.plate.trim().toUpperCase(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        ct_date: form.ct_date?.trim() ? form.ct_date : null,
      }
      const v = await createVehicle(payload)
      router.push(`/parc/${v.id}`)
    } catch (e: unknown) {
      const message = getErrorMessage(e)
      console.error('createVehicle error:', e)
      setErrorMessage(message)
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/parc" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Retour au parc
      </Link>
      <h1 className="text-lg font-medium text-gray-900 mb-5">Ajouter un véhicule</h1>

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <Card className="mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Identification</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Marque">
            <div className="space-y-2">
              <Input
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
                placeholder="Tape 1-2 lettres (ex: me, pe, vo...)"
                list="car-brands-list"
              />
              <datalist id="car-brands-list">
                {CAR_BRANDS.map(brand => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
              <p className="text-xs text-gray-400">
                Suggestions dynamiques disponibles sur toutes les marques principales.
              </p>
            </div>
          </Field>
          <Field label="Modèle">
            <Input value={form.model} onChange={e => set('model', e.target.value)} placeholder="ex: 308 SW" />
          </Field>
          <Field label="Plaque d'immatriculation">
            <Input value={form.plate} onChange={e => set('plate', e.target.value.toUpperCase())} placeholder="ex: AB-123-CD" />
          </Field>
          <Field label="Année">
            <Input type="number" value={form.year} onChange={e => set('year', +e.target.value)} />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="VO">VO — Occasion</option>
              <option value="VN">VN — Neuf</option>
            </Select>
          </Field>
          <Field label="Statut">
            <Select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="disponible">Disponible</option>
              <option value="réservé">Réservé</option>
              <option value="vendu">Vendu</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Caractéristiques</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Kilométrage">
            <Input type="number" value={form.km} onChange={e => set('km', +e.target.value)} />
          </Field>
          <Field label="Carburant">
            <Select value={form.fuel} onChange={e => set('fuel', e.target.value)}>
              {['Essence','Diesel','Hybride','Électrique','GPL'].map(f => <option key={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="Boîte de vitesses">
            <Select value={form.gear} onChange={e => set('gear', e.target.value)}>
              <option>Manuelle</option>
              <option>Automatique</option>
            </Select>
          </Field>
          <Field label="Puissance (ch)">
            <Input type="number" value={form.power_hp} onChange={e => set('power_hp', +e.target.value)} />
          </Field>
          <Field label="Nb. de portes">
            <Select value={form.doors} onChange={e => set('doors', +e.target.value)}>
              <option value={3}>3 portes</option>
              <option value={5}>5 portes</option>
            </Select>
          </Field>
          <Field label="DPE">
            <Select value={form.dpe} onChange={e => set('dpe', e.target.value)}>
              {['A','B','C','D','E','F','G'].map(d => <option key={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="Couleur extérieure">
            <Input value={form.color_ext} onChange={e => set('color_ext', e.target.value)} placeholder="ex: Gris Platinium" />
          </Field>
          <Field label="Couleur intérieure">
            <Input value={form.color_int} onChange={e => set('color_int', e.target.value)} placeholder="ex: Noir cuir" />
          </Field>
          <Field label="CT">
            <Select value={form.ct_status} onChange={e => set('ct_status', e.target.value)}>
              <option>Valide</option>
              <option>Expiré</option>
              <option>N/A</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Prix</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix de vente (€)">
            <Input type="number" value={form.price_sell} onChange={e => set('price_sell', +e.target.value)} />
          </Field>
          <Field label="Prix d'achat (€) — interne">
            <Input type="number" value={form.price_buy} onChange={e => set('price_buy', +e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="mb-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Infos complémentaires</p>
        <div className="space-y-3">
          <Field label="Équipements / options">
            <Textarea
              value={form.options}
              onChange={e => set('options', e.target.value)}
              placeholder="Climatisation auto, GPS, caméra de recul…"
            />
          </Field>
          <Field label="Note interne (non visible client)">
            <Textarea
              value={form.notes_internal}
              onChange={e => set('notes_internal', e.target.value)}
              placeholder="Observations internes…"
            />
          </Field>
        </div>
      </Card>

      <Card className="mb-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Photos du véhicule</p>
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotosChange}
            className="block w-full cursor-pointer text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-700"
          />
          <p className="text-xs text-gray-400">
            Jusqu’à 8 images. La première image sera utilisée comme photo principale.
          </p>

          {form.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {form.photos.map((photo, idx) => (
                <div key={`${photo.slice(0, 24)}-${idx}`} className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={`Photo ${idx + 1}`} className="h-32 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/75"
                    aria-label={`Supprimer la photo ${idx + 1}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-2 justify-end">
        <Link href="/parc"><Button>Annuler</Button></Link>
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le véhicule'}
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message
    }
    if ('error_description' in error && typeof (error as { error_description?: unknown }).error_description === 'string') {
      return (error as { error_description: string }).error_description
    }
  }
  return "Impossible d'enregistrer le véhicule. Vérifie les champs saisis puis réessaie."
}
