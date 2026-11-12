/**
 * /dashboard/chat — Player support chat
 * Changes: file attachment button, image preview, file download links
 */
import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'

const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''

function Bubble({ msg }) {
  const isMe   = msg.sender_type === 'player'
  const isImage = msg.file_type?.startsWith('image/')
  return (
    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      {!isMe && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#b45309,#92400e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
          S
        </div>
      )}
      <div style={{
        maxWidth: '72%', padding: msg.file_url && !msg.body ? '6px' : '10px 14px',
        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isMe ? 'linear-gradient(135deg,#b45309,#92400e)' : 'rgba(255,255,255,.08)',
        border: isMe ? 'none' : '1px solid rgba(255,255,255,.12)',
        fontSize: 14, color: '#fff', lineHeight: 1.5, wordBreak: 'break-word',
      }}>
        {!isMe && msg.body && (
          <div style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Support
          </div>
        )}
        {msg.file_url && isImage && (
          <a href={msg.file_url} target="_blank" rel="noreferrer">
            <img src={msg.file_url} alt={msg.file_name ?? 'image'}
              style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, display: 'block', marginBottom: msg.body ? 8 : 0 }} />
          </a>
        )}
        {msg.file_url && !isImage && (
          <a href={msg.file_url} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,.1)', borderRadius: 10, color: '#fff', textDecoration: 'none', marginBottom: msg.body ? 8 : 0 }}>
            <span style={{ fontSize: 20 }}>📎</span>
            <span style={{ fontSize: 12, wordBreak: 'break-all' }}>{msg.file_name ?? 'Attachment'}</span>
          </a>
        )}
        {msg.body && <span>{msg.body}</span>}
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
          {fmtTime(msg.created_at)}
        </div>
      </div>
    </div>
  )
}

export default function PlayerChat() {
  const [conv, setConv]         = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [body, setBody]         = useState('')
  const [sending, setSending]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState('')
  const bottomRef               = useRef(null)
  const channelRef              = useRef(null)
  const fileRef                 = useRef(null)

  useEffect(() => {
    async function init() {
      setLoading(true); setError('')
      try {
        const cr = await fetch('/api/chat/conversations')
        const cd = await cr.json()
        if (cd.error) { setError(cd.error); setLoading(false); return }
        setConv(cd.conversation)
        const mr = await fetch(`/api/chat/messages?conversationId=${cd.conversation.id}`)
        const md = await mr.json()
        if (md.error) { setError(md.error); setLoading(false); return }
        setMessages(md.messages ?? [])
      } catch { setError('Failed to load chat. Please refresh.') }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!conv) return
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
    const ch = supabase.channel(`player-chat-${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conv.id}` },
        (payload) => {
          setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
        })
      .subscribe()
    channelRef.current = ch
    return () => { supabase.removeChannel(ch); channelRef.current = null }
  }, [conv?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!body.trim() || !conv || sending) return
    setSending(true); setError('')
    try {
      const r = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conv.id, body: body.trim() }),
      })
      const d = await r.json()
      if (d.error) { setError(d.error); setSending(false); return }
      setBody('')
      setMessages(prev => prev.find(m => m.id === d.message.id) ? prev : [...prev, d.message])
    } catch { setError('Failed to send. Please try again.') }
    setSending(false)
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file || !conv) return
    setUploading(true); setError('')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await fetch('/api/chat/upload', { method: 'POST', body: fd })
      const up = await r.json()
      if (up.error) { setError(up.error); setUploading(false); return }
      const r2 = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conv.id, body: '', fileUrl: up.url, fileName: up.name, fileType: up.type }),
      })
      const d = await r2.json()
      if (d.error) { setError(d.error); setUploading(false); return }
      setMessages(prev => prev.find(m => m.id === d.message.id) ? prev : [...prev, d.message])
    } catch { setError('Upload failed. Please try again.') }
    setUploading(false)
    e.target.value = ''
  }

  const PANEL = { background: 'linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.018))', border: '1px solid rgba(251,191,36,.13)', borderRadius: 20 }

  return (
    <PlayerLayout>
      <Head><title>Support Chat</title></Head>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 32px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Support Chat</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginTop: 4 }}>Chat with our support team — we typically reply within a few minutes.</p>
        </div>
        <div style={{ ...PANEL, display: 'flex', flexDirection: 'column', height: '65vh', minHeight: 400 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Support is online</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {loading && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: 13, padding: 32 }}>Connecting…</div>}
            {!loading && messages.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: 13, padding: 32 }}>👋 Hi! Send a message to start chatting with our support team.</div>}
            {messages.map(m => <Bubble key={m.id} msg={m} />)}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div style={{ margin: '0 16px', padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.txt" style={{ display: 'none' }} onChange={handleFile} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || loading}
              title="Attach file"
              style={{ flexShrink: 0, width: 40, height: 40, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: (uploading || loading) ? 'rgba(255,255,255,.3)' : '#fff', fontSize: 18, cursor: (uploading || loading) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {uploading ? '…' : '📎'}
            </button>
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Type a message…"
              maxLength={2000}
              disabled={sending || loading}
              style={{ flex: 1, padding: '11px 16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: "'Outfit',sans-serif", outline: 'none' }}
            />
            <button type="submit" disabled={!body.trim() || sending || loading}
              style={{ padding: '11px 22px', background: (body.trim() && !sending) ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'rgba(255,255,255,.07)', border: 'none', borderRadius: 12, color: (body.trim() && !sending) ? '#000' : 'rgba(255,255,255,.35)', fontWeight: 800, fontSize: 14, cursor: (body.trim() && !sending) ? 'pointer' : 'default', fontFamily: "'Outfit',sans-serif", transition: 'all .15s' }}>
              {sending ? '…' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </PlayerLayout>
  )
}
