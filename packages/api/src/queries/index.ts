import { type RecipeSlot, type RecipeTemplate } from '@grocery-savings/utils/matching'
import { type SupabaseClient } from '@supabase/supabase-js'

import { seedSaleDataProvider } from '../providers'
import { type RecipeTemplateRow } from '../types'
import { type Database } from '../types/database'

type Client = SupabaseClient<Database>

/**
 * Map a `recipe_templates` row into the matching contract `RecipeTemplate`
 * shape (snake_case → camelCase; `slots` jsonb cast to RecipeSlot[]).
 */
function mapRecipeTemplate(row: RecipeTemplateRow): RecipeTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    dietaryTags: row.dietary_tags,
    servings: row.servings,
    instructions: row.instructions,
    slots: (row.slots as unknown as RecipeSlot[]) ?? [],
    assumedStaples: row.assumed_staples,
  }
}

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

/**
 * Store queries — reference data sourced through the SaleDataProvider adapter.
 */
export const storeQueries = {
  byZipRadius: (zip: string, radiusMiles: number) => ({
    queryKey: ['stores', zip, radiusMiles] as const,
    queryFn: (client: Client) =>
      seedSaleDataProvider.getStores(client, { zip, radiusMiles }),
  }),
}

/**
 * Sale-item queries — reference data sourced through the SaleDataProvider.
 */
export const saleItemQueries = {
  byStores: (storeIds: string[]) => ({
    queryKey: ['sale-items', ...storeIds] as const,
    queryFn: (client: Client) =>
      seedSaleDataProvider.getSaleItems(client, { storeIds }),
  }),
}

/**
 * Recipe-template queries — reference data mapped to the matching contract.
 */
export const recipeTemplateQueries = {
  all: () => ({
    queryKey: ['recipe-templates'] as const,
    queryFn: async (client: Client) => {
      const { data, error } = await client
        .from('recipe_templates')
        .select('*')

      if (error) throw error
      return (data ?? []).map(mapRecipeTemplate)
    },
  }),
}

/**
 * User-preferences queries (user-scoped). Returns null when logged out or when
 * the signed-in user has no saved preferences row yet.
 */
export const preferencesQueries = {
  current: () => ({
    queryKey: ['preferences'] as const,
    queryFn: async (client: Client) => {
      const {
        data: { user },
      } = await client.auth.getUser()
      if (!user) return null

      const { data, error } = await client
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      return data
    },
  }),
}

/**
 * Saved meal-plan queries (user-scoped). Empty list when logged out.
 */
export const mealPlanQueries = {
  list: () => ({
    queryKey: ['meal-plans'] as const,
    queryFn: async (client: Client) => {
      const {
        data: { user },
      } = await client.auth.getUser()
      if (!user) return []

      const { data, error } = await client
        .from('saved_meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
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
