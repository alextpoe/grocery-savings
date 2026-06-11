/**
 * DB smoke test — `pnpm verify:db`
 *
 * Proves the schema, RLS policies, and the packages/api query shapes actually
 * work against a real local Supabase instance. TypeScript cannot catch wrong
 * column names or broken policies; this can.
 *
 * Requires `supabase start` (fails fast with instructions if it isn't running).
 */
import { execSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

function fail(msg) {
  console.error(`\n✗ verify:db failed — ${msg}`)
  process.exit(1)
}

function ok(msg) {
  console.log(`✓ ${msg}`)
}

// --- 1. Get local Supabase credentials ---------------------------------
let statusEnv
try {
  statusEnv = execSync('supabase status -o env', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
} catch {
  fail(
    'local Supabase is not running. Run `supabase start`, then `pnpm verify:db` again.'
  )
}

const envVal = (key) =>
  statusEnv.match(new RegExp(`^${key}="?([^"\n]+)"?$`, 'm'))?.[1]
const url = envVal('API_URL')
const anonKey = envVal('ANON_KEY')
const serviceKey = envVal('SERVICE_ROLE_KEY')
if (!url || !anonKey || !serviceKey)
  fail('could not parse `supabase status -o env` output.')

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
const run = `smoke-${Date.now()}`
const createdUserIds = []

async function createUser(label) {
  const email = `${run}-${label}@example.com`
  const password = 'smoke-test-password-123'
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Smoke ${label}` },
  })
  if (error) fail(`could not create test user: ${error.message}`)
  createdUserIds.push(data.user.id)
  const client = createClient(url, anonKey, { auth: { persistSession: false } })
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError) fail(`could not sign in test user: ${signInError.message}`)
  return { client, id: data.user.id }
}

async function cleanup() {
  for (const id of createdUserIds) {
    await admin.auth.admin.deleteUser(id).catch(() => {})
  }
}

try {
  // --- 2. Signup trigger created a profile row --------------------------
  const alice = await createUser('alice')
  const { data: aliceProfile, error: profileError } = await alice.client
    .from('profiles')
    .select('*')
    .eq('id', alice.id)
    .single()
  if (profileError) fail(`reading own profile: ${profileError.message}`)
  if (!aliceProfile?.email?.startsWith(run))
    fail('handle_new_user trigger did not populate profile')
  ok('signup trigger creates profile; own-profile SELECT policy works')

  // --- 3. Profile update (mirrors profileMutations.update) ---------------
  const { data: updated, error: updateError } = await alice.client
    .from('profiles')
    .update({ full_name: 'Smoke Updated' })
    .eq('id', alice.id)
    .select()
    .single()
  if (updateError) fail(`updating own profile: ${updateError.message}`)
  if (updated.full_name !== 'Smoke Updated')
    fail('profile update did not persist')
  ok('own-profile UPDATE policy works')

  // --- 4. RLS negative test: Bob must not see Alice ----------------------
  const bob = await createUser('bob')
  const { data: crossRead } = await bob.client
    .from('profiles')
    .select('*')
    .eq('id', alice.id)
  if (crossRead && crossRead.length > 0)
    fail("RLS BREACH: a user can read another user's profile")
  ok('RLS blocks cross-user profile reads')

  // --- 5. Storage: private bucket upload + signed URL --------------------
  const path = `${alice.id}/${crypto.randomUUID()}.txt`
  const { error: uploadError } = await alice.client.storage
    .from('avatars')
    .upload(path, new Blob(['smoke']), { upsert: true })
  if (uploadError) fail(`avatar upload: ${uploadError.message}`)
  const { data: signed, error: signError } = await alice.client.storage
    .from('avatars')
    .createSignedUrl(path, 60)
  if (signError || !signed?.signedUrl)
    fail(`createSignedUrl: ${signError?.message}`)
  const res = await fetch(signed.signedUrl)
  if (!res.ok) fail(`signed URL fetch returned ${res.status}`)
  await alice.client.storage.from('avatars').remove([path])
  ok('avatars bucket: per-user upload + signed URL retrieval work')

  console.log(
    '\n✓ verify:db passed — schema, RLS, and storage behave as expected'
  )
} finally {
  await cleanup()
}
