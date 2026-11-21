/**
 * GET /api/player/game-accounts
 *
 * Returns the signed-in player's own game accounts, with the stored password
 * decrypted into `game_password_display`.
 *
 * The page used to query game_accounts straight from the browser, which could
 * never show a password: the value is encrypted and the key must stay on the
 * server. Decryption happens here instead.
 *
 * Two rules this route exists to enforce:
 *   - A player only ever sees their own accounts. The user id comes from the
 *     verified token, never from the request.
 *   - The encrypted blob itself is never returned to the browser.
 */
import { createClient } from '@supabase/supabase-js'
import { decryptPassword } from '../../../lib/crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  // The id comes from the verified token. A caller cannot ask for someone else.
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { data, error } = await supabaseAdmin
    .from('game_accounts')
    .select('*, game_panels(name, accent_color, slug, logo_url, redeem_multiplier)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  let anyLegacyPlaintext = false

  const accounts = (data || []).map((row) => {
    const { game_password_enc, ...rest } = row   // never send the blob out
    const { value, legacyPlaintext } = decryptPassword(game_password_enc)
    if (legacyPlaintext) anyLegacyPlaintext = true
    return { ...rest, game_password_display: value }
  })

  // Surfaced so this can be spotted without digging through logs: these rows
  // were written while ENCRYPTION_KEY was unset and are stored in clear text.
  if (anyLegacyPlaintext) {
    console.warn('[player/game-accounts] some rows hold UNENCRYPTED passwords and should be re-saved')
  }

  return res.status(200).json({ accounts })
}
