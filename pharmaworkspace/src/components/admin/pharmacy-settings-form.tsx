'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Building2 } from 'lucide-react'
import { useProfile } from '@/contexts/profile-context'
import { updatePharmacySettings } from '@/lib/queries/admin'
import type { Pharmacy } from '@/types/index'

type FormData = {
  name: string
  finess: string
  address: string
  logo_url: string
}

export function PharmacySettingsForm() {
  const { pharmacy } = useProfile()

  const [form, setForm] = useState<FormData>({
    name: '',
    finess: '',
    address: '',
    logo_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!pharmacy) return
    const timeoutId = setTimeout(() => {
      setForm({
        name: pharmacy.name ?? '',
        finess: pharmacy.finess ?? '',
        address: pharmacy.address ?? '',
        logo_url: pharmacy.logo_url ?? '',
      })
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [pharmacy])

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }



  const handleSubmit = async () => {
    if (!pharmacy) return

    setLoading(true)

    const payload: Partial<Pick<Pharmacy, 'name' | 'finess' | 'address' | 'logo_url'>> = {}

    if (form.name !== (pharmacy.name ?? '')) payload.name = form.name
    if (form.finess !== (pharmacy.finess ?? '')) payload.finess = form.finess
    if (form.address !== (pharmacy.address ?? '')) payload.address = form.address
    if (form.logo_url !== (pharmacy.logo_url ?? '')) payload.logo_url = form.logo_url

    if (Object.keys(payload).length === 0) {
      setLoading(false)
      toast('Aucune modification détectée.')
      return
    }

    const { error } = await updatePharmacySettings(pharmacy.id, payload)
    setLoading(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('Modifications enregistrées')
    setDirty(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Informations de l&apos;officine
        </CardTitle>
        <CardDescription>
          Modifiez les informations générales de votre pharmacie.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="pharmacy-name">Nom de l&apos;officine</Label>
          <Input
            id="pharmacy-name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Pharmacie du Centre"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pharmacy-finess">Numéro FINESS</Label>
          <Input
            id="pharmacy-finess"
            value={form.finess}
            onChange={(e) => handleChange('finess', e.target.value)}
            placeholder="0123456789"
            maxLength={9}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Identifiant unique à 9 chiffres de l&apos;établissement.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pharmacy-address">Adresse</Label>
          <Textarea
            id="pharmacy-address"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="12 rue de la Santé, 75013 Paris"
            rows={3}
            disabled={loading}
          />
        </div>


      </CardContent>

      <CardFooter className="flex justify-end border-t px-3 pt-4 sm:px-4 sm:pt-6">
        <Button onClick={handleSubmit} disabled={loading || !dirty}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les modifications
        </Button>
      </CardFooter>
    </Card>
  )
}