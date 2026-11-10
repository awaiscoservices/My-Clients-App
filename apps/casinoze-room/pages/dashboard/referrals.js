import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import MoneyDisplay from '../../components/ui/MoneyDisplay'
import { useUser, Title, Btn, Notice, card, input, Label } from '../../components/ui/kit'

export default function Referrals() {
  const user = useUser()
  const [code, setCode] = useState(null)
  const [earned, setEarned] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('referral_code').eq('id', user.id).single().then(({ data }) => setCode(data?.referral_code))
    supabase.from('ledger').select('amount_cents').eq('user_id', user.id).eq('type', 'referral_bonus').eq('direction', 'credit')
      .then(({ data }) => setEarned((data || []).reduce((s, r) => s + r.amount_cents, 0)))
  }, [user])

  const link = code && typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${code}` : ''
  async function copy() { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <PlayerLayout>
      <Head><title>Referrals — Casinoze Room</title></Head>
      <Title sub="Invite friends and earn referral bonuses">Referrals</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 20 }}>
        <div style={card}>
          <Label>Your referral code</Label>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24', letterSpacing: '.1em', marginBottom: 16 }}>{code || '—'}</div>
          {code ? (<>
            <Label>Your invite link</Label>
            <input readOnly value={link} style={{ ...input, marginBottom: 12 }} onFocus={e => e.target.select()} />
            <Btn onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</Btn>
          </>) : <Notice>Your referral code is being generated.</Notice>}
        </div>
        <div style={card}>
          <Label>Referral bonuses earned</Label>
          <MoneyDisplay cents={earned} size="xl" color="#10b981" />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 10 }}>Bonuses appear in your Transactions once your friend's deposit is approved.</p>
        </div>
      </div>
    </PlayerLayout>
  )
}
