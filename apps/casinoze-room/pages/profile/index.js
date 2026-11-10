import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import { useUser, Title, Label, Btn, Notice, card, input, G } from '../../components/ui/kit'

const initials = (name, email) => ((name || email || 'U').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('') || 'U').toUpperCase()

export default function Profile() {
  const user = useUser()
  const [p, setP] = useState(null)
  const [level, setLevel] = useState(null)
  const [next, setNext] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setP(prof); setName(prof?.full_name || ''); setPhone(prof?.phone || '')
      const xp = prof?.total_xp || 0
      if (prof?.player_level_id) {
        const { data } = await supabase.from('player_levels').select('*').eq('id', prof.player_level_id).single()
        setLevel(data)
      }
      const { data: nx } = await supabase.from('player_levels').select('*').gt('xp_required', xp).order('xp_required', { ascending: true }).limit(1)
      setNext(nx?.[0] || null)
    })()
  }, [user])

  async function save(e) {
    e.preventDefault(); setMsg(null)
    if (name.trim().length < 2) return setMsg({ kind: 'error', text: 'Please enter your full name' })
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ full_name: name.trim(), phone: phone.trim() || null }).eq('id', user.id)
    setBusy(false)
    setMsg(error ? { kind: 'error', text: error.message } : { kind: 'success', text: 'Profile saved' })
  }
  async function copy() { try { await navigator.clipboard.writeText(p.referral_code); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {} }

  const xp = p?.total_xp || 0
  const from = level?.xp_required || 0
  const pct = next ? Math.min(100, Math.max(0, ((xp - from) / Math.max(1, next.xp_required - from)) * 100)) : 100
  const kyc = p?.kyc_status || 'not_started'
  const color = level?.badge_color || G

  return (
    <PlayerLayout>
      <Head><title>My Profile — Casinoze Room</title></Head>
      <Title sub="Your details, verification and level">My Profile</Title>

      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#fbbf24,#b45309)', color: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, border: '3px solid rgba(251,191,36,.5)', flexShrink: 0 }}>{initials(p?.full_name, user?.email)}</div>
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, wordBreak: 'break-word' }}>{p?.full_name || 'Player'}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', wordBreak: 'break-all' }}>{user?.email}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusBadge status={kyc} />
          <Link href="/profile/kyc" style={{ color: G, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{kyc === 'verified' ? 'View' : kyc === 'pending' ? 'View status' : 'Verify identity'} →</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 20 }}>
        <form onSubmit={save} style={card}>
          <Notice kind={msg?.kind}>{msg?.text}</Notice>
          <div style={{ marginBottom: 16 }}><Label>Full name</Label><input value={name} onChange={e => setName(e.target.value)} style={input} /></div>
          <div style={{ marginBottom: 16 }}><Label>Email</Label><input value={user?.email || ''} disabled style={{ ...input, opacity: .6 }} /></div>
          <div style={{ marginBottom: 20 }}><Label>Phone</Label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={input} /></div>
          <Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Btn>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={card}>
            <Label>Player level</Label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color }}>{level?.name || 'Level 1'}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>{xp.toLocaleString()} XP</span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${color},#f59e0b)`, transition: 'width .6s' }} />
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 8 }}>{next ? `${(next.xp_required - xp).toLocaleString()} XP to reach ${next.name}` : 'You are at the top level 👑'}</div>
          </div>

          <div style={card}>
            <Label>Your referral code</Label>
            {p?.referral_code ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: G, letterSpacing: '.1em', wordBreak: 'break-all' }}>{p.referral_code}</span>
                <Btn type="button" ghost onClick={copy} style={{ padding: '8px 16px', fontSize: 13 }}>{copied ? 'Copied ✓' : 'Copy'}</Btn>
              </div>
            ) : <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>Your code is being generated.</div>}
          </div>
        </div>
      </div>
    </PlayerLayout>
  )
}
