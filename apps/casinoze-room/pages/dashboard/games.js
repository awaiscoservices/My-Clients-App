/**
 * pages/dashboard/games.js — Games
 *
 * One page, two tabs:
 *   All Games — every game room this casino offers
 *   My Games  — the ones an account has been created for, with credentials
 *
 * This used to be two sidebar entries, Games and My Games, which split one
 * question ("what can I play, and where do I already have an account?") across
 * two pages. /dashboard/game-accounts now redirects here.
 *
 * No bonus or multiplier is shown on a game card. A bonus depends on the
 * payment method, the player's level and the day, so a number printed on a
 * game tile was decoration at best and wrong at worst — bonuses belong on
 * Deposit, and redeem rules on Player Levels.
 */
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import GameIcon from '../../components/ui/GameIcon'
import { WaitPopup, WAIT_MESSAGES } from '../../components/ui/kit'

// The same colour pairs the dashboard tiles cycle through, so a game looks
// the same in both places.
const TINTS = [
  ['#1f9d7a', '#0f3b4a'], ['#2b5fd9', '#13264f'], ['#7a3fe0', '#2a1450'],
  ['#12b8d6', '#0c3350'], ['#2b6fe0', '#14285a'], ['#1fa77f', '#0c3a3f'],
]

/* ── a game in the All Games tab ──────────────────────────────────────────── */
/* Built as the dashboard's game tile: the artwork fills a colour-washed box
   with the name on a bar across the bottom. No username here — whether you
   hold an account is a My Games question; this tab is the catalogue. */
function GameCard({ game, myAccount, onRequest, requesting, tint }) {
  const status = myAccount?.status

  const btnLabel = () => {
    if (!myAccount) return requesting ? 'Requesting…' : '+ Create Account'
    if (status === 'pending')   return 'Pending Setup'
    if (status === 'active')    return 'Account Active'
    if (status === 'suspended') return 'Suspended'
    return 'View Account'
  }

  const btnDisabled = !!myAccount || requesting

  return (
    <div className="gcard">
      <div className="gtile" style={{ '--g1': tint[0], '--g2': tint[1] }}>
        <div className="gtile-art">
          <GameIcon name={game.name} slug={game.slug} logoUrl={game.logo_url} size={96} />
        </div>
        <div className="gtile-bar">
          <span className="gtile-play"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg></span>
          <span className="gtile-name">{game.name}</span>
        </div>
      </div>

      <button
        onClick={() => !btnDisabled && onRequest(game)}
        disabled={btnDisabled}
        className="gcard-cta"
        style={{
          background: status === 'active' ? 'rgba(16,185,129,.12)'
            : btnDisabled ? 'rgba(255,255,255,.05)'
            : `linear-gradient(135deg,${tint[0]},${tint[1]})`,
          border: `1px solid ${status === 'active' ? 'rgba(16,185,129,.35)' : btnDisabled ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.18)'}`,
          color: status === 'active' ? '#10b981' : btnDisabled ? 'rgba(255,255,255,.35)' : '#fff',
          cursor: btnDisabled ? 'default' : 'pointer',
        }}
      >
        {btnLabel()}
      </button>
    </div>
  )
}

/* ── one of my accounts, in the My Games tab ──────────────────────────────── */
function AccountCard({ account, onRequestPassword, requestingPassword }) {
  const [showPassword, setShowPassword] = useState(false)
  const [hov, setHov] = useState(false)
  const [copied, setCopied] = useState('')
  const color = account.game_panels?.accent_color || '#fbbf24'
  const pwRequested = !!account.password_change_requested

  function copy(text, label) {
    navigator.clipboard.writeText(text || '').then(
      () => { setCopied(label); setTimeout(() => setCopied(''), 1600) },
      () => {},
    )
  }

  const copyBtn = {
    padding: '6px 12px', background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.3)',
    borderRadius: 8, color: '#fbbf24', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
  }

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,.03)',
      border: `1.5px solid ${hov ? color + '55' : 'rgba(255,255,255,.08)'}`, transition: 'all .2s',
    }}>
      <div style={{ height: 4, background: `linear-gradient(90deg,${color},${color}66)` }} />

      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GameIcon name={account.game_panels?.name} slug={account.game_panels?.slug} logoUrl={account.game_panels?.logo_url} size={34} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: "'Cinzel',serif" }}>{account.game_panels?.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{account.reference_id}</div>
            </div>
          </div>
          <StatusBadge status={account.status} />
        </div>

        {account.status === 'active' && account.game_username ? (
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Username</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'monospace', letterSpacing: '.05em' }}>{account.game_username}</div>
              </div>
              <button onClick={() => copy(account.game_username, 'Username')} style={copyBtn}>
                {copied === 'Username' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Password</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'monospace', letterSpacing: '.05em' }}>
                  {showPassword ? (account.game_password_display || '••••••••') : '••••••••'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setShowPassword(p => !p)}
                  style={{ padding: '6px 12px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                {showPassword && (
                  <button onClick={() => copy(account.game_password_display, 'Password')} style={copyBtn}>
                    {copied === 'Password' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : account.status === 'pending' ? (
          <div style={{ padding: 16, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 12, marginBottom: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Being set up</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>Our team is creating your account. You will be notified once it is ready.</div>
          </div>
        ) : null}

        {account.game_id && (
          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>Game ID</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{account.game_id}</span>
          </div>
        )}

        {/* A password change is a request to staff, not something the player
            can do themselves — the password lives in the game panel. The old
            one keeps working until staff replace it. */}
        {account.status === 'active' && (
          pwRequested ? (
            <div style={{ marginBottom: 10, padding: '9px 12px', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, fontSize: 11.5, color: '#f59e0b', fontWeight: 700, textAlign: 'center' }}>
              New password requested — your current one still works
            </div>
          ) : (
            <button onClick={() => onRequestPassword(account)} disabled={requestingPassword} className="btn-soft">
              {requestingPassword ? 'Requesting…' : 'Change Password'}
            </button>
          )
        )}

        {/* The two things a player does with a live game account, equal
            weight. Support moved out: it is in the sidebar, and it was
            competing with the actions that belong to this card. */}
        {account.status === 'active' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Link href={`/dashboard/load-game?account=${account.id}`} className="pill pill-load">
              Load Credits
            </Link>
            <Link href={`/dashboard/redeem?account=${account.id}`} className="pill pill-redeem">
              Redeem Scores
            </Link>
          </div>
        )}
      </div>

      <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,.04)', fontSize: 10, color: 'rgba(255,255,255,.2)', fontWeight: 600 }}>
        Requested {new Date(account.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  )
}

/* ── page ─────────────────────────────────────────────────────────────────── */
export default function GamesPage() {
  const router = useRouter()
  const [games, setGames]           = useState([])
  const [accounts, setAccounts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [requesting, setRequesting] = useState(null)
  const [pwRequesting, setPwRequesting] = useState(null)
  const [toast, setToast]           = useState(null)
  const [popup, setPopup]           = useState(null)
  const [tab, setTab]               = useState('all')
  const [showAll, setShowAll]       = useState(false)
  const [isNarrow, setIsNarrow]     = useState(false)

  // How many games to show before "Show more" depends on the width, and the
  // grid is CSS, so the count has to be worked out in JS. Starts false so the
  // server and the first client render agree.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)')
    const sync = () => setIsNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // /dashboard/game-accounts redirects here with ?tab=mine, and the tab is in
  // the URL so a player can link straight to their accounts.
  useEffect(() => {
    if (!router.isReady) return
    if (router.query.tab === 'mine') setTab('mine')
  }, [router.isReady, router.query.tab])

  useEffect(() => { loadData() }, [])

  function showToast(msg, type = 'info') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    // Accounts come from the API, not straight from the table. The game
    // password is stored encrypted and the key lives on the server, so a
    // query made in the browser could never show one — Show just revealed
    // another row of dots. The route decrypts the caller's own accounts and
    // never returns the encrypted blob itself.
    // Only this player's own casino's games. Without the tenant filter the
    // list showed every casino's panels, so a player could request an account
    // on another casino's copy of a game — a second account for the same game.
    const { data: me } = await supabase
      .from('profiles').select('tenant_id').eq('id', session.user.id).single()

    let panelQuery = supabase.from('game_panels').select('*').eq('is_active', true)
    if (me?.tenant_id) panelQuery = panelQuery.eq('tenant_id', me.tenant_id)

    const [{ data: gamesData }, accountsRes] = await Promise.all([
      panelQuery.order('sort_order'),
      fetch('/api/player/game-accounts', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }),
    ])

    setGames(gamesData || [])

    if (accountsRes.ok) {
      const d = await accountsRes.json()
      setAccounts(d.accounts || [])
    } else {
      setAccounts([])
      showToast('Could not load your game accounts', 'error')
    }

    setLoading(false)
  }

  const accountByGame = {}
  accounts.forEach(a => { accountByGame[a.game_panel_id] = a })

  async function handleRequest(game) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    setRequesting(game.id)
    try {
      const res = await fetch('/api/game-accounts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ game_panel_id: game.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setPopup(WAIT_MESSAGES.game_account)
      loadData()
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error')
    } finally {
      setRequesting(null)
    }
  }

  async function handleRequestPassword(account) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    setPwRequesting(account.id)
    try {
      const res = await fetch('/api/game-accounts/request-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ account_id: account.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setPopup(WAIT_MESSAGES.game_password)
      loadData()
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error')
    } finally {
      setPwRequesting(null)
    }
  }

  // How many games fit before "Show more": two rows of seven on a desktop,
  // eight rows of two on a phone. A phone shows more because a tile is small
  // there and scrolling past them costs little.
  const perPage    = isNarrow ? 16 : 14
  const visibleGames = showAll ? games : games.slice(0, perPage)
  const hiddenCount  = showAll ? 0 : Math.max(0, games.length - perPage)

  if (loading) return (
    <PlayerLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 14 }}>Loading games…</div>
      </div>
    </PlayerLayout>
  )

  return (
    <PlayerLayout>
      <Head><title>Games — Casinoze Room</title></Head>
      <WaitPopup data={popup} onClose={() => setPopup(null)} />

      <style>{`
        /* Seven across, which is what fits a desktop without the row sliding
           sideways. The old grid scrolled horizontally and hid most of the
           catalogue behind a scrollbar. */
        .games-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 14px; }
        @media (max-width: 1500px) { .games-grid { grid-template-columns: repeat(6, 1fr); } }
        @media (max-width: 1280px) { .games-grid { grid-template-columns: repeat(5, 1fr); } }
        @media (max-width: 1040px) { .games-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 860px)  { .games-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 720px)  { .games-grid { grid-template-columns: repeat(2, 1fr); gap: 11px; } }

        .gcard { display: flex; flex-direction: column; gap: 8px; }

        /* Gradient action buttons on an account card */
        .pill {
          padding: 12px 10px; border-radius: 11px; color: #fff;
          font-size: 12.5px; font-weight: 800; text-decoration: none; text-align: center;
          letter-spacing: .03em; transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
        }
        .pill:hover { transform: translateY(-2px); filter: brightness(1.08); }
        .pill-load   { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #050505; box-shadow: 0 8px 20px rgba(251,191,36,.35); }
        .pill-load:hover   { box-shadow: 0 12px 26px rgba(251,191,36,.5); }
        .pill-redeem { background: linear-gradient(135deg, #2dd4bf, #0891b2); box-shadow: 0 8px 20px rgba(13,148,136,.35); }
        .pill-redeem:hover { box-shadow: 0 12px 26px rgba(13,148,136,.5); }

        /* Soft gold gradient for the secondary "Change Password" action */
        .btn-soft {
          width: 100%; margin-bottom: 10px; padding: 10px 12px; border-radius: 10px;
          font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Outfit', sans-serif;
          color: #fbbf24; border: 1px solid rgba(251,191,36,.3);
          background: linear-gradient(135deg, rgba(251,191,36,.18), rgba(245,158,11,.08));
          transition: filter .18s ease;
        }
        .btn-soft:hover:enabled { filter: brightness(1.12); }
        .btn-soft:disabled { opacity: .6; cursor: default; }

        /* The dashboard's tile, so a game looks the same in both places. */
        .gtile {
          position: relative; border-radius: 18px; overflow: hidden; color: #fff;
          background: linear-gradient(165deg, var(--g1) 0%, var(--g2) 62%, #0a1222 100%);
          border: 1px solid rgba(255,255,255,.1);
          box-shadow: 0 8px 22px rgba(0,0,0,.35);
          transition: transform .3s cubic-bezier(.2,.9,.3,1.35), box-shadow .3s, border-color .3s;
        }
        .gtile::after {
          content: ''; position: absolute; top: 0; left: -70%; width: 45%; height: 100%;
          pointer-events: none; background: linear-gradient(105deg, transparent, rgba(255,255,255,.24), transparent);
          transform: skewX(-18deg); transition: left .7s;
        }
        .gtile-art { height: 122px; display: flex; align-items: center; justify-content: center; padding: 16px 12px 6px; }
        .gtile-art img { transition: transform .35s cubic-bezier(.2,.9,.3,1.35); }
        .gtile-bar {
          display: flex; align-items: center; gap: 7px; padding: 11px 12px;
          background: linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.6));
          border-top: 1px solid rgba(255,255,255,.08);
          font-size: 11px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: rgba(255,255,255,.88);
        }
        .gtile-play { font-size: 8px; color: #fbbf24; }
        .gtile-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .gcard:hover .gtile { transform: translateY(-6px) scale(1.04); border-color: #fbbf24; box-shadow: 0 22px 40px rgba(0,0,0,.55), 0 0 0 1px #fbbf24, 0 0 30px rgba(251,191,36,.35); z-index: 3; }
        .gcard:hover .gtile::after { left: 135%; }
        .gcard:hover .gtile-art img { transform: scale(1.1) translateY(-3px); }

        .gcard-cta {
          width: 100%; padding: 10px 8px; border-radius: 11px;
          font-size: 12px; font-weight: 800; font-family: 'Outfit', sans-serif;
          letter-spacing: .02em; transition: filter .2s;
        }
        .gcard-cta:hover:enabled { filter: brightness(1.12); }

        .show-more {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 13px 34px; border-radius: 14px; cursor: pointer;
          font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 800; color: #050505;
          background: linear-gradient(135deg, #fbbf24, #f59e0b); border: none;
          box-shadow: 0 10px 26px rgba(251,191,36,.25);
          transition: transform .2s, box-shadow .2s;
        }
        .show-more:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(251,191,36,.35); }

        /* Bigger, so the two tabs read as the main control on the page. */
        .gtab {
          padding: 13px 42px; border-radius: 12px; border: none; cursor: pointer;
          font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 800;
          letter-spacing: .01em; transition: all .2s;
        }
        @media (max-width: 560px) { .gtab { padding: 12px 24px; font-size: 14px; } }

        @media (prefers-reduced-motion: reduce) {
          .gtile, .gtile-art img, .show-more { transition: none; }
          .gcard:hover .gtile { transform: none; }
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? 'rgba(239,68,68,.95)' : toast.type === 'success' ? 'rgba(16,185,129,.95)' : 'rgba(251,191,36,.95)', borderRadius: 12, padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif", boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
          {toast.msg}
        </div>
      )}

      {/* Heading — centred, like the tabs and the stat cards below it. */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: '#fff', marginBottom: 6 }}>Games</h1>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, margin: 0 }}>
          Request an account in any game room. Our team sets it up for you.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
        <div style={{ display: 'flex', gap: 5, background: 'rgba(255,255,255,.04)', padding: 5, borderRadius: 15 }}>
          {[['all', 'All Games'], ['mine', 'My Games']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className="gtab" style={{
              background: tab === key ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : 'transparent',
              color: tab === key ? '#050505' : 'rgba(255,255,255,.5)',
              boxShadow: tab === key ? '0 8px 20px rgba(251,191,36,.25)' : 'none',
            }}>
              {label}{key === 'mine' && accounts.length > 0 ? ` (${accounts.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* All Games */}
      {tab === 'all' && (
        games.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,.5)', fontSize: 15, fontWeight: 600 }}>
            No games have been set up for this casino yet.
          </div>
        ) : (
          <>
            <div className="games-grid">
              {visibleGames.map((game, i) => (
                <GameCard
                  key={game.id}
                  game={game}
                  tint={TINTS[i % TINTS.length]}
                  myAccount={accountByGame[game.id]}
                  onRequest={handleRequest}
                  requesting={requesting === game.id}
                />
              ))}
            </div>

            {hiddenCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}>
                <button onClick={() => setShowAll(true)} className="show-more">
                  Show all {games.length} games
                  <span style={{ opacity: .7, fontWeight: 700 }}>+{hiddenCount}</span>
                </button>
              </div>
            )}
            {showAll && games.length > perPage && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}>
                <button onClick={() => setShowAll(false)} className="show-more">Show less</button>
              </div>
            )}
          </>
        )
      )}

      {/* My Games */}
      {tab === 'mine' && (
        accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px' }}>
            <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10 }}>No game accounts yet</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, marginBottom: 24 }}>
              Pick a game under All Games and request an account. Our team will set it up for you.
            </p>
            <button onClick={() => setTab('all')} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', border: 'none', borderRadius: 12, color: '#050505', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              Browse games
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%),1fr))', gap: 16, marginBottom: 24 }}>
              {accounts.map(a => (
                <AccountCard
                  key={a.id}
                  account={a}
                  onRequestPassword={handleRequestPassword}
                  requestingPassword={pwRequesting === a.id}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setTab('all')} style={{ padding: '12px 28px', background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.3)', borderRadius: 12, color: '#fbbf24', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                + Request another game account
              </button>
            </div>
          </>
        )
      )}
    </PlayerLayout>
  )
}
