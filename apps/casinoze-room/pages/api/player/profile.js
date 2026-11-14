/**
 * GET /api/player/profile
 * Returns the authenticated player's full profile including wallet, level, and game accounts.
 * Level logic mirrors the Levels page (rewards.js): ordered by sort_order, current
 * by player_level_id, progress from total_xp vs xp_required thresholds.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Same default icon-per-level mapping the Levels page uses.
const LEVEL_ICONS = {
  bronze: 'medal', silver: 'medal', gold: 'medal', platinum: 'diamond',
  diamond: 'gem', elite: 'crown', master: 'flame', champion: 'zap', legend: 'trophy',
}
const iconFor = lvl => {
  if (!lvl) return 'star'
  // A plain alphabetic badge_icon is treated as an icon name; emojis/legacy fall back.
  if (lvl.badge_icon && /^[a-z]+$/i.test(lvl.badge_icon)) return lvl.badge_icon
  return LEVEL_ICONS[lvl.name?.toLowerCase()] || 'star'
}
const shape = lvl => lvl && ({
  name: lvl.name,
  color: lvl.accent_color || lvl.badge_color || '#fbbf24',
  icon: iconFor(lvl),
  min_xp: lvl.xp_required || 0,
  perks: lvl.perks || null,
})

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const [profileRes, walletRes, gameAccountsRes] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, username, kyc_status, status, role, total_xp, player_level_id, referral_code, tenant_id, created_at')
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

  // Only this player's own tenant's levels — names/sort_orders repeat across tenants.
  const { data: levelsData } = await supabaseAdmin
    .from('player_levels')
    .select('id, name, accent_color, badge_color, badge_icon, perks, xp_required, sort_order')
    .eq('is_active', true)
    .eq('tenant_id', profile.tenant_id)
    .order('sort_order', { ascending: true })
  const levels = levelsData || []

  const curIdx = levels.findIndex(l => l.id === profile.player_level_id)
  const current = curIdx >= 0 ? levels[curIdx] : null
  const next = curIdx >= 0 ? levels[curIdx + 1] : null

  return res.status(200).json({
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    username: profile.username,
    kyc_status: profile.kyc_status,
    status: profile.status,
    xp_points: profile.total_xp || 0,
    level: shape(current) || { name: 'Unranked', color: '#fbbf24', icon: 'star', min_xp: 0, perks: null },
    next_level: shape(next),
    my_referral_code: profile.referral_code,
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
