'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { MessageCircle, MessageSquarePlus, X } from 'lucide-react'
import { ChatWindow } from '@/components/chat/chat-window'
import { ChatUnreadBadge } from '@/components/chat/unread-badge'
import { useProfile } from '@/contexts/profile-context'

// La bulle ouvre uniquement la carte du chat (messages + composer), flottante
// avec une marge, sans cadre ni en-tête supplémentaire. Fermeture par Échap ou
// clic sur le fond. Permet d'accéder au salon sans quitter la page courante.
export function ChatBubble() {
  const pathname = usePathname()
  const { pharmacy } = useProfile()
  const [open, setOpen] = useState(false)

  // Pas de bulle sur la page chat plein écran (redondant) ni hors officine.
  if (pathname === '/chat' || !pharmacy) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-colors hover:bg-teal-700 lg:hidden"
          aria-label="Ouvrir le salon d'équipe"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="absolute -right-1 -top-1">
            <ChatUnreadBadge />
          </span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/30 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div className="flex shrink-0 items-start justify-between gap-2 px-4 pt-4 pb-3">
            <DialogPrimitive.Title asChild>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Salon d&apos;équipe
              </h1>
            </DialogPrimitive.Title>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('pw:open-feedback'))}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
                title="Donner mon avis sur l'app"
              >
                <MessageSquarePlus className="h-3.5 w-3.5 text-teal-600" aria-hidden />
                <span className="hidden sm:inline">Mon avis</span>
              </button>
              <DialogPrimitive.Close
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer le chat"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
          </div>
          <ChatWindow showHeader={false} className="min-h-0 flex-1" />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
