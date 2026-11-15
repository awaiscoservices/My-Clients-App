/**
 * GET /api/player/signup-bonus
 *
 * Single source of truth for the first-deposit "Signup Bonus". Returns the
 * tenant's configured % and whether THIS player still qualifies (they qualify
 * until their first deposit exists). The deposit page, payment-method badges
 * and the home banner all read this, so the number is the same everywhere and
 * changes the moment an admin changes it.
 *
 *   → { eligible, pct, active }
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

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile) return res.status(200).json({ eligible: false, pct: 0, active: false })

  const [{ data: cfg }, { count: approvedCount }] = await Promise.all([
    supabaseAdmin.from('signup_bonus_config').select('pct, is_active').eq('tenant_id', profile.tenant_id).maybeSingle(),
    supabaseAdmin.from('deposits').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'approved'),
  ])

  const pct = parseFloat(cfg?.pct || 0) || 0
  const active = !!cfg?.is_active && pct > 0
  // Qualifies until the player's FIRST deposit is approved. A rejected first
  // attempt leaves the signup bonus unclaimed, so it still applies next time.
  const eligible = active && (approvedCount || 0) === 0

  return res.status(200).json({ eligible, pct, active })
}
