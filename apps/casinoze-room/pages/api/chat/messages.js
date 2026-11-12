/**
 * GET  /api/chat/messages?conversationId=<uuid>
 *   Load messages for the player's own conversation.
 *   RLS ensures they can only read their own conversation's messages.
 *
 * POST /api/chat/messages
 *   Body: { conversationId, body }
 *   Send a player message. tenant_id comes from the conversation row,
 *   never from the request body.
 *
 * Uses anon key + session cookie — NOT the service-role key.
 * RLS enforces that the player can only read/write their own conversation.
 *
 * Scoped by:
 *   - GET: RLS policy "player_read_own_messages"
 *   - POST: RLS policy "player_insert_message" + explicit ownership check
 * NOT scoped: nothing — RLS handles it at the DB level for real-time safety.
 */
import { createPagesServerClient } from '../../../lib/supabaseServer'

export default async function handler(req, res) {
  if (req.method === 'GET') return getMessages(req, res)
  if (req.method === 'POST') return sendMessage(req, res)
  return res.status(405).json({ error: 'Method not allowed' })
}

async function getMessages(req, res) {
  const sb = createPagesServerClient({ req, res })

  const { data: { session } } = await sb.auth.getSession()
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const { conversationId } = req.query
  if (!conversationId) return res.status(400).json({ error: 'conversationId required' })

  // Verify this conversation belongs to the player (RLS also enforces this)
  const { data: conv } = await sb
    .from('chat_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (!conv) return res.status(404).json({ error: 'Conversation not found' })

  const { data: messages, error } = await sb
    .from('chat_messages')
    .select('id, sender_id, sender_type, body, file_url, file_name, file_type, read_at, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  // Mark unread staff messages as read, so support sees the blue (seen) ticks.
  const unreadIds = (messages ?? [])
    .filter(m => m.sender_type === 'staff' && !m.read_at)
    .map(m => m.id)

  if (unreadIds.length) {
    sb.from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds)
      .then(() => {})
  }

  return res.json({ messages: messages ?? [] })
}

async function sendMessage(req, res) {
  const sb = createPagesServerClient({ req, res })

  const { data: { session } } = await sb.auth.getSession()
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const { conversationId, body, fileUrl, fileName, fileType } = req.body ?? {}
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId required' })
  }
  if (!body?.trim() && !fileUrl) {
    return res.status(400).json({ error: 'Message or file required' })
  }
  if ((body ?? '').trim().length > 2000) {
    return res.status(400).json({ error: 'Message too long (max 2000 chars)' })
  }

  // Verify ownership — returns nothing if conversation belongs to someone else
  const { data: conv } = await sb
    .from('chat_conversations')
    .select('id, tenant_id, status')
    .eq('id', conversationId)
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (!conv) return res.status(404).json({ error: 'Conversation not found' })
  if (conv.status === 'closed') return res.status(409).json({ error: 'Conversation is closed' })

  const { data: message, error } = await sb
    .from('chat_messages')
    .insert({
      tenant_id:       conv.tenant_id,   // from parent row — not from request
      conversation_id: conversationId,
      sender_id:       session.user.id,
      sender_type:     'player',
      body:            (body ?? '').trim(),
      file_url:        fileUrl ?? null,
      file_name:       fileName ?? null,
      file_type:       fileType ?? null,
    })
    .select('id, sender_id, sender_type, body, file_url, file_name, file_type, read_at, created_at')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Update last_message_at (anon key — RLS allows update on own conversation)
  await sb
    .from('chat_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', session.user.id)

  return res.status(201).json({ message })
}
