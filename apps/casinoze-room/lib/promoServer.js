/**
 * Server-side promo validation (service-role client passed in).
 * Shared by /api/player/promo/validate, /api/player/promo/claim and
 * /api/deposit/submit so the rules never drift.
 *
 * Returns { promo, bonus_cents } on success, or { error } on failure.
 *  - type 'deposit': bonus_cents = floor(amount * percent/100), capped by
 *    max_bonus_cents; requires amount >= min_deposit_cents.
 *  - type 'wallet': bonus_cents = reward_cents (amount ignored).
 * Either way the credit belongs in the player's Bonus balance.
 */
export async function validatePromo(db, { userId, tenantId, code, amountCents = 0, requireType = null }) {
  const clean = (code || '').trim().toUpperCase()
  if (!clean) return { error: 'Enter a promo code' }

  const { data: promo } = await db.from('promotions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('code', clean)
    .in('type', ['deposit', 'wallet'])
    .maybeSingle()

  if (!promo) return { error: 'Invalid promo code' }
  if (!promo.is_active) return { error: 'This promo is not active' }
  if (requireType && promo.type !== requireType) {
    return { error: requireType === 'deposit' ? 'This code is a wallet promo — claim it from the home screen' : 'This code applies to deposits only' }
  }

  const now = Date.now()
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) return { error: 'This promo has not started yet' }
  if (promo.expires_at && new Date(promo.expires_at).getTime() < now) return { error: 'This promo has expired' }

  if (promo.max_uses_total != null && (promo.current_uses || 0) >= promo.max_uses_total) {
    return { error: 'This promo has reached its limit' }
  }
  if (promo.max_uses_per_player != null) {
    const { count } = await db.from('promo_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('promotion_id', promo.id).eq('user_id', userId)
    if ((count || 0) >= promo.max_uses_per_player) return { error: 'You have already used this promo' }
  }

  let bonus_cents = 0
  if (promo.type === 'deposit') {
    // Only enforce the minimum once an amount is known (the deposit box can
    // validate a code before the amount is entered by passing amountCents = 0).
    if (promo.min_deposit_cents && amountCents > 0 && amountCents < promo.min_deposit_cents) {
      return { error: `Minimum deposit for this promo is $${(promo.min_deposit_cents / 100).toFixed(2)}` }
    }
    bonus_cents = Math.floor(amountCents * (Number(promo.bonus_value || 0) / 100))
    if (promo.max_bonus_cents != null) bonus_cents = Math.min(bonus_cents, promo.max_bonus_cents)
  } else {
    bonus_cents = promo.reward_cents || 0
  }

  return { promo, bonus_cents }
}
