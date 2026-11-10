import Link from 'next/link'
import Logo from '../ui/Logo'
import { GAME_CATALOG } from '../../lib/gameCatalog'

const cols = [
  ['Platform', [['Games', '/#games'], ['How it works', '/#how'], ['Register', '/auth/register'], ['Login', '/auth/login']]],
  ['Company', [['About', '/about'], ['FAQ', '/faq'], ['Support', '/dashboard/support']]],
  ['Legal', [['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']]],
]

export default function SiteFooter() {
  return (
    <footer className="sf">
      <div className="sf-in">
        <div className="sf-brand">
          <Logo variant="full" height={44} />
          <p>One account and one wallet for {GAME_CATALOG.length} game rooms.</p>
        </div>
        {cols.map(([t, ls]) => (
          <div key={t} className="sf-col">
            <div className="sf-h">{t}</div>
            {ls.map(([l, h]) => <Link key={l} href={h}>{l}</Link>)}
          </div>
        ))}
      </div>
      <div className="sf-bar"><span>© {new Date().getFullYear()} Casinoze Room. All rights reserved.</span><span>18+ · Play responsibly</span></div>
      <style>{`
        .sf{border-top:1px solid rgba(251,191,36,.12);background:rgba(4,7,13,.55);margin-top:40px}
        .sf-in{max-width:1240px;margin:0 auto;padding:54px 24px 30px;display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:34px}
        .sf-brand p{margin:14px 0 0;color:rgba(255,255,255,.45);font-size:14px;line-height:1.7;max-width:280px}
        .sf-col{display:flex;flex-direction:column;gap:11px}
        .sf-h{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#fbbf24;margin-bottom:4px}
        .sf-col a{color:rgba(255,255,255,.55);text-decoration:none;font-size:14px;transition:color .2s,transform .2s;width:fit-content}
        .sf-col a:hover{color:#fff;transform:translateX(3px)}
        .sf-bar{max-width:1240px;margin:0 auto;padding:18px 24px 26px;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:12px;color:rgba(255,255,255,.35)}
        @media(max-width:760px){.sf-in{grid-template-columns:1fr 1fr;padding-top:40px}.sf-brand{grid-column:1/-1}}
      `}</style>
    </footer>
  )
}
