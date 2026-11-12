/**
 * POST /api/chat/upload
 * Player uploads a file attachment.
 * Uses anon key (session cookie) — player must be signed in.
 * File path: <user_id>/<timestamp>-<random>.<ext>
 * RLS storage policy allows players to upload to their own folder.
 */
import { createPagesServerClient } from '../../lib/supabaseServer'
import formidable from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

const ALLOWED_TYPES = ['image/jpeg','image/png','image/gif','image/webp','application/pdf','text/plain']
const MAX_BYTES = 5 * 1024 * 1024

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createPagesServerClient({ req, res })
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const form = formidable({ maxFileSize: MAX_BYTES })
  let files
  try {
    ;[, files] = await form.parse(req)
  } catch {
    return res.status(400).json({ error: 'File too large or invalid' })
  }

  const file = Array.isArray(files.file) ? files.file[0] : files.file
  if (!file) return res.status(400).json({ error: 'No file provided' })
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return res.status(400).json({ error: 'File type not allowed' })
  }

  const bytes = fs.readFileSync(file.filepath)
  const ext   = file.originalFilename?.split('.').pop() ?? 'bin'
  const path  = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .upload(path, bytes, { contentType: file.mimetype, upsert: false })

  if (error) return res.status(500).json({ error: 'Upload failed' })

  const { data: { publicUrl } } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(data.path)

  return res.status(200).json({ url: publicUrl, name: file.originalFilename, type: file.mimetype })
}
