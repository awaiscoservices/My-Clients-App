import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.body
  if (!id) return res.status(400).json({ error: 'id required' })

  // Verify ownership before soft-delete
  const { data: method } = await supabaseAdmin
    .from('player_payout_methods').select('id, user_id').eq('id', id).single()

  if (!method) return res.status(404).json({ error: 'Not found' })
  if (method.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' })

  // Soft delete
  const { error } = await supabaseAdmin
    .from('player_payout_methods').update({ is_active: false }).eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ success: true })
}
