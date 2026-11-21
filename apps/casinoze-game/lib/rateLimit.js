/**
 * Server-side rate limiting for sensitive player endpoints.
 *
 * Vercel runs these routes as stateless lambdas, so an in-process counter is
 * useless — two requests can land on two instances. The limit therefore lives
 * in Postgres: check_rate_limit() does an atomic fixed-window upsert and tells
 * us whether this caller is still under the cap.
 *
 * FAIL-OPEN by design: if the limiter errors (DB blip, function missing), we
 * ALLOW the request. A limiter outage must never block a player from
 * depositing or withdrawing their own money — the limiter is abuse control,
 * not an authorization gate.
 *
 * Usage:
 *   const ok = await rateLimit(supabaseAdmin, {
 *     bucket: 'deposit_submit', key: user.id, limit: 10, windowSecs: 60,
 *   })
 *   if (!ok) return res.status(429).json({ error: '…' })
 */
export async function rateLimit(db, { bucket, key, limit, windowSecs }) {
  if (!key) return true // nothing to key on — don't block
  try {
    const { data, error } = await db.rpc('check_rate_limit', {
      p_bucket: bucket,
      p_key: String(key),
      p_limit: limit,
      p_window_secs: windowSecs,
    })
    if (error) {
      console.error(`[rateLimit] ${bucket} check failed (allowing):`, error.message)
      return true
    }
    return data === true
  } catch (e) {
    console.error(`[rateLimit] ${bucket} threw (allowing):`, e)
    return true
  }
}
