export type KeysetCursor = { created_at: string; id: string }

export function sliceKeysetPage<T extends KeysetCursor>(
  rows: T[],
  limit: number
): { items: T[]; nextCursor: KeysetCursor | null } {
  const items = rows.slice(0, limit)
  const extra = rows.length > limit ? rows[limit] : null
  const nextCursor = extra ? { created_at: extra.created_at, id: extra.id } : null
  return { items, nextCursor }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyKeysetCursor(query: any, cursor?: KeysetCursor) {
  if (!cursor) return query
  return query.or(
    `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
  )
}
