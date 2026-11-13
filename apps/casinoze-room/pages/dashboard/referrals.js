import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import MoneyDisplay from '../../components/ui/MoneyDisplay'
import { Title, Btn, Empty, card, input, Label, G, fmtDate } from '../../components/ui/kit'

const STEPS = [
  { n: 1, t: 'Share your code', d: 'Send your invite link to a friend' },
  { n: 2, t: 'They deposit', d: 'Your friend signs up and adds money' },
  { n: 3, t: 'You earn', d: 'Get a bonus on their first 3 deposits' },
]

function Stat({ label, children }) {
  return (
    <div style={card}>
      <Label>{label}</Label>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  )
}

export default function Referrals() {
  const [code, setCode] = useState(null)
  const [refs, setRefs] = useState([])
  const [stats, setStats] = useState({ total_referrals: 0, total_earned_cents: 0, deposited: 0, awaiting: 0 })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      try {
        const res = await fetch('/api/referrals/dashboard', { headers: { Authorization: `Bearer ${session.access_token}` } })
        const j = await res.json()
        if (res.ok) { setCode(j.code); setRefs(j.referrals || []); setStats(j.stats) }
      } catch {}
      setLoading(false)
    })()
  }, [])

  const link = code && typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${code}` : ''
  async function copy() { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {} }

  return (
    <PlayerLayout>
      <Head><title>Referrals — Casinoze Room</title></Head>
      <Title sub="Invite friends and earn on their first 3 deposits">Referrals</Title>

      {/* How it works */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: 14, marginBottom: 20 }}>
        {STEPS.map(s => (
          <div key={s.n} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, padding: 18 }}>
            <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#050505', background: `linear-gradient(135deg,${G},#f59e0b)` }}>{s.n}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{s.t}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.45)' }}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Code + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <Label>Your referral code</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: G, letterSpacing: '.12em' }}>{code || '—'}</span>
            {link && (
              <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
                <input readOnly value={link} onFocus={e => e.target.select()} style={{ ...input, flex: 1 }} />
                <Btn onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</Btn>
              </div>
            )}
          </div>
        </div>

        <Stat label="Total referrals"><span style={{ fontSize: 30, fontWeight: 800 }}>{stats.total_referrals}</span></Stat>
        <Stat label="Total earned"><MoneyDisplay cents={stats.total_earned_cents} size="xl" color="#10b981" /></Stat>
        <Stat label="Deposited"><span style={{ fontSize: 30, fontWeight: 800, color: '#10b981' }}>{stats.deposited}</span></Stat>
        <Stat label="Awaiting deposit"><span style={{ fontSize: 30, fontWeight: 800, color: G }}>{stats.awaiting}</span></Stat>
      </div>

      {/* Referred users */}
      <div style={card}>
        <Label>Referred users</Label>
        {loading ? (
          <Empty icon="clock" text="Loading…" />
        ) : refs.length === 0 ? (
          <Empty icon="users" text="No referrals yet — share your code to get started." />
        ) : (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {refs.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, flex: 1, minWidth: 120 }}>{r.name}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.4)' }}>{fmtDate(r.joined_at)}</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: r.has_deposited ? 'rgba(16,185,129,.12)' : 'rgba(251,191,36,.12)', color: r.has_deposited ? '#10b981' : G }}>
                  {r.has_deposited ? `Deposited ×${r.deposits}` : 'Awaiting deposit'}
                </span>
                <div style={{ minWidth: 80, textAlign: 'right' }}><MoneyDisplay cents={r.earned_cents} size="sm" color="#10b981" /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PlayerLayout>
  )
}
