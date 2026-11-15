import { useState, useEffect } from 'react'
import PlayerLayout from '../../components/layout/PlayerLayout'
import { supabase } from '../../lib/supabase'
import Icon from '../../components/ui/Icon'
import { useSettings, formatInTimezone } from '../../lib/settings'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'; const purple = '#a855f7'; const blue = '#3b82f6'

const fmt = (cents) => '$' + (Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// Timestamps show in the casino's timezone (admin Settings), not the viewer's.
const fmtDate = (d, tz) => d ? formatInTimezone(d, tz, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const TYPE_META = {
  deposit:          { label: 'Deposit',      icon: 'arrowDown', color: green },
  game_load:        { label: 'Scores',       icon: 'gamepad',   color: purple },
  game_load_return: { label: 'Score Refund', icon: 'arrowDown', color: blue },
  game_load_refund: { label: 'Score Refund', icon: 'arrowDown', color: blue },
  redeem:           { label: 'Redeem',       icon: 'coins',     color: gold },
  redemption:       { label: 'Redeem',       icon: 'coins',     color: gold },
  withdrawal:       { label: 'Withdraw',     icon: 'arrowUp',   color: red },
  withdrawal_hold:  { label: 'Withdraw',     icon: 'arrowUp',   color: red },
  withdrawal_refund:{ label: 'Withdraw Refund', icon: 'arrowDown', color: blue },
  adjustment:       { label: 'Adjustment',   icon: 'gear',      color: 'rgba(255,255,255,0.5)' },
  bonus:            { label: 'Bonus',        icon: 'gift',      color: gold },
  referral:         { label: 'Referral',     icon: 'users',     color: green },
  // Ledger-only credits/debits (no dedicated request table)
  deposit_bonus:     { label: 'Deposit Bonus',  icon: 'gift',    color: gold },
  referral_bonus:    { label: 'Referral Bonus', icon: 'users',   color: green },
  promotion_credit:  { label: 'Promo Bonus',    icon: 'gift',    color: gold },
  spin_win:          { label: 'Spin Win',       icon: 'wheel',   color: gold },
  spin_bet:          { label: 'Spin Bet',       icon: 'wheel',   color: purple },
  refund:            { label: 'Refund',         icon: 'arrow',   color: blue },
  adjustment_credit: { label: 'Adjustment',     icon: 'gear',    color: green },
  adjustment_debit:  { label: 'Adjustment',     icon: 'gear',    color: red },
  transfer:          { label: 'Transfer',       icon: 'coins',   color: purple },
}

// Which tab a ledger type belongs under. Same grouping the admin uses, so the
// two sides read identically.
const CATEGORY_TYPES = {
  deposits:    ['deposit'],
  withdrawals: ['withdrawal', 'withdrawal_refund', 'withdrawal_hold'],
  loads:       ['game_load', 'game_load_refund', 'game_load_return'],
  redemptions: ['redeem', 'redemption'],
  bonuses:     ['deposit_bonus', 'promotion_credit', 'referral_bonus', 'bonus', 'spin_win', 'spin_bet'],
  transfers:   ['transfer'],
}
const catOfType = t => Object.keys(CATEGORY_TYPES).find(k => CATEGORY_TYPES[k].includes(t)) || null

// A request row counts as "settled" once it has a ledger entry; those come
// from the ledger below. Only still-open or rejected requests are merged in,
// so the player sees the same rows an admin sees plus in-flight items.
// "Settled" is per-table: a withdrawal is done only when 'paid', but a game
// load / redeem in 'processing' has already moved money (it has a ledger
// row), so it must not be merged again or it would show twice.
const SETTLED_REQUEST = {
  deposits:    ['approved'],
  withdrawals: ['paid'],
  loads:       ['completed', 'processing'],
  redemptions: ['completed', 'processing'],
}

const STATUS_STYLE = {
  pending:    { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', color: gold,                        label: 'Pending' },
  under_review: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', color: blue,                      label: 'Processing' },
  processing: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', color: blue,                       label: 'Processing' },
  approved:   { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: green,                       label: 'Completed' },
  completed:  { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: green,                       label: 'Completed' },
  paid:       { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)',   color: green,                       label: 'Paid' },
  rejected:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: red,                         label: 'Rejected' },
  failed:     { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   color: red,                         label: 'Failed' },
  cancelled:  { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)',   label: 'Cancelled' },
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

const TABS = [
  { key: 'all',         label: 'All' },
  { key: 'deposits',    label: 'Deposits' },
  { key: 'withdrawals', label: 'Withdraws' },
  { key: 'loads',       label: 'Scores' },
  { key: 'redemptions', label: 'Redeems' },
  { key: 'bonuses',     label: 'Bonuses' },
  { key: 'transfers',   label: 'Transfer' },
]

export default function TransactionsPage() {
  const { timezone } = useSettings()
  const [tab, setTab] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [openReason, setOpenReason] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setToken(session.access_token)
      await fetchData(session.access_token)
    }
    init()
  }, [])

  const fetchData = async (tok) => {
    setLoading(true)
    const res = await fetch('/api/player/transactions?limit=50', { headers: { Authorization: `Bearer ${tok || token}` } })
    if (res.ok) { const d = await res.json(); setData(d) }
    setLoading(false)
  }

  const pendingCount = data
    ? (data.pending.deposits.length + data.pending.withdrawals.length + data.pending.loads.length + data.pending.redemptions.length)
    : 0

  // Settled transactions come straight from the ledger — the same source of
  // truth the admin reads — so every row, description and amount matches what
  // an admin sees for this account.
  const ledgerRows = () => (data?.ledger || []).map(l => ({
    ...l, _type: l.type, _amount: l.amount_cents,
    _desc: l.description || (TYPE_META[l.type]?.label ?? '—'),
    _dir: l.direction || (l.amount_cents >= 0 ? 'credit' : 'debit'),
    status: 'completed',
  }))

  // Still-open or rejected requests aren't in the ledger yet, so merge them in
  // from the request tables (with their real status + reason).
  const openRequestRows = () => {
    if (!data) return []
    const { deposits, withdrawals, loads, redemptions } = data.recent
    const open = (arr, settled) => arr.filter(x => !settled.includes(x.status))
    return [
      ...open(deposits, SETTLED_REQUEST.deposits).map(d => ({ ...d, _type: 'deposit',    _amount: d.amount_cents, _desc: d.payment_method_name || 'Deposit',    _dir: 'credit' })),
      ...open(withdrawals, SETTLED_REQUEST.withdrawals).map(w => ({ ...w, _type: 'withdrawal', _amount: w.amount_cents, _desc: w.payout_method_label || w.payout_method_type || 'Withdraw', _dir: 'debit' })),
      ...open(loads, SETTLED_REQUEST.loads).map(l => ({ ...l, _type: 'game_load',    _amount: l.amount_cents, _desc: l.game_panel_name || 'Scores',    _dir: 'debit' })),
      ...open(redemptions, SETTLED_REQUEST.redemptions).map(r => ({ ...r, _type: 'redemption', _amount: r.amount_cents, _desc: r.game_panel_name || 'Redeem',   _dir: 'credit' })),
    ]
  }

  const getRows = () => {
    if (!data) return []
    const all = [...ledgerRows(), ...openRequestRows()]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (tab === 'all') return all
    return all.filter(r => catOfType(r._type) === tab)
  }

  const rows = getRows()

  return (
    <PlayerLayout>
      <style jsx global>{`
        @media (max-width: 560px) {
          .txn-head { display: none !important; }
          .txn-row {
            grid-template-columns: 1fr auto !important;
            row-gap: 4px !important;
            padding: 12px 14px !important;
          }
          .txn-date { text-align: right; font-size: 12px !important; }
        }
      `}</style>
      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: gold, margin: 0, display: 'flex', alignItems: 'center', gap: 9 }}><Icon name="clipboard" size={20} color={gold} /> My Transactions</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Track all your deposits, withdraws, scores and redeems.</p>
          </div>
          <button onClick={() => fetchData(token)} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>↻ Refresh</button>
        </div>

        {/* Pending banner */}
        {!loading && pendingCount > 0 && (
          <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <p style={{ color: gold, fontSize: 13, margin: '0 0 12px', fontWeight: 700 }}>⏳ {pendingCount} Pending Request{pendingCount > 1 ? 's' : ''} — awaiting admin review</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.pending.deposits.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="arrowDown" size={14} color={green} /> Deposit <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{d.reference_id}</span></span>
                  <span style={{ color: green, fontWeight: 700 }}>{fmt(d.amount_cents)}</span>
                </div>
              ))}
              {data.pending.withdrawals.map(w => (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="arrowUp" size={14} color={red} /> Withdraw <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{w.reference_id}</span></span>
                  <span style={{ color: red, fontWeight: 700 }}>−{fmt(w.amount_cents)}</span>
                </div>
              ))}
              {data.pending.loads.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="gamepad" size={14} color={purple} /> Scores <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{l.reference_id}</span></span>
                  <span style={{ color: purple, fontWeight: 700 }}>−{fmt(l.amount_cents)}</span>
                </div>
              ))}
              {data.pending.redemptions.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="coins" size={14} color={gold} /> Redeem <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{r.reference_id}</span></span>
                  <span style={{ color: gold, fontWeight: 700 }}>{fmt(r.amount_cents)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '10px 18px', border: 'none', borderBottom: `2px solid ${tab === t.key ? gold : 'transparent'}`, background: 'none', color: tab === t.key ? gold : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: tab === t.key ? 700 : 400, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'rgba(255,255,255,0.3)' }}><Icon name="inbox" size={34} /></div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>No transactions yet.</div>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            {/* Header row */}
            <div className="txn-head" style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Transaction</span>
              <span>Date</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
            </div>
            {rows.map((row, i) => {
              const meta = TYPE_META[row._type] || { label: row._type, icon: '•', color: 'rgba(255,255,255,0.5)' }
              const isCredit = row._dir === 'credit'
              const rowKey = `${row._type}-${row.id}`
              const isRejected = row.status === 'rejected'
              const reasonOpen = openReason === rowKey
              return (
                <div key={rowKey} style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div className="txn-row" style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '14px 20px', alignItems: 'center', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {/* Type + desc */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                      <Icon name={meta.icon} size={18} color={meta.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{meta.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{row._desc}</div>
                      {row.reference_id && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', marginTop: 1 }}>{row.reference_id}</div>}
                    </div>
                  </div>
                  {/* Date */}
                  <div className="txn-date" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{fmtDate(row.created_at, timezone)}</div>
                  {/* Status */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
                    <StatusPill status={row.status} />
                    {isRejected && (
                      <button onClick={() => setOpenReason(reasonOpen ? null : rowKey)} style={{ fontSize: 11, fontWeight: 600, padding: 0, background: 'none', border: 'none', color: 'rgba(239,68,68,0.9)', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textDecoration: 'underline' }}>
                        {reasonOpen ? 'Hide reason' : 'View reason'}
                      </button>
                    )}
                  </div>
                  {/* Amount */}
                  <div style={{ fontSize: 15, fontWeight: 700, color: isCredit ? green : red, textAlign: 'right' }}>
                    {isCredit ? '+' : '−'}{fmt(row._amount)}
                  </div>
                </div>
                {isRejected && reasonOpen && (
                  <div style={{ padding: '0 20px 14px 68px', margin: '-4px 0 0' }}>
                    <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                      <span style={{ color: red, fontWeight: 700 }}>Reason: </span>
                      {row.rejection_reason || 'No reason was provided.'}
                    </div>
                  </div>
                )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PlayerLayout>
  )
}
