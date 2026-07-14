'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProfile } from '@/contexts/profile-context'
import { submitFeedback } from '@/lib/queries/feedback'
import type { FeedbackCategory } from '@/types/index'

const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  idea: 'Idée',
  praise: 'Compliment',
  other: 'Autre',
}

// Dialog de feedback "headless" : pas de bouton flottant. S'ouvre via
// l'évènement `pw:open-feedback` (action « Mon avis » du panneau chat, mission
// d'activation M8, bannière missions complétées).
export function FeedbackDialog() {
  const pathname = usePathname()
  const { pharmacy } = useProfile()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory>('bug')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Permet aux missions d'activation (ONBOARD-01) d'ouvrir le dialog sans
  // coupler les composants : window.dispatchEvent(new Event('pw:open-feedback')).
  useEffect(() => {
    const openDialog = () => setOpen(true)
    window.addEventListener('pw:open-feedback', openDialog)
    return () => window.removeEventListener('pw:open-feedback', openDialog)
  }, [])

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (trimmed.length < 3) {
      toast.error('Merci de décrire votre retour en quelques mots.')
      return
    }

    setSubmitting(true)
    const pageUrl =
      typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : pathname

    const result = await submitFeedback({
      pharmacy_id: pharmacy?.id ?? null,
      category,
      content: trimmed,
      page_url: pageUrl,
    })
    setSubmitting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Merci, votre retour a bien été envoyé.')
    setContent('')
    setCategory('bug')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Votre avis nous aide</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-category">Catégorie</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as FeedbackCategory)}
              >
                <SelectTrigger id="feedback-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FEEDBACK_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-content">Message</Label>
              <Textarea
                id="feedback-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Décrivez le bug, l'idée ou ce qui vous a plu…"
                rows={5}
                maxLength={2000}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? 'Envoi…' : 'Envoyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}
