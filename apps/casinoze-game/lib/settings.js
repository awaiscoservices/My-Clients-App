/**
 * lib/settings.js (client)
 *
 * App-wide access to this casino's public settings (admin Settings page),
 * fetched once from /api/settings/flags and shared via context. Covers the
 * feature flags (for maintenance), plus the display fields: platform name,
 * support email, currency and timezone.
 *
 * Currency is also pushed into MoneyDisplay so every money string uses it.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { setDisplayCurrency } from '../components/ui/MoneyDisplay'

const DEFAULTS = {
  registrations_enabled: true, deposits_enabled: true, withdrawals_enabled: true,
  maintenance_mode: false, maintenance_message: '',
  platform_name: '', support_email: '', currency: 'USD', timezone: 'UTC',
}

const SettingsContext = createContext(DEFAULTS)

export function useSettings() {
  return useContext(SettingsContext)
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)

  useEffect(() => {
    let on = true
    fetch('/api/settings/flags')
      .then(r => r.json())
      .then(f => {
        if (!on || !f) return
        setSettings({ ...DEFAULTS, ...f })
        if (f.currency) setDisplayCurrency(f.currency)
      })
      .catch(() => {})
    return () => { on = false }
  }, [])

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

/** Format a date/time in the casino's timezone (falls back to viewer-local). */
export function formatInTimezone(value, timezone, opts = { dateStyle: 'medium', timeStyle: 'short' }) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: timezone || 'UTC', ...opts }).format(new Date(value))
  } catch {
    return new Date(value).toLocaleString('en-US', opts)
  }
}
