/**
 * GET /api/payment-methods/list?for=withdraw|deposit
 *
 * The casino's own payment methods, as set in Admin → Payment Methods.
 *
 * The withdraw page used to carry a hardcoded list — Cash App, PayPal,
 * Zelle, Bank Transfer, Crypto — while the wallet page read the real ones
 * from the database. That is why the two screens disagreed: they were not
 * showing the same thing at all.
 *
 * Scoped to the player's own casino, and filtered by what the method is
 * allowed to do, so a deposit-only method never appears as a way to be paid.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('tenant_id').eq('id', user.id).single()

  let query = supabaseAdmin
    .from('payment_methods')
    .select('id, name, type, icon, description, instructions, min_deposit_cents, max_deposit_cents, allow_deposit, allow_withdraw')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (profile?.tenant_id) query = query.eq('tenant_id', profile.tenant_id)

  if (req.query.for === 'withdraw')     query = query.eq('allow_withdraw', true)
  else if (req.query.for === 'deposit') query = query.eq('allow_deposit', true)

  const { data, error } = await query

  if (error) {
    console.error('[payment-methods/list]', error)
    return res.status(500).json({ error: 'Could not load payment methods' })
  }

  return res.status(200).json({ methods: data || [] })
}
