'use client'

import { useState } from 'react'
import { useSuppliers } from '@/features/orders'
import { useProfile } from '@/contexts/profile-context'
import { SupplierDialog } from '@/components/orders/supplier-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Supplier, NewSupplier } from '@/types/index'
import { DataTable, type Column } from '@/components/shared/data-table'

export default function SuppliersPage() {
  const { isAdmin, canWrite } = useProfile()
  const { suppliers, loading, error, updateSupplier, deleteSupplier } =
    useSuppliers()
  const [createOpen, setCreateOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editContact, setEditContact] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const openEdit = (supplier: Supplier) => {
    setEditSupplier(supplier)
    setEditName(supplier.name)
    setEditContact(supplier.contact_name ?? '')
    setEditPhone(supplier.phone ?? '')
    setEditEmail(supplier.email ?? '')
  }

  const handleUpdate = async () => {
    if (!editSupplier || !editName.trim()) return
    setSubmitting(true)
    await updateSupplier(editSupplier.id, {
      name: editName.trim(),
      contact_name: editContact.trim() || null,
      phone: editPhone.trim() || null,
      email: editEmail.trim() || null,
    } as Partial<NewSupplier>)
    setSubmitting(false)
    setEditSupplier(null)
  }

  const handleDelete = async (id: string) => {
    await deleteSupplier(id)
  }

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'Nom',
      sortable: true,
      render: (_v, row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'contact_name',
      header: 'Contact',
      render: (_v, row) => (
        <span className="text-sm">{row.contact_name || '-'}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Téléphone',
      render: (_v, row) => (
        <span className="text-sm text-muted-foreground">
          {row.phone || '-'}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (_v, row) => (
        <span className="text-sm text-muted-foreground">
          {row.email || '-'}
        </span>
      ),
    },
    ...(canWrite
      ? [
          {
            key: 'actions' as keyof Supplier | string,
            header: '',
            render: (_v: unknown, row: Supplier) => (
              <div className="flex gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEdit(row)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(row.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Fournisseurs
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestion des fournisseurs
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform active:scale-95"
            onClick={() => setCreateOpen(true)}
            aria-label="Nouveau fournisseur"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DataTable<Supplier>
        data={suppliers}
        columns={columns}
        loading={loading}
        emptyMessage="Aucun fournisseur trouvé."
      />

      <SupplierDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* Edit Dialog */}
      <Dialog
        open={!!editSupplier}
        onOpenChange={(v) => !v && setEditSupplier(null)}
      >
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le fournisseur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditSupplier(null)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!editName.trim() || submitting}
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


// ============================================================================
// FILE: src/app/(app)/rentals/page.tsx
// ============================================================================
