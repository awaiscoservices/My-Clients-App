/**
 * GET  /api/chat/conversations
 *   Returns the authenticated player's own open conversation,
 *   creating one if none exists yet.
 *
 * Uses anon key + session cookie — NOT the service-role key.
 * RLS on chat_conversations ensures the player can only ever see their own row.
 *
 * Scoped by: RLS policy "player_read_own_conversation" (user_id = auth.uid())
 * tenant_id: read from the player's profile — never trusted from the request.
 */
import { createPagesServerClient } from '../../../lib/supabaseServer'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // Anon-key client — session from cookie
  const sb = createPagesServerClient({ req, res })

  const { data: { session }, error: sessErr } = await sb.auth.getSession()
  if (sessErr || !session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const userId = session.user.id

  // Get tenant_id from the player's profile — never from query string
  const { data: profile, error: profErr } = await sb
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single()

  if (profErr || !profile?.tenant_id) {
    return res.status(403).json({ error: 'Could not determine your casino' })
  }

  const tenantId = profile.tenant_id

  // Try to find an existing open conversation (RLS restricts to own rows)
  const { data: existing, error: findErr } = await sb
    .from('chat_conversations')
    .select('id, status, last_message_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findErr) return res.status(500).json({ error: findErr.message })

  if (existing) return res.json({ conversation: existing })

  // No conversation yet — create one
  const { data: created, error: createErr } = await sb
    .from('chat_conversations')
    .insert({
      tenant_id: tenantId,
      user_id:   userId,
      status:    'open',
    })
    .select('id, status, last_message_at, created_at')
    .single()

  if (createErr) return res.status(500).json({ error: createErr.message })

  return res.status(201).json({ conversation: created })
}
