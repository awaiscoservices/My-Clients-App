/**
 * GET /api/settings/flags  (public, no auth)
 *
 * The player-facing switches from the admin Settings page, for THIS casino
 * (NEXT_PUBLIC_TENANT_ID). Read with the service role so it also works before
 * sign-in — the register page and the site-wide maintenance screen use it.
 */
import { getTenantSettings, flagOn } from '../../../lib/platformSettings'

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || ''

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const s = await getTenantSettings(TENANT_ID, [
      'registrations_enabled', 'deposits_enabled', 'withdrawals_enabled',
      'maintenance_mode', 'maintenance_message',
    ])
    return res.status(200).json({
      registrations_enabled: flagOn(s.registrations_enabled, true),
      deposits_enabled:      flagOn(s.deposits_enabled, true),
      withdrawals_enabled:   flagOn(s.withdrawals_enabled, true),
      maintenance_mode:      flagOn(s.maintenance_mode, false),
      maintenance_message:   typeof s.maintenance_message === 'string' ? s.maintenance_message : '',
    })
  } catch {
    // A settings read failure must never take the whole site down.
    return res.status(200).json({
      registrations_enabled: true, deposits_enabled: true, withdrawals_enabled: true,
      maintenance_mode: false, maintenance_message: '',
    })
  }
}
