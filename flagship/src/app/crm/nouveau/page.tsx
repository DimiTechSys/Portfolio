'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient_ } from '@/lib/data/clients'
import { Button, Card, Input, Select, Textarea } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'

export default function NewClientPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    address: '', city: '', postal_code: '', notes: '',
    status: 'prospect' as const,
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name) return
    setSaving(true)
    try {
      const c = await createClient_(form)
      router.push(`/crm/${c.id}`)
    } catch (e) { console.error(e); setSaving(false) }
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/crm" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Retour CRM
      </Link>
      <h1 className="text-lg font-medium text-gray-900 mb-5">Nouveau client</h1>

      <Card className="mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Identité</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom"><Input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Jean" /></Field>
          <Field label="Nom"><Input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Dupont" /></Field>
          <Field label="Statut">
            <Select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="prospect">Prospect</option>
              <option value="actif">Actif</option>
              <option value="fidèle">Fidèle</option>
              <option value="inactif">Inactif</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Contact</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email"><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jean@email.fr" /></Field>
          <Field label="Téléphone"><Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+33 6 …" /></Field>
          <Field label="Adresse" className="col-span-2"><Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="12 rue de la Paix" /></Field>
          <Field label="Code postal"><Input value={form.postal_code} onChange={e => set('postal_code', e.target.value)} placeholder="75001" /></Field>
          <Field label="Ville"><Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Paris" /></Field>
        </div>
      </Card>

      <Card className="mb-6">
        <Field label="Notes internes"><Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Préférences, historique, contexte…" /></Field>
      </Card>

      <div className="flex gap-2 justify-end">
        <Link href="/crm"><Button>Annuler</Button></Link>
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Enregistrement…' : 'Créer le client'}</Button>
      </div>
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  )
}
