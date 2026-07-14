'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { usePlanningWeek } from '@/features/planning'
import {
  getWeekRange,
  cancelLeaveAsTitulaire,
  deleteMemberDayPresence,
  getProfileDisplayName,
} from '@/lib/queries/planning'
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
import { DEFAULT_SHIFT_PRESETS } from '@/lib/planning/shift-kinds'
import {
  createShiftTemplate,
  createShiftAssignment,
  deleteShiftAssignment,
} from '@/lib/queries/shifts'
import { PlanningWeekView } from '@/components/planning/planning-week-view'
import { LeaveRequestForm } from '@/components/planning/leave-request-form'
import { TeamSessionsPanel } from '@/components/planning/team-sessions-panel'
import { ShiftPlanner } from '@/components/planning/shift-planner'
import { ShiftQuickFill } from '@/components/planning/shift-quick-fill'
import { useProfile } from '@/contexts/profile-context'

export default function PlanningPage() {
  const { role, pharmacy } = useProfile()
  const [weekOffset, setWeekOffset] = useState(0)
  const planningQuery = usePlanningWeek(weekOffset)
  const isTitulaire = role === 'titulaire'

  const data = planningQuery.data
  const weekRange = data?.weekRange ?? getWeekRange(weekOffset)

  // Auto-seed des modèles par défaut : une officine sans aucun modèle reçoit
  // d'office les presets dès la 1re visite du titulaire (pour que le « + »
  // d'affectation soit utilisable tout de suite). Flag localStorage = pas de
  // recréation si le titulaire les supprime ensuite.
  const seededRef = useRef(false)
  useEffect(() => {
    if (!isTitulaire || !pharmacy || !data || data.templates.length > 0 || seededRef.current) return
    const key = `pw_shift_presets_seeded_${pharmacy.id}`
    try {
      if (localStorage.getItem(key) === '1') {
        seededRef.current = true
        return
      }
    } catch {
      // localStorage indisponible → on tente quand même.
    }
    seededRef.current = true
    void (async () => {
      const results = await Promise.all(
        DEFAULT_SHIFT_PRESETS.map((p) =>
          createShiftTemplate({
            pharmacy_id: pharmacy.id,
            name: p.name,
            kind: p.kind,
            start_time: p.start,
            end_time: p.end,
            break_start: p.breakStart ?? null,
            break_end: p.breakEnd ?? null,
          })
        )
      )
      try {
        localStorage.setItem(key, '1')
      } catch {
        // ignore
      }
      if (results.some((r) => !r.error)) void planningQuery.refetch()
    })()
  }, [isTitulaire, pharmacy, data, planningQuery])

  const handleAssign = async (userId: string, dateKey: string, templateId: string) => {
    if (!pharmacy) return
    const r = await createShiftAssignment({
      pharmacy_id: pharmacy.id,
      user_id: userId,
      template_id: templateId,
      date: dateKey,
    })
    if (r.error) {
      toast.error(r.error)
      return
    }
    void planningQuery.refetch()
  }

  const handleUnassign = async (assignmentId: string) => {
    const r = await deleteShiftAssignment(assignmentId)
    if (r.error) {
      toast.error(r.error)
      return
    }
    void planningQuery.refetch()
  }

  const handleCancelLeave = async (leaveId: string) => {
    const r = await cancelLeaveAsTitulaire(leaveId)
    if (r.error) {
      toast.error(r.error)
      return
    }
    toast.success('Congé retiré du planning')
    void planningQuery.refetch()
  }

  // Suppression du pointage : confirmation requise (donnée factuelle).
  const [pendingPresence, setPendingPresence] = useState<{ userId: string; day: Date } | null>(null)
  const [deletingPresence, setDeletingPresence] = useState(false)

  const pendingMemberName = pendingPresence
    ? (() => {
        const m = data?.members.find((x) => x.id === pendingPresence.userId)
        return m ? getProfileDisplayName(m) : 'ce collaborateur'
      })()
    : ''
  const pendingDayLabel = pendingPresence
    ? pendingPresence.day.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : ''

  const confirmRemovePresence = async () => {
    if (!pendingPresence) return
    const from = new Date(pendingPresence.day)
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(from.getDate() + 1)
    setDeletingPresence(true)
    const r = await deleteMemberDayPresence(pendingPresence.userId, from.toISOString(), to.toISOString())
    setDeletingPresence(false)
    if (r.error) {
      toast.error(r.error)
      return
    }
    toast.success('Pointage supprimé')
    setPendingPresence(null)
    void planningQuery.refetch()
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Planning</h1>
          <p className="mt-1 text-sm text-slate-600">
            Présence de l&apos;équipe et congés sur la semaine.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isTitulaire && pharmacy && (
            <ShiftPlanner
              pharmacyId={pharmacy.id}
              templates={data?.templates ?? []}
              onChanged={() => planningQuery.refetch()}
            />
          )}
          <Link
            href="/planning/requests"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-medium text-white shadow-lg transition-colors hover:bg-slate-800 active:scale-95"
          >
            {isTitulaire ? 'Absences à valider' : 'Mes absences'}
          </Link>
        </div>
      </div>

      {isTitulaire && pharmacy && (
        <ShiftQuickFill
          pharmacyId={pharmacy.id}
          days={weekRange.days}
          members={data?.members ?? []}
          templates={data?.templates ?? []}
          onChanged={() => planningQuery.refetch()}
        />
      )}

      <PlanningWeekView
        members={data?.members ?? []}
        leaves={data?.leaves ?? []}
        assignments={data?.assignments ?? []}
        segmentMinutes={data?.segmentMinutes ?? {}}
        weekRange={weekRange}
        weekOffset={weekOffset}
        onWeekOffsetChange={setWeekOffset}
        loading={planningQuery.isLoading}
        editable={isTitulaire}
        templates={data?.templates ?? []}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
        onCancelLeave={handleCancelLeave}
        onRemovePresence={(userId, day) => setPendingPresence({ userId, day })}
      />

      {/* Pointage du jour (titulaire only — déplacé depuis « Mon équipe »,
          plus cohérent à côté du planning de présence). */}
      <TeamSessionsPanel />

      <LeaveRequestForm onSuccess={() => planningQuery.refetch()} />

      <AlertDialog
        open={pendingPresence !== null}
        onOpenChange={(o) => {
          if (!o) setPendingPresence(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le pointage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le pointage de <strong>{pendingMemberName}</strong> du <strong>{pendingDayLabel}</strong> sera
              définitivement supprimé (heures badgées et sessions du jour). Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPresence}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmRemovePresence()
              }}
              disabled={deletingPresence}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingPresence ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
