'use client'

import { useState } from 'react'
import { CalendarClock, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SHIFT_KIND_LABELS,
  SHIFT_KIND_STYLES,
  SHIFT_KIND_OPTIONS,
  formatShiftRange,
  formatShiftTime,
} from '@/lib/planning/shift-kinds'
import {
  createShiftTemplate,
  updateShiftTemplate,
  archiveShiftTemplate,
} from '@/lib/queries/shifts'
import type { ShiftKind, ShiftTemplate } from '@/types/index'

type ShiftPlannerProps = {
  pharmacyId: string
  templates: ShiftTemplate[]
  onChanged: () => void
}

// Dialog de gestion des MODÈLES de shifts (l'affectation se fait directement sur
// la grille du planning, pas ici).
export function ShiftPlanner({ pharmacyId, templates, onChanged }: ShiftPlannerProps) {
  const [open, setOpen] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ShiftKind>('journee')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('19:00')
  const [breakStart, setBreakStart] = useState('')
  const [breakEnd, setBreakEnd] = useState('')
  const [savingTpl, setSavingTpl] = useState(false)

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setKind('journee')
    setStart('09:00')
    setEnd('19:00')
    setBreakStart('')
    setBreakEnd('')
  }

  const startEdit = (t: ShiftTemplate) => {
    setEditingId(t.id)
    setName(t.name)
    setKind(t.kind)
    setStart(formatShiftTime(t.start_time))
    setEnd(formatShiftTime(t.end_time))
    setBreakStart(t.break_start ? formatShiftTime(t.break_start) : '')
    setBreakEnd(t.break_end ? formatShiftTime(t.break_end) : '')
  }

  const handleSaveTemplate = async () => {
    if (!name.trim()) {
      toast.error('Donnez un nom au shift.')
      return
    }
    if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
      toast.error('Renseignez le début ET la fin de la pause.')
      return
    }
    const payload = {
      name: name.trim(),
      kind,
      start_time: start,
      end_time: end,
      break_start: breakStart || null,
      break_end: breakEnd || null,
    }
    setSavingTpl(true)
    const r = editingId
      ? await updateShiftTemplate(editingId, payload)
      : await createShiftTemplate({ pharmacy_id: pharmacyId, ...payload })
    setSavingTpl(false)
    if (r.error) {
      toast.error(r.error)
      return
    }
    toast.success(editingId ? 'Modèle modifié' : 'Modèle de shift créé')
    resetForm()
    onChanged()
  }

  const handleArchive = async (id: string) => {
    const r = await archiveShiftTemplate(id)
    if (r.error) {
      toast.error(r.error)
      return
    }
    onChanged()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Modèles de shifts"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-medium text-white shadow-lg transition-colors hover:bg-slate-800 active:scale-95"
        >
          <CalendarClock className="h-5 w-5" />
          Modèles de shifts
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modèles de shifts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Définis ici tes shifts réutilisables. L&apos;affectation se fait ensuite directement
            sur la grille du planning.
          </p>

          <ul className="space-y-2">
            {templates.length === 0 ? (
              <li className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Aucun modèle pour l&apos;instant.
              </li>
            ) : (
              templates.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${SHIFT_KIND_STYLES[t.kind]}`}>
                      {SHIFT_KIND_LABELS[t.kind]}
                    </span>
                    <span className="truncate font-medium text-slate-900">{t.name}</span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {formatShiftRange(t.start_time, t.end_time)}
                      {t.break_start && t.break_end
                        ? ` · pause ${formatShiftRange(t.break_start, t.break_end)}`
                        : ''}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(t)}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      aria-label={`Modifier le modèle ${t.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleArchive(t.id)}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Supprimer le modèle ${t.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>

          <div className="space-y-3 rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-900">
              {editingId ? 'Modifier le modèle' : 'Nouveau modèle'}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-name">Nom</Label>
                <Input
                  id="tpl-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Ouverture comptoir"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-kind">Type</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as ShiftKind)}>
                  <SelectTrigger id="tpl-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFT_KIND_OPTIONS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {SHIFT_KIND_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-start">Début</Label>
                <Input id="tpl-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-end">Fin</Label>
                <Input id="tpl-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-break-start">Pause début (option.)</Label>
                <Input id="tpl-break-start" type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-break-end">Pause fin (option.)</Label>
                <Input id="tpl-break-end" type="time" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Astuce : pour une garde de nuit, mettez une fin plus tôt que le début (ex. 20:00 → 08:00).
            </p>
            <div className="flex justify-end gap-2">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={savingTpl}>
                  Annuler
                </Button>
              )}
              <Button type="button" onClick={() => void handleSaveTemplate()} disabled={savingTpl}>
                {savingTpl ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Ajouter le modèle'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
