/**
 * pages/dashboard/wallet.js
 * Wallet is the single hub for all player financial activity.
 * - 4 balance cards (Cash, Bonus, Reserved, Withdrawable)
 * - 4 action buttons: Deposit, Withdraw, Scores, Redeem
 * - Withdraw opens an inline method picker (filtered by allow_withdraw=true)
 * - Full transaction history with filters
 */
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { pageTitle } from '../../lib/brand'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import MoneyDisplay from '../../components/ui/MoneyDisplay'
import StatusBadge from '../../components/ui/StatusBadge'
import Icon from '../../components/ui/Icon'
import { getMyActivity } from '../../lib/wallet'

const TX_FILTERS = [
  { key: 'all',        label: 'All'        },
  { key: 'deposit',    label: 'Deposits'   },
  { key: 'game_load',  label: 'Scores'     },
  { key: 'redeem',     label: 'Redeems'    },
  { key: 'withdrawal', label: 'Withdraws'},
  { key: 'bonus',      label: 'Bonus'      },
  { key: 'transfer',   label: 'Transfer'   },
  { key: 'spinner',    label: 'Wheel'      },
]

// ─── Balance card ─────────────────────────────────────────────────────────────
function BucketCard({ label, cents, color, icon, desc }) {
  return (
    <div style={{ padding: '20px', borderRadius: 6, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(239,68,68,.12)', flex: 1, minWidth: 150 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ display: 'inline-flex', color }}><Icon name={icon} size={18} color={color} /></span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>{label}</span>
      </div>
      <MoneyDisplay cents={cents} size="xl" color={color} />
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 6, lineHeight: 1.5 }}>{desc}</div>
    </div>
  )
}

// ─── Transfer modal (Bonus ⇄ Cash exchange) ──────────────────────────────────
// One exchange rate, set by the admin as the Bonus "redeemable %". Bonus is
// worth pct% of cash, so:
//   Bonus → Cash:  cash  = bonus × pct/100   (e.g. 15% → $100 bonus = $15 cash)
//   Cash → Bonus:  bonus = cash × 100/pct    (the inverse, same rate)
// The actual move is atomic server-side (transfer_wallet RPC); this is preview
// + input only.
function TransferModal({ wallet, onClose, onDone }) {
  const [dir, setDir]     = useState('bonus_to_cash')   // 'bonus_to_cash' | 'cash_to_bonus'
  const [amount, setAmount] = useState('')              // dollars, as typed
  const [pct, setPct]     = useState(null)
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch('/api/player/bonus-rate', { headers: { Authorization: `Bearer ${session?.access_token}` } })
      if (r.ok) { const d = await r.json(); setPct(d.pct) }
    })()
  }, [])

  const fromBonus = dir === 'bonus_to_cash'
  const srcCents  = fromBonus ? (wallet?.bonus_balance_cents || 0) : (wallet?.cash_balance_cents || 0)
  const srcLabel  = fromBonus ? 'Bonus' : 'Main'
  const dstLabel  = fromBonus ? 'Main' : 'Bonus'
  const amtCents  = Math.round((parseFloat(amount) || 0) * 100)
  const rate      = pct && pct > 0 ? pct : 0
  // Preview of what lands in the destination wallet.
  const recvCents = rate <= 0 ? 0
    : fromBonus ? Math.floor(amtCents * rate / 100)
    : Math.floor(amtCents * 100 / rate)

  const tooMuch   = amtCents > srcCents
  const tooSmall  = amtCents > 0 && recvCents <= 0
  const canSubmit = !busy && rate > 0 && amtCents > 0 && !tooMuch && recvCents > 0

  async function submit() {
    if (!canSubmit) return
    setBusy(true); setErr('')
    const { data, error } = await supabase.rpc('transfer_wallet', { p_direction: dir, p_amount_cents: amtCents })
    setBusy(false)
    if (error) { setErr(error.message || 'Transfer failed'); return }
    onDone?.(data)
  }

  const money = c => `$${(c / 100).toFixed(2)}`

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#160a0a', border: '1px solid rgba(239,68,68,.3)', borderRadius: 6, padding: 24, width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 19, fontWeight: 700, color: '#fff', margin: 0 }}>Transfer</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex' }}><Icon name="x" size={18} /></button>
        </div>

        {/* Direction toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {[['bonus_to_cash', 'Bonus → Main'], ['cash_to_bonus', 'Main → Bonus']].map(([key, label]) => {
            const on = dir === key
            return (
              <button key={key} onClick={() => { setDir(key); setAmount(''); setErr('') }}
                style={{ padding: '10px 8px', borderRadius: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 800,
                  background: on ? 'rgba(239,68,68,.16)' : 'rgba(255,255,255,.05)',
                  border: `1px solid ${on ? 'rgba(239,68,68,.5)' : 'rgba(255,255,255,.1)'}`,
                  color: on ? '#ef4444' : 'rgba(255,255,255,.6)' }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'rgba(255,255,255,.5)' }}>{srcLabel} to move</span>
          <button onClick={() => setAmount((srcCents / 100).toFixed(2))} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Max {money(srcCents)}
          </button>
        </div>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.5)', fontSize: 16, fontWeight: 700 }}>$</span>
          <input type="number" min="0" step="0.01" value={amount} onChange={e => { setAmount(e.target.value); setErr('') }} placeholder="0.00"
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 30px', background: 'rgba(255,255,255,.06)', border: `1px solid ${tooMuch ? 'rgba(248,113,113,.5)' : 'rgba(255,255,255,.12)'}`, borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: "'Outfit',sans-serif", outline: 'none' }} />
        </div>

        {/* Preview */}
        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}>You receive in {dstLabel}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{money(recvCents)}</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 6 }}>
            {rate > 0 ? `Rate: Bonus is worth ${rate}% of Main Wallet` : 'Transfers are currently unavailable'}
          </div>
        </div>

        {(err || tooMuch || tooSmall) && (
          <div style={{ marginBottom: 14, fontSize: 13, color: '#f87171', fontWeight: 600 }}>
            {err || (tooMuch ? `Not enough ${srcLabel} balance` : 'Amount too small to convert')}
          </div>
        )}

        <button onClick={submit} disabled={!canSubmit}
          style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 800, fontFamily: "'Outfit',sans-serif",
            background: canSubmit ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(255,255,255,.08)',
            color: canSubmit ? '#050505' : 'rgba(255,255,255,.4)', cursor: canSubmit ? 'pointer' : 'default' }}>
          {busy ? 'Transferring…' : 'Confirm Transfer'}
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const router = useRouter()
  const [wallet, setWallet]           = useState(null)
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter]           = useState('all')
  const [loading, setLoading]         = useState(true)
  const [txLoading, setTxLoading]     = useState(false)
  const [page, setPage]               = useState(0)
  const [hasMore, setHasMore]         = useState(true)
  const [showTransfer, setShowTransfer] = useState(false)
  const LIMIT = 15

  useEffect(() => { loadWallet() }, [])
  useEffect(() => { loadTransactions(0) }, [filter])

  async function loadWallet() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data } = await supabase.from('wallets').select('*').eq('user_id', user.id).single()
    setWallet(data)
    setLoading(false)
  }

  async function loadTransactions(pageNum = 0) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setTxLoading(true)
    try {
      const txs = await getMyActivity(user.id, {
        limit: LIMIT, offset: pageNum * LIMIT,
        kind: filter === 'all' ? undefined : filter,
      })
      if (pageNum === 0) setTransactions(txs)
      else setTransactions(p => [...p, ...txs])
      setHasMore(txs.length === LIMIT)
      setPage(pageNum)
    } finally { setTxLoading(false) }
  }

  if (loading) return (
    <PlayerLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>Loading wallet…</div>
      </div>
    </PlayerLayout>
  )

  // 4 action buttons — Withdraw opens inline picker
  const ACTIONS = [
    {
      text: 'Deposit', icon: 'plus',
      bg: 'linear-gradient(135deg,#10b981,#059669)',
      color: '#fff',
      onClick: () => router.push('/dashboard/deposit'),
    },
    {
      text: 'Withdraw', icon: 'arrowUp',
      bg: 'linear-gradient(135deg,#3b82f6,#2563eb)',
      color: '#fff',
      // Straight to the withdraw page. This opened a method picker first,
      // and the withdraw page then asked for the method again — the same
      // question twice, with two different lists behind it.
      onClick: () => router.push('/dashboard/withdraw'),
    },
    {
      text: 'Scores', icon: 'gamepad',
      bg: 'linear-gradient(135deg,#ef4444,#dc2626)',
      color: '#050505',
      onClick: () => router.push('/dashboard/games'),
    },
    {
      text: 'Redeem', icon: 'trophy',
      bg: 'linear-gradient(135deg,#dc2626,#b91c1c)',
      color: '#050505',
      onClick: () => router.push('/dashboard/redeem'),
    },
    {
      text: 'Transfer', icon: 'coins',
      bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
      color: '#fff',
      onClick: () => setShowTransfer(true),
    },
  ]

  return (
    <PlayerLayout>
      <Head><title>{pageTitle('Wallet')}</title></Head>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: '#fff', marginBottom: 4, letterSpacing: '.06em', textTransform: 'uppercase' }}>My Wallet</h1>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>All your balances and transaction history</p>
      </div>

      {/* 4 Balance cards */}
      {wallet && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px,100%),1fr))', gap: 12, marginBottom: 20 }}>
          <BucketCard label="Main Wallet"  cents={wallet.cash_balance_cents}   color="#10b981" icon="cash"  desc="Available to load or withdraw" />
          <BucketCard label="Bonus Wallet" cents={wallet.bonus_balance_cents}  color="#dc2626" icon="gift"  desc="Bonus credits" />
          <BucketCard label="Reserved"     cents={wallet.reserved_cents}       color="#94a3b8" icon="lock"  desc="Held for pending requests" />
          <BucketCard label="Withdrawable" cents={wallet.withdrawable_cents}   color="#ef4444" icon="money" desc="Ready to withdraw" />
        </div>
      )}

      {/* 5 Action buttons — equal-sized and centred, so they wrap 2-up on
          mobile with the 5th (Transfer) centred on its own third row. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
        {ACTIONS.map(a => (
          <button key={a.text} onClick={a.onClick} style={{
            flex: '1 1 150px', maxWidth: 240,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 22px', borderRadius: 12,
            background: a.bg, color: a.color, fontSize: 13, fontWeight: 700, border: 'none',
            cursor: 'pointer', letterSpacing: '.02em', fontFamily: "'Outfit',sans-serif",
            boxShadow: '0 2px 12px rgba(0,0,0,.3)', transition: 'opacity .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Icon name={a.icon} size={16} color={a.color} /> {a.text}
          </button>
        ))}
      </div>

      {/* Transaction history */}
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(239,68,68,.12)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Transaction History</span>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.05)', padding: 4, borderRadius: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {TX_FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 700,
                background: filter === f.key ? 'rgba(239,68,68,.8)' : 'transparent',
                color: filter === f.key ? '#fff' : 'rgba(255,255,255,.4)', transition: 'all .15s',
              }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {transactions.length === 0 && !txLoading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'rgba(255,255,255,.3)' }}><Icon name="list" size={34} /></div>
            <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 14 }}>No transactions found</div>
          </div>
        ) : (
          <>
            {transactions.map(tx => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: tx.direction === 'credit' ? 'rgba(16,185,129,.12)' : 'rgba(248,113,113,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={tx.direction === 'credit' ? 'arrowUp' : 'arrowDown'} size={18} color={tx.direction === 'credit' ? '#10b981' : '#f87171'} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                      {tx.label}
                      {tx.game_name && <span style={{ color: '#ef4444' }}> · {tx.game_name}</span>}
                      {tx.source_label && <span style={{ color: 'rgba(255,255,255,.4)', fontWeight: 500 }}> · {tx.source_label}</span>}
                    </div>
                    {tx.status === 'rejected' && tx.rejection_reason && (
                      <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>Reason: {tx.rejection_reason}</div>
                    )}
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 2 }}>
                      {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: tx.direction === 'credit' ? '#10b981' : '#f87171' }}>
                    {tx.direction === 'credit' ? '+' : '-'}
                    <MoneyDisplay cents={tx.amount_cents} size="md" color={tx.direction === 'credit' ? '#10b981' : '#f87171'} />
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                    <StatusBadge status={tx.status} size="xs" />
                  </div>
                  {tx.balance_after_cents != null && (
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,.25)' }}>
                        After: <MoneyDisplay cents={tx.balance_after_cents} size="xs" color="rgba(255,255,255,.35)" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {hasMore && (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <button onClick={() => loadTransactions(page + 1)} disabled={txLoading} style={{ padding: '10px 28px', background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  {txLoading ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showTransfer && (
        <TransferModal
          wallet={wallet}
          onClose={() => setShowTransfer(false)}
          onDone={() => { setShowTransfer(false); loadWallet(); loadTransactions(0) }}
        />
      )}
    </PlayerLayout>
  )
}
