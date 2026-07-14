'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from 'sonner'
import { UserPlus, Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { useProfile } from '@/contexts/profile-context'
import { ROLE_LABELS } from '@/config/constants'
import { INVITABLE_ROLES } from '@/lib/auth/roles'
import type { UserRole } from '@/types/index'

type InviteDialogProps = {
  onInviteSent: () => void
  inviteDisabled?: boolean
  remainingSlots?: number | null
}

export function InviteDialog({
  onInviteSent,
  inviteDisabled = false,
  remainingSlots = null,
}: InviteDialogProps) {
  const { pharmacy } = useProfile()

  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('preparateur')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const resetForm = () => {
    setEmail('')
    setRole('preparateur')
    setInviteLink(null)
    setCopied(false)
  }

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) resetForm()
  }

  const handleSubmit = async () => {
    if (!pharmacy || !email.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/invitations/create-native', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
        }),
      })
      const data = (await res.json()) as {
        error?: string
        ok?: boolean
        mode?: 'invite_email' | 'invite_link' | 'already_member'
        message?: string
        link?: string
      }

      if (!res.ok) {
        toast.error(
          data.message ??
            (data.error === 'tier_limit_reached'
              ? 'Limite d’utilisateurs atteinte pour votre formule.'
              : data.error) ??
            "Impossible d'envoyer l'invitation."
        )
        setLoading(false)
        return
      }

      if (data.mode === 'already_member') {
        toast.info(data.message ?? 'Cette personne est déjà dans l’officine.')
        resetForm()
        setOpen(false)
      } else if (data.mode === 'invite_link' && data.link) {
        setInviteLink(data.link)
        // We do not close the dialog so the user can copy the link
      } else {
        toast.success('Membre invité, courriel envoyé')
        resetForm()
        setOpen(false)
      }
      onInviteSent()
    } catch {
      toast.error('Erreur réseau.')
    }
    setLoading(false)
  }

  const handleCopyLink = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success("Lien copié dans le presse-papiers !")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Impossible de copier le lien.")
    }
  }

  const invitableRoles: UserRole[] = [...INVITABLE_ROLES]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={inviteDisabled} title={inviteDisabled ? 'Limite d’utilisateurs atteinte' : undefined}>
          <UserPlus className="mr-2 h-4 w-4" />
          Inviter un membre
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {!inviteLink ? (
          <>
            <DialogHeader>
              <DialogTitle>Inviter un nouveau membre</DialogTitle>
              <DialogDescription>
                {remainingSlots === null
                  ? 'Votre formule autorise un nombre illimité de collaborateurs.'
                  : remainingSlots === 0
                    ? 'Aucune place disponible sur votre formule actuelle.'
                    : remainingSlots === 1
                      ? 'Il vous reste 1 place sur votre formule actuelle.'
                      : `Il vous reste ${remainingSlots} places sur votre formule actuelle.`}{' '}
                Un lien d&apos;invitation va être généré à copier et envoyer à votre
                collaborateur.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Adresse email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="collaborateur@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Rôle</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                  disabled={loading}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {invitableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={loading || !email.trim()}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Générer le lien
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invitation créée avec succès</DialogTitle>
              <DialogDescription>
                Copiez le lien ci-dessous et envoyez-le à votre collaborateur. 
                Lorsqu&apos;il cliquera dessus, il sera automatiquement connecté à l&apos;officine.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex space-x-2">
                <Input
                  readOnly
                  value={inviteLink}
                  className="flex-1 font-mono text-xs"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={handleCopyLink}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>
                Terminer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
