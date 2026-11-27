import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '../ui/Logo'
import Ico from '../ui/Icons'
import { BRAND } from '../../lib/brand'

// Public top bar, shared by the landing page and the static pages (About, FAQ, Terms, Privacy).
export default function SiteNav({ landing = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 12)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  const base = landing ? '' : '/'
  const links = [['Games', '#games'], ['How it works', '#how'], ['Features', '#features'], ['FAQ', '#faq']]

  return (
    <header className={`sn${scrolled || open ? ' sn-solid' : ''}`}>
      <div className="sn-in">
        <Link href="/" style={{ textDecoration: 'none' }} aria-label={`${BRAND.name} home`}><Logo variant="full" height={42} className="sn-logo" /></Link>
        <nav className="sn-links" aria-label="Main">
          {links.map(([l, h]) => <a key={l} href={base + h}>{l}</a>)}
        </nav>
        <div className="sn-cta">
          <Link href="/auth/login" className="sn-login">Login</Link>
          <Link href="/auth/register" className="sn-join">Join free <Ico name="arrow" size={15} stroke={2.2} /></Link>
          <button className="sn-burger" onClick={() => setOpen(o => !o)} aria-label="Menu" aria-expanded={open}><Ico name={open ? 'close' : 'menu'} size={22} /></button>
        </div>
      </div>
      {open && (
        <div className="sn-sheet">
          {links.map(([l, h]) => <a key={l} href={base + h} onClick={() => setOpen(false)}>{l}</a>)}
          <Link href="/auth/login">Login</Link>
        </div>
      )}
      <style>{`
        /* Luxe casino top bar — hairline frame, refined uppercase tracking,
           a thin crimson filament that lights the bar once you scroll. */
        .sn{position:sticky;top:0;z-index:50;transition:background .3s,border-color .3s,backdrop-filter .3s;border-bottom:1px solid transparent}
        .sn::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(239,68,68,.55),transparent);opacity:0;transition:opacity .4s}
        .sn-solid{background:rgba(5,7,12,.86);backdrop-filter:blur(16px) saturate(1.2);-webkit-backdrop-filter:blur(16px) saturate(1.2);border-bottom-color:rgba(231,216,195,.1)}
        .sn-solid::before{opacity:1}
        .sn-in{max-width:1240px;margin:0 auto;padding:15px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}
        .sn-links{display:flex;gap:36px}
        .sn-links a,.sn-sheet a{color:rgba(255,255,255,.6);text-decoration:none;font-size:11.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;position:relative;transition:color .25s}
        .sn-links a::after{content:'';position:absolute;left:50%;right:50%;bottom:-8px;height:1px;background:linear-gradient(90deg,transparent,#ef4444,transparent);transition:left .3s,right .3s}
        .sn-links a:hover{color:#fff}.sn-links a:hover::after{left:0;right:0}
        .sn-cta{display:flex;align-items:center;gap:12px}
        .sn-login{padding:10px 20px;border-radius:2px;border:1px solid rgba(231,216,195,.24);color:#f3ece1;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;transition:border-color .25s,background .25s,color .25s}
        .sn-login:hover{border-color:rgba(239,68,68,.7);background:rgba(239,68,68,.06);color:#fff}
        .sn-join{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:2px;background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;text-decoration:none;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 0 0 rgba(239,68,68,0);transition:box-shadow .3s,transform .25s}
        .sn-join:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 10px 28px rgba(239,68,68,.4);transform:translateY(-1px)}
        .sn-join svg{transition:transform .25s}.sn-join:hover svg{transform:translateX(3px)}
        .sn-burger{display:none;background:none;border:0;color:#ef4444;cursor:pointer;padding:4px}
        .sn-sheet{display:none;flex-direction:column;padding:6px 24px 18px;border-top:1px solid rgba(231,216,195,.1);background:rgba(5,7,12,.96)}
        .sn-sheet a{padding:15px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:12.5px}
        @media(max-width:860px){.sn-links{display:none}.sn-burger{display:flex}.sn-sheet{display:flex}.sn-in{padding:12px 16px}.sn-login{display:none}.sn-logo .logo-text{display:none}}
      `}</style>
    </header>
  )
}
