import { useState } from 'react'
import { gameLogoFor } from '../../lib/gameCatalog'
import Icon from './Icon'

// A game's logo. Uses the logo set in the database (Admin → Game Panels), otherwise the matching
// file in public/images/games/, otherwise a gamepad placeholder.
export default function GameIcon({ name, slug, logoUrl, size = 40 }) {
  const src = logoUrl || gameLogoFor(slug, name)
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <span style={{ display: 'inline-flex', color: 'rgba(251,191,36,.7)' }}><Icon name="gamepad" size={Math.round(size * 0.7)} /></span>
  return <img src={src} alt={name || 'Game'} onError={() => setFailed(true)} style={{ width: size, height: size, objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.45))' }} />
}
