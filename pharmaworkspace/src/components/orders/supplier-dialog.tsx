'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSuppliers } from '@/features/orders'
import { useProfile } from '@/contexts/profile-context'
import type { Supplier } from '@/types/index'

type SupplierDialogProps = {
  open: boolean
  onClose: () => void
  onCreated?: (supplier: Supplier) => void
}

export function SupplierDialog({ open, onClose, onCreated }: SupplierDialogProps) {
  const { pharmacy } = useProfile()
  const { createSupplier } = useSuppliers()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !pharmacy) return
    setSubmitting(true)
    const supplier = await createSupplier({
      pharmacy_id: pharmacy.id,
      name: name.trim(),
      contact_name: contact.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
    })
    setSubmitting(false)
    if (supplier) {
      onCreated?.(supplier)
      resetAndClose()
    }
  }

  const resetAndClose = () => {
    setName('')
    setContact('')
    setPhone('')
    setEmail('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau fournisseur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="supplier-name">Nom *</Label>
            <Input
              id="supplier-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du fournisseur"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-contact">Contact</Label>
            <Input
              id="supplier-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Nom du contact"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Téléphone</Label>
              <Input
                id="supplier-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01 23 45 67 89"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@fournisseur.fr"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? 'Création…' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


// ============================================================================
// FILE: src/components/orders/order-form.tsx
// ============================================================================
