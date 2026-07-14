'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toDateKey } from '@/lib/planning/cell-status'
import { formatShiftRange } from '@/lib/planning/shift-kinds'
import { getProfileDisplayName } from '@/lib/queries/planning'
import { createShiftAssignmentsBulk, copyWeekAssignments } from '@/lib/queries/shifts'
import type { Profile, ShiftTemplate } from '@/types/index'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

type ShiftQuickFillProps = {
  pharmacyId: string
  days: Date[]
  members: Profile[]
  templates: ShiftTemplate[]
  onChanged: () => void
}

// Barre d'outils de remplissage rapide, intégrée directement au-dessus du
// planning (pas de modal) : applique un modèle à un collaborateur / toute
// l'équipe sur plusieurs jours en une fois, ou reprend la semaine précédente.
export function ShiftQuickFill({
  pharmacyId,
  days,
  members,
  templates,
  onChanged,
}: ShiftQuickFillProps) {
  const [memberId, setMemberId] = useState<string>('all')
  const [templateId, setTemplateId] = useState<string>('')
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)
  const [copying, setCopying] = useState(false)

  const toggleDay = (key: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleCopyPrevious = async () => {
    if (days.length < 7) return
    const prevFrom = new Date(days[0])
    prevFrom.setDate(prevFrom.getDate() - 7)
    const prevTo = new Date(days[6])
    prevTo.setDate(prevTo.getDate() - 7)
    setCopying(true)
    const r = await copyWeekAssignments(pharmacyId, toDateKey(prevFrom), toDateKey(prevTo), 7)
    setCopying(false)
    if (r.error) {
      toast.error(r.error)
      return
    }
    if ((r.data ?? 0) === 0) {
      toast.info('Aucun shift à reprendre la semaine précédente.')
      return
    }
    toast.success(`${r.data} shift(s) repris de la semaine précédente`)
    onChanged()
  }

  const handleApply = async () => {
    if (!templateId) {
      toast.error('Choisissez un modèle de shift.')
      return
    }
    if (selectedDays.size === 0) {
      toast.error('Sélectionnez au moins un jour.')
      return
    }
    const targets = memberId === 'all' ? members : members.filter((m) => m.id === memberId)
    const rows: { pharmacy_id: string; user_id: string; template_id: string; date: string }[] = []
    for (const m of targets) {
      for (const dk of selectedDays) {
        rows.push({ pharmacy_id: pharmacyId, user_id: m.id, template_id: templateId, date: dk })
      }
    }
    setApplying(true)
    const r = await createShiftAssignmentsBulk(rows)
    setApplying(false)
    if (r.error) {
      toast.error(r.error)
      return
    }
    toast.success(`${rows.length} affectation(s) appliquée(s)`)
    onChanged()
    setSelectedDays(new Set())
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-900">Remplir rapidement</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleCopyPrevious()}
          disabled={copying}
          className="w-full sm:w-auto"
        >
          <Copy className="h-4 w-4" />
          {copying ? 'Copie…' : 'Reprendre la semaine précédente'}
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">
          Créez d&apos;abord un modèle dans « Modèles de shifts » pour pouvoir remplir le planning.
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full space-y-1 sm:w-auto">
            <Label htmlFor="qf-member" className="text-xs text-slate-500">
              Collaborateur
            </Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger id="qf-member" className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute l&apos;équipe</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {getProfileDisplayName(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1 sm:w-auto">
            <Label htmlFor="qf-template" className="text-xs text-slate-500">
              Modèle
            </Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="qf-template" className="w-full sm:w-48">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({formatShiftRange(t.start_time, t.end_time)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1 sm:w-auto">
            <Label className="text-xs text-slate-500">Jours</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {days.map((day, i) => {
                const key = toDateKey(day)
                const on = selectedDays.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDay(key)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      on
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {DAY_LABELS[i]}
                  </button>
                )
              })}
              <span className="mx-1 text-slate-200">|</span>
              <button
                type="button"
                onClick={() => setSelectedDays(new Set(days.slice(0, 5).map(toDateKey)))}
                className="text-xs text-teal-700 underline-offset-2 hover:underline"
              >
                Lun-Ven
              </button>
              <button
                type="button"
                onClick={() => setSelectedDays(new Set(days.map(toDateKey)))}
                className="text-xs text-teal-700 underline-offset-2 hover:underline"
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setSelectedDays(new Set())}
                className="text-xs text-slate-500 underline-offset-2 hover:underline"
              >
                Effacer
              </button>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => void handleApply()}
            disabled={applying}
            className="w-full sm:ml-auto sm:w-auto"
          >
            {applying ? 'Application…' : 'Appliquer'}
          </Button>
        </div>
      )}
    </div>
  )
}
