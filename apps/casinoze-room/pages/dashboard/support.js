import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import { useUser, Title, Label, Btn, Notice, Empty, card, input, fmtDate } from '../../components/ui/kit'

const CATEGORIES = ['Deposit', 'Withdrawal', 'Redeem', 'Game account', 'Verification', 'Other']

export default function Support() {
  const user = useUser()
  const [tickets, setTickets] = useState([])
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    setTickets(data || [])
  }
  useEffect(() => { if (user) load() }, [user])

  async function submit(e) {
    e.preventDefault(); setMsg(null)
    if (!subject.trim() || !message.trim()) return setMsg({ kind: 'error', text: 'Add a subject and a message' })
    setBusy(true)
    const { error } = await supabase.from('support_tickets').insert({ user_id: user.id, subject: subject.trim(), category, message: message.trim() })
    setBusy(false)
    if (error) return setMsg({ kind: 'error', text: error.message })
    setMsg({ kind: 'success', text: 'Ticket sent. We will get back to you soon.' })
    setSubject(''); setMessage(''); load()
  }

  return (
    <PlayerLayout>
      <Head><title>Support — Casinoze Room</title></Head>
      <Title sub="Tell us what you need help with">Support</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 20 }}>
        <form onSubmit={submit} style={card}>
          <Notice kind={msg?.kind}>{msg?.text}</Notice>
          <div style={{ marginBottom: 16 }}><Label>Category</Label><select value={category} onChange={e => setCategory(e.target.value)} style={input}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div style={{ marginBottom: 16 }}><Label>Subject</Label><input value={subject} onChange={e => setSubject(e.target.value)} style={input} /></div>
          <div style={{ marginBottom: 20 }}><Label>Message</Label><textarea rows={5} value={message} onChange={e => setMessage(e.target.value)} style={{ ...input, resize: 'vertical' }} /></div>
          <Btn type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send ticket'}</Btn>
        </form>
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.06)' }}>Your tickets</div>
          {tickets.length === 0 ? <Empty icon="💬" text="No tickets yet" /> : tickets.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
              <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{t.subject}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{t.category} · {fmtDate(t.created_at)}</div>{t.admin_reply && <div style={{ marginTop: 6, fontSize: 12, color: '#fbbf24' }}>Support: {t.admin_reply}</div>}</div>
              <StatusBadge status={t.status} size="xs" />
            </div>
          ))}
        </div>
      </div>
    </PlayerLayout>
  )
}
