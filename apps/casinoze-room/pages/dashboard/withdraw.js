import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import MoneyDisplay from '../../components/ui/MoneyDisplay'
import StatusBadge from '../../components/ui/StatusBadge'
import { useUser, Title, Label, Btn, Notice, Empty, card, input, fmtDate, toCents } from '../../components/ui/kit'

// The methods come from the casino's own Payment Methods, filtered to those
// marked allow_withdraw. They were a hardcoded list here, which is why the
// wallet page offered one set and this page a different one.

export default function Withdraw() {
  const user = useUser()
  const [wallet, setWallet] = useState(null)
  const [kyc, setKyc] = useState(null)
  const [history, setHistory] = useState([])
  const router = useRouter()
  const [methods, setMethods] = useState([])
  const [methodId, setMethodId] = useState('')
  const [dest, setDest] = useState('')
  const [amount, setAmount] = useState('')
  const [qr, setQr] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()

    const [{ data: w }, { data: p }, { data: h }, methodRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user.id).single(),
      supabase.from('profiles').select('kyc_status').eq('id', user.id).single(),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
      fetch('/api/payment-methods/list?for=withdraw', {
        headers: { Authorization: 'Bearer ' + session?.access_token },
      }),
    ])

    setWallet(w); setKyc(p?.kyc_status); setHistory(h || [])

    const md = methodRes.ok ? await methodRes.json() : { methods: [] }
    setMethods(md.methods || [])

    // The wallet page may pass one along; otherwise take the first.
    const wanted = router.query.method
    const exists = (md.methods || []).some(m => m.id === wanted)
    setMethodId(exists ? wanted : (md.methods?.[0]?.id || ''))
  }
  useEffect(() => { if (user && router.isReady) load() }, [user, router.isReady])

  async function uploadQr(file) {
    if (!file) return
    setUploading(true); setMsg(null)
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/withdraw/upload-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ file_base64: base64, file_type: file.type, file_name: file.name }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Upload failed')
      setQr({ path: d.path, name: file.name })
    } catch (err) {
      setMsg({ kind: 'error', text: err.message })
    } finally {
      setUploading(false)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setMsg(null)
    const cents = toCents(amount)
    if (!cents || cents <= 0) return setMsg({ kind: 'error', text: 'Enter a valid amount' })
    if (!methodId) return setMsg({ kind: 'error', text: 'Choose how you want paying' })
    if (!dest.trim() && !qr) return setMsg({ kind: 'error', text: 'Enter your payout details, or upload a QR code' })

    setBusy(true)
    // Through the route rather than the database function: it checks the
    // method allows withdrawals, applies the level and daily limits, works
    // out the bonus-to-cash split and reserves the money. The function did
    // none of that.
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/withdraw/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
      body: JSON.stringify({
        payment_method_id: methodId,
        amount_cents: cents,
        destination: dest.trim(),
        qr_path: qr?.path || null,
        idempotency_key: 'wd-' + user.id + '-' + Date.now(),
      }),
    })
    const d = await res.json()
    setBusy(false)
    if (!res.ok) return setMsg({ kind: 'error', text: d.error || 'Could not submit' })
    setMsg({ kind: 'success', text: 'Withdrawal requested. The amount is held until it is reviewed.' })
    setAmount(''); setDest(''); setQr(null); load()
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
          <div style={{ marginBottom: 16 }}>
            <Label>Payout method</Label>
            {methods.length === 0 ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', padding: '10px 0' }}>
                This casino has no withdrawal methods set up yet.
              </div>
            ) : (
              <select value={methodId} onChange={e => setMethodId(e.target.value)} style={input}>
                {methods.map(m => <option key={m.id} value={m.id} style={{ background: '#0e1a2e' }}>{m.name}</option>)}
              </select>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <Label>Your payout details</Label>
            <input value={dest} onChange={e => setDest(e.target.value)} style={input}
              placeholder="Your tag, address or account" />
            <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,.3)' }}>
              Asked each time, so a payout never goes to an account you have stopped using.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Label>QR code (optional)</Label>
            <input type="file" accept="image/*" disabled={uploading}
              onChange={e => uploadQr(e.target.files?.[0])}
              style={{ ...input, padding: '9px 10px' }} />
            <p style={{ margin: '6px 0 0', fontSize: 11.5, color: qr ? '#10b981' : 'rgba(255,255,255,.3)' }}>
              {uploading ? 'Uploading…' : qr ? 'Attached: ' + qr.name : 'Easier than typing a long crypto address.'}
            </p>
          </div>
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
