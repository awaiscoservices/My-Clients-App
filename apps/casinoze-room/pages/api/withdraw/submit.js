/**
 * POST /api/withdraw/submit
 *
 * NEW FILE — did not exist before.
 *
 * Flow:
 *  1. Authenticate player
 *  2. Validate input (payment_method_id, amount_cents, payout details)
 *  3. Check allow_withdraw = true on payment method  (Task 38)
 *  4. Check player status, level withdrawal limits, daily limits
 *  5. Task 40 — Bonus-to-cash conversion:
 *     Determine how much of the requested withdrawal must come from bonus_balance
 *     vs cash_balance based on player_bonuses.bonus_to_cash_percent (or
 *     player_levels.bonus_to_cash_pct as fallback).
 *     bonus_to_cash_percent is the % of bonus that converts to withdrawable cash.
 *  6. Check withdrawable_cents covers amount
 *  7. Reserve funds (pending state) — admin approves to finalise
 *  8. Create withdrawal record + ledger entry + notification
 *
 * Security rules:
 *  - SUPABASE_SERVICE_ROLE_KEY server-side only, never sent to browser
 *  - All amounts integer cents, all calculations server-side
 *  - Ledger is append-only
 *  - Idempotency key prevents double-submit
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ── Authenticate ──────────────────────────────────────────────────────────
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  // Payout details are given with each withdrawal now, not chosen from a
  // list saved on the player's profile. Where the money goes can change
  // between one payout and the next, and a stale saved account is how money
  // gets sent to the wrong place.
  const {
    payment_method_id,
    amount_cents,
    destination,        // the tag, address or account the player wants paying
    qr_path,            // optional QR image, uploaded first
    idempotency_key,
  } = req.body

  // ── Input validation ──────────────────────────────────────────────────────
  if (!payment_method_id)
    return res.status(400).json({ error: 'Payment method is required' })
  if (!amount_cents || typeof amount_cents !== 'number' || amount_cents <= 0 || !Number.isInteger(amount_cents))
    return res.status(400).json({ error: 'Invalid amount (must be positive integer cents)' })
  // Staff need somewhere to send it: either typed details or a QR image.
  if (!String(destination || '').trim() && !qr_path)
    return res.status(400).json({ error: 'Enter your payout details, or upload a QR code' })
  if (!idempotency_key)
    return res.status(400).json({ error: 'Idempotency key is required' })

  // ── Idempotency ───────────────────────────────────────────────────────────
  const { data: existing } = await supabaseAdmin
    .from('withdrawals')
    .select('id, reference_id, status')
    .eq('idempotency_key', idempotency_key)
    .single()

  if (existing) {
    return res.status(200).json({
      message: 'Withdrawal already submitted',
      withdrawal: existing,
      duplicate: true,
    })
  }

  // ── Load payment method ───────────────────────────────────────────────────
  // payment_methods has min_deposit_cents and max_deposit_cents. It has no
  // withdrawal limits — those belong to the player's level, and are applied
  // below. Asking for columns that do not exist made PostgREST reject the
  // whole query, which this code then reported as "Payment method not
  // found" — for a method the dropdown had just listed.
  const { data: method, error: methodError } = await supabaseAdmin
    .from('payment_methods')
    .select('id, name, is_active, allow_withdraw')
    .eq('id', payment_method_id)
    .single()

  if (methodError) {
    console.error('[withdraw/submit] method lookup failed:', methodError)
    return res.status(500).json({ error: 'Could not check that payment method' })
  }
  if (!method) return res.status(400).json({ error: 'Payment method not found' })
  if (!method.is_active)
    return res.status(400).json({ error: 'Payment method is not active' })

  // ── Task 38: allow_withdraw check ─────────────────────────────────────────
  if (!method.allow_withdraw)
    return res.status(400).json({ error: 'Withdrawals are not currently accepted via this payment method' })

  // The minimum and maximum for a single withdrawal come from the player's
  // level, applied below. There were checks here against columns the
  // payment_methods table does not have.

  // ── Load profile + level ──────────────────────────────────────────────────
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('status, player_level_id, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active')
    return res.status(403).json({ error: 'Account is not active' })

  const { data: level } = await supabaseAdmin
    .from('player_levels')
    .select('min_withdrawal_cents, max_withdrawal_cents, max_daily_withdrawal_cents, bonus_to_cash_pct')
    .eq('id', profile.player_level_id)
    .single()

  // Level-based limits (take level limits over method limits when stricter)
  if (level?.min_withdrawal_cents && amount_cents < level.min_withdrawal_cents)
    return res.status(400).json({ error: `Your level requires a minimum withdrawal of $${(level.min_withdrawal_cents / 100).toFixed(2)}` })
  if (level?.max_withdrawal_cents && amount_cents > level.max_withdrawal_cents)
    return res.status(400).json({ error: `Your level allows a maximum withdrawal of $${(level.max_withdrawal_cents / 100).toFixed(2)}` })

  // ── Daily withdrawal limit ────────────────────────────────────────────────
  if (level?.max_daily_withdrawal_cents) {
    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)

    const { data: todayWithdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('amount_cents')
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved'])
      .gte('created_at', startOfDay.toISOString())

    const usedToday = (todayWithdrawals || []).reduce((s, w) => s + w.amount_cents, 0)
    if (usedToday + amount_cents > level.max_daily_withdrawal_cents) {
      const remaining = level.max_daily_withdrawal_cents - usedToday
      return res.status(400).json({
        error: remaining > 0
          ? `Daily withdrawal limit reached. You can withdraw up to $${(remaining / 100).toFixed(2)} more today.`
          : 'You have reached your daily withdrawal limit.',
      })
    }
  }

  // ── Task 40: Bonus-to-cash conversion ─────────────────────────────────────
  // Load wallet
  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('cash_balance_cents, bonus_balance_cents, withdrawable_cents')
    .eq('user_id', user.id)
    .single()

  if (!wallet)
    return res.status(400).json({ error: 'Wallet not found' })

  // bonus_to_cash_pct from player_levels: what % of bonus converts to cash on withdrawal
  // e.g. 50 → 50% of bonus_balance converts to withdrawable cash
  const bonusToCashPct = level?.bonus_to_cash_pct
    ? parseFloat(level.bonus_to_cash_pct)
    : 0

  // Calculate how much bonus converts to withdrawable cash right now
  const bonusConvertibleCents = Math.floor(wallet.bonus_balance_cents * (bonusToCashPct / 100))
  const effectiveCashAvailable = wallet.cash_balance_cents + bonusConvertibleCents

  if (amount_cents > effectiveCashAvailable) {
    return res.status(400).json({
      error: `Insufficient funds. Available for withdrawal: $${(effectiveCashAvailable / 100).toFixed(2)}`,
      cash_balance_cents: wallet.cash_balance_cents,
      bonus_convertible_cents: bonusConvertibleCents,
      effective_available_cents: effectiveCashAvailable,
    })
  }

  // Split: how much comes from cash vs bonus conversion
  let cash_deduct_cents  = 0
  let bonus_deduct_cents = 0

  if (amount_cents <= wallet.cash_balance_cents) {
    // Enough cash — no bonus conversion needed
    cash_deduct_cents = amount_cents
  } else {
    // Use all available cash first, then convert bonus to cover the rest
    cash_deduct_cents  = wallet.cash_balance_cents
    const shortfall    = amount_cents - cash_deduct_cents
    // bonus_deduct removes from bonus_balance; we convert at bonusToCashPct
    // shortfall = bonus_deduct * (bonusToCashPct/100)
    // → bonus_deduct = ceil(shortfall / (bonusToCashPct/100))
    bonus_deduct_cents = bonusToCashPct > 0
      ? Math.ceil(shortfall / (bonusToCashPct / 100))
      : 0
  }

  // ── Create withdrawal record ──────────────────────────────────────────────
  const { data: withdrawal, error: wError } = await supabaseAdmin
    .from('withdrawals')
    .insert({
      user_id:              user.id,
      payment_method_id,
      amount_cents,
      cash_deduct_cents,
      bonus_deduct_cents,
      bonus_to_cash_pct_applied: bonusToCashPct,
      // What staff need to pay this out, captured at the moment it was asked
      // for. `player_notes` was written here and is not a column on this
      // table, so this insert could never have succeeded.
      method:               method.name,
      destination:          String(destination || '').trim() || null,
      payout_label:         method.name,
      // Its own column, not proof_screenshot_url: that one holds the proof
      // staff upload when they pay, so putting the player's QR there meant
      // approving a withdrawal erased the thing it was paid to.
      payout_qr_url:        qr_path || null,
      status:               'pending',
      idempotency_key,
      // Defaults to the first casino, so without this every other casino's
      // withdrawals would be filed under it.
      ...(profile?.tenant_id ? { tenant_id: profile.tenant_id } : {}),
    })
    .select()
    .single()

  if (wError) {
    console.error('[withdraw/submit] insert error:', wError)
    return res.status(500).json({ error: 'Failed to create withdrawal request' })
  }

  // ── Reserve funds from wallet (pending state) ─────────────────────────────
  // Deduct from cash and bonus balances; admin approval will finalise
  const { error: walletErr } = await supabaseAdmin.rpc('reserve_withdrawal', {
    p_user_id:           user.id,
    p_cash_cents:        cash_deduct_cents,
    p_bonus_cents:       bonus_deduct_cents,
    p_withdrawal_id:     withdrawal.id,
  }).then(r => r, e => ({ error: e }))

  if (walletErr) {
    // Roll back the withdrawal record if wallet reservation fails
    await supabaseAdmin.from('withdrawals').delete().eq('id', withdrawal.id)
    console.error('[withdraw/submit] wallet reservation error:', walletErr)
    return res.status(500).json({ error: 'Failed to reserve withdrawal funds' })
  }

  // ── Append-only ledger entry ──────────────────────────────────────────────
  await supabaseAdmin.from('ledger').insert({
    // Without the casino, this row is invisible to every scoped read and the
    // casino's own staff never see the movement.
    tenant_id:      profile?.tenant_id || null,
    user_id:        user.id,
    type:           'withdrawal_pending',
    amount_cents:   -amount_cents, // negative = outflow
    reference_id:   withdrawal.reference_id,
    entity:         'withdrawals',
    entity_id:      withdrawal.id,
    metadata:       { cash_deduct_cents, bonus_deduct_cents, bonus_to_cash_pct: bonusToCashPct },
  }).then(() => {}, err => console.error('[withdraw/submit] ledger error:', err))

  // ── Notification ──────────────────────────────────────────────────────────
  await supabaseAdmin.from('notifications').insert({
    tenant_id: profile?.tenant_id || null,
    user_id: user.id,
    type:    'general',
    title:   'Withdrawal Submitted',
    message: `Your withdrawal of $${(amount_cents / 100).toFixed(2)} (${withdrawal.reference_id}) has been submitted and is pending review.`,
    reference_id: withdrawal.reference_id,
  }).then(() => {}, () => {})

  return res.status(201).json({
    message: 'Withdrawal submitted successfully',
    withdrawal: {
      id:                        withdrawal.id,
      reference_id:              withdrawal.reference_id,
      amount_cents,
      cash_deduct_cents,
      bonus_deduct_cents,
      bonus_to_cash_pct_applied: bonusToCashPct,
      status:                    'pending',
    },
  })
}
