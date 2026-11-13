/**
 * GET /api/referrals/dashboard
 * Everything the player Referrals page needs, in one call:
 *  - the caller's own referral code
 *  - the list of people they referred (masked username, join date, deposit
 *    status, bonus earned from that referral)
 *  - headline stats (total referrals, total earned, deposited, awaiting deposit)
 *
 * Runs with the service role so it can read the referred players' profiles and
 * deposit counts, which the referrer cannot see under RLS.
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

  // My own code
  const { data: me } = await supabaseAdmin
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  // Everyone I referred
  const { data: refs } = await supabaseAdmin
    .from('referrals')
    .select('referred_id, reward_cents, reward_status, signed_up_at, created_at')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const rows = refs || []
  const referredIds = rows.map(r => r.referred_id).filter(Boolean)

  // Referred players' names + how many approved deposits each one has
  let nameById = {}
  let approvedByUser = {}
  if (referredIds.length) {
    const [{ data: profs }, { data: deps }] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, username, full_name').in('id', referredIds),
      supabaseAdmin.from('deposits').select('user_id').eq('status', 'approved').in('user_id', referredIds),
    ])
    for (const p of profs || []) nameById[p.id] = p.username || p.full_name || 'Player'
    for (const d of deps || []) approvedByUser[d.user_id] = (approvedByUser[d.user_id] || 0) + 1
  }

  const referrals = rows.map(r => {
    const deposits = approvedByUser[r.referred_id] || 0
    return {
      name:         maskName(nameById[r.referred_id] || 'Player'),
      joined_at:    r.signed_up_at || r.created_at,
      deposits,
      has_deposited: deposits > 0,
      earned_cents: r.reward_cents || 0,
      reward_status: r.reward_status,
    }
  })

  const stats = {
    total_referrals: referrals.length,
    total_earned_cents: referrals.reduce((s, r) => s + r.earned_cents, 0),
    deposited: referrals.filter(r => r.has_deposited).length,
    awaiting: referrals.filter(r => !r.has_deposited).length,
  }

  return res.status(200).json({ code: me?.referral_code || null, referrals, stats })
}

// Show the first few characters only, so a referrer can recognise their
// invitee without exposing the full username.
function maskName(name) {
  const n = String(name)
  if (n.length <= 3) return n
  return n.slice(0, 3) + '•'.repeat(Math.min(5, n.length - 3))
}
