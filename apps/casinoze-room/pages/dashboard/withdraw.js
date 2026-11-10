import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import MoneyDisplay from '../../components/ui/MoneyDisplay'
import StatusBadge from '../../components/ui/StatusBadge'
import { useUser, Title, Label, Btn, Notice, Empty, card, input, fmtDate, toCents } from '../../components/ui/kit'

// Edit this list to match the payout methods you support
const METHODS = ['Cash App', 'PayPal', 'Zelle', 'Bank Transfer', 'Crypto']

export default function Withdraw() {
  const user = useUser()
  const [wallet, setWallet] = useState(null)
  const [kyc, setKyc] = useState(null)
  const [history, setHistory] = useState([])
  const [method, setMethod] = useState(METHODS[0])
  const [dest, setDest] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    const [{ data: w }, { data: p }, { data: h }] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user.id).single(),
      supabase.from('profiles').select('kyc_status').eq('id', user.id).single(),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
    ])
    setWallet(w); setKyc(p?.kyc_status); setHistory(h || [])
  }
  useEffect(() => { if (user) load() }, [user])

  async function submit(e) {
    e.preventDefault()
    setMsg(null)
    const cents = toCents(amount)
    if (!cents || cents <= 0) return setMsg({ kind: 'error', text: 'Enter a valid amount' })
    if (!dest.trim()) return setMsg({ kind: 'error', text: 'Enter your payout details' })
    setBusy(true)
    const { error } = await supabase.rpc('request_withdrawal', { p_amount_cents: cents, p_method: method, p_destination: dest.trim() })
    setBusy(false)
    if (error) return setMsg({ kind: 'error', text: error.message })
    setMsg({ kind: 'success', text: 'Withdrawal requested. The amount is held until it is reviewed.' })
    setAmount(''); setDest(''); load()
  }

  const verified = kyc === 'verified'
  return (
    <PlayerLayout>
      <Head><title>Withdraw — Casinoze Room</title></Head>
      <Title sub="Send your withdrawable balance to your own account">Withdraw</Title>
      {kyc && !verified && (
        <Notice kind="info">Identity verification is required before you can withdraw. <Link href="/dashboard/kyc" style={{ color: '#fbbf24', fontWeight: 800 }}>Verify now →</Link></Notice>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 20 }}>
        <form onSubmit={submit} style={card}>
          <div style={{ marginBottom: 18 }}><Label>Withdrawable balance</Label><MoneyDisplay cents={wallet?.withdrawable_cents || 0} size="xl" color="#10b981" /></div>
          <Notice kind={msg?.kind}>{msg?.text}</Notice>
          <div style={{ marginBottom: 16 }}><Label>Payout method</Label>
            <select value={method} onChange={e => setMethod(e.target.value)} style={input}>{METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
          <div style={{ marginBottom: 16 }}><Label>Account / handle / address</Label>
            <input value={dest} onChange={e => setDest(e.target.value)} placeholder="e.g. $yourcashtag" style={input} /></div>
          <div style={{ marginBottom: 20 }}><Label>Amount (USD)</Label>
            <input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={input} /></div>
          <Btn type="submit" disabled={busy || !verified} style={{ width: '100%' }}>{busy ? 'Submitting…' : 'Request Withdrawal'}</Btn>
        </form>
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.06)' }}>Recent requests</div>
          {history.length === 0 ? <Empty text="No withdrawals yet" /> : history.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{r.method}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{fmtDate(r.created_at)}</div></div>
              <div style={{ textAlign: 'right' }}><MoneyDisplay cents={r.amount_cents} size="sm" color="#fbbf24" /><div><StatusBadge status={r.status} size="xs" /></div></div>
            </div>
          ))}
        </div>
      </div>
    </PlayerLayout>
  )
}
