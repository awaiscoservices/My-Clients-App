/**
 * POST /api/player/promo/claim
 * Claim a direct-wallet promo (type 'wallet'). Credits reward_cents straight
 * to the player's Bonus balance — no deposit, no payment system involved.
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

  const { code } = req.body || {}
  const { data: profile } = await db.from('profiles').select('tenant_id, status').eq('id', user.id).single()
  if (!profile) return res.status(404).json({ error: 'Profile not found' })
  if (profile.status !== 'active') return res.status(403).json({ error: 'Account is not active' })

  const tenantId = profile.tenant_id
  const result = await validatePromo(db, { userId: user.id, tenantId, code, requireType: 'wallet' })
  if (result.error) return res.status(400).json({ error: result.error })
  const { promo, bonus_cents } = result
  if (bonus_cents <= 0) return res.status(400).json({ error: 'This promo has no reward configured' })

  // Credit the Bonus balance with an optimistic lock.
  const { data: wallet, error: wErr } = await db.from('wallets').select('*').eq('user_id', user.id).single()
  if (wErr || !wallet) return res.status(500).json({ error: 'Wallet not found' })

  const newBonus = wallet.bonus_balance_cents + bonus_cents
  const { data: updated, error: uErr } = await db.from('wallets')
    .update({
      bonus_balance_cents: newBonus,
      total_bonus_cents: (wallet.total_bonus_cents || 0) + bonus_cents,
      version: wallet.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', wallet.id).eq('version', wallet.version)
    .select().single()
  if (uErr || !updated) return res.status(409).json({ error: 'Please try again' })

  // Record the redemption and bump usage.
  await db.from('promo_redemptions').insert({
    tenant_id: tenantId, promotion_id: promo.id, user_id: user.id,
    kind: 'wallet', bonus_cents,
  })
  await db.from('promotions').update({ current_uses: (promo.current_uses || 0) + 1 }).eq('id', promo.id)

  await db.from('ledger').insert({
    tenant_id: tenantId, user_id: user.id,
    type: 'promotion_credit', wallet_bucket: 'bonus',
    amount_cents: bonus_cents, direction: 'credit',
    balance_after_cents: newBonus,
    description: `Promo ${promo.code} claimed`,
    idempotency_key: `promo-claim-${promo.id}-${user.id}-${Date.now()}`,
    metadata: { promo_id: promo.id, code: promo.code },
  }).then(() => {}, () => {})

  await db.from('notifications').insert({
    tenant_id: tenantId, user_id: user.id, type: 'bonus',
    title: '🎁 Promo Claimed!',
    message: `$${(bonus_cents / 100).toFixed(2)} bonus from code ${promo.code} has been added to your Bonus balance.`,
  }).then(() => {}, () => {})

  return res.status(200).json({ success: true, bonus_cents, code: promo.code })
}
