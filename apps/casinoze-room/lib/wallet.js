import { supabase } from './supabase'

/**
 * Get wallet for current user
 */
export async function getMyWallet(userId) {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data
}

/**
 * Get recent ledger transactions for a user
 */
export async function getMyTransactions(userId, { limit = 20, offset = 0, type } = {}) {
  // The game's name comes from the linked game load or redemption, not from
  // the ledger row's own text.
  //
  // The description is written once, when the entry is created, and the
  // ledger is append-only — two database rules forbid updating or deleting
  // a row. So entries written before the name was added to that text can
  // never gain it. Reading it through the link fixes old rows and new ones
  // alike, and keeps working whatever the description happens to say.
  const base = (select) => {
    let q = supabase
      .from('ledger')
      .select(select)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (type) q = q.eq('type', type)
    return q
  }

  // The embedded read needs a foreign key PostgREST can see from
  // ledger.game_load_id and ledger.redeem_id. If either is missing the
  // whole query fails, and a wallet that will not load is far worse than
  // one missing a game name — so fall back to the plain rows.
  let { data, error } = await base('*, game_loads(game_panel_name), redemptions(game_panel_name)')

  if (error) {
    console.warn('[wallet] game names unavailable:', error.message)
    ;({ data, error } = await base('*'))
  }
  if (error) throw error

  return (data || []).map(row => ({
    ...row,
    game_name: row.game_loads?.game_panel_name || row.redemptions?.game_panel_name || null,
  }))
}

/**
 * Unified activity feed for the wallet: deposits, withdrawals, redeems and
 * scores (game loads) in one list, each carrying its live status so the player
 * sees a pending request the moment they make it — not only after it settles.
 *
 * The ledger only holds money that has already moved, so a pending deposit or
 * withdrawal never appeared there. These rows come straight from the request
 * tables instead, which is where the status lives.
 *
 * `kind` filters to one type ('deposit' | 'withdrawal' | 'redeem' |
 * 'game_load'); omit it for everything. Paginated by created_at across all
 * four tables.
 */
export async function getMyActivity(userId, { limit = 15, offset = 0, kind } = {}) {
  const want = k => !kind || kind === k
  const need = offset + limit          // enough from each table to fill this page
  const empty = Promise.resolve({ data: [] })

  const [dep, wd, rd, gl, spin, led] = await Promise.all([
    want('deposit') ? supabase.from('deposits')
      .select('id, amount_cents, status, created_at, rejection_reason, payment_methods(name)')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(need) : empty,
    want('withdrawal') ? supabase.from('withdrawals')
      .select('id, amount_cents, status, created_at, rejection_reason, method')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(need) : empty,
    want('redeem') ? supabase.from('redemptions')
      .select('id, amount_cents, status, created_at, rejection_reason, source_bucket, game_accounts(game_panels(name))')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(need) : empty,
    want('game_load') ? supabase.from('game_loads')
      .select('id, amount_cents, status, created_at, rejection_reason, wallet_bucket, game_accounts(game_panels(name))')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(need) : empty,
    // Wheel of Fortune bets and winnings — these settle instantly, so they come
    // straight from the ledger (there is no request row for them).
    want('spinner') ? supabase.from('ledger')
      .select('id, type, amount_cents, direction, balance_after_cents, created_at')
      .eq('user_id', userId).in('type', ['spin_bet', 'spin_win'])
      .order('created_at', { ascending: false }).limit(need) : empty,
    // The running wallet balance after each settled request, from the ledger.
    supabase.from('ledger')
      .select('balance_after_cents, wallet_bucket, created_at, deposit_id, withdrawal_id, redeem_id, game_load_id')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(1000),
  ])

  // Map each request to its "after" balance AND when the money actually moved.
  // Latest ledger row wins, but a cash-bucket row is preferred (a deposit
  // writes both a cash and a bonus entry, and the cash balance is the one the
  // player wants to see).
  const settled = {}
  const put = (id, l) => {
    if (!id) return
    const cur = settled[id]
    if (cur === undefined || (cur.bucket !== 'cash' && l.wallet_bucket === 'cash')) {
      settled[id] = { cents: l.balance_after_cents, bucket: l.wallet_bucket, at: l.created_at }
    }
  }
  for (const l of led.data || []) {
    put(l.deposit_id, l); put(l.withdrawal_id, l); put(l.redeem_id, l); put(l.game_load_id, l)
  }
  const after  = id => (settled[id] ? settled[id].cents : null)
  // Order and date a settled request by when it was credited/debited, not when
  // it was requested — so the running balance reads correctly even when two
  // requests were approved out of the order they were made. Pending and
  // rejected requests have no ledger entry, so they fall back to request time.
  const whenAt = (id, requestedAt) => (settled[id] ? settled[id].at : requestedAt)

  // A deposit is "approved" in the DB but the player sees it as "Completed",
  // like scores and redeems; withdraw keeps its own "Paid".
  const normDeposit = s => (s === 'approved' ? 'completed' : s)

  // 'cash' | 'bonus' → the word shown to the player.
  const srcTag = b => (b === 'bonus' ? 'Bonus' : b === 'cash' ? 'Cash' : null)

  const rows = [
    ...(dep.data || []).map(r => ({ id: 'dep-' + r.id, kind: 'deposit', label: 'Deposit', game_name: r.payment_methods?.name || null, amount_cents: r.amount_cents, direction: 'credit', status: normDeposit(r.status), created_at: whenAt(r.id, r.created_at), rejection_reason: r.rejection_reason, balance_after_cents: after(r.id) })),
    ...(wd.data || []).map(r => ({ id: 'wd-' + r.id, kind: 'withdrawal', label: 'Withdrawal', game_name: r.method || null, amount_cents: r.amount_cents, direction: 'debit', status: r.status, created_at: whenAt(r.id, r.created_at), rejection_reason: r.rejection_reason, balance_after_cents: after(r.id) })),
    ...(rd.data || []).map(r => ({ id: 'rd-' + r.id, kind: 'redeem', label: 'Redeem', game_name: r.game_accounts?.game_panels?.name || null, amount_cents: r.amount_cents, direction: 'credit', status: r.status, created_at: whenAt(r.id, r.created_at), rejection_reason: r.rejection_reason, balance_after_cents: after(r.id), source_bucket: r.source_bucket || null, source_label: srcTag(r.source_bucket) ? `${srcTag(r.source_bucket)} winnings` : null })),
    ...(gl.data || []).map(r => ({ id: 'gl-' + r.id, kind: 'game_load', label: 'Scores', game_name: r.game_accounts?.game_panels?.name || null, amount_cents: r.amount_cents, direction: 'debit', status: r.status, created_at: whenAt(r.id, r.created_at), rejection_reason: r.rejection_reason, balance_after_cents: after(r.id), source_bucket: r.wallet_bucket || null, source_label: srcTag(r.wallet_bucket) ? `from ${srcTag(r.wallet_bucket)}` : null })),
    ...(spin.data || []).map(r => ({
      id: 'spin-' + r.id,
      kind: 'spinner',
      label: r.type === 'spin_win' ? 'Wheel of Fortune win' : 'Wheel of Fortune bet',
      game_name: null,
      amount_cents: r.amount_cents,
      direction: r.direction,                 // debit = bet, credit = winnings
      status: 'completed',
      created_at: r.created_at,
      rejection_reason: null,
      balance_after_cents: r.balance_after_cents,
      source_label: r.type === 'spin_win' ? 'to Bonus' : null,
    })),
  ]

  rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return rows.slice(offset, offset + limit)
}

/**
 * Get recent deposits for a user
 */
export async function getMyDeposits(userId, { limit = 10 } = {}) {
  const { data, error } = await supabase
    .from('deposits')
    .select('*, payment_methods(name, type, icon)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

/**
 * Get recent game loads for a user
 */
export async function getMyGameLoads(userId, { limit = 10 } = {}) {
  const { data, error } = await supabase
    .from('game_loads')
    .select('*, game_accounts(game_username, game_panels(name, logo_url))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

/**
 * Get recent redemptions for a user
 */
export async function getMyRedemptions(userId, { limit = 10 } = {}) {
  const { data, error } = await supabase
    .from('redemptions')
    .select('*, game_accounts(game_username, game_panels(name, logo_url))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

/**
 * Get player's game accounts
 */
export async function getMyGameAccounts(userId) {
  const { data, error } = await supabase
    .from('game_accounts')
    .select('*, game_panels(name, logo_url, accent_color, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Get pending counts for dashboard summary
 */
export async function getMyPendingCounts(userId) {
  const [deposits, loads, redeems, withdrawals] = await Promise.all([
    supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
    supabase.from('game_loads').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
    supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
    supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
  ])
  return {
    deposits: deposits.count || 0,
    loads: loads.count || 0,
    redeems: redeems.count || 0,
    withdrawals: withdrawals.count || 0,
  }
}

/**
 * Format transaction type to human-readable label
 */
export function txTypeLabel(type) {
  const labels = {
    deposit:                    'Deposit',
    deposit_bonus:              'Deposit Bonus',
    game_load:                  'Game Load',
    game_load_reserve:          'Load Reserved',
    game_load_reserve_release:  'Load Released',
    redeem:                     'Redemption',
    redeem_reserve:             'Redeem Reserved',
    redeem_reserve_release:     'Redeem Released',
    withdrawal:                 'Withdrawal',
    withdrawal_reserve:         'Withdrawal Reserved',
    withdrawal_reserve_release: 'Withdrawal Released',
    referral_bonus:             'Referral Bonus',
    level_bonus:                'Level Bonus',
    adjustment_credit:          'Admin Credit',
    adjustment_debit:           'Admin Debit',
    promotion_credit:           'Promotion Credit',
    refund:                     'Refund',
  }
  return labels[type] || type
}

/**
 * Get color for transaction type
 */
export function txTypeColor(type) {
  const credits = ['deposit','deposit_bonus','redeem','referral_bonus','level_bonus','adjustment_credit','promotion_credit','refund','game_load_reserve_release','redeem_reserve_release','withdrawal_reserve_release']
  return credits.includes(type) ? '#10b981' : '#f87171'
}

/**
 * How many times a player has loaded each of their game accounts.
 *
 * Returns { [game_account_id]: count }. Used to put the games someone
 * actually plays at the top of My Games, instead of whichever account was
 * created most recently — which told a player nothing they did not know.
 *
 * Counted in the browser over the id column alone: PostgREST cannot group,
 * and a player's own load history is small. Approved loads only, so a
 * rejected or pending one does not inflate the ranking.
 */
export async function getMyLoadCounts(userId) {
  const { data, error } = await supabase
    .from('game_loads')
    .select('game_account_id')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .limit(1000)

  if (error) return {}

  const counts = {}
  for (const row of data || []) {
    if (!row.game_account_id) continue
    counts[row.game_account_id] = (counts[row.game_account_id] || 0) + 1
  }
  return counts
}
