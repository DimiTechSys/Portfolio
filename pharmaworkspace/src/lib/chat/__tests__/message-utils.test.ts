import { describe, expect, it } from 'vitest'
import { canEditMessage, formatRelativeTime } from '@/lib/chat/message-utils'

describe('chat message utils', () => {
  it('canEditMessage allows edit within 15 minutes', () => {
    const now = Date.now()
    const recent = new Date(now - 5 * 60 * 1000).toISOString()
    const old = new Date(now - 20 * 60 * 1000).toISOString()
    expect(canEditMessage(recent, now)).toBe(true)
    expect(canEditMessage(old, now)).toBe(false)
  })

  it('formatRelativeTime returns minutes for recent messages', () => {
    const now = Date.now()
    const iso = new Date(now - 3 * 60 * 1000).toISOString()
    expect(formatRelativeTime(iso, now)).toBe('il y a 3 min')
  })
})
