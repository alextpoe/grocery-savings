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

  // --- 6. Reference data readable: stores, sale_items, recipe_templates ----
  const { data: stores, error: storesError } = await alice.client
    .from('stores')
    .select('*')
  if (storesError) fail(`reading stores: ${storesError.message}`)
  if (!stores || stores.length !== 3)
    fail(`expected 3 stores, got ${stores?.length ?? 0}`)

  const { data: saleItems, error: saleItemsError } = await alice.client
    .from('sale_items')
    .select('*')
  if (saleItemsError) fail(`reading sale_items: ${saleItemsError.message}`)
  if (!saleItems || saleItems.length < 40)
    fail(`expected >= 40 sale_items, got ${saleItems?.length ?? 0}`)

  const { data: recipes, error: recipesError } = await alice.client
    .from('recipe_templates')
    .select('*')
  if (recipesError) fail(`reading recipe_templates: ${recipesError.message}`)
  if (!recipes || recipes.length < 15)
    fail(`expected >= 15 recipe_templates, got ${recipes?.length ?? 0}`)

  ok('reference data readable: stores/sale_items/recipe_templates seeded and SELECT policies work')

  // --- 7. Reference data is read-only (RLS blocks client inserts) -----------
  const fakeStoreId = '00000000-0000-0000-0000-000000000001'
  const { error: insertError } = await alice.client
    .from('sale_items')
    .insert({
      store_id: fakeStoreId,
      name: 'smoke test item',
      category: 'other',
      ingredient_key: 'smoke_test',
      regular_price: 1.00,
      sale_price: 0.50,
      unit: 'each',
      servings_per_unit: 1,
      dietary_flags: [],
      sale_starts_at: '2024-01-01',
      sale_ends_at: '2030-12-31',
    })
  if (!insertError)
    fail('RLS BREACH: client can write to reference table sale_items')
  ok('reference tables are read-only to clients')

  // --- 8. user_preferences RLS: own-row upsert works; cross-user blocked ----
  const { error: upsertPrefError } = await alice.client
    .from('user_preferences')
    .upsert({ user_id: alice.id, zip: '45208', dietary_restrictions: ['dairy_free'] })
  if (upsertPrefError) fail(`alice upsert user_preferences: ${upsertPrefError.message}`)

  const { data: alicePrefs, error: readPrefError } = await alice.client
    .from('user_preferences')
    .select('*')
    .eq('user_id', alice.id)
    .single()
  if (readPrefError) fail(`alice read own user_preferences: ${readPrefError.message}`)
  if (alicePrefs?.zip !== '45208')
    fail(`user_preferences zip mismatch: expected 45208, got ${alicePrefs?.zip}`)

  const { data: bobSeesAlicePrefs } = await bob.client
    .from('user_preferences')
    .select('*')
    .eq('user_id', alice.id)
  if (bobSeesAlicePrefs && bobSeesAlicePrefs.length > 0)
    fail('RLS BREACH: bob can read alice\'s user_preferences')
  ok('user_preferences: own-row upsert works; cross-user read blocked')

  // --- 9. saved_meal_plans RLS: own-row insert works; cross-user blocked ----
  const { data: insertedPlan, error: insertPlanError } = await alice.client
    .from('saved_meal_plans')
    .insert({ user_id: alice.id, title: 'smoke plan', plan: { meals: [] } })
    .select()
    .single()
  if (insertPlanError) fail(`alice insert saved_meal_plans: ${insertPlanError.message}`)

  const { data: alicePlan, error: readPlanError } = await alice.client
    .from('saved_meal_plans')
    .select('*')
    .eq('id', insertedPlan.id)
    .single()
  if (readPlanError) fail(`alice read own saved_meal_plans: ${readPlanError.message}`)
  if (alicePlan?.title !== 'smoke plan')
    fail(`saved_meal_plans title mismatch: expected 'smoke plan', got '${alicePlan?.title}'`)

  const { data: bobSeesPlan } = await bob.client
    .from('saved_meal_plans')
    .select('*')
    .eq('user_id', alice.id)
  if (bobSeesPlan && bobSeesPlan.length > 0)
    fail('RLS BREACH: bob can read alice\'s saved_meal_plans')
  ok('saved_meal_plans: own-row insert works; cross-user read blocked')

  console.log(
    '\n✓ verify:db passed — schema, RLS, and storage behave as expected'
  )
} finally {
  await cleanup()
}
