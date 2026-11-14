import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import MoneyDisplay from '../../components/ui/MoneyDisplay'
import Icon from '../../components/ui/Icon'
import { Title, Btn, Empty, card, input, Label, G, fmtDate } from '../../components/ui/kit'

const STEPS = [
  { n: 1, t: 'Share your code', d: 'Send your invite link to a friend', icon: 'send' },
  { n: 2, t: 'They deposit', d: 'Your friend signs up and adds money', icon: 'wallet' },
  { n: 3, t: 'You earn', d: 'Get a bonus on their first 3 deposits', icon: 'gift' },
]

function HowItWorks() {
  return (
    <div className="hiw-wrap">
      <style>{`
        .hiw-wrap { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-bottom: 22px; }
        .hiw-step { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 8px 16px;
          opacity: 0; transform: translateY(14px); animation: hiwIn .55s cubic-bezier(.22,1,.36,1) forwards; }
        .hiw-step:nth-child(1) { animation-delay: .05s; }
        .hiw-step:nth-child(2) { animation-delay: .22s; }
        .hiw-step:nth-child(3) { animation-delay: .39s; }
        @keyframes hiwIn { to { opacity: 1; transform: translateY(0); } }
        .hiw-ring { position: relative; width: 70px; height: 70px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: radial-gradient(circle at 30% 25%, rgba(251,191,36,.22), rgba(255,255,255,.03));
          border: 1.5px solid rgba(251,191,36,.45); color: ${G}; margin-bottom: 14px; z-index: 2; }
        .hiw-ring::before { content: ''; position: absolute; inset: -5px; border-radius: 50%; border: 1.5px solid rgba(251,191,36,.25);
          animation: hiwPulse 2.4s ease-out infinite; }
        .hiw-step:nth-child(2) .hiw-ring::before { animation-delay: .8s; }
        .hiw-step:nth-child(3) .hiw-ring::before { animation-delay: 1.6s; }
        @keyframes hiwPulse { 0% { transform: scale(1); opacity: .6; } 70% { transform: scale(1.25); opacity: 0; } 100% { opacity: 0; } }
        .hiw-num { position: absolute; top: -4px; right: -4px; width: 24px; height: 24px; border-radius: 50%; font-size: 12px; font-weight: 800;
          color: #050505; background: linear-gradient(135deg, ${G}, #f59e0b); display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 10px rgba(245,158,11,.4); z-index: 3; }
        .hiw-t { font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 4px; }
        .hiw-d { font-size: 12.5px; color: rgba(255,255,255,.45); line-height: 1.45; max-width: 190px; }
        /* Connector line behind the rings */
        .hiw-step:not(:last-child)::after { content: ''; position: absolute; top: 43px; left: 50%; width: 100%; height: 2px; z-index: 1;
          background: linear-gradient(90deg, rgba(251,191,36,.5), rgba(251,191,36,.12)); }
        .hiw-step:not(:last-child)::before { content: ''; position: absolute; top: 39px; left: 50%; width: 10px; height: 10px; z-index: 1;
          background: ${G}; border-radius: 50%; box-shadow: 0 0 10px ${G};
          animation: hiwFlow 2.6s linear infinite; }
        .hiw-step:nth-child(2)::before { animation-delay: 1.3s; }
        @keyframes hiwFlow { 0% { left: 50%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: 150%; opacity: 0; } }
        @media (max-width: 620px) {
          .hiw-wrap { grid-template-columns: 1fr; gap: 6px; }
          .hiw-step { flex-direction: row; text-align: left; gap: 16px; padding: 10px 6px; }
          .hiw-ring { margin-bottom: 0; flex-shrink: 0; }
          .hiw-d { max-width: none; }
          .hiw-step:not(:last-child)::after { top: 70px; left: 35px; width: 2px; height: 100%;
            background: linear-gradient(180deg, rgba(251,191,36,.5), rgba(251,191,36,.12)); }
          .hiw-step:not(:last-child)::before { display: none; }
          .hiw-txt { padding-top: 6px; }
        }
      `}</style>
      {STEPS.map(s => (
        <div key={s.n} className="hiw-step">
          <div className="hiw-ring">
            <span className="hiw-num">{s.n}</span>
            <Icon name={s.icon} size={28} />
          </div>
          <div className="hiw-txt">
            <div className="hiw-t">{s.t}</div>
            <div className="hiw-d">{s.d}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, children }) {
  return (
    <div style={{ ...card, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
      <HowItWorks />

      {/* Code + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <Label>Your referral code</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: G, letterSpacing: '.12em' }}>{code || '—'}</span>
            {link && (
              <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
                <input readOnly value={link} onFocus={e => e.target.select()} style={{ ...input, flex: 1 }} />
                <Btn onClick={copy}>{copied ? 'Copied' : 'Copy link'}</Btn>
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
