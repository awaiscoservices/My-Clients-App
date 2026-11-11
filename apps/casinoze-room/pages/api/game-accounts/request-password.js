/**
 * POST /api/game-accounts/request-password   { account_id }
 *
 * A player asks staff for a new password on a game account they already have.
 *
 * The account's status is deliberately NOT changed to 'pending': the old
 * password keeps working until staff set a new one, and the player can still
 * see it meanwhile. The request is a flag, which the admin Games page reads
 * to tell a password change apart from a new-account request.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { account_id } = req.body || {}
  if (!account_id) return res.status(400).json({ error: 'account_id required' })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('status, tenant_id').eq('id', user.id).single()
  if (!profile || profile.status !== 'active')
    return res.status(403).json({ error: 'Account is not active' })

  // Scoped to this player: a player may only ask for a new password on an
  // account that is theirs. Anything else is simply not found.
  const { data: account } = await supabaseAdmin
    .from('game_accounts')
    .select('id, status, reference_id, game_username, tenant_id, password_change_requested, game_panels(name)')
    .eq('id', account_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!account) return res.status(404).json({ error: 'Game account not found' })
  if (account.status !== 'active')
    return res.status(409).json({ error: 'This account is not active yet, so there is no password to change.' })
  if (account.password_change_requested)
    return res.status(409).json({ error: 'A new password has already been requested. Our team is on it.' })

  const { error: updateErr } = await supabaseAdmin
    .from('game_accounts')
    .update({
      password_change_requested: true,
      password_change_requested_at: new Date().toISOString(),
    })
    .eq('id', account_id)
    .eq('user_id', user.id)

  if (updateErr) {
    console.error('[request-password]', updateErr)
    return res.status(500).json({ error: 'Could not submit the request' })
  }

  const gameName = account.game_panels?.name || 'your game'

  await supabaseAdmin.from('notifications').insert({
    tenant_id:    account.tenant_id || profile.tenant_id || null,
    user_id:      user.id,
    type:         'general',
    title:        'New password requested',
    message:      `We have asked our team for a new ${gameName} password. Your current password keeps working until the new one is ready.`,
    reference_id: account.reference_id,
  }).then(() => {}, () => {})

  return res.status(200).json({
    message: `New ${gameName} password requested. Our team will update it shortly.`,
  })
}
