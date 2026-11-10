/**
 * POST /api/deposit/upload-screenshot
 * Uploads a deposit screenshot to Supabase Storage (private bucket).
 * Returns the storage path — NOT a public URL.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { file_base64, file_type, file_name } = req.body

  if (!file_base64 || !file_type || !file_name)
    return res.status(400).json({ error: 'File data required' })

  // Validate file type
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file_type))
    return res.status(400).json({ error: 'Only images are allowed (jpg, png, webp, gif)' })

  // Convert base64 to buffer
  const buffer = Buffer.from(file_base64, 'base64')

  // Validate size (max 5MB)
  if (buffer.length > 5 * 1024 * 1024)
    return res.status(400).json({ error: 'File too large. Maximum 5MB.' })

  const ext = file_type.split('/')[1]
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabaseAdmin.storage
    .from('deposits')
    .upload(path, buffer, { contentType: file_type, upsert: false })

  if (error) {
    console.error('Storage upload error:', error)
    return res.status(500).json({ error: 'Upload failed. Please try again.' })
  }

  return res.status(200).json({ path: data.path })
}
