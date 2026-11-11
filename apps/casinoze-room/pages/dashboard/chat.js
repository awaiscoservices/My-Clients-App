/**
 * /dashboard/chat — Player support chat
 *
 * - Loads or creates the player's conversation via /api/chat/conversations
 * - Fetches message history via /api/chat/messages
 * - Subscribes to new messages in real-time via Supabase anon key channel
 *   (RLS ensures they only receive their own conversation's messages)
 * - Sends messages via /api/chat/messages (POST)
 *
 * Uses anon key (supabase browser client) for real-time — NOT service-role.
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''

// ─── Bubble ───────────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isMe = msg.sender_type === 'player'
  return (
    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      {!isMe && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#b45309,#92400e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
          S
        </div>
      )}
      <div style={{
        maxWidth: '72%', padding: '10px 14px',
        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isMe ? 'linear-gradient(135deg,#b45309,#92400e)' : 'rgba(255,255,255,.08)',
        border: isMe ? 'none' : '1px solid rgba(255,255,255,.12)',
        fontSize: 14, color: '#fff', lineHeight: 1.5, wordBreak: 'break-word',
      }}>
        {!isMe && (
          <div style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Support
          </div>
        )}
        {msg.body}
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
          {fmtTime(msg.created_at)}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlayerChat() {
  const [conv, setConv]           = useState(null)
  const [messages, setMessages]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [body, setBody]           = useState('')
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState('')
  const bottomRef                 = useRef(null)
  const channelRef                = useRef(null)

  // Load or create conversation, then load messages
  useEffect(() => {
    async function init() {
      setLoading(true)
      setError('')
      try {
        const cr = await fetch('/api/chat/conversations')
        const cd = await cr.json()
        if (cd.error) { setError(cd.error); setLoading(false); return }

        const conversation = cd.conversation
        setConv(conversation)

        const mr = await fetch(`/api/chat/messages?conversationId=${conversation.id}`)
        const md = await mr.json()
        if (md.error) { setError(md.error); setLoading(false); return }
        setMessages(md.messages ?? [])
      } catch (e) {
        setError('Failed to load chat. Please refresh.')
      }
      setLoading(false)
    }
    init()
  }, [])

  // Real-time subscription — anon key, governed by RLS
  useEffect(() => {
    if (!conv) return
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const ch = supabase
      .channel(`player-chat-${conv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conv.id}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .subscribe()

    channelRef.current = ch
    return () => {
      supabase.removeChannel(ch)
      channelRef.current = null
    }
  }, [conv?.id])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!body.trim() || !conv || sending) return
    setSending(true)
    setError('')
    try {
      const r = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conv.id, body: body.trim() }),
      })
      const d = await r.json()
      if (d.error) { setError(d.error); setSending(false); return }
      setBody('')
      // Optimistic — real-time will also fire, dedup by id
      setMessages(prev => prev.find(m => m.id === d.message.id) ? prev : [...prev, d.message])
    } catch {
      setError('Failed to send. Please try again.')
    }
    setSending(false)
  }

  const PANEL = { background: 'linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.018))', border: '1px solid rgba(251,191,36,.13)', borderRadius: 20 }

  return (
    <PlayerLayout>
      <Head><title>Support Chat</title></Head>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 32px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>
            Support Chat
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginTop: 4 }}>
            Chat with our support team — we typically reply within a few minutes.
          </p>
        </div>

        <div style={{ ...PANEL, display: 'flex', flexDirection: 'column', height: '65vh', minHeight: 400 }}>
          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Support is online</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {loading && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: 13, padding: 32 }}>
                Connecting…
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: 13, padding: 32 }}>
                👋 Hi! Send a message to start chatting with our support team.
              </div>
            )}
            {messages.map(m => <Bubble key={m.id} msg={m} />)}
            <div ref={bottomRef} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ margin: '0 16px', padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 10 }}>
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
