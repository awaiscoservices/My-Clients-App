import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { centsToDisplay } from '../ui/MoneyDisplay'
import Logo from '../ui/Logo'

const PROMO_TEXT = 'Welcome to Casinoze Room — add money, load a game and play.'
const GOLD = '#fbbf24'

const ICONS = {
  home:     'M3 11l9-8 9 8M5 10v10h14V10',
  games:    'M6 12h4M8 10v4M15 13h.01M18 11h.01M7 7h10a4 4 0 014 4v2a4 4 0 01-4 4l-2-2H9l-2 2a4 4 0 01-4-4v-2a4 4 0 014-4z',
  cards:    'M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2zM9 9h6M9 13h6',
  wallet:   'M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 0V6a2 2 0 012-2h11M16 13.5h.01',
  plus:     'M12 5v14M5 12h14',
  star:     'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
  users:    'M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a4 4 0 100-8 4 4 0 000 8zM21 20v-2a4 4 0 00-3-3.9M16 2.1a4 4 0 010 7.8',
  shield:   'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4',
  chat:     'M21 12a8 8 0 01-11.6 7.1L3 21l1.9-5.7A8 8 0 1121 12z',
  user:     'M20 21v-1a6 6 0 00-6-6h-4a6 6 0 00-6 6v1M12 11a4 4 0 100-8 4 4 0 000 8z',
  bell:     'M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 003.4 0',
  logout:   'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  menu:     'M3 6h18M3 12h18M3 18h18',
}

function Icon({ name, size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={ICONS[name]} />
    </svg>
  )
}

// Sidebar: Wallet is the hub — Deposit/Transactions/Redeem/Withdraw all removed.
//
// One flat list rather than Main and Account: six entries did not need two
// headings over them, and the headings cost a line each in a rail this
// narrow. Verification moved under Profile, and Support is reachable from
// the pages that need it.
const NAV_ITEMS = [
  { href: '/dashboard',           icon: 'home',   label: 'Dashboard'     },
  { href: '/dashboard/games',     icon: 'games',  label: 'Games'         },
  { href: '/dashboard/wallet',    icon: 'wallet', label: 'Wallet'        },
  { href: '/dashboard/rewards',   icon: 'star',   label: 'Player Levels' },
  { href: '/dashboard/referrals', icon: 'users',  label: 'Referrals'     },
  { href: '/dashboard/profile',   icon: 'user',   label: 'Profile'       },
]

function BalanceChip({ label, cents, accent }) {
  return (
    <Link href="/dashboard/wallet" className="bal-chip" style={{
      textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '5px 14px', borderRadius: 12, minWidth: 96,
      background: 'linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))',
      border: `1px solid ${accent}55`,
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', lineHeight: 1.2 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 800, color: accent, lineHeight: 1.3 }}>{centsToDisplay(cents)}</span>
    </Link>
  )
}

function WinsTicker() {
  const [wins, setWins] = useState([])
  useEffect(() => {
    supabase.from('recent_wins').select('id, masked_name, amount_cents')
      .order('created_at', { ascending: false }).limit(12)
      .then(({ data }) => { if (data?.length) setWins(data) })
      .catch(() => {})
  }, [])
  if (!wins.length) return null
  const row = [...wins, ...wins]
  return (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(251,191,36,.12)', background: 'rgba(251,191,36,.03)', height: 34, display: 'flex', alignItems: 'center' }}>
      <div className="wins-track" style={{ display: 'inline-flex', gap: 40 }}>
        {row.map((w, i) => (
          <span key={i} style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>
            <span style={{ color: GOLD }}>🏆</span> {w.masked_name} <span style={{ opacity: .6 }}>WON</span> <span style={{ color: GOLD }}>{centsToDisplay(w.amount_cents)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

const cache = { profile: null, wallet: null, unread: 0, navScroll: 0 }
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function PlayerLayout({ children }) {
  const router = useRouter()
  const [profile, setProfile] = useState(cache.profile)
  const [wallet, setWallet]   = useState(cache.wallet)
  const [unread, setUnread]   = useState(cache.unread)
  const navRef = useRef(null)

  useIsoLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    nav.scrollTop = cache.navScroll
    const el = nav.querySelector('.nav-link.active')
    if (el) {
      const n = nav.getBoundingClientRect(), e = el.getBoundingClientRect()
      if (e.top < n.top || e.bottom > n.bottom) nav.scrollTop += (e.top - n.top) - (n.height / 2 - e.height / 2)
    }
    cache.navScroll = nav.scrollTop
  }, [router.pathname])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signingOut, setSigningOut]   = useState(false)
  const [promoOpen, setPromoOpen]     = useState(true)

  const loadUserData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      const ref = localStorage.getItem('cz_ref')
      if (ref) { await supabase.rpc('apply_referral', { p_code: ref }); localStorage.removeItem('cz_ref') }
    } catch {}
    const [{ data: prof }, { data: wal }, { count }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('wallets').select('*').eq('user_id', user.id).single(),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
    ])
    cache.profile = prof; cache.wallet = wal; cache.unread = count || 0
    setProfile(prof); setWallet(wal); setUnread(count || 0)
  }, [])

  useEffect(() => { loadUserData() }, [loadUserData])
  useEffect(() => {
    router.events.on('routeChangeComplete', loadUserData)
    return () => router.events.off('routeChangeComplete', loadUserData)
  }, [router.events, loadUserData])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    cache.profile = null; cache.wallet = null; cache.unread = 0; cache.navScroll = 0
    window.location.href = '/'
  }

  const isActive = (href) =>
    href === '/dashboard' ? router.pathname === '/dashboard' : router.pathname.startsWith(href)

  const showPromo = PROMO_TEXT && promoOpen

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', backgroundAttachment: 'fixed', fontFamily: "'Outfit', sans-serif", color: '#fff' }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      {/* TOP BAR */}
      <header className="top-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 20px', maxWidth: '100vw',
        background: 'var(--panel-gradient)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(251,191,36,.18)', boxShadow: '0 4px 24px rgba(0,0,0,.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setSidebarOpen(p => !p)} className="mobile-hamburger" aria-label="Menu"
            style={{ display: 'none', background: 'none', border: 'none', color: GOLD, cursor: 'pointer', padding: 4 }}>
            <Icon name="menu" size={24} />
          </button>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="logo-full"><Logo variant="full" height={54} /></span>
            <span className="logo-icon"><Logo variant="icon" height={50} /></span>
          </Link>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/dashboard/deposit" className="deposit-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px',
            background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: 12,
            color: '#050505', fontSize: 12, fontWeight: 800, textDecoration: 'none', letterSpacing: '.06em',
            textTransform: 'uppercase', boxShadow: '0 0 18px rgba(251,191,36,.3)',
          }}>
            <Icon name="plus" size={14} /> Deposit
          </Link>
          <BalanceChip label="Cash Balance"  cents={wallet?.cash_balance_cents  || 0} accent="#10b981" />
          <BalanceChip label="Bonus Balance" cents={wallet?.bonus_balance_cents || 0} accent={GOLD} />
          <Link href="/dashboard/notifications" style={{ position: 'relative', color: 'rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
            <Icon name="bell" size={18} />
            {unread > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: GOLD, color: '#000', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99 }}>{unread}</span>}
          </Link>
          <Link href="/dashboard/profile" className="avatar-btn" style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#fbbf24,#b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#050505', textDecoration: 'none', border: '2px solid rgba(251,191,36,.5)' }}>
            {(profile?.full_name || 'U')[0].toUpperCase()}
          </Link>
        </div>
      </header>

      {/* SIDEBAR */}
      <aside className={`player-sidebar${sidebarOpen ? ' open' : ''}`} style={{
        position: 'fixed', top: 64, left: 0, bottom: 0, zIndex: 50,
        background: 'var(--panel-gradient)', borderRight: '1px solid rgba(251,191,36,.1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <nav ref={navRef} onScroll={e => { cache.navScroll = e.currentTarget.scrollTop }} style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', scrollbarWidth: 'none' }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                title={item.label}
                className={`nav-link${active ? ' active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, marginBottom: 4,
                  textDecoration: 'none', fontSize: 14, fontWeight: active ? 700 : 500,
                  color: active ? '#050505' : 'rgba(255,255,255,.7)',
                  background: active ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'transparent',
                  boxShadow: active ? '0 0 20px rgba(251,191,36,.25)' : 'none',
                }}>
                <Icon name={item.icon} />
                <span className="rail-label" style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid rgba(251,191,36,.1)' }}>
          <button onClick={handleSignOut} disabled={signingOut} title="Sign out" className="rail-btn"
            style={{ width: '100%', height: 40, padding: '0 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, color: '#f87171', fontSize: 13, fontWeight: 700, cursor: signingOut ? 'default' : 'pointer', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: signingOut ? .6 : 1 }}>
            <Icon name="logout" size={16} />
            <span className="rail-label" style={{ whiteSpace: 'nowrap' }}>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, top: 64, background: 'rgba(0,0,0,.7)', zIndex: 40 }} />}

      {/* MAIN */}
      <div className="player-main" style={{ marginLeft: 72, paddingTop: 64, minHeight: '100vh' }}>
        <WinsTicker />
        {showPromo && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '10px 40px 10px 16px', position: 'relative', background: 'linear-gradient(90deg,rgba(251,191,36,.14),rgba(245,158,11,.06),rgba(251,191,36,.14))', borderBottom: '1px solid rgba(251,191,36,.18)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
            <span style={{ color: GOLD }}>🎁</span> {PROMO_TEXT}
            <button onClick={() => setPromoOpen(false)} aria-label="Dismiss" style={{ position: 'absolute', right: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: 18, cursor: 'pointer' }}>×</button>
          </div>
        )}
        <main className="player-content" style={{ padding: '28px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        /* Icon rail: 72px of icons, expanding to 250px on hover and sitting
           over the page, so nothing shifts underneath. Same as both admin
           portals. */
        .player-sidebar { width: 72px; overflow: hidden; transition: width .18s ease; }
        .player-sidebar:hover,
        .player-sidebar:focus-within { width: 250px; box-shadow: 8px 0 32px rgba(0,0,0,.55); }

        /* A hidden label must take no WIDTH either, or the Sign Out button
           centres its icon against invisible text and pushes it off the
           edge — which is exactly what happened in the admin rail. */
        .player-sidebar .rail-label {
          opacity: 0; max-width: 0; overflow: hidden;
          transition: opacity .12s ease, max-width .18s ease; pointer-events: none;
        }
        .player-sidebar:hover .rail-label,
        .player-sidebar:focus-within .rail-label { opacity: 1; max-width: 190px; pointer-events: auto; }

        .player-sidebar .rail-btn { gap: 0 !important; padding-left: 0 !important; padding-right: 0 !important; }
        .player-sidebar:hover .rail-btn,
        .player-sidebar:focus-within .rail-btn { gap: 8px !important; padding-left: 12px !important; padding-right: 12px !important; }

        .nav-link:not(.active):hover { background: rgba(251,191,36,.08) !important; color: #fff !important; }
        .player-sidebar::-webkit-scrollbar { display: none; }
        .wins-track { animation: winsScroll 40s linear infinite; padding-left: 20px; }
        @keyframes winsScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .logo-icon { display: none; }
        .bal-chip:hover { border-color: rgba(251,191,36,.6) !important; }
        @media (max-width: 900px) {
          .logo-full { display: none; }
          .logo-icon { display: inline-flex !important; }
          .deposit-btn { padding: 9px 12px !important; }
        }
        @media (max-width: 768px) {
          /* On a phone there is no hover, so the drawer opens at full width
             with every label showing. */
          .player-sidebar { width: 250px !important; transform: translateX(-100%); transition: transform .25s; }
          .player-sidebar.open { transform: translateX(0); }
          .player-sidebar .rail-label { opacity: 1 !important; max-width: none !important; pointer-events: auto !important; }
          .player-sidebar .rail-btn { gap: 8px !important; padding-left: 12px !important; padding-right: 12px !important; }
          .player-main { margin-left: 0 !important; overflow-x: hidden; }
          .player-content { padding: 18px 14px !important; }
          .top-header { padding: 0 12px !important; gap: 8px !important; }
          .header-right { gap: 8px !important; }
          .mobile-hamburger { display: flex !important; }
          .avatar-btn { display: none !important; }
          .bal-chip { min-width: 0 !important; padding: 4px 8px !important; }
        }
        @media (max-width: 480px) {
          .deposit-btn { display: none !important; }
          .header-right { gap: 6px !important; }
          .bal-chip { padding: 3px 7px !important; }
          .bal-chip span:last-child { font-size: 12.5px !important; }
          .bal-chip span:first-child { font-size: 8px !important; letter-spacing: .06em !important; }
          .player-content { padding: 14px 12px !important; }
        }
      `}</style>
    </div>
  )
}
