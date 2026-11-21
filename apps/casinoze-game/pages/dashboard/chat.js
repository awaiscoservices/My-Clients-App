/**
 * /dashboard/chat — Player support chat
 * Changes: file attachment button, image preview, file download links
 */
import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'

const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''

// Inline SVG paperclip — the 📎 emoji rendered as a broken box on some
// phones/browsers, so the attach icon showed nothing. An SVG always draws.
function Paperclip({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block' }} aria-hidden="true">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

// Small, dependency-free emoji picker.
const EMOJIS = ['😀','😁','😂','🤣','😊','😍','😘','😎','🤩','🥳','😅','😭','😉','😴','🤔','🙏','👍','👎','👌','🙌','👏','💪','👋','🤝','🔥','💯','✅','❌','⭐','🎉','🎁','💰','💵','🤑','🥰','😇','😳','🤗','😢','😡','❤️','💖','😬','🙈','🫶','😄','🤭','😤']

function EmojiButton({ onPick, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button type="button" onClick={() => setOpen(o => !o)} disabled={disabled} title="Emoji"
        style={{ width: 40, height: 40, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: '#fff', cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01M15 9h.01" /></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, width: 268, background: '#0e1a2e', border: '1px solid rgba(251,191,36,.25)', borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,.6)', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 2, zIndex: 30 }}>
          {EMOJIS.map(em => (
            <button key={em} type="button" onClick={() => { onPick(em); setOpen(false) }}
              style={{ background: 'transparent', border: 'none', fontSize: 20, lineHeight: 1, padding: '5px 0', cursor: 'pointer', borderRadius: 6 }}>
              {em}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// WhatsApp-style ticks: grey ✓✓ = delivered, blue ✓✓ = seen (read_at set).
function Ticks({ read }) {
  return (
    <span style={{ marginLeft: 5, display: 'inline-flex', color: read ? '#53bdeb' : 'rgba(255,255,255,.5)' }}>
      <svg width="18" height="11" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 7l3.2 3.2L11 3.5" /><path d="M7.5 10L8 10.2 14.8 3.5" /></svg>
    </span>
  )
}

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
            <Paperclip size={20} />
            <span style={{ fontSize: 12, wordBreak: 'break-all' }}>{msg.file_name ?? 'Attachment'}</span>
          </a>
        )}
        {msg.body && <span>{msg.body}</span>}
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
          {fmtTime(msg.created_at)}
          {isMe && <Ticks read={!!msg.read_at} />}
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
  const justOpenedRef           = useRef(false)  // jump to newest instantly on open

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
        justOpenedRef.current = true          // first paint jumps straight to newest
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conv.id}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            // read_at flips when support opens the thread — turn ticks blue.
            setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m))
            return
          }
          setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
        })
      .subscribe()
    channelRef.current = ch
    return () => { supabase.removeChannel(ch); channelRef.current = null }
  }, [conv?.id])

  // Safety-net poll: reload the thread every 5s and merge only when something
  // changed, so a support reply shows live even if the realtime drops.
  useEffect(() => {
    if (!conv) return
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/chat/messages?conversationId=${conv.id}`)
        const d = await r.json()
        if (!Array.isArray(d.messages)) return
        setMessages(prev => {
          const b = prev[prev.length - 1], n = d.messages[d.messages.length - 1]
          const same = prev.length === d.messages.length && (!n || (b && b.id === n.id && b.read_at === n.read_at))
          return same ? prev : d.messages
        })
      } catch {}
    }, 5000)
    return () => clearInterval(poll)
  }, [conv?.id])

  // On open, snap straight to the newest message (like WhatsApp) — no animated
  // scroll through the whole history. New messages while open glide in.
  useEffect(() => {
    if (!messages.length) return
    const end = bottomRef.current
    if (!end) return
    if (justOpenedRef.current) {
      justOpenedRef.current = false
      // Set scrollTop directly so the jump is instant even though the app sets
      // scroll-behavior:smooth — scrollIntoView() would otherwise animate.
      const box = end.parentElement
      if (box) box.scrollTop = box.scrollHeight
      else end.scrollIntoView()
    } else {
      end.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

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
      {/* On the chat route, lock the whole screen to the viewport so only the
          message list scrolls — the input bar then stays put on mobile instead
          of sliding away with a page scroll. These override the layout's own
          scrolling and only apply while this page is mounted. */}
      <style>{`
        .player-main { height: 100dvh; overflow: hidden; display: flex; flex-direction: column; }
        .player-content { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
      `}</style>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 0, width: '100%', boxSizing: 'border-box', flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ ...PANEL, display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Support is online</span>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px' }}>
            {loading && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: 13, padding: 32 }}>Connecting…</div>}
            {!loading && messages.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: 13, padding: 32 }}>Hi! Send a message to start chatting with our support team.</div>}
            {messages.map(m => <Bubble key={m.id} msg={m} />)}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div style={{ margin: '0 16px', padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg> {error}
            </div>
          )}

          <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.txt" style={{ display: 'none' }} onChange={handleFile} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || loading}
              title="Attach file"
              style={{ flexShrink: 0, width: 40, height: 40, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: (uploading || loading) ? 'rgba(255,255,255,.3)' : '#fff', fontSize: 18, cursor: (uploading || loading) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {uploading ? '…' : <Paperclip size={18} />}
            </button>
            <EmojiButton disabled={sending || loading} onPick={em => setBody(b => b + em)} />
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Type a message…"
              maxLength={2000}
              disabled={sending || loading}
              style={{ flex: 1, minWidth: 0, padding: '11px 16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontFamily: "'Outfit',sans-serif", outline: 'none' }}
            />
            <button type="submit" disabled={!body.trim() || sending || loading}
              style={{ flexShrink: 0, padding: '11px 18px', background: (body.trim() && !sending) ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'rgba(255,255,255,.07)', border: 'none', borderRadius: 12, color: (body.trim() && !sending) ? '#000' : 'rgba(255,255,255,.35)', fontWeight: 800, fontSize: 14, cursor: (body.trim() && !sending) ? 'pointer' : 'default', fontFamily: "'Outfit',sans-serif", transition: 'all .15s' }}>
              {sending ? '…' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </PlayerLayout>
  )
}
