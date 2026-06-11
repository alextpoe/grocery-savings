import { type SupabaseClient } from '@supabase/supabase-js'

import { type Database } from '../types/database'

type Client = SupabaseClient<Database>

/**
 * Query factory pattern
 * Separates query definitions from hooks for better testability
 */
export const profileQueries = {
  detail: (id: string) => ({
    queryKey: ['profiles', 'detail', id] as const,
    queryFn: async (client: Client) => {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
  }),

  current: () => ({
    queryKey: ['profiles', 'current'] as const,
    queryFn: async (client: Client) => {
      const {
        data: { user },
      } = await client.auth.getUser()
      if (!user) return null

      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    },
  }),
}

export const storageQueries = {
  /**
   * Resolve a profile avatar_url value to a displayable URL.
   * External URLs (http/https) pass through; storage paths get a signed URL
   * (the avatars bucket is private).
   */
  avatarUrl: (value: string | null) => ({
    queryKey: ['storage', 'avatar-url', value] as const,
    queryFn: async (client: Client) => {
      if (!value) return null
      if (/^https?:\/\//.test(value)) return value

      const { data, error } = await client.storage
        .from('avatars')
        .createSignedUrl(value, 60 * 60)

      if (error) throw error
      return data.signedUrl
    },
  }),
}

export const authQueries = {
  session: () => ({
    queryKey: ['auth', 'session'] as const,
    queryFn: async (client: Client) => {
      const { data, error } = await client.auth.getSession()
      if (error) throw error
      return data.session
    },
  }),

  user: () => ({
    queryKey: ['auth', 'user'] as const,
    queryFn: async (client: Client) => {
      const { data, error } = await client.auth.getUser()
      if (error) throw error
      return data.user
    },
  }),
}
