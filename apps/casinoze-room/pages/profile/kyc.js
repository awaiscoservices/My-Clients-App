import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import { useUser, Title, Label, Btn, Notice, card, input, fmtDate } from '../../components/ui/kit'

const MAX = 8 * 1024 * 1024
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export default function KycSubmit() {
  const user = useUser()
  const [latest, setLatest] = useState(undefined)   // undefined = loading, null = never submitted
  const [front, setFront] = useState(null)
  const [back, setBack] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    const { data } = await supabase.from('kyc_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
    setLatest(data?.[0] || null)
  }
  useEffect(() => { if (user) load() }, [user])

  const locked = latest && ['pending', 'verified'].includes(latest.status)

  function pick(setter) {
    return e => {
      const f = e.target.files?.[0]; if (!f) return setter(null)
      if (!OK_TYPES.includes(f.type)) { setMsg({ kind: 'error', text: 'Please upload a JPG, PNG, WebP or PDF file' }); e.target.value = ''; return setter(null) }
      if (f.size > MAX) { setMsg({ kind: 'error', text: 'Each file must be under 8 MB' }); e.target.value = ''; return setter(null) }
      setMsg(null); setter(f)
    }
  }
  async function upload(file, tag) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${user.id}/${Date.now()}-${tag}.${ext}`
    const { error } = await supabase.storage.from('kyc-documents').upload(path, file)
    if (error) throw error
    return path
  }
  async function submit(e) {
    e.preventDefault(); setMsg(null)
    if (locked) return
    if (!front || !back) return setMsg({ kind: 'error', text: 'Please upload both the front and the back of your ID' })
    setBusy(true)
    try {
      const front_path = await upload(front, 'front')
      const back_path = await upload(back, 'back')
      const { error } = await supabase.from('kyc_records').insert({ user_id: user.id, front_path, back_path, status: 'pending' })
      if (error) throw error
      setFront(null); setBack(null); await load()
    } catch (err) { setMsg({ kind: 'error', text: err.message || 'Upload failed. Please try again.' }) }
    setBusy(false)
  }

  return (
    <PlayerLayout>
      <Head><title>Verify Identity — Casinoze Room</title></Head>
      <Title sub="Upload your ID to unlock withdrawals">Identity Verification</Title>
      <div style={{ maxWidth: 560 }}>
        {latest && (
          <div style={{ ...card, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div><div style={{ fontWeight: 700 }}>Latest submission</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{fmtDate(latest.created_at)}</div></div>
            <StatusBadge status={latest.status} />
          </div>
        )}
        {latest?.status === 'pending' && <Notice>Your documents are under review. You can’t submit again until we’ve checked them.</Notice>}
        {latest?.status === 'verified' && <Notice kind="success">You’re verified. Withdrawals are unlocked. <Link href="/dashboard/withdraw" style={{ color: '#10b981', fontWeight: 800 }}>Go to Withdraw →</Link></Notice>}
        {latest && ['rejected', 'more_info_required'].includes(latest.status) && <Notice kind="error">{latest.status === 'rejected' ? 'Your last submission was rejected' : 'We need more information'}{latest.rejection_reason ? `: ${latest.rejection_reason}` : '.'} Please submit again below.</Notice>}

        <form onSubmit={submit} style={{ ...card, opacity: locked ? .5 : 1 }}>
          <Notice kind={msg?.kind}>{msg?.text}</Notice>
          <div style={{ marginBottom: 16 }}><Label>ID — front</Label><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={locked || busy} onChange={pick(setFront)} style={input} /></div>
          <div style={{ marginBottom: 14 }}><Label>ID — back</Label><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={locked || busy} onChange={pick(setBack)} style={input} /></div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 18 }}>Use a government-issued ID (driver’s license, passport or national ID). JPG, PNG, WebP or PDF, up to 8 MB each. Make sure all four corners and the text are clearly visible.</div>
          <Btn type="submit" disabled={locked || busy || latest === undefined}>{busy ? 'Uploading…' : locked ? (latest.status === 'verified' ? 'Already verified' : 'Under review') : 'Submit for verification'}</Btn>
        </form>
        <div style={{ marginTop: 16 }}><Link href="/profile" style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>← Back to profile</Link></div>
      </div>
    </PlayerLayout>
  )
}
