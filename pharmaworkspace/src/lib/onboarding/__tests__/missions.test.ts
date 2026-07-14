import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import { getMissionsForUser } from '@/lib/onboarding/missions'
import { computeOwnerMissions, type OwnerCounts } from '@/lib/onboarding/missions-owner'
import { computeMemberMissions, type MemberState } from '@/lib/onboarding/missions-member'

// ─── Mock SupabaseClient ────────────────────────────────────────────────────
// Simule les counts par table + les rows profiles/pharmacies + auth.getUser.
// `queriedTables` trace les tables réellement interrogées (pour vérifier que
// chat_messages n'est JAMAIS query quand le flag est OFF).

type MockDb = {
  profile: {
    role: string
    pharmacy_id: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    missions_dismissed_at: string | null
  } | null
  pharmacy: {
    subscription_status: string | null
  } | null
  counts: Record<string, number>
  userMetadata: Record<string, unknown>
}

function makeMockSupabase(
  db: MockDb,
  queriedTables: string[] = [],
  eqFilters: Array<{ table: string; column: string; value: string }> = [],
) {
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: { id: 'user-1', user_metadata: db.userMetadata } },
        error: null,
      }),
    },
    from(table: string) {
      queriedTables.push(table)
      return {
        select(_cols: string, opts?: { count?: string; head?: boolean }) {
          const isCount = Boolean(opts?.count)
          return {
            eq(col: string, val: string) {
              eqFilters.push({ table, column: col, value: val })
              if (isCount) {
                // Les counts filtrés par created_by/author_id réutilisent la
                // même valeur que par pharmacy_id (suffisant pour les cas).
                return Promise.resolve({
                  count: db.counts[table] ?? 0,
                  error: null,
                })
              }
              return {
                maybeSingle: async () => {
                  if (table === 'profiles') {
                    return { data: db.profile, error: null }
                  }
                  if (table === 'pharmacies') {
                    return { data: db.pharmacy, error: null }
                  }
                  return { data: null, error: null }
                },
              }
            },
          }
        },
      }
    },
  }
  return client as unknown as SupabaseClient
}

const OWNER_PROFILE = {
  role: 'titulaire',
  pharmacy_id: 'pharma-1',
  first_name: 'Jean',
  last_name: 'Dupont',
  avatar_url: null,
  missions_dismissed_at: null,
}

const MEMBER_PROFILE = {
  role: 'preparateur',
  pharmacy_id: 'pharma-1',
  first_name: 'Anna',
  last_name: 'Martin',
  avatar_url: 'pharma-1/avatars/a.jpg',
  missions_dismissed_at: null,
}

const ACTIVE_PHARMACY = {
  subscription_status: 'trialing',
}

function ownerDb(counts: Partial<MockDb['counts']>, overrides?: Partial<MockDb>): MockDb {
  return {
    profile: OWNER_PROFILE,
    pharmacy: ACTIVE_PHARMACY,
    counts: {
      profiles: 1,
      tasks: 0,
      prescriptions: 0,
      shortages: 0,
      rentals: 0,
      feedback: 0,
      chat_messages: 0,
      ...counts,
    },
    userMetadata: { onboarding_invites_handled: true },
    ...overrides,
  }
}

describe('getMissionsForUser (owner)', () => {
  // [label, counts, expectedDone, expectedTotal], flag chat ON (total 12).
  it.each([
    ['empty pharmacy', {}, 4, 12],
    ['1 task created', { tasks: 1 }, 5, 12],
    // 3 modules → M2 M3 M4 done + M7 auto-coché = 4 wizard + 4 = 8
    ['3 modules used', { tasks: 1, prescriptions: 1, shortages: 1 }, 8, 12],
    [
      'all done',
      {
        profiles: 2,
        tasks: 1,
        prescriptions: 1,
        shortages: 1,
        rentals: 1,
        chat_messages: 1,
        feedback: 1,
      },
      12,
      12,
    ],
  ])('%s', async (_label, counts, expectedDone, expectedTotal) => {
    const supabase = makeMockSupabase(ownerDb(counts))
    const result = await getMissionsForUser(supabase, 'user-1', {
      requireChat: true,
    })
    expect(result.progress).toEqual({ done: expectedDone, total: expectedTotal })
    expect(result.allCompleted).toBe(expectedDone === expectedTotal)
  })

  it('total drops to 11 and M6 is hidden when MISSIONS_REQUIRE_CHAT=false', async () => {
    const supabase = makeMockSupabase(ownerDb({}))
    const result = await getMissionsForUser(supabase, 'user-1', {
      requireChat: false,
    })
    expect(result.progress.total).toBe(11) // 4 wizard + 7 dashboard
    const m6 = result.missions.find((m) => m.id === 'M6')
    expect(m6?.status).toBe('hidden')
  })

  it('never queries chat_messages when MISSIONS_REQUIRE_CHAT=false', async () => {
    const queried: string[] = []
    const supabase = makeMockSupabase(ownerDb({}), queried)
    await getMissionsForUser(supabase, 'user-1', { requireChat: false })
    expect(queried).not.toContain('chat_messages')
  })

  it('returns dismissed=true when profile.missions_dismissed_at is set (per-user)', async () => {
    const supabase = makeMockSupabase(
      ownerDb({}, {
        profile: {
          ...OWNER_PROFILE,
          missions_dismissed_at: '2026-06-01T10:00:00Z',
        },
      }),
    )
    const result = await getMissionsForUser(supabase, 'user-1', {
      requireChat: false,
    })
    expect(result.dismissed).toBe(true)
  })

  it('M7 stays pending with only 2 modules used', async () => {
    const supabase = makeMockSupabase(ownerDb({ tasks: 1, rentals: 1 }))
    const result = await getMissionsForUser(supabase, 'user-1', {
      requireChat: true,
    })
    const m7 = result.missions.find((m) => m.id === 'M7')
    expect(m7?.status).toBe('pending')
  })
})

describe('getMissionsForUser (member)', () => {
  function memberDb(overrides?: Partial<MockDb>): MockDb {
    return {
      profile: MEMBER_PROFILE,
      pharmacy: ACTIVE_PHARMACY,
      counts: { tasks: 0, chat_messages: 0 },
      userMetadata: {},
      ...overrides,
    }
  }

  it('fresh member: only Wi1 + M1 done (profile + avatar)', async () => {
    const supabase = makeMockSupabase(memberDb())
    const result = await getMissionsForUser(supabase, 'user-1', {
      requireChat: true,
    })
    expect(result.progress).toEqual({ done: 2, total: 5 })
  })

  it('hides M4 member when MISSIONS_REQUIRE_CHAT=false (total 4)', async () => {
    const supabase = makeMockSupabase(memberDb())
    const result = await getMissionsForUser(supabase, 'user-1', {
      requireChat: false,
    })
    expect(result.progress.total).toBe(4) // Wi1 + M1-M3
    const m4 = result.missions.find((m) => m.id === 'M4')
    expect(m4?.status).toBe('hidden')
  })

  it('all member missions done', async () => {
    const supabase = makeMockSupabase(
      memberDb({
        counts: { tasks: 1, chat_messages: 1 },
        userMetadata: { has_opened_transmission_note: true },
      }),
    )
    const result = await getMissionsForUser(supabase, 'user-1', {
      requireChat: true,
    })
    expect(result.progress).toEqual({ done: 5, total: 5 })
    expect(result.allCompleted).toBe(true)
  })

  it('member dismissed is false by default (per-user flag, migration 0060)', async () => {
    const supabase = makeMockSupabase(memberDb())
    const result = await getMissionsForUser(supabase, 'user-1', {
      requireChat: false,
    })
    expect(result.dismissed).toBe(false)
  })

  it('member dismissed=true when profile.missions_dismissed_at is set', async () => {
    const supabase = makeMockSupabase(
      memberDb({
        profile: {
          ...MEMBER_PROFILE,
          missions_dismissed_at: '2026-06-01T10:00:00Z',
        },
      }),
    )
    const result = await getMissionsForUser(supabase, 'user-1', {
      requireChat: false,
    })
    expect(result.dismissed).toBe(true)
  })

  it('never queries chat_messages for member when flag OFF', async () => {
    const queried: string[] = []
    const supabase = makeMockSupabase(memberDb(), queried)
    await getMissionsForUser(supabase, 'user-1', { requireChat: false })
    expect(queried).not.toContain('chat_messages')
  })
})

describe('getMissionsForUser (RLS isolation)', () => {
  it('every count query is scoped to the user own pharmacy or user id', async () => {
    const filters: Array<{ table: string; column: string; value: string }> = []
    const supabase = makeMockSupabase(ownerDb({}), [], filters)
    await getMissionsForUser(supabase, 'user-1', { requireChat: true })

    const countFilters = filters.filter((f) => f.table !== 'profiles' || f.column !== 'id')
    for (const f of countFilters) {
      if (f.column === 'pharmacy_id') expect(f.value).toBe('pharma-1')
      else if (f.column === 'id') expect(f.value).toBe('pharma-1') // pharmacies row
      else expect(f.value).toBe('user-1') // created_by / author_id
    }
    // Aucune query n'est émise sans filtre eq() (le mock l'imposerait par un
    // crash) : pas de SELECT global cross-tenant possible.
    expect(countFilters.length).toBeGreaterThanOrEqual(7)
  })
})

describe('getMissionsForUser (edge cases)', () => {
  it('returns empty result when user has no pharmacy', async () => {
    const supabase = makeMockSupabase({
      profile: { ...OWNER_PROFILE, pharmacy_id: null },
      pharmacy: null,
      counts: {},
      userMetadata: {},
    })
    const result = await getMissionsForUser(supabase, 'user-1')
    expect(result.missions).toHaveLength(0)
    expect(result.progress).toEqual({ done: 0, total: 0 })
    expect(result.allCompleted).toBe(false)
  })
})

describe('computeOwnerMissions (unit)', () => {
  const BASE: OwnerCounts = {
    members: 1,
    tasks: 0,
    prescriptions: 0,
    shortages: 0,
    rentals: 0,
    feedback: 0,
    chatMessages: 0,
    hasPharmacy: true,
    profileComplete: true,
    invitesHandled: true,
    subscriptionActive: true,
  }

  it('chat counts toward M7 modules only when flag ON', () => {
    const counts = { ...BASE, tasks: 1, rentals: 1, chatMessages: 1 }
    const off = computeOwnerMissions(counts, false)
    const on = computeOwnerMissions(counts, true)
    expect(off.find((m) => m.id === 'M7')?.status).toBe('pending')
    expect(on.find((m) => m.id === 'M7')?.status).toBe('done')
  })

  it('M1 requires at least 2 profiles in the pharmacy', () => {
    expect(
      computeOwnerMissions({ ...BASE, members: 1 }, false).find((m) => m.id === 'M1')
        ?.status,
    ).toBe('pending')
    expect(
      computeOwnerMissions({ ...BASE, members: 2 }, false).find((m) => m.id === 'M1')
        ?.status,
    ).toBe('done')
  })

  it('wizard missions reflect P2-01 state', () => {
    const missions = computeOwnerMissions(
      { ...BASE, profileComplete: false, subscriptionActive: false },
      false,
    )
    expect(missions.find((m) => m.id === 'W1')?.status).toBe('done')
    expect(missions.find((m) => m.id === 'W2')?.status).toBe('pending')
    expect(missions.find((m) => m.id === 'W3')?.status).toBe('done')
    expect(missions.find((m) => m.id === 'W4')?.status).toBe('pending')
  })
})

describe('computeMemberMissions (unit)', () => {
  const BASE: MemberState = {
    profileComplete: false,
    hasAvatar: false,
    tasksCreated: 0,
    hasOpenedTransmissionNote: false,
    chatMessages: 0,
  }

  it('everything pending for a fresh member (flag ON)', () => {
    const missions = computeMemberMissions(BASE, true)
    expect(missions.filter((m) => m.status === 'pending')).toHaveLength(5)
  })

  it('M3 driven by the user_metadata flag', () => {
    expect(
      computeMemberMissions({ ...BASE, hasOpenedTransmissionNote: true }, false).find(
        (m) => m.id === 'M3',
      )?.status,
    ).toBe('done')
  })
})
