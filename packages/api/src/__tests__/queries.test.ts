import { describe, it, expect, vi } from 'vitest'

import { authQueries, profileQueries, storageQueries } from '../queries'

// Minimal mock Supabase client — vitest (vi.fn), NOT jest
function createMockClient() {
  const single = vi.fn(() =>
    Promise.resolve({ data: { id: '123', full_name: 'Test' }, error: null })
  )
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))

  return {
    from,
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('authQueries', () => {
  it('session query has correct key', () => {
    const query = authQueries.session()
    expect(query.queryKey).toEqual(['auth', 'session'])
  })

  it('user query has correct key', () => {
    const query = authQueries.user()
    expect(query.queryKey).toEqual(['auth', 'user'])
  })
})

describe('profileQueries', () => {
  it('detail query has correct key with id', () => {
    const id = '123'
    const query = profileQueries.detail(id)
    expect(query.queryKey).toEqual(['profiles', 'detail', id])
  })

  it('detail queryFn selects from profiles by id', async () => {
    const client = createMockClient()
    const data = await profileQueries.detail('123').queryFn(client)

    expect(client.from).toHaveBeenCalledWith('profiles')
    expect(data).toEqual({ id: '123', full_name: 'Test' })
  })
})

describe('storageQueries', () => {
  it('avatarUrl passes external URLs through without signing', async () => {
    const client = createMockClient()
    const url = await storageQueries
      .avatarUrl('https://example.com/a.png')
      .queryFn(client)

    expect(url).toBe('https://example.com/a.png')
  })

  it('avatarUrl returns null for unset values', async () => {
    const client = createMockClient()
    expect(await storageQueries.avatarUrl(null).queryFn(client)).toBeNull()
  })
})
