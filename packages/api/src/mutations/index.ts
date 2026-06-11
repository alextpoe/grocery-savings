import { type SupabaseClient } from '@supabase/supabase-js'

import { type Database, type UpdateTables } from '../types/database'

type Client = SupabaseClient<Database>

/**
 * Auth mutations
 */
export const authMutations = {
  signInWithEmail: async (
    client: Client,
    { email, password }: { email: string; password: string }
  ) => {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signInWithMagicLink: async (
    client: Client,
    { email, redirectTo }: { email: string; redirectTo?: string }
  ) => {
    const { data, error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) throw error
    return data
  },

  signUp: async (
    client: Client,
    {
      email,
      password,
      fullName,
      redirectTo,
    }: {
      email: string
      password: string
      fullName?: string
      redirectTo?: string
    }
  ) => {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectTo,
      },
    })
    if (error) throw error
    return data
  },

  signOut: async (client: Client) => {
    const { error } = await client.auth.signOut()
    if (error) throw error
  },

  resetPassword: async (
    client: Client,
    { email, redirectTo }: { email: string; redirectTo?: string }
  ) => {
    const { data, error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    if (error) throw error
    return data
  },

  updatePassword: async (
    client: Client,
    { password }: { password: string }
  ) => {
    const { data, error } = await client.auth.updateUser({ password })
    if (error) throw error
    return data
  },

  signInWithOAuth: async (
    client: Client,
    {
      provider,
      redirectTo,
    }: {
      provider: 'google' | 'github' | 'apple'
      redirectTo?: string
    }
  ) => {
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })
    if (error) throw error
    return data
  },
}

/**
 * Profile mutations
 */
export const profileMutations = {
  update: async (
    client: Client,
    { id, data }: { id: string; data: UpdateTables<'profiles'> }
  ) => {
    const { data: profile, error } = await client
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return profile
  },

  updateAvatar: async (
    client: Client,
    { id, file }: { id: string; file: File }
  ) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${id}/${crypto.randomUUID()}.${fileExt}`

    // Upload file
    const { error: uploadError } = await client.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) throw uploadError

    // Store the storage path, not a URL — the bucket is private and signed
    // URLs expire. Resolve to a URL at read time via useAvatarUrl().
    const { data: profile, error: updateError } = await client
      .from('profiles')
      .update({ avatar_url: fileName })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError
    return profile
  },
}
