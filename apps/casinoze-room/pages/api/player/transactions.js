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

  const { page = '1', limit = '20', type = '' } = req.query
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(50, parseInt(limit))
  const offset = (pageNum - 1) * limitNum

  let query = supabaseAdmin
    .from('ledger')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limitNum - 1)

  if (type) query = query.eq('type', type)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })

  // Also fetch pending deposits, withdrawals, loads, redemptions for status
  const [{ data: deposits }, { data: withdrawals }, { data: loads }, { data: redemptions }] = await Promise.all([
    supabaseAdmin.from('deposits').select('id, reference_id, status, amount_cents, payment_method_name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('withdrawals').select('id, reference_id, status, amount_cents, payout_method_label, payout_method_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('game_loads').select('id, reference_id, status, amount_cents, game_panel_name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('redemptions').select('id, reference_id, status, amount_cents, game_panel_name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ])

  return res.status(200).json({
    ledger: data || [],
    total: count || 0,
    page: pageNum,
    pages: Math.ceil((count || 0) / limitNum),
    pending: {
      deposits: (deposits || []).filter(d => d.status === 'pending'),
      withdrawals: (withdrawals || []).filter(w => w.status === 'pending'),
      loads: (loads || []).filter(l => l.status === 'pending'),
      redemptions: (redemptions || []).filter(r => r.status === 'pending'),
    },
    recent: {
      deposits: deposits || [],
      withdrawals: withdrawals || [],
      loads: loads || [],
      redemptions: redemptions || [],
    },
  })
}
