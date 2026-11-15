/**
 * MoneyDisplay — converts integer cents to a formatted currency string.
 * NEVER pass raw dollar floats here. Always pass cents (integer).
 *
 * The currency comes from the casino's admin Settings. SettingsProvider calls
 * setDisplayCurrency() once on load; until then it is USD. It is a module-level
 * value so every centsToDisplay() call site picks it up without threading a
 * prop through — amounts load async and re-render with the right symbol.
 *
 * Usage:
 *   <MoneyDisplay cents={1050} />          → $10.50
 *   <MoneyDisplay cents={1050} size="lg" /> → larger text
 *   <MoneyDisplay cents={0} showZero />     → $0.00
 */

let ACTIVE_CURRENCY = 'USD'

export function setDisplayCurrency(code) {
  if (typeof code === 'string' && code.trim()) ACTIVE_CURRENCY = code.trim().toUpperCase()
}

export function centsToDisplay(cents) {
  if (cents === null || cents === undefined) cents = 0
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: ACTIVE_CURRENCY,
      minimumFractionDigits: 2,
    }).format(cents / 100)
  } catch {
    // Unknown currency code → fall back to USD formatting.
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(cents / 100)
  }
}

export default function MoneyDisplay({
  cents = 0,
  size = 'md',
  color,
  showZero = true,
  className,
}) {
  if (!showZero && !cents) return null

  const sizes = {
    xs:  { fontSize: 12, fontWeight: 600 },
    sm:  { fontSize: 14, fontWeight: 600 },
    md:  { fontSize: 16, fontWeight: 700 },
    lg:  { fontSize: 22, fontWeight: 700 },
    xl:  { fontSize: 28, fontWeight: 800 },
    '2xl': { fontSize: 36, fontWeight: 900 },
  }

  return (
    <span style={{
      ...sizes[size],
      color: color || 'inherit',
      fontFamily: "'Outfit', sans-serif",
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-0.01em',
    }}>
      {centsToDisplay(cents)}
    </span>
  )
}
