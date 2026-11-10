import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import MoneyDisplay, { centsToDisplay } from '../../components/ui/MoneyDisplay'
import StatusBadge from '../../components/ui/StatusBadge'
import { getMyGameAccounts } from '../../lib/wallet'
import { useUser, Title, Label, Btn, Notice, Empty, card, input, fmtDate, toCents } from '../../components/ui/kit'

const QUICK = [10, 20, 50, 100]

export default function LoadGame() {
  const user = useUser()
  const router = useRouter()
  const [accounts, setAccounts] = useState([])
  const [wallet, setWallet] = useState(null)
  const [history, setHistory] = useState([])
  const [acct, setAcct] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    const [accs, { data: w }, { data: h }] = await Promise.all([
      getMyGameAccounts(user.id),
      supabase.from('wallets').select('*').eq('user_id', user.id).single(),
      supabase.from('game_loads').select('*, game_accounts(game_panels(name))').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
    ])
    const active = (accs || []).filter(a => a.status === 'active')
    setAccounts(active); setWallet(w); setHistory(h || [])
    const pre = router.query.account
    if (pre && active.some(a => a.id === pre)) setAcct(pre)
  }
  useEffect(() => { if (user && router.isReady) load() }, [user, router.isReady])

  const selected = accounts.find(a => a.id === acct)
  const min = selected?.game_panels?.min_load_cents || 0

  async function submit(e) {
    e.preventDefault(); setMsg(null)
    const cents = toCents(amount)
    if (!acct) return setMsg({ kind: 'error', text: 'Choose a game account' })
    if (!cents || cents <= 0) return setMsg({ kind: 'error', text: 'Enter a valid amount' })
    if (cents < min) return setMsg({ kind: 'error', text: `Minimum load for this game is ${centsToDisplay(min)}` })
    setBusy(true)
    const { error } = await supabase.rpc('request_game_load', { p_game_account_id: acct, p_amount_cents: cents })
    setBusy(false)
    if (error) return setMsg({ kind: 'error', text: error.message })
    setMsg({ kind: 'success', text: 'Load requested. Credits are added to your game once our team processes it.' })
    setAmount(''); load()
  }

  return (
    <PlayerLayout>
      <Head><title>Load Game — Casinoze Room</title></Head>
      <Title sub="Move cash from your wallet into a game account">Load Game</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 20 }}>
        <form onSubmit={submit} style={card}>
          <div style={{ marginBottom: 18 }}><Label>Cash balance</Label><MoneyDisplay cents={wallet?.cash_balance_cents || 0} size="xl" color="#10b981" /></div>
          <Notice kind={msg?.kind}>{msg?.text}</Notice>
          {accounts.length === 0 ? (
            <Empty icon="🎮" text={<>You need an active game account first. <Link href="/dashboard/games" style={{ color: '#fbbf24' }}>Browse games →</Link></>} />
          ) : (<>
            <div style={{ marginBottom: 16 }}><Label>Game account</Label>
              <select value={acct} onChange={e => setAcct(e.target.value)} style={input}>
                <option value="">Select…</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.game_panels?.name} — {a.game_username}</option>)}
              </select>
              {selected && min > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 6 }}>Minimum load: {centsToDisplay(min)}</div>}</div>
            <div style={{ marginBottom: 12 }}><Label>Amount (USD)</Label>
              <input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={input} /></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {QUICK.map(q => <Btn key={q} type="button" ghost onClick={() => setAmount(String(q))} style={{ flex: 1, padding: '8px 0', fontSize: 13 }}>${q}</Btn>)}
            </div>
            <Btn type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Submitting…' : 'Load Credits'}</Btn>
            <div style={{ textAlign: 'center', marginTop: 14 }}><Link href="/dashboard/deposit" style={{ color: '#fbbf24', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Need more cash? Add money →</Link></div>
          </>)}
        </form>
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.06)' }}>Recent loads</div>
          {history.length === 0 ? <Empty text="No loads yet" /> : history.map(r => (
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
