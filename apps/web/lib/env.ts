import { z } from 'zod'

/**
 * Validated environment variables. Add new vars here, not as bare
 * `process.env.X!` assertions — a missing var should fail loudly at startup.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so each must be referenced
 * explicitly (no dynamic `process.env[key]` access).
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
})

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
})

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}\n` +
      'Did you symlink .env.local? (ln -sf ../../.env.local apps/web/.env.local)'
  )
}

export const env = parsed.data
