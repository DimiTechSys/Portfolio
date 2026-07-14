import { describe, expect, it } from 'vitest'

import { sliceKeysetPage } from '@/lib/queries/keyset-pagination'

describe('sliceKeysetPage', () => {
  it('returns next cursor when more rows than limit', () => {
    const rows = [
      { id: 'a', created_at: '2026-01-03T00:00:00Z' },
      { id: 'b', created_at: '2026-01-02T00:00:00Z' },
      { id: 'c', created_at: '2026-01-01T00:00:00Z' },
    ]
    const result = sliceKeysetPage(rows, 2)
    expect(result.items).toHaveLength(2)
    expect(result.nextCursor).toEqual({ created_at: '2026-01-01T00:00:00Z', id: 'c' })
  })

  it('returns null cursor when no extra row', () => {
    const rows = [{ id: 'a', created_at: '2026-01-01T00:00:00Z' }]
    const result = sliceKeysetPage(rows, 2)
    expect(result.items).toHaveLength(1)
    expect(result.nextCursor).toBeNull()
  })
})
