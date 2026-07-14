'use client'

import { MessageSquarePlus } from 'lucide-react'
import { ChatWindow } from '@/components/chat/chat-window'

export default function ChatPage() {
  // Pleine hauteur : la page remplit la zone de contenu du <main> et le scroll
  // de l'historique reste interne à la liste des messages (pas de scroll de
  // page). Repose sur le wrapper h-full du layout. La bulle flottante est
  // masquée sur cette route.
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex shrink-0 items-start justify-between gap-3 sm:mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Salon d&apos;équipe</h1>
          <p className="text-sm text-slate-500">Échangez avec votre équipe en temps réel.</p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('pw:open-feedback'))}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-medium text-white shadow-lg transition-transform hover:bg-slate-800 active:scale-95"
          aria-label="Donner votre avis"
          title="Donner mon avis sur l'app"
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span>Donner votre avis</span>
        </button>
      </div>

      <ChatWindow
        showHeader={false}
        className="min-h-0 flex-1 rounded-2xl border border-slate-200 shadow-sm"
      />
    </div>
  )
}
