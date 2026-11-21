/**
 * GET /api/player/bonus-rate
 *
 * The single Bonus⇄Cash exchange rate, read from the admin's universal
 * bonus_balance_config.redeemable_pct. The wallet Transfer modal uses it to
 * preview conversions; the actual move is done server-side by the
 * transfer_wallet RPC, which re-reads the same value (the source of truth).
 *
 *   → { pct }   // e.g. 15  (meaning bonus is worth 15% of cash)
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { data } = await supabaseAdmin
    .from('bonus_balance_config')
    .select('redeemable_pct')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const pct = parseFloat(data?.redeemable_pct || 0) || 0
  return res.status(200).json({ pct })
}
