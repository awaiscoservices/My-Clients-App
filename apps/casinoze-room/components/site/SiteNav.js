import { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '../ui/Logo'
import Ico from '../ui/Icons'

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
        <Link href="/" style={{ textDecoration: 'none' }} aria-label="Casinoze Room home"><Logo variant="full" height={42} className="sn-logo" /></Link>
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
        .sn{position:sticky;top:0;z-index:50;transition:background .3s,border-color .3s,backdrop-filter .3s;border-bottom:1px solid transparent}
        .sn-solid{background:rgba(7,10,18,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom-color:rgba(251,191,36,.14)}
        .sn-in{max-width:1240px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}
        .sn-links{display:flex;gap:30px}
        .sn-links a,.sn-sheet a{color:rgba(255,255,255,.66);text-decoration:none;font-size:14px;font-weight:600;position:relative;transition:color .2s}
        .sn-links a::after{content:'';position:absolute;left:0;right:0;bottom:-6px;height:2px;border-radius:2px;background:#fbbf24;transform:scaleX(0);transform-origin:left;transition:transform .3s}
        .sn-links a:hover{color:#fff}.sn-links a:hover::after{transform:scaleX(1)}
        .sn-cta{display:flex;align-items:center;gap:10px}
        .sn-login{padding:9px 18px;border-radius:11px;border:1px solid rgba(255,255,255,.16);color:#fff;text-decoration:none;font-size:13px;font-weight:700;transition:border-color .2s,background .2s}
        .sn-login:hover{border-color:rgba(251,191,36,.6);background:rgba(251,191,36,.06)}
        .sn-join{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:11px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0a0a0a;text-decoration:none;font-size:13px;font-weight:800;box-shadow:0 0 0 rgba(251,191,36,0);transition:box-shadow .25s,transform .25s}
        .sn-join:hover{box-shadow:0 8px 26px rgba(251,191,36,.35);transform:translateY(-1px)}
        .sn-burger{display:none;background:none;border:0;color:#fbbf24;cursor:pointer;padding:4px}
        .sn-sheet{display:none;flex-direction:column;padding:6px 24px 18px;border-top:1px solid rgba(255,255,255,.07)}
        .sn-sheet a{padding:13px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:16px}
        @media(max-width:860px){.sn-links{display:none}.sn-burger{display:flex}.sn-sheet{display:flex}.sn-in{padding:10px 16px}.sn-login{display:none}.sn-logo .logo-text{display:none}}
      `}</style>
    </header>
  )
}
