'use client'

import { Suspense, useCallback, useMemo, useState } from 'react'
import { useContacts } from '@/hooks/use-contacts'
import { useProfile } from '@/contexts/profile-context'
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  CreditCard,
  Edit,
  Trash2,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Contact, ContactCategory, UpdateContact } from '@/types/index'

// ── Constants ────────────────────────────────────────────────────────

const BASE_CATEGORIES = ['fournisseur', 'pharmacien', 'juridique', 'urgence', 'autre']

const CATEGORY_STYLES_MAP: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
  fournisseur: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', activeBg: 'bg-blue-600' },
  pharmacien:  { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', activeBg: 'bg-green-600' },
  juridique:   { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', activeBg: 'bg-purple-600' },
  urgence:     { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', activeBg: 'bg-red-600' },
  autre:       { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', activeBg: 'bg-slate-600' },
}

const CATEGORY_LABELS_MAP: Record<string, string> = {
  fournisseur: 'Fournisseurs',
  pharmacien: 'Pharmaciens',
  juridique: 'Juridique',
  urgence: 'Urgences',
  autre: 'Autres',
}

const CATEGORY_SINGULAR_MAP: Record<string, string> = {
  fournisseur: 'Pharmacien',
  pharmacien: 'Pharmacien confrère',
  juridique: 'Juridique / Avocat / Comptable',
  urgence: 'Urgence',
  autre: 'Autre',
}

function getCategoryStyle(cat: string) {
  return CATEGORY_STYLES_MAP[cat] || CATEGORY_STYLES_MAP.autre
}

function getCategoryLabel(cat: string) {
  if (CATEGORY_LABELS_MAP[cat]) return CATEGORY_LABELS_MAP[cat]
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

function getCategoryLabelSingular(cat: string) {
  if (CATEGORY_SINGULAR_MAP[cat]) return CATEGORY_SINGULAR_MAP[cat]
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}


// ── Helpers ──────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 3)
    .join('')
}

// ── Zod Schema ──────────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  company: z.string().optional(),
  role: z.string().optional(),
  category: z.string().min(1, 'La catégorie est requise'),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().optional(),
  website: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  is_urgent: z.boolean(),
})

type ContactFormData = z.infer<typeof contactSchema>

// ── Contact Form Component ──────────────────────────────────────────

function ContactForm({
  defaultValues,
  onSubmit,
  onCancel,
  isEditing = false,
}: {
  defaultValues?: Partial<ContactFormData>
  onSubmit: (data: ContactFormData) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    control,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      company: '',
      role: '',
      category: 'fournisseur',
      phone: '',
      email: '',
      address: '',
      website: '',
      reference: '',
      notes: '',
      is_urgent: false,
      ...defaultValues,
    },
  })

  const [isNewCategory, setIsNewCategory] = useState(() => {
    const cat = defaultValues?.category
    return cat ? !BASE_CATEGORIES.includes(cat) : false
  })

  const isUrgent = watch('is_urgent')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Nom complet <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition focus:border-teal-400 focus:bg-white focus:outline-none"
          placeholder="Ex: Dr. Martin Dupont"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Company */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Entreprise / Cabinet
        </label>
        <input
          {...register('company')}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition focus:border-teal-400 focus:bg-white focus:outline-none"
          placeholder="Ex: Laboratoire Biogaran"
        />
      </div>

      {/* Role */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Rôle / Fonction
        </label>
        <input
          {...register('role')}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition focus:border-teal-400 focus:bg-white focus:outline-none"
          placeholder="Ex: Délégué commercial"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Catégorie <span className="text-red-500">*</span>
        </label>
        {!isNewCategory ? (
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(val) => {
                  if (val === 'NEW') {
                    setIsNewCategory(true)
                    setValue('category', '')
                  } else {
                    field.onChange(val)
                  }
                }}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white px-4 text-slate-800 transition focus:border-teal-400 focus:ring-0 focus-visible:ring-2 focus-visible:ring-teal-600/20 data-[size=default]:h-11">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="fournisseur">Fournisseur</SelectItem>
                  <SelectItem value="pharmacien">Pharmacien confrère</SelectItem>
                  <SelectItem value="juridique">Juridique / Avocat / Comptable</SelectItem>
                  <SelectItem value="urgence">Urgence</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                  {field.value && !BASE_CATEGORIES.includes(field.value) && (
                    <SelectItem value={field.value}>{getCategoryLabel(field.value)}</SelectItem>
                  )}
                  <SelectSeparator />
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewCategory(true)
                      setValue('category', '')
                    }}
                    className="flex w-full cursor-default items-center rounded-md py-1.5 px-2 text-sm font-medium text-teal-600 outline-none hover:bg-teal-50"
                  >
                    + Créer une catégorie...
                  </button>
                </SelectContent>
              </Select>
            )}
          />
        ) : (
          <div className="flex gap-2">
            <input
              {...register('category')}
              autoFocus
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition focus:border-teal-400 focus:bg-white focus:outline-none"
              placeholder="Nom de la catégorie (ex: Laboratoire)"
            />
            <button
              type="button"
              onClick={() => setIsNewCategory(false)}
              className="rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        )}
        {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Téléphone
        </label>
        <input
          {...register('phone')}
          type="tel"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition focus:border-teal-400 focus:bg-white focus:outline-none"
          placeholder="Ex: 01 23 45 67 89"
        />
      </div>

      {/* Email */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition focus:border-teal-400 focus:bg-white focus:outline-none"
          placeholder="Ex: contact@example.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      {/* Address */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Adresse
        </label>
        <textarea
          {...register('address')}
          rows={2}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition focus:border-teal-400 focus:bg-white focus:outline-none"
          placeholder="Ex: 12 rue de la Pharmacie, 75001 Paris"
        />
      </div>

      {/* Website */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Site web
        </label>
        <input
          {...register('website')}
          type="url"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition focus:border-teal-400 focus:bg-white focus:outline-none"
          placeholder="Ex: https://www.example.com"
        />
      </div>

      {/* Reference */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          N° compte / Référence
        </label>
        <input
          {...register('reference')}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition focus:border-teal-400 focus:bg-white focus:outline-none"
          placeholder="Ex: CLI-00123"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Notes
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition focus:border-teal-400 focus:bg-white focus:outline-none"
          placeholder="Notes libres..."
        />
      </div>

      {/* Urgent toggle */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-800">Contact urgent</p>
          <p className="text-xs text-slate-500">Afficher dans les accès rapides</p>
        </div>
        <Switch
          checked={isUrgent}
          onCheckedChange={(v) => setValue('is_urgent', v)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {isSubmitting ? 'En cours...' : isEditing ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

// ── Contact Detail Sheet ────────────────────────────────────────────

function ContactDetailSheet({
  contact,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  contact: Contact | null
  open: boolean
  onClose: () => void
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
}) {
  if (!contact) return null

  const style = getCategoryStyle(contact.category)

  const fields = [
    { icon: Phone, bg: 'bg-green-50', textColor: 'text-green-600', label: 'Téléphone', value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : undefined },
    { icon: Mail, bg: 'bg-blue-50', textColor: 'text-blue-600', label: 'Email', value: contact.email, href: contact.email ? `mailto:${contact.email}` : undefined },
    { icon: MapPin, bg: 'bg-amber-50', textColor: 'text-amber-600', label: 'Adresse', value: contact.address },
    { icon: Globe, bg: 'bg-slate-100', textColor: 'text-slate-600', label: 'Site web', value: contact.website, href: contact.website, external: true },
    { icon: FileText, bg: 'bg-slate-100', textColor: 'text-slate-600', label: 'Notes', value: contact.notes },
    { icon: CreditCard, bg: 'bg-purple-50', textColor: 'text-purple-600', label: 'Référence', value: contact.reference },
  ].filter((f) => f.value)

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-3xl px-0 pb-6 pt-0 sm:max-w-lg sm:mx-auto"
      >
        <SheetTitle className="sr-only">
          Détails du contact {contact.name}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Fiche du contact avec ses coordonnées et actions disponibles.
        </SheetDescription>

        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Edit button */}
        <button
          onClick={() => { onClose(); setTimeout(() => onEdit(contact), 200) }}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Modifier"
        >
          <Edit className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center px-6 pb-4">
          <div className={cn('flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold', style.bg, style.text)}>
            {getInitials(contact.name)}
          </div>
          <h2 className="mt-3 text-xl font-bold text-slate-800">{contact.name}</h2>
          {contact.role && <p className="text-sm text-slate-500">{contact.role}{contact.company ? ` · ${contact.company}` : ''}</p>}
          {!contact.role && contact.company && <p className="text-sm text-slate-500">{contact.company}</p>}
          <span className={cn('mt-2 rounded-full border px-2.5 py-0.5 text-xs font-medium', style.bg, style.text, style.border)}>
            {getCategoryLabelSingular(contact.category)}
          </span>
        </div>

        {/* Fields */}
        <div className="space-y-1 px-6">
          {fields.map((field) => {
            const Icon = field.icon
            const content = (
              <div key={field.label} className="flex items-start gap-3 rounded-xl px-3 py-2.5">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', field.bg)}>
                  <Icon className={cn('h-4 w-4', field.textColor)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400">{field.label}</p>
                  <p className={cn('text-sm break-all', field.href ? 'text-teal-600 font-medium' : 'text-slate-600')}>
                    {field.value}
                  </p>
                </div>
              </div>
            )

            if (field.href) {
              return (
                <a
                  key={field.label}
                  href={field.href}
                  target={field.external ? '_blank' : undefined}
                  rel={field.external ? 'noopener noreferrer' : undefined}
                  className="block transition hover:bg-slate-50 rounded-xl"
                >
                  {content}
                </a>
              )
            }
            return content
          })}
        </div>

        {/* CTA Footer */}
        {(contact.phone || contact.email) && (
          <div className="flex gap-3 px-6 pt-4">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 text-sm font-medium text-white transition hover:bg-teal-700"
              >
                <Phone className="h-4 w-4" />
                Appeler
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            )}
          </div>
        )}

        {/* Delete */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => { onClose(); setTimeout(() => onDelete(contact), 200) }}
            className="text-sm text-red-500 transition hover:text-red-700"
          >
            Supprimer ce contact
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Skeleton Loader ─────────────────────────────────────────────────

function ContactSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="h-10 w-10 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-3 w-48 rounded bg-slate-100" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-100" />
            <div className="h-9 w-9 rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Content ────────────────────────────────────────────────────

function AnnuaireContent() {
  const { canWrite } = useProfile()
  const { contacts, loading, createContact, updateContact, deleteContact } = useContacts()

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ContactCategory | 'all'>('all')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)

  const filterOptions = useMemo(() => {
    const existingCats = Array.from(new Set(contacts.map((c) => c.category).filter((c) => !BASE_CATEGORIES.includes(c))))
    const allKeys = [...BASE_CATEGORIES, ...existingCats]

    return [
      { key: 'all' as const, label: 'Tous' },
      ...allKeys.map((k) => ({
        key: k,
        label: k === 'all' ? 'Tous' : getCategoryLabel(k),
      })),
    ]
  }, [contacts])



  // ── Filtering ──

  const filteredContacts = useMemo(() => {
    let result = contacts

    // Category filter
    if (activeFilter !== 'all') {
      result = result.filter((c) => c.category === activeFilter)
    }

    // Search filter
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.role?.toLowerCase().includes(q)) ||
          (c.company?.toLowerCase().includes(q))
      )
    }

    return result
  }, [contacts, activeFilter, search])

  // Group by category
  const groupedContacts = useMemo(() => {
    const groups: Partial<Record<ContactCategory, Contact[]>> = {}
    for (const contact of filteredContacts) {
      if (!groups[contact.category]) groups[contact.category] = []
      groups[contact.category]!.push(contact)
    }
    return groups
  }, [filteredContacts])

  // Urgent contacts
  const urgentContacts = useMemo(() => contacts.filter((c) => c.is_urgent), [contacts])

  // ── Handlers ──

  const handleOpenDetail = useCallback((contact: Contact) => {
    setSelectedContact(contact)
    setSheetOpen(true)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSheetOpen(false)
    setTimeout(() => setSelectedContact(null), 300)
  }, [])

  const handleCreate = useCallback(
    async (data: ContactFormData) => {
      try {
        await createContact(data)
        toast.success('Contact créé avec succès')
        setCreateDialogOpen(false)
      } catch {
        toast.error('Erreur lors de la création du contact')
      }
    },
    [createContact]
  )

  const handleUpdate = useCallback(
    async (data: ContactFormData) => {
      if (!editContact) return
      try {
        await updateContact(editContact.id, data as UpdateContact)
        toast.success('Contact mis à jour')
        setEditContact(null)
      } catch {
        toast.error('Erreur lors de la mise à jour')
      }
    },
    [editContact, updateContact]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteContact(deleteTarget.id)
      toast.success('Contact supprimé')
      setDeleteTarget(null)
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }, [deleteTarget, deleteContact])

  return (
    <div className="space-y-4 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Annuaire</h1>
          <p className="text-sm text-muted-foreground">
            Répertoire des contacts de l&apos;officine
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform active:scale-95"
            aria-label="Ajouter un contact"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un contact..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm shadow-sm transition-colors border-0 focus-visible:outline-none focus-visible:border-teal-500 focus-visible:ring-1 focus-visible:ring-teal-500 placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* ── Urgent contacts band ── */}
      {urgentContacts.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-500">
            Accès rapide
          </p>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {urgentContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleOpenDetail(contact)}
                className="flex flex-col items-center gap-1.5 transition hover:opacity-80"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
                  {getInitials(contact.name)}
                </div>
                <span className="w-16 truncate text-center text-xs text-slate-700 leading-tight">
                  {contact.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterOptions.map((opt) => {
          const isActive = activeFilter === opt.key
          const catStyle = opt.key !== 'all' ? getCategoryStyle(opt.key) : null

          return (
            <button
              key={opt.key}
              onClick={() => setActiveFilter(opt.key)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition whitespace-nowrap',
                isActive
                  ? opt.key === 'all'
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : `${catStyle!.activeBg} border-transparent text-white`
                  : opt.key === 'all'
                    ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    : `${catStyle!.bg} ${catStyle!.text} ${catStyle!.border}`
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>


      {/* ── Contact List ── */}
      {loading ? (
        <ContactSkeleton />
      ) : filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center">
          {search.trim() ? (
            <>
              <Search className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">
                Aucun résultat pour « <span className="font-medium text-slate-700">{search.trim()}</span> »
              </p>
            </>
          ) : contacts.length === 0 ? (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                <Phone className="h-7 w-7 text-teal-400" />
              </div>
              <p className="mb-1 font-semibold text-slate-700">Aucun contact pour l&apos;instant</p>
              <p className="text-sm text-slate-500">Commencez par ajouter vos premiers contacts</p>
            </>
          ) : (
            <>
              <Search className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">Aucun contact dans cette catégorie</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedContacts) as [string, Contact[]][]).map(([category, list]) => (
            <section key={category}>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {getCategoryLabel(category)} ({list.length})
              </p>
              <div className="space-y-2">
                {list.map((contact) => {
                  const style = getCategoryStyle(contact.category)
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleOpenDetail(contact)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md"
                    >
                      {/* Avatar */}
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold', style.bg, style.text)}>
                        {getInitials(contact.name)}
                      </div>


                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{contact.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {[contact.role, contact.company].filter(Boolean).join(' · ') || getCategoryLabelSingular(contact.category)}
                        </p>
                      </div>

                      {/* Category badge */}
                      <span className={cn('hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-flex', style.bg, style.text, style.border)}>
                        {getCategoryLabelSingular(contact.category)}
                      </span>

                      {/* Action buttons */}
                      <div className="flex shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-200 bg-green-50 text-green-600 transition hover:bg-green-100"
                            aria-label={`Appeler ${contact.name}`}
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                            aria-label={`Email à ${contact.name}`}
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Detail Bottom Sheet ── */}
      <ContactDetailSheet
        contact={selectedContact}
        open={sheetOpen}
        onClose={handleCloseDetail}
        onEdit={(c) => setEditContact(c)}
        onDelete={(c) => setDeleteTarget(c)}
      />

      {/* ── Create Drawer ── */}
      <DetailDrawer
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Nouveau contact"
        width="lg"
      >
        <ContactForm
          onSubmit={handleCreate}
          onCancel={() => setCreateDialogOpen(false)}
        />
      </DetailDrawer>

      {/* ── Edit Drawer ── */}
      <DetailDrawer
        open={!!editContact}
        onClose={() => setEditContact(null)}
        title="Modifier le contact"
        width="lg"
      >
        {editContact && (
          <ContactForm
            key={editContact.id}
            isEditing
            defaultValues={{
              name: editContact.name,
              company: editContact.company ?? '',
              role: editContact.role ?? '',
              category: editContact.category,
              phone: editContact.phone ?? '',
              email: editContact.email ?? '',
              address: editContact.address ?? '',
              website: editContact.website ?? '',
              reference: editContact.reference ?? '',
              notes: editContact.notes ?? '',
              is_urgent: editContact.is_urgent,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditContact(null)}
          />
        )}
      </DetailDrawer>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le contact</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <span className="font-medium">{deleteTarget?.name}</span> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDelete()}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Page Export ──────────────────────────────────────────────────────

export default function AnnuairePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <AnnuaireContent />
    </Suspense>
  )
}
