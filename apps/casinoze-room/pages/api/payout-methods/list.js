/**
 * GET /api/payout-methods/list
 *
 * The signed-in player's own payout methods — where their withdrawals are
 * sent. The profile page has always called this; it was never written, so
 * the list came back 404 and a player could not see or add one, which meant
 * they could not withdraw at all.
 *
 * The user id comes from the verified token, never from the request, so a
 * player can only ever see their own.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { data, error } = await supabaseAdmin
    .from('player_payout_methods')
    .select('id, type, label, account_last4, is_active, created_at')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[payout-methods/list]', error)
    return res.status(500).json({ error: 'Could not load your payout methods' })
  }

  return res.status(200).json({ methods: data || [] })
}
