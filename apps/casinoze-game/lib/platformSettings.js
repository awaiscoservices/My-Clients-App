/**
 * lib/platformSettings.js (server-only)
 *
 * Reads a tenant's platform_settings with the service role. This is how the
 * admin Settings feature flags (deposits/withdrawals/registrations enabled,
 * maintenance mode) are enforced on the player side — the browser never reads
 * platform_settings directly.
 */
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

/** { key: value } for the given keys of one tenant. Empty on any miss. */
export async function getTenantSettings(tenantId, keys) {
  if (!tenantId) return {}
  const { data } = await admin
    .from('platform_settings')
    .select('key, value')
    .eq('tenant_id', tenantId)
    .in('key', keys)
  const out = {}
  for (const r of data || []) out[r.key] = r.value
  return out
}

/**
 * A switch is ON unless explicitly 'false'. A missing row falls back to `dflt`
 * — pass true for feature flags (a missing row must never block the casino)
 * and false for maintenance_mode (a missing row is not "under maintenance").
 */
export function flagOn(value, dflt = true) {
  if (value === undefined || value === null || value === '') return dflt
  return value === true || value === 'true'
}
