'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type DismissModalProps = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DismissModal({ open, onConfirm, onCancel }: DismissModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Masquer le widget des missions ?</DialogTitle>
          <DialogDescription>
            Vous pourrez le réafficher à tout moment depuis{' '}
            <Link
              href="/profile/preferences#display"
              className="font-medium text-teal-700 underline-offset-4 hover:underline"
              onClick={onCancel}
            >
              Mes préférences → Affichage
            </Link>
            .
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onConfirm}>
            Masquer
          </Button>
          <Button onClick={onCancel}>Garder visible</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
