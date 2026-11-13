// Shared line-icon set for the player side. Replaces decorative emojis with
// crisp, theme-coloured SVGs. Usage: <Icon name="trophy" size={18} />
// Stroke icons inherit `currentColor`, so colour them via the parent's `color`.
const P = {
  trophy:   'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3',
  medal:    'M12 15a4 4 0 100-8 4 4 0 000 8zM12 15v6l-2.5-1.5L7 21l1.2-5M12 15l2.5 4.8L17 21l-1.2-5M9 3h6l1 3H8z',
  crown:    'M3 7l4 4 5-6 5 6 4-4-1.5 12H4.5L3 7zM4.5 19h15',
  diamond:  'M6 3h12l4 6-10 12L2 9l4-6zM2 9h20M9 3l3 6 3-6M12 21L9 9M15 9l-3 12',
  gem:      'M6 3h12l4 6-10 12L2 9l4-6zM2 9h20',
  flame:    'M12 3c1 3 4 4.5 4 8a4 4 0 01-8 0c0-1.3.5-2.3 1-3 .2 1 .8 1.6 1.6 1.8C10.4 8 10 6 12 3z',
  zap:      'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  star:     'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
  sparkle:  'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z',
  gift:     'M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H8.5a2.5 2.5 0 110-5C11 2 12 7 12 7zM12 7h3.5a2.5 2.5 0 100-5C13 2 12 7 12 7z',
  gamepad:  'M6 12h4M8 10v4M15 13h.01M18 11h.01M7 7h10a4 4 0 014 4v2a4 4 0 01-4 4l-2-2H9l-2 2a4 4 0 01-4-4v-2a4 4 0 014-4z',
  coins:    'M12 21a9 9 0 100-18 9 9 0 000 18zM14.5 9.5c-.5-1-1.4-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2-.5-2.5-1.5M12 6.5V8M12 16v1.5',
  cash:     'M3 6h18v12H3zM12 15a3 3 0 100-6 3 3 0 000 6M6 9h.01M18 15h.01',
  bank:     'M3 10l9-6 9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18',
  card:     'M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 4h18M7 16h4',
  wallet:   'M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 0V6a2 2 0 012-2h11M16 13.5h.01',
  chart:    'M3 3v18h18M7 15l3-4 3 2 4-6',
  list:     'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  clipboard:'M9 4h6a1 1 0 011 1v1h2a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h2V5a1 1 0 011-1zM9 4h6v3H9z',
  bell:     'M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 003.4 0',
  user:     'M20 21v-1a6 6 0 00-6-6h-4a6 6 0 00-6 6v1M12 11a4 4 0 100-8 4 4 0 000 8z',
  users:    'M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a4 4 0 100-8 4 4 0 000 8zM21 20v-2a4 4 0 00-3-3.9M16 2.1a4 4 0 010 7.8',
  lock:     'M6 11h12v9H6zM8 11V8a4 4 0 018 0v3',
  shield:   'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4',
  check:    'M20 6L9 17l-5-5',
  checkCircle:'M12 21a9 9 0 100-18 9 9 0 000 18zM8.5 12l2.5 2.5 4.5-5',
  x:        'M18 6L6 18M6 6l12 12',
  xCircle:  'M12 21a9 9 0 100-18 9 9 0 000 18zM15 9l-6 6M9 9l6 6',
  alert:    'M12 3l9.5 16.5H2.5L12 3zM12 10v4M12 17.5h.01',
  clock:    'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  hourglass:'M6 3h12M6 21h12M7 3c0 5 4 6 5 9 1-3 5-4 5-9M7 21c0-5 4-6 5-9 1 3 5 4 5 9',
  inbox:    'M3 12h5l2 3h4l2-3h5M5 5h14l2 7v7H3v-7l2-7z',
  arrowUp:  'M12 19V5M6 11l6-6 6 6',
  arrowDown:'M12 5v14M6 13l6 6 6-6',
  arrow:    'M5 12h14M13 6l6 6-6 6',
  plus:     'M12 5v14M5 12h14',
  gear:     'M12 15a3 3 0 100-6 3 3 0 000 6M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 005 19.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H1a2 2 0 110-4h.1A1.6 1.6 0 002.7 5l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V1a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H23a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z',
  wheel:    'M12 21a9 9 0 100-18 9 9 0 000 18zM12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4',
  spin:     'M21 12a9 9 0 11-3-6.7M21 4v5h-5',
  clover:   'M12 12c-2-2-5-1-5 1.5S9 17 12 15m0-3c2-2 5-1 5 1.5S15 17 12 15m0 0c-2 2-1 5 1.5 5s3.5-3 1.5-5m0 0c2 2 5 1 5-1.5M12 12c-2-2-1-5 1.5-5S17 9 15 12M12 12c2-2 1-5-1.5-5S7 9 9 12M12 15v6',
  dice:     'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 8.5h.01M12 12h.01M15.5 15.5h.01',
  camera:   'M3 8h3l2-2h8l2 2h3v12H3V8zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  send:     'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  paperclip:'M21 11.5l-8.8 8.8a5 5 0 01-7-7l8.8-8.8a3.3 3.3 0 014.7 4.7l-8.5 8.5a1.6 1.6 0 01-2.3-2.3l8-8',
  wave:     'M7 11V6a1.5 1.5 0 013 0v4M10 10V5a1.5 1.5 0 013 0v5M13 10V6.5a1.5 1.5 0 013 0V13c0 3.3-2.7 6-6 6a6 6 0 01-6-6v-1.5a1.5 1.5 0 013-.5l.5 1',
  money:    'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  ban:      'M12 21a9 9 0 100-18 9 9 0 000 18zM5.6 5.6l12.8 12.8',
  fire:     'M12 3c1 3 4 4.5 4 8a4 4 0 01-8 0c0-1.3.5-2.3 1-3 .2 1 .8 1.6 1.6 1.8C10.4 8 10 6 12 3z',
}

export default function Icon({ name, size = 18, stroke = 1.8, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }} aria-hidden="true">
      <path d={P[name] || P.sparkle} />
    </svg>
  )
}

export { P as ICON_PATHS }
