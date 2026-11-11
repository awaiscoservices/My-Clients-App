/**
 * POST /api/withdraw/upload-qr
 *
 * A player can photograph or screenshot the QR code for the wallet they want
 * paying, instead of typing a long address by hand. Typing a crypto address
 * is where payouts go wrong.
 *
 * Stored in the private `deposits` bucket under the player's own folder —
 * the same bucket deposit screenshots use, so staff view it the same way.
 * Nothing here is public: the path is returned, never a URL.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { file_base64, file_type, file_name } = req.body || {}
  if (!file_base64 || !file_type || !file_name) {
    return res.status(400).json({ error: 'File data required' })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file_type)) {
    return res.status(400).json({ error: 'Only images are allowed (jpg, png, webp, gif)' })
  }

  const buffer = Buffer.from(file_base64, 'base64')
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large. Maximum 5MB.' })
  }

  const ext  = file_type.split('/')[1]
  const path = `${user.id}/withdraw-qr/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabaseAdmin.storage
    .from('deposits')
    .upload(path, buffer, { contentType: file_type, upsert: false })

  if (error) {
    console.error('[withdraw/upload-qr]', error)
    return res.status(500).json({ error: 'Upload failed. Please try again.' })
  }

  return res.status(200).json({ path: data.path })
}
