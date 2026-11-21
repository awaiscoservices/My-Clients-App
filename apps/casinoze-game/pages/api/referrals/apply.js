/**
 * POST /api/referrals/apply
 * Called after a user's first qualifying deposit to apply referral bonus.
 * Looks up the referral code stored in profile metadata, credits both referrer and referee.
 * Idempotent — safe to call multiple times; only applies once per user.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Referral bonus amounts in cents
const REFEREE_BONUS_CENTS  = 500  // $5 bonus to new player
const REFERRER_BONUS_CENTS = 1000 // $10 bonus to referrer

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  // Only player role can trigger this
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role, full_name, referral_code_used, referral_bonus_applied')
    .eq('id', user.id)
    .single()

  if (!profile) return res.status(404).json({ error: 'Profile not found' })
  if (profile.role !== 'player') return res.status(403).json({ error: 'Players only' })

  // Already applied — idempotent return
  if (profile.referral_bonus_applied) {
    return res.status(200).json({ message: 'Referral bonus already applied', skipped: true })
  }

  const referralCode = profile.referral_code_used?.trim()?.toUpperCase()
  if (!referralCode) {
    return res.status(200).json({ message: 'No referral code on this account', skipped: true })
  }

  // Find the referrer by their referral code
  const { data: referrer } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .eq('my_referral_code', referralCode)
    .eq('role', 'player')
    .single()

  if (!referrer) {
    return res.status(200).json({ message: 'Referral code not found or expired', skipped: true })
  }

  // Cannot refer yourself
  if (referrer.id === user.id) {
    return res.status(400).json({ error: 'Cannot use your own referral code' })
  }

  // Load both wallets
  const { data: refereeWallet } = await supabaseAdmin
    .from('wallets').select('*').eq('user_id', user.id).single()
  const { data: referrerWallet } = await supabaseAdmin
    .from('wallets').select('*').eq('user_id', referrer.id).single()

  if (!refereeWallet || !referrerWallet)
    return res.status(500).json({ error: 'Wallet not found for one or both users' })

  const now = Date.now()
  const refId = `REF-${now}`

  // Credit referee (new player) — bonus bucket
  const newRefereeBonus = (refereeWallet.bonus_balance_cents || 0) + REFEREE_BONUS_CENTS
  const { error: refereeUpdateErr } = await supabaseAdmin
    .from('wallets')
    .update({ bonus_balance_cents: newRefereeBonus, version: refereeWallet.version + 1 })
    .eq('id', refereeWallet.id)
    .eq('version', refereeWallet.version)

  if (refereeUpdateErr)
    return res.status(409).json({ error: 'Concurrent wallet update. Please retry.' })

  // Credit referrer — bonus bucket
  const newReferrerBonus = (referrerWallet.bonus_balance_cents || 0) + REFERRER_BONUS_CENTS
  await supabaseAdmin
    .from('wallets')
    .update({ bonus_balance_cents: newReferrerBonus, version: referrerWallet.version + 1 })
    .eq('id', referrerWallet.id)
    .eq('version', referrerWallet.version)

  // Ledger entries for both
  await supabaseAdmin.from('ledger').insert([
    {
      reference_id: `${refId}-REFEREE`,
      user_id: user.id,
      type: 'referral_bonus',
      wallet_bucket: 'bonus',
      amount_cents: REFEREE_BONUS_CENTS,
      direction: 'credit',
      balance_after_cents: newRefereeBonus,
      description: `Referral bonus for joining with code ${referralCode}`,
      idempotency_key: `ref_${user.id}_referee`,
    },
    {
      reference_id: `${refId}-REFERRER`,
      user_id: referrer.id,
      type: 'referral_bonus',
      wallet_bucket: 'bonus',
      amount_cents: REFERRER_BONUS_CENTS,
      direction: 'credit',
      balance_after_cents: newReferrerBonus,
      description: `Referral bonus for referring ${profile.full_name}`,
      idempotency_key: `ref_${user.id}_referrer`,
    },
  ])

  // Mark bonus as applied so it can't run again
  await supabaseAdmin
    .from('profiles')
    .update({ referral_bonus_applied: true })
    .eq('id', user.id)

  // Notify both
  await supabaseAdmin.from('notifications').insert([
    {
      user_id: user.id,
      type: 'general',
      title: '🎉 Referral Bonus Credited!',
      message: `You've received a $${(REFEREE_BONUS_CENTS / 100).toFixed(2)} bonus for joining with referral code ${referralCode}. Reference: ${refId}.`,
      reference_id: refId,
    },
    {
      user_id: referrer.id,
      type: 'general',
      title: '🎉 Referral Reward!',
      message: `${profile.full_name} used your referral code! You've received a $${(REFERRER_BONUS_CENTS / 100).toFixed(2)} bonus. Reference: ${refId}.`,
      reference_id: refId,
    },
  ])

  // Audit log
  await supabaseAdmin.from('audit_logs').insert({
    actor_id: user.id, actor_role: 'player',
    action: 'referral_bonus_applied',
    target_type: 'wallet', target_id: refereeWallet.id,
    before_state: { bonus_balance_cents: refereeWallet.bonus_balance_cents },
    after_state: { bonus_balance_cents: newRefereeBonus },
    reason: `Referral code ${referralCode} applied — referrer: ${referrer.id}`,
  }).then(() => {}, () => {})

  return res.status(200).json({
    message: 'Referral bonus applied successfully',
    reference_id: refId,
    referee_bonus_cents: REFEREE_BONUS_CENTS,
    referrer_bonus_cents: REFERRER_BONUS_CENTS,
  })
}
