import { useState, useRef, useEffect } from 'react'

// ONE image file: public/images/logo/logo.png  (logo mark only, no text, square)
// variant "full" = mark + "CASINOZE ROOM" written as text next to it
// variant "icon" = mark only
const SRC = '/images/logo/logo.png'

export default function Logo({ variant = 'full', height = 40, stack = false, className, style }) {
  const [failed, setFailed] = useState(false)
  const ref = useRef(null)

  // catches an image that already failed before React attached onError
  useEffect(() => {
    const img = ref.current
    if (img && img.complete && img.naturalWidth === 0) setFailed(true)
  }, [])

  const mark = failed ? (
    <span style={{ width: height, height, borderRadius: height * 0.28, flexShrink: 0, background: 'linear-gradient(135deg,#fbbf24,#b45309)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: height * 0.5 }}>🎰</span>
  ) : (
    <img ref={ref} className="logo-mark" src={SRC} alt="Casinoze Room" onError={() => setFailed(true)}
      style={{ height, width: height, objectFit: 'contain', display: 'block', flexShrink: 0 }} />
  )

  if (variant === 'icon') return <span className={className} style={{ display: 'inline-flex', ...style }}>{mark}</span>

  return (
    <span className={className} style={{ display: 'inline-flex', flexDirection: stack ? 'column' : 'row', alignItems: 'center', gap: height * (stack ? 0.12 : 0.25), maxWidth: '100%', ...style }}>
      {mark}
      <span className="logo-text" style={{ lineHeight: 1.1, textAlign: stack ? 'center' : 'left' }}>
        <span style={{ display: 'block', fontFamily: "'Cinzel', serif", fontSize: height * 0.4, fontWeight: 700, letterSpacing: '.06em', color: '#fff' }}>CASINOZE</span>
        <span style={{ display: 'block', fontFamily: "'Cinzel', serif", fontSize: height * 0.29, fontWeight: 700, letterSpacing: '.3em', color: '#fbbf24' }}>ROOM</span>
      </span>
    </span>
  )
}
