'use client'

import { useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type MessageComposerProps = {
  onSend: (body: string) => Promise<void>
  disabled?: boolean
}

export function MessageComposer({ onSend, disabled = false }: MessageComposerProps) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    const trimmed = body.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      await onSend(trimmed)
      setBody('')
      textareaRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="bg-white p-3">
      {/* Un seul cadre bordé : textarea sans bordure + bouton d'envoi à l'intérieur. */}
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white py-1.5 pl-3 pr-1.5 transition-colors focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500/30">
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message…"
          rows={1}
          disabled={disabled || sending}
          className="max-h-32 min-h-[2.25rem] flex-1 resize-none border-0 bg-transparent px-0 py-1.5 shadow-none focus-visible:border-0 focus-visible:ring-0"
        />
        <Button
          type="button"
          size="icon"
          onClick={() => void handleSend()}
          disabled={disabled || sending || !body.trim()}
          aria-label="Envoyer"
          className="h-9 w-9 shrink-0 rounded-full bg-teal-600 hover:bg-teal-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
