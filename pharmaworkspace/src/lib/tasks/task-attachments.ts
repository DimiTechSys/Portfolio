import type { Attachment } from '@/components/shared/file-uploader'
import { getSignedAttachmentUrl } from '@/lib/storage/get-signed-url'

const ATTACHMENT_BLOCK_RE = /\n\nPièces jointes:\n([\s\S]*)$/

function guessAttachmentType(name: string): string {
  if (/\.(jpe?g|png|gif|webp)$/i.test(name)) return 'image'
  return 'document'
}

function parseJsonAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item): item is Attachment =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Attachment).path === 'string' &&
        typeof (item as Attachment).name === 'string'
    )
    .map((item) => ({
      path: item.path,
      name: item.name,
      type: item.type || guessAttachmentType(item.name),
    }))
}

export function splitTaskDescription(description: string | null | undefined): {
  text: string
  legacyAttachments: Attachment[]
} {
  // Le bloc texte "Pièces jointes" (format legacy avec URL inline) est retiré du
  // descriptif visible mais n'alimente plus la liste d'attachments : les URLs
  // publiques de ce format ne fonctionnent plus depuis P1-05 (buckets privés).
  if (!description?.trim()) {
    return { text: '', legacyAttachments: [] }
  }

  const match = description.match(ATTACHMENT_BLOCK_RE)
  if (!match || match.index === undefined) {
    return { text: description.trim(), legacyAttachments: [] }
  }

  return { text: description.slice(0, match.index).trim(), legacyAttachments: [] }
}

type TaskAttachmentSource = {
  description?: string | null
  attachments?: unknown
}

export function getTaskAttachments(task: TaskAttachmentSource): Attachment[] {
  const fromJson = parseJsonAttachments(task.attachments)
  if (fromJson.length > 0) return fromJson
  return splitTaskDescription(task.description).legacyAttachments
}

export function getTaskDescriptionText(task: TaskAttachmentSource): string {
  // `splitTaskDescription` retire systématiquement le bloc "Pièces jointes:" du
  // texte affiché. Depuis P1-06 ce bloc n'alimente plus aucune liste d'attachments
  // (les URLs publiques inline ne fonctionnent plus), donc on ne le réaffiche
  // jamais dans la description.
  return splitTaskDescription(task.description).text
}

export async function openAttachmentInNewTab(attachment: Attachment): Promise<void> {
  const signedUrl = await getSignedAttachmentUrl('attachments', attachment.path)
  if (!signedUrl) {
    throw new Error('Aperçu impossible')
  }
  window.open(signedUrl, '_blank', 'noopener,noreferrer')
}

export async function downloadAttachmentFile(attachment: Attachment): Promise<void> {
  const signedUrl = await getSignedAttachmentUrl('attachments', attachment.path)
  if (!signedUrl) {
    throw new Error('Téléchargement impossible')
  }

  try {
    const response = await fetch(signedUrl)
    if (!response.ok) {
      throw new Error('Téléchargement impossible')
    }
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = attachment.name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(signedUrl, '_blank', 'noopener,noreferrer')
  }
}
