'use client'

import { type SupabaseClient } from '@supabase/supabase-js'
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { createContext, useContext } from 'react'

import {
  authMutations,
  mealPlanMutations,
  preferencesMutations,
  profileMutations,
} from '../mutations'
import {
  authQueries,
  mealPlanQueries,
  preferencesQueries,
  profileQueries,
  recipeTemplateQueries,
  saleItemQueries,
  storageQueries,
  storeQueries,
} from '../queries'
import { type Database, type Profile, type UpdateTables } from '../types'

type Client = SupabaseClient<Database>

/**
 * Helper to extract the return type of a query factory function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryData<T extends (...args: any) => any> = Awaited<
  ReturnType<ReturnType<T>['queryFn']>
>

/**
 * Supabase client context
 * Must be provided by platform-specific implementations
 */
const SupabaseContext = createContext<Client | null>(null)

export const SupabaseProvider = SupabaseContext.Provider

export function useSupabase(): Client {
  const client = useContext(SupabaseContext)
  if (!client) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return client
}

/**
 * Auth hooks
 */
export function useSession(
  options?: Omit<
    UseQueryOptions<QueryData<typeof authQueries.session>>,
    'queryKey' | 'queryFn'
  >
) {
  const client = useSupabase()
  const query = authQueries.session()

  return useQuery({
    ...options,
    queryKey: query.queryKey,
    queryFn: () => query.queryFn(client),
  })
}

export function useUser(
  options?: Omit<
    UseQueryOptions<QueryData<typeof authQueries.user>>,
    'queryKey' | 'queryFn'
  >
) {
  const client = useSupabase()
  const query = authQueries.user()

  return useQuery({
    ...options,
    queryKey: query.queryKey,
    queryFn: () => query.queryFn(client),
  })
}

export function useSignIn(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof authMutations.signInWithEmail>>,
    Error,
    { email: string; password: string }
  >
) {
  const client = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (vars) => authMutations.signInWithEmail(client, vars),
    onSuccess: (data, vars, ...args) => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      options?.onSuccess?.(data, vars, ...args)
    },
  })
}

export function useSignUp(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof authMutations.signUp>>,
    Error,
    { email: string; password: string; fullName?: string; redirectTo?: string }
  >
) {
  const client = useSupabase()

  return useMutation({
    ...options,
    mutationFn: (vars) => authMutations.signUp(client, vars),
  })
}

export function useSignOut(options?: UseMutationOptions<void, Error, void>) {
  const client = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: () => authMutations.signOut(client),
    onSuccess: (data, vars, ...args) => {
      queryClient.clear()
      options?.onSuccess?.(data, vars, ...args)
    },
  })
}

export function useResetPassword(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof authMutations.resetPassword>>,
    Error,
    { email: string; redirectTo?: string }
  >
) {
  const client = useSupabase()

  return useMutation({
    ...options,
    mutationFn: (vars) => authMutations.resetPassword(client, vars),
  })
}

/**
 * Profile hooks
 */
export function useProfile(
  id: string,
  options?: Omit<UseQueryOptions<Profile>, 'queryKey' | 'queryFn'>
) {
  const client = useSupabase()
  const query = profileQueries.detail(id)

  return useQuery({
    ...options,
    queryKey: query.queryKey,
    queryFn: () => query.queryFn(client),
  })
}

export function useCurrentProfile(
  options?: Omit<UseQueryOptions<Profile | null>, 'queryKey' | 'queryFn'>
) {
  const client = useSupabase()
  const query = profileQueries.current()

  return useQuery({
    ...options,
    queryKey: query.queryKey,
    queryFn: () => query.queryFn(client),
  })
}

export function useUpdateProfile(
  options?: UseMutationOptions<
    Profile,
    Error,
    { id: string; data: UpdateTables<'profiles'> }
  >
) {
  const client = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (vars) => profileMutations.update(client, vars),
    onSuccess: (data, vars, ...args) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      options?.onSuccess?.(data, vars, ...args)
    },
  })
}

/**
 * Resolve profile.avatar_url (external URL or private-bucket storage path)
 * to a displayable URL. Returns null while loading or when unset.
 */
export function useAvatarUrl(
  value: string | null | undefined,
  options?: Omit<UseQueryOptions<string | null>, 'queryKey' | 'queryFn'>
) {
  const client = useSupabase()
  const query = storageQueries.avatarUrl(value ?? null)

  return useQuery({
    ...options,
    queryKey: query.queryKey,
    queryFn: () => query.queryFn(client),
  })
}

export function useUpdateAvatar(
  options?: UseMutationOptions<Profile, Error, { id: string; file: File }>
) {
  const client = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (vars) => profileMutations.updateAvatar(client, vars),
    onSuccess: (data, vars, ...args) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      options?.onSuccess?.(data, vars, ...args)
    },
  })
}

/**
 * Grocery reference-data hooks (public; no auth required)
 */
export function useStores(
  zip: string,
  radiusMiles: number,
  options?: Omit<
    UseQueryOptions<QueryData<typeof storeQueries.byZipRadius>>,
    'queryKey' | 'queryFn'
  >
) {
  const client = useSupabase()
  const query = storeQueries.byZipRadius(zip, radiusMiles)

  return useQuery({
    enabled: /^\d{5}$/.test(zip),
    ...options,
    queryKey: query.queryKey,
    queryFn: () => query.queryFn(client),
  })
}

export function useSaleItems(
  storeIds: string[],
  options?: Omit<
    UseQueryOptions<QueryData<typeof saleItemQueries.byStores>>,
    'queryKey' | 'queryFn'
  >
) {
  const client = useSupabase()
  const query = saleItemQueries.byStores(storeIds)

  return useQuery({
    enabled: storeIds.length > 0,
    ...options,
    queryKey: query.queryKey,
    queryFn: () => query.queryFn(client),
  })
}

export function useRecipeTemplates(
  options?: Omit<
    UseQueryOptions<QueryData<typeof recipeTemplateQueries.all>>,
    'queryKey' | 'queryFn'
  >
) {
  const client = useSupabase()
  const query = recipeTemplateQueries.all()

  return useQuery({
    ...options,
    queryKey: query.queryKey,
    queryFn: () => query.queryFn(client),
  })
}

/**
 * Grocery user-data hooks (user-scoped; null/empty when logged out)
 */
export function usePreferences(
  options?: Omit<
    UseQueryOptions<QueryData<typeof preferencesQueries.current>>,
    'queryKey' | 'queryFn'
  >
) {
  const client = useSupabase()
  const query = preferencesQueries.current()

  return useQuery({
    ...options,
    queryKey: query.queryKey,
    queryFn: () => query.queryFn(client),
  })
}

export function useUpsertPreferences(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof preferencesMutations.upsert>>,
    Error,
    Parameters<typeof preferencesMutations.upsert>[1]
  >
) {
  const client = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (vars) => preferencesMutations.upsert(client, vars),
    onSuccess: (data, vars, ...args) => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
      options?.onSuccess?.(data, vars, ...args)
    },
  })
}

export function useSavedMealPlans(
  options?: Omit<
    UseQueryOptions<QueryData<typeof mealPlanQueries.list>>,
    'queryKey' | 'queryFn'
  >
) {
  const client = useSupabase()
  const query = mealPlanQueries.list()

  return useQuery({
    ...options,
    queryKey: query.queryKey,
    queryFn: () => query.queryFn(client),
  })
}

export function useSaveMealPlan(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof mealPlanMutations.save>>,
    Error,
    Parameters<typeof mealPlanMutations.save>[1]
  >
) {
  const client = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (vars) => mealPlanMutations.save(client, vars),
    onSuccess: (data, vars, ...args) => {
      queryClient.invalidateQueries({ queryKey: ['meal-plans'] })
      options?.onSuccess?.(data, vars, ...args)
    },
  })
}
