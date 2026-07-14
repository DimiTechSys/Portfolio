'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { capture } from '@/lib/analytics/posthog'
import { PLANNING_EVENTS } from '@/lib/analytics/events'
import { leaveService } from '@/features/planning'
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from '@/config/constants'
import { formatLeavePeriod } from '@/lib/planning/format'
import { getProfileDisplayName } from '@/lib/queries/planning'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { LeaveRequestWithProfiles } from '@/types/index'

type LeaveRequestCardProps = {
  request: LeaveRequestWithProfiles
  canReview?: boolean
  canCancel?: boolean
  onUpdated?: () => void
  highlighted?: boolean
}

export function LeaveRequestCard({
  request,
  canReview = false,
  canCancel = false,
  onUpdated,
  highlighted = false,
}: LeaveRequestCardProps) {
  const [reviewNote, setReviewNote] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | 'cancel' | null>(null)

  const requesterName = request.requester
    ? getProfileDisplayName(request.requester)
    : 'Collaborateur'

  const handleReview = async (action: 'approve' | 'reject') => {
    setLoading(action)
    const result = await leaveService.reviewLeaveRequest(request.id, action, reviewNote)
    setLoading(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    capture(
      action === 'approve'
        ? PLANNING_EVENTS.leave_request_approved
        : PLANNING_EVENTS.leave_request_rejected,
      { leave_type: request.leave_type }
    )

    toast.success(action === 'approve' ? 'Demande approuvée.' : 'Demande refusée.')
    setReviewNote('')
    onUpdated?.()
  }

  const handleCancel = async () => {
    setLoading('cancel')
    const result = await leaveService.cancelLeaveRequest(request.id)
    setLoading(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Demande annulée.')
    onUpdated?.()
  }

  return (
    <article
      className={`rounded-lg border bg-white p-4 ${
        highlighted ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{requesterName}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {LEAVE_TYPE_LABELS[request.leave_type]} · {formatLeavePeriod(request)}
          </p>
        </div>
        <Badge variant={request.status === 'pending' ? 'secondary' : 'outline'}>
          {LEAVE_STATUS_LABELS[request.status]}
        </Badge>
      </div>

      {request.reason ? (
        <p className="mt-3 text-sm text-slate-700">
          <span className="font-medium">Motif :</span> {request.reason}
        </p>
      ) : null}

      {request.review_note && request.status !== 'pending' ? (
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium">Commentaire :</span> {request.review_note}
        </p>
      ) : null}

      {canReview && request.status === 'pending' ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <Textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={2}
            placeholder="Commentaire pour le collaborateur (optionnel)"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => handleReview('approve')}
              disabled={loading !== null}
            >
              {loading === 'approve' ? '…' : 'Approuver'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleReview('reject')}
              disabled={loading !== null}
            >
              {loading === 'reject' ? '…' : 'Refuser'}
            </Button>
          </div>
        </div>
      ) : null}

      {canCancel && request.status === 'pending' ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={loading !== null}
          >
            {loading === 'cancel' ? '…' : 'Annuler ma demande'}
          </Button>
        </div>
      ) : null}
    </article>
  )
}
