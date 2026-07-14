'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { MessageBody } from '@/components/chat/message-body'
import { canEditMessage, formatRelativeTime, getAuthorDisplayName } from '@/lib/chat/message-utils'
import { chatService } from '@/features/chat'
import type { ChatMessageWithAuthor } from '@/types/index'

type MessageBubbleProps = {
  message: ChatMessageWithAuthor
  isOwn: boolean
  canModerate: boolean
  onUpdated: (message: ChatMessageWithAuthor) => void
}

export function MessageBubble({ message, isOwn, canModerate, onUpdated }: MessageBubbleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.body)
  const [saving, setSaving] = useState(false)

  const deleted = Boolean(message.deleted_at)
  const authorName = getAuthorDisplayName(message.author)
  const showActions = !deleted && (isOwn || canModerate)
  const canEdit = isOwn && canEditMessage(message.created_at)

  const handleDelete = async () => {
    const result = await chatService.deleteChatMessage(message, {
      moderatedByTitulaire: canModerate && !isOwn,
    })
    if (result.error) {
      toast.error(result.error)
      return
    }
    if (result.data) onUpdated(result.data)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    const result = await chatService.editChatMessage(message, draft)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    if (result.data) {
      onUpdated(result.data)
      setEditing(false)
    }
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm sm:max-w-[70%] ${
          isOwn
            ? 'rounded-br-md bg-teal-600 text-white'
            : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'
        }`}
      >
        {!isOwn ? (
          <p className="mb-1 text-xs font-semibold text-teal-700">{authorName}</p>
        ) : null}

        {deleted ? (
          <p className={`italic ${isOwn ? 'text-teal-100' : 'text-slate-500'}`}>
            Message supprimé
          </p>
        ) : editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className={isOwn ? 'bg-teal-700 text-white' : ''}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>
                Annuler
              </Button>
              <Button type="button" size="sm" onClick={handleSaveEdit} disabled={saving}>
                Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          <MessageBody
            body={message.body}
            className={isOwn ? 'prose-invert prose-sm max-w-none' : 'prose prose-sm max-w-none'}
          />
        )}

        <div
          className={`mt-1 flex items-center gap-2 text-[10px] ${
            isOwn ? 'text-teal-100' : 'text-slate-500'
          }`}
        >
          <span>{formatRelativeTime(message.created_at)}</span>
          {message.edited_at ? <span>(modifié)</span> : null}
          {showActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`rounded p-0.5 ${isOwn ? 'hover:bg-teal-500' : 'hover:bg-slate-100'}`}
                  aria-label="Actions message"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
                {canEdit ? (
                  <DropdownMenuItem onClick={() => setEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </div>
  )
}
