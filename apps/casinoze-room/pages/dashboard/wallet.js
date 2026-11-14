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
  { key: 'spinner',    label: 'Wheel'      },
]

// ─── Balance card ─────────────────────────────────────────────────────────────
function BucketCard({ label, cents, color, icon, desc }) {
  return (
    <div style={{ padding: '20px', borderRadius: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', flex: 1, minWidth: 150 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ display: 'inline-flex', color }}><Icon name={icon} size={18} color={color} /></span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>{label}</span>
      </div>
      <MoneyDisplay cents={cents} size="xl" color={color} />
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 6, lineHeight: 1.5 }}>{desc}</div>
    </div>
  )
}

// ─── Withdraw method picker (inline modal) ────────────────────────────────────
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
      bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
      color: '#050505',
      onClick: () => router.push('/dashboard/games'),
    },
    {
      text: 'Redeem', icon: 'trophy',
      bg: 'linear-gradient(135deg,#f59e0b,#d97706)',
      color: '#050505',
      onClick: () => router.push('/dashboard/redeem'),
    },
  ]

  return (
    <PlayerLayout>
      <Head><title>Wallet — Casinoze Room</title></Head>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: '#fff', marginBottom: 4 }}>My Wallet</h1>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>All your balances and transaction history</p>
      </div>

      {/* 4 Balance cards */}
      {wallet && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px,100%),1fr))', gap: 12, marginBottom: 20 }}>
          <BucketCard label="Cash"         cents={wallet.cash_balance_cents}   color="#10b981" icon="cash"  desc="Available to load or withdraw" />
          <BucketCard label="Bonus"        cents={wallet.bonus_balance_cents}  color="#f59e0b" icon="gift"  desc="Bonus credits" />
          <BucketCard label="Reserved"     cents={wallet.reserved_cents}       color="#94a3b8" icon="lock"  desc="Held for pending requests" />
          <BucketCard label="Withdrawable" cents={wallet.withdrawable_cents}   color="#fbbf24" icon="money" desc="Ready to withdraw" />
        </div>
      )}

      {/* 4 Action buttons — equal-sized, centred, 2-up on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 10, marginBottom: 28 }}>
        {ACTIONS.map(a => (
          <button key={a.text} onClick={a.onClick} style={{
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
      <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Transaction History</span>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.05)', padding: 4, borderRadius: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {TX_FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 700,
                background: filter === f.key ? 'rgba(251,191,36,.8)' : 'transparent',
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
                      {tx.game_name && <span style={{ color: '#fbbf24' }}> · {tx.game_name}</span>}
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
                <button onClick={() => loadTransactions(page + 1)} disabled={txLoading} style={{ padding: '10px 28px', background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 10, color: '#fbbf24', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  {txLoading ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PlayerLayout>
  )
}
