/**
 * POST /api/payout-methods/add   { type, label, account_last4 }
 *
 * Adds a place the player wants their withdrawals sent. Like list.js, this
 * was called by the profile page and never written, so adding one 404'd and
 * withdrawing was impossible.
 *
 * Only the last four digits are stored. Full account numbers are never sent
 * here and must never be: the player gives them to staff when the payout is
 * actually made.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// The same list the profile page offers.
const ALLOWED_TYPES = ['cashapp', 'venmo', 'zelle', 'paypal', 'bank_transfer', 'crypto', 'other']

const MAX_PER_PLAYER = 10

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { type, label, account_last4 } = req.body || {}

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Choose one of the listed payout types' })
  }
  if (!String(label || '').trim()) {
    return res.status(400).json({ error: 'Give this method a name so you can tell it apart' })
  }

  // Four digits at most, digits only — anything longer is someone pasting a
  // whole account number, which does not belong in this table.
  const last4 = String(account_last4 || '').replace(/\D/g, '').slice(-4) || null

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('status, tenant_id').eq('id', user.id).single()
  if (!profile || profile.status !== 'active') {
    return res.status(403).json({ error: 'Account is not active' })
  }

  const { count } = await supabaseAdmin
    .from('player_payout_methods')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('is_active', true)

  if ((count || 0) >= MAX_PER_PLAYER) {
    return res.status(409).json({ error: `You can keep up to ${MAX_PER_PLAYER} payout methods. Remove one first.` })
  }

  const { data, error } = await supabaseAdmin
    .from('player_payout_methods')
    .insert({
      user_id:       user.id,
      type,
      label:         String(label).trim().slice(0, 60),
      account_last4: last4,
      is_active:     true,
      // tenant_id defaults to the FIRST casino, so without this a player at
      // any other casino files their payout method under the wrong one.
      ...(profile.tenant_id ? { tenant_id: profile.tenant_id } : {}),
    })
    .select('id, type, label, account_last4, is_active, created_at')
    .single()

  if (error) {
    console.error('[payout-methods/add]', error)
    return res.status(500).json({ error: 'Could not add that payout method' })
  }

  return res.status(201).json({ method: data })
}
