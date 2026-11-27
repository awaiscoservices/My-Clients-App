import Link from 'next/link'
import Logo from '../ui/Logo'
import { GAME_CATALOG } from '../../lib/gameCatalog'
import { useSettings } from '../../lib/settings'
import { BRAND } from '../../lib/brand'

const cols = [
  ['Platform', [['Games', '/#games'], ['How it works', '/#how'], ['Register', '/auth/register'], ['Login', '/auth/login']]],
  ['Company', [['About', '/about'], ['FAQ', '/faq'], ['Support', '/dashboard/chat']]],
  ['Legal', [['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']]],
]

export default function SiteFooter() {
  const { platform_name, support_email } = useSettings()
  const brand = platform_name || BRAND.name
  return (
    <footer className="sf">
      <div className="sf-in">
        <div className="sf-brand">
          <Logo variant="full" height={44} />
          <p>One account and one wallet for {GAME_CATALOG.length} game rooms.</p>
          {support_email && (
            <p style={{ marginTop: 8 }}>
              Support: <a href={`mailto:${support_email}`} style={{ color: '#ef4444', textDecoration: 'none' }}>{support_email}</a>
            </p>
          )}
        </div>
        {cols.map(([t, ls]) => (
          <div key={t} className="sf-col">
            <div className="sf-h">{t}</div>
            {ls.map(([l, h]) => <Link key={l} href={h}>{l}</Link>)}
          </div>
        ))}
      </div>
      <div className="sf-bar"><span>© {new Date().getFullYear()} {brand}. All rights reserved.</span><span className="sf-crest">◆</span><span>18+ · Play responsibly</span></div>
      <style>{`
        /* Luxe footer — a crimson filament across the top, platinum hairlines,
           uppercase column heads, a small diamond in the baseline. */
        .sf{position:relative;border-top:1px solid rgba(231,216,195,.1);background:linear-gradient(180deg,rgba(4,6,11,.4),rgba(4,6,11,.75));margin-top:60px}
        .sf::before{content:'';position:absolute;left:0;right:0;top:-1px;height:1px;background:linear-gradient(90deg,transparent,rgba(239,68,68,.5),transparent)}
        .sf-in{max-width:1240px;margin:0 auto;padding:60px 24px 34px;display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:34px}
        .sf-brand p{margin:16px 0 0;color:rgba(255,255,255,.42);font-size:14px;line-height:1.75;max-width:280px}
        .sf-col{display:flex;flex-direction:column;gap:12px}
        .sf-h{font-size:10.5px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#ef4444;margin-bottom:6px}
        .sf-col a{color:rgba(255,255,255,.52);text-decoration:none;font-size:13.5px;letter-spacing:.01em;transition:color .25s,transform .25s;width:fit-content}
        .sf-col a:hover{color:#fff;transform:translateX(4px)}
        .sf-bar{max-width:1240px;margin:0 auto;padding:20px 24px 30px;border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:11.5px;letter-spacing:.06em;color:rgba(255,255,255,.34)}
        .sf-crest{color:rgba(239,68,68,.6);font-size:10px}
        @media(max-width:760px){.sf-in{grid-template-columns:1fr 1fr;padding-top:44px}.sf-brand{grid-column:1/-1}.sf-crest{display:none}}
      `}</style>
    </footer>
  )
}
