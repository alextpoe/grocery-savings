import { z } from 'zod'

/**
 * Validated environment variables. Add new vars here, not as bare
 * `process.env.X!` assertions — a missing var should fail loudly at startup.
 *
 * EXPO_PUBLIC_* values are inlined at build time, so each must be referenced
 * explicitly (no dynamic `process.env[key]` access).
 */
const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
})

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}\n` +
      'Set EXPO_PUBLIC_* vars in .env.local at the monorepo root.'
  )
}

export const env = parsed.data
