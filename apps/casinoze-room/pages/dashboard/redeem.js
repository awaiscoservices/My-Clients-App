import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import MoneyDisplay from '../../components/ui/MoneyDisplay'
import StatusBadge from '../../components/ui/StatusBadge'
import { getMyGameAccounts } from '../../lib/wallet'
import { useUser, Title, Label, Btn, Notice, Empty, card, input, fmtDate, toCents } from '../../components/ui/kit'
import Link from 'next/link'

export default function Redeem() {
  const user = useUser()
  const [accounts, setAccounts] = useState([])
  const [history, setHistory] = useState([])
  const [acct, setAcct] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    const [accs, { data: h }] = await Promise.all([
      getMyGameAccounts(user.id),
      supabase.from('redemptions').select('*, game_accounts(game_panels(name))').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
    ])
    setAccounts((accs || []).filter(a => a.status === 'active'))
    setHistory(h || [])
  }
  useEffect(() => { if (user) load() }, [user])

  async function submit(e) {
    e.preventDefault()
    setMsg(null)
    const cents = toCents(amount)
    if (!acct) return setMsg({ kind: 'error', text: 'Choose a game account' })
    if (!cents || cents <= 0) return setMsg({ kind: 'error', text: 'Enter a valid amount' })
    setBusy(true)
    const { error } = await supabase.rpc('request_redemption', { p_game_account_id: acct, p_amount_cents: cents, p_notes: notes || null })
    setBusy(false)
    if (error) return setMsg({ kind: 'error', text: error.message })
    setMsg({ kind: 'success', text: 'Redemption requested. Our team will review it shortly.' })
    setAmount(''); setNotes(''); load()
  }

  return (
    <PlayerLayout>
      <Head><title>Redeem — Casinoze Room</title></Head>
      <Title sub="Cash out your winnings from a game account">Redeem</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 20 }}>
        <form onSubmit={submit} style={card}>
          <Notice kind={msg?.kind}>{msg?.text}</Notice>
          {accounts.length === 0 ? (
            <Empty icon="🎮" text={<>You need an active game account first. <Link href="/dashboard/games" style={{ color: '#fbbf24' }}>Browse games →</Link></>} />
          ) : (<>
            <div style={{ marginBottom: 16 }}><Label>Game account</Label>
              <select value={acct} onChange={e => setAcct(e.target.value)} style={input}>
                <option value="">Select…</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.game_panels?.name} — {a.game_username}</option>)}
              </select></div>
            <div style={{ marginBottom: 16 }}><Label>Amount (USD)</Label>
              <input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={input} /></div>
            <div style={{ marginBottom: 20 }}><Label>Notes (optional)</Label>
              <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ ...input, resize: 'vertical' }} /></div>
            <Btn type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Submitting…' : 'Request Redemption'}</Btn>
          </>)}
        </form>
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.06)' }}>Recent requests</div>
          {history.length === 0 ? <Empty text="No redemptions yet" /> : history.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{r.game_accounts?.game_panels?.name || 'Game'}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{fmtDate(r.created_at)}</div></div>
              <div style={{ textAlign: 'right' }}><MoneyDisplay cents={r.amount_cents} size="sm" color="#fbbf24" /><div><StatusBadge status={r.status} size="xs" /></div></div>
            </div>
          ))}
        </div>
      </div>
    </PlayerLayout>
  )
}
