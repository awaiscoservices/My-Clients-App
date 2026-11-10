/**
 * POST /api/game-accounts/request
 * Player requests a game account for a specific game panel.
 * Creates a pending game_account record for admin to fulfill.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { game_panel_id } = req.body
  if (!game_panel_id) return res.status(400).json({ error: 'Game panel ID required' })

  // Check game panel exists and is active
  const { data: panel } = await supabaseAdmin
    .from('game_panels')
    .select('id, name, is_active')
    .eq('id', game_panel_id)
    .eq('is_active', true)
    .single()

  if (!panel) return res.status(404).json({ error: 'Game not found or unavailable' })

  // Check player status
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active')
    return res.status(403).json({ error: 'Account is not active' })

  // Check for existing account (pending or active)
  const { data: existing } = await supabaseAdmin
    .from('game_accounts')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('game_panel_id', game_panel_id)
    .single()

  if (existing) {
    const messages = {
      pending: 'You already have a pending request for this game. Please wait for admin to process it.',
      active: 'You already have an active account for this game.',
      suspended: 'Your account for this game is suspended. Contact support.',
    }
    return res.status(409).json({ error: messages[existing.status] || 'Account already exists' })
  }

  // Create the game account request
  const { data: account, error: createError } = await supabaseAdmin
    .from('game_accounts')
    .insert({
      user_id: user.id,
      game_panel_id,
      status: 'pending',
    })
    .select()
    .single()

  if (createError) {
    console.error('Game account create error:', createError)
    return res.status(500).json({ error: 'Failed to create game account request' })
  }

  // Notify player
  await supabaseAdmin.from('notifications').insert({
    user_id: user.id,
    type: 'general',
    title: 'Game Account Requested',
    message: `Your request for a ${panel.name} account (${account.reference_id}) has been submitted. Our team will set it up shortly.`,
    reference_id: account.reference_id,
  }).then(() => {}, () => {})

  return res.status(201).json({
    message: `${panel.name} account request submitted successfully`,
    account: {
      id: account.id,
      reference_id: account.reference_id,
      status: 'pending',
    },
  })
}
