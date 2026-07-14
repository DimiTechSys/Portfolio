'use client'

import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { UserX, Loader2 } from 'lucide-react'
import { useProfile } from '@/contexts/profile-context'
import {
  getPharmacyMembers,
  getPendingInvitations,
  updateMemberRole,
  deactivateMember,
  revokeInvitation,
} from '@/lib/queries/admin'
import { ROLE_LABELS } from '@/config/constants'
import { INVITABLE_ROLES } from '@/lib/auth/roles'
import type { Profile, Invitation, UserRole } from '@/types/index'
import { InviteDialog } from './invite-dialog'
import { TeamTierUsage } from './team-tier-usage'
import { getPharmacyTierUsage } from '@/lib/queries/pharmacy-tier-usage'

const ROLE_BADGE_VARIANT: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  titulaire: 'default',
  adjoint: 'secondary',
  preparateur: 'outline',
  student: 'outline',
  shelver: 'outline',
}

export function MembersTable() {
  const { pharmacy, profile } = useProfile()
  const queryClient = useQueryClient()

  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const tierUsageQuery = useQuery({
    queryKey: ['pharmacy-tier-usage', pharmacy?.id] as const,
    enabled: Boolean(pharmacy?.id),
    queryFn: async () => {
      const result = await getPharmacyTierUsage(pharmacy!.id)
      if (result.error) throw new Error(result.error)
      return result.data!
    },
  })

  const canInvite = tierUsageQuery.data?.canInvite ?? true
  const remainingSlots = tierUsageQuery.data?.remaining

  const membersQuery = useQuery({
    queryKey: ['pharmacy-members', pharmacy?.id] as const,
    enabled: Boolean(pharmacy?.id),
    queryFn: async () => {
      const { data, error } = await getPharmacyMembers(pharmacy!.id)
      if (error) throw new Error(error)
      return data ?? []
    },
  })

  const invitationsQuery = useQuery({
    queryKey: ['pharmacy-invitations', pharmacy?.id] as const,
    enabled: Boolean(pharmacy?.id),
    queryFn: async () => {
      const { data, error } = await getPendingInvitations(pharmacy!.id)
      if (error) throw new Error(error)
      return data ?? []
    },
  })

  const members = membersQuery.data ?? []
  const invitations = invitationsQuery.data ?? []
  const loadingMembers = membersQuery.isLoading
  const loadingInvitations = invitationsQuery.isLoading

  const invalidateTierUsage = useCallback(() => {
    if (pharmacy?.id) void queryClient.invalidateQueries({ queryKey: ['pharmacy-tier-usage', pharmacy.id] })
  }, [pharmacy, queryClient])
  const invalidateMembers = useCallback(() => {
    if (pharmacy?.id) void queryClient.invalidateQueries({ queryKey: ['pharmacy-members', pharmacy.id] })
  }, [pharmacy, queryClient])
  const invalidateInvitations = useCallback(() => {
    if (pharmacy?.id) void queryClient.invalidateQueries({ queryKey: ['pharmacy-invitations', pharmacy.id] })
  }, [pharmacy, queryClient])

  const handleInviteSent = useCallback(() => {
    invalidateInvitations()
    invalidateTierUsage()
  }, [invalidateInvitations, invalidateTierUsage])

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    setUpdatingId(memberId)
    const { error } = await updateMemberRole(memberId, newRole)
    setUpdatingId(null)
    if (error) { toast.error(error); return }
    toast.success('Rôle mis à jour')
    invalidateMembers()
  }

  const handleDeactivate = async (memberId: string) => {
    setUpdatingId(memberId)
    const { error } = await deactivateMember(memberId)
    setUpdatingId(null)
    if (error) { toast.error(error); return }
    toast.success('Membre désactivé')
    invalidateMembers()
    invalidateTierUsage()
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    const { error } = await revokeInvitation(invitationId)
    if (error) { toast.error(error); return }
    toast.success('Invitation révoquée')
    invalidateInvitations()
    invalidateTierUsage()
  }

  const assignableRoles: UserRole[] = [...INVITABLE_ROLES]

  const memberColumns: Column<Profile>[] = [
    {
      key: 'display_name',
      header: 'Nom',
      sortable: true,
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.display_name ?? '-'}</span>
          {row.id === profile?.id && (
            <Badge variant="outline" className="text-xs">Vous</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (_value, row) => {
        const isSelf = row.id === profile?.id
        const isTitulaire = row.role === 'titulaire'

        if (isSelf || isTitulaire) {
          return (
            <Badge variant={ROLE_BADGE_VARIANT[row.role as UserRole]}>
              {ROLE_LABELS[row.role as UserRole]}
            </Badge>
          )
        }

        return (
          <Select
            value={row.role}
            onValueChange={(value) => handleRoleChange(row.id, value as UserRole)}
            disabled={updatingId === row.id}
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignableRoles.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      key: 'actions',
      header: '',
      render: (_value, row) => {
        const isSelf = row.id === profile?.id
        const isTitulaire = row.role === 'titulaire'
        if (isSelf || isTitulaire) return null

        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={updatingId === row.id}
              >
                {updatingId === row.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Désactiver ce membre ?</AlertDialogTitle>
                <AlertDialogDescription>
                  {row.display_name ?? 'Ce membre'} ne pourra plus accéder à l&apos;officine.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeactivate(row.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Désactiver
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ]

  const invitationColumns: Column<Invitation>[] = [
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (_value, row) => <span className="font-medium">{row.email}</span>,
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (_value, row) => (
        <Badge variant={ROLE_BADGE_VARIANT[row.role as UserRole]}>
          {ROLE_LABELS[row.role as UserRole]}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Envoyée le',
      sortable: true,
      render: (_value, row) => (
        <span className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          }).format(new Date(row.created_at))}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_value, row) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              Révoquer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Révoquer cette invitation ?</AlertDialogTitle>
              <AlertDialogDescription>
                L&apos;invitation envoyée à {row.email} sera annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleRevokeInvitation(row.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Révoquer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <TeamTierUsage pharmacyId={pharmacy?.id} />

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 md:text-lg">Membres de l&apos;équipe</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les accès et les rôles de votre équipe.
          </p>
        </div>
        <InviteDialog
          onInviteSent={handleInviteSent}
          inviteDisabled={!canInvite}
          remainingSlots={remainingSlots}
        />
      </div>

      <DataTable<Profile>
        data={members}
        columns={memberColumns}
        loading={loadingMembers}
        emptyMessage="Aucun membre trouvé."
      />

      <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-md font-semibold">Invitations en attente</h3>
          <p className="text-sm text-muted-foreground">
            Invitations envoyées qui n&apos;ont pas encore été acceptées.
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <DataTable<Invitation>
            data={invitations}
            columns={invitationColumns}
            loading={loadingInvitations}
            emptyMessage="Aucune invitation en attente."
          />
        </div>
      </div>
    </div>
  )
}