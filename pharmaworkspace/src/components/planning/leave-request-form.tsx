'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { capture } from '@/lib/analytics/posthog'
import { PLANNING_EVENTS } from '@/lib/analytics/events'
import { leaveService } from '@/features/planning'
import { LEAVE_TYPE_LABELS } from '@/config/constants'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LeaveType } from '@/types/index'

type LeaveRequestFormProps = {
  onSuccess?: () => void
}

export function LeaveRequestForm({ onSuccess }: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>('cp')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [halfDayStart, setHalfDayStart] = useState(false)
  const [halfDayEnd, setHalfDayEnd] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!startDate || !endDate) {
      toast.error('Veuillez renseigner les dates de début et de fin.')
      return
    }

    if (endDate < startDate) {
      toast.error('La date de fin doit être après la date de début.')
      return
    }

    setSubmitting(true)
    const result = await leaveService.submitLeaveRequest({
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      half_day_start: halfDayStart,
      half_day_end: halfDayEnd,
      reason: reason.trim() || null,
    })
    setSubmitting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    capture(PLANNING_EVENTS.leave_request_submitted, {
      leave_type: leaveType,
      days_span:
        Math.round(
          (new Date(`${endDate}T12:00:00`).getTime() -
            new Date(`${startDate}T12:00:00`).getTime()) /
            86_400_000
        ) + 1,
    })

    toast.success('Demande de congé envoyée au titulaire.')
    setStartDate('')
    setEndDate('')
    setHalfDayStart(false)
    setHalfDayEnd(false)
    setReason('')
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">Nouvelle demande de congé</h3>

      <div className="space-y-2">
        <Label htmlFor="leave-type">Type</Label>
        <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
          <SelectTrigger id="leave-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start-date">Date de début</Label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">Date de fin</Label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={halfDayStart}
            onChange={(e) => setHalfDayStart(e.target.checked)}
          />
          Demi-journée le premier jour (matin)
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={halfDayEnd}
            onChange={(e) => setHalfDayEnd(e.target.checked)}
          />
          Demi-journée le dernier jour (après-midi)
        </label>
      </div>

      <div className="space-y-1">
        <Label htmlFor="reason">Motif (optionnel)</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Précisions pour le titulaire…"
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Envoi…' : 'Soumettre la demande'}
      </Button>
    </form>
  )
}
