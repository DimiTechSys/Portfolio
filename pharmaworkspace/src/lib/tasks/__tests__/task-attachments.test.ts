import { describe, expect, it } from 'vitest'
import {
  getTaskAttachments,
  getTaskDescriptionText,
  splitTaskDescription,
} from '../task-attachments'

describe('splitTaskDescription', () => {
  it('retourne le texte seul sans bloc pièces jointes', () => {
    expect(splitTaskDescription('Description simple')).toEqual({
      text: 'Description simple',
      legacyAttachments: [],
    })
  })

  it('retire le bloc pièces jointes du texte (mais ne le réinjecte plus comme attachments)', () => {
    // Depuis P1-06, le format legacy texte n'est plus exposé : les URLs
    // publiques qu'il référençait ne fonctionnent plus (buckets privés).
    const description = `Ma tâche

Pièces jointes:
- scan.pdf: https://example.com/scan.pdf
- photo.jpg: https://example.com/photo.jpg`

    const { text, legacyAttachments } = splitTaskDescription(description)
    expect(text).toBe('Ma tâche')
    expect(legacyAttachments).toEqual([])
  })
})

describe('getTaskAttachments', () => {
  it('lit les attachments JSON au format { path, name, type }', () => {
    const attachments = [
      { path: 'pharmacy/tasks/123/doc.pdf', name: 'doc.pdf', type: 'document' },
    ]
    expect(
      getTaskAttachments({
        attachments,
        description: 'Texte\n\nPièces jointes:\n- old.pdf: https://old',
      })
    ).toEqual(attachments)
  })

  it('ignore les anciennes pièces jointes inline en description (format texte legacy)', () => {
    const description = `Note

Pièces jointes:
- fiche.pdf: https://example.com/fiche.pdf`

    expect(getTaskAttachments({ description })).toEqual([])
  })

  it('ignore les attachments JSON sans path (format legacy { url, name, type })', () => {
    const attachments = [
      { url: 'https://example.com/old.pdf', name: 'old.pdf', type: 'document' },
    ]
    expect(getTaskAttachments({ attachments })).toEqual([])
  })
})

describe('getTaskDescriptionText', () => {
  it('retire le bloc pièces jointes même si plus aucun attachment n\'en est extrait', () => {
    const description = `Corps

Pièces jointes:
- a.pdf: https://example.com/a.pdf`

    expect(getTaskDescriptionText({ description })).toBe('Corps')
  })

  it('conserve la description brute sans pièces jointes', () => {
    expect(getTaskDescriptionText({ description: '  Texte seul  ' })).toBe('Texte seul')
  })
})
