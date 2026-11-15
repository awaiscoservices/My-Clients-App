/**
 * POST /api/auth/stamp-tenant
 *
 * Google OAuth can't carry our tenant_id into the new auth user, so the
 * handle_new_user DB trigger puts a brand-new Google signup in the default
 * casino. This moves that brand-new player — plus their wallet and KYC row —
 * to THIS deployment's casino.
 *
 * Safety: it only ever touches a player created in the last few minutes (i.e.
 * the OAuth that just ran). A returning player — who already belongs to a
 * casino — is never moved, which is correct for a single shared project where
 * one email = one player = one casino.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'
// How long after sign-up a profile still counts as "brand new".
const FRESH_WINDOW_MS = 10 * 60 * 1000

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || DEFAULT_TENANT_ID

  // Nothing to do for the default casino — the trigger already set it.
  if (tenantId === DEFAULT_TENANT_ID) {
    return res.status(200).json({ skipped: true, reason: 'default tenant' })
  }

  // Only move a genuinely new signup: the OAuth that just created this user.
  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
  if (!createdAt || Date.now() - createdAt > FRESH_WINDOW_MS) {
    return res.status(200).json({ skipped: true, reason: 'returning user' })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return res.status(404).json({ error: 'Profile not found' })
  if (profile.role !== 'player') return res.status(200).json({ skipped: true, reason: 'not a player' })

  // Only correct a profile still sitting in the default casino.
  if (profile.tenant_id && profile.tenant_id !== DEFAULT_TENANT_ID) {
    return res.status(200).json({ skipped: true, reason: 'already assigned' })
  }

  // Move the player and the rows the trigger created alongside them.
  await supabaseAdmin.from('profiles').update({ tenant_id: tenantId }).eq('id', user.id)
  await supabaseAdmin.from('wallets').update({ tenant_id: tenantId }).eq('user_id', user.id)
  await supabaseAdmin.from('kyc_records').update({ tenant_id: tenantId }).eq('user_id', user.id)

  return res.status(200).json({ ok: true, tenant_id: tenantId })
}
