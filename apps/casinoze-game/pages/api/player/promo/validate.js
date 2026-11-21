/**
 * POST /api/player/promo/validate
 * Checks a promo code for the signed-in player. Used by the deposit box
 * (type 'deposit', with amount) and the Claim Promo modal (type 'wallet').
 * Read-only — credits nothing.
 */
import { createClient } from '@supabase/supabase-js'
import { validatePromo } from '../../../../lib/promoServer'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const { data: { user }, error: authErr } = await db.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { code, amount_cents = 0, require_type = null } = req.body || {}
  const { data: profile } = await db.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile) return res.status(404).json({ error: 'Profile not found' })

  const result = await validatePromo(db, {
    userId: user.id, tenantId: profile.tenant_id, code,
    amountCents: Number(amount_cents) || 0, requireType: require_type,
  })
  if (result.error) return res.status(400).json({ error: result.error })

  const { promo, bonus_cents } = result
  return res.status(200).json({
    valid: true,
    promo: {
      id: promo.id, code: promo.code, name: promo.name, type: promo.type,
      percent: promo.type === 'deposit' ? Number(promo.bonus_value) : null,
      reward_cents: promo.type === 'wallet' ? promo.reward_cents : null,
    },
    bonus_cents,
  })
}
