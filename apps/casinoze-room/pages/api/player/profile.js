/**
 * GET /api/player/profile
 * Returns the authenticated player's full profile including wallet, level, and game accounts.
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

  const [profileRes, walletRes, gameAccountsRes] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, status, role, xp_points, current_level_id, my_referral_code, referral_code_used, referral_bonus_applied, created_at, player_levels(name, min_xp, max_xp, color, icon, perks)')
      .eq('id', user.id)
      .single(),
    supabaseAdmin
      .from('wallets')
      .select('cash_balance_cents, bonus_balance_cents')
      .eq('user_id', user.id)
      .single(),
    supabaseAdmin
      .from('game_accounts')
      .select('id, status, username, game_panel_id, game_panels(name)')
      .eq('user_id', user.id)
      .in('status', ['active', 'pending']),
  ])

  if (!profileRes.data) return res.status(404).json({ error: 'Profile not found' })

  const profile = profileRes.data
  const wallet = walletRes.data || {}

  // Next level info
  let nextLevel = null
  if (profile.current_level_id) {
    const { data: nl } = await supabaseAdmin
      .from('player_levels')
      .select('name, min_xp, color, icon')
      .gt('min_xp', profile.player_levels?.min_xp || 0)
      .order('min_xp', { ascending: true })
      .limit(1)
      .single()
    nextLevel = nl
  }

  return res.status(200).json({
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    status: profile.status,
    xp_points: profile.xp_points || 0,
    level: profile.player_levels,
    next_level: nextLevel,
    my_referral_code: profile.my_referral_code,
    cash_balance_cents: wallet.cash_balance_cents || 0,
    bonus_balance_cents: wallet.bonus_balance_cents || 0,
    game_accounts: (gameAccountsRes.data || []).map(ga => ({
      id: ga.id,
      status: ga.status,
      username: ga.username,
      game_name: ga.game_panels?.name,
    })),
    member_since: profile.created_at,
  })
}
