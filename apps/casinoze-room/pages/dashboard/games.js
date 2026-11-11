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

/* ── a game in the All Games tab ──────────────────────────────────────────── */
function GameCard({ game, myAccount, onRequest, requesting }) {
  const [hov, setHov] = useState(false)
  const color = game.accent_color || '#fbbf24'

  const btnLabel = () => {
    if (!myAccount) return requesting ? 'Requesting…' : '+ Create Account'
    if (myAccount.status === 'pending')   return 'Pending Setup'
    if (myAccount.status === 'active')    return 'Account Active'
    if (myAccount.status === 'suspended') return 'Suspended'
    return 'View Account'
  }

  const btnDisabled = !!myAccount || requesting

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      borderRadius: 20, overflow: 'hidden',
      background: hov ? `linear-gradient(135deg,${color}18,rgba(0,0,0,.4))` : 'rgba(255,255,255,.03)',
      border: `1.5px solid ${hov ? color + '66' : 'rgba(255,255,255,.08)'}`,
      transition: 'all .25s',
      transform: hov ? 'translateY(-4px)' : 'none',
      boxShadow: hov ? `0 20px 50px rgba(0,0,0,.5), 0 0 30px ${color}22` : 'none',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 6, background: `linear-gradient(90deg,${color},${color}66)` }} />

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: `linear-gradient(135deg,${color}22,${color}08)`, border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          marginBottom: 14, boxShadow: hov ? `0 0 20px ${color}33` : 'none', transition: 'box-shadow .25s',
        }}>
          <GameIcon name={game.name} slug={game.slug} logoUrl={game.logo_url} size={56} />
        </div>

        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6, fontFamily: "'Fraunces', serif" }}>{game.name}</div>
        {game.description && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.6, marginBottom: 14 }}>{game.description}</div>
        )}

        {/* Pushes the button to the bottom so a row of cards lines up. */}
        <div style={{ flex: 1 }} />

        {myAccount && (
          <div style={{ width: '100%', marginBottom: 12, padding: '8px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontWeight: 600 }}>
              {myAccount.game_username ? `@${myAccount.game_username}` : 'Setting up…'}
            </span>
            <StatusBadge status={myAccount.status} size="xs" />
          </div>
        )}

        <button
          onClick={() => !btnDisabled && onRequest(game)}
          disabled={btnDisabled}
          style={{
            width: '100%', padding: 11, borderRadius: 12,
            background: myAccount?.status === 'active'
              ? 'rgba(16,185,129,.12)'
              : btnDisabled ? 'rgba(255,255,255,.05)' : `linear-gradient(135deg,${color},${color}cc)`,
            border: `1px solid ${myAccount?.status === 'active' ? 'rgba(16,185,129,.3)' : btnDisabled ? 'rgba(255,255,255,.08)' : color + '66'}`,
            color: btnDisabled && myAccount?.status !== 'active' ? 'rgba(255,255,255,.35)' : myAccount?.status === 'active' ? '#10b981' : '#fff',
            fontSize: 13, fontWeight: 800, cursor: btnDisabled ? 'not-allowed' : 'pointer',
            fontFamily: "'Outfit',sans-serif", letterSpacing: '.02em', transition: 'all .2s',
          }}
        >
          {btnLabel()}
        </button>
      </div>
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
            <button onClick={() => onRequestPassword(account)} disabled={requestingPassword}
              style={{ width: '100%', marginBottom: 10, padding: '9px 12px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: 'rgba(255,255,255,.6)', fontSize: 11.5, fontWeight: 700, cursor: requestingPassword ? 'default' : 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              {requestingPassword ? 'Requesting…' : 'Request new password'}
            </button>
          )
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {account.status === 'active' && (
            <Link href={`/dashboard/load-game?account=${account.id}`} style={{ flex: 1, minWidth: 130, padding: 10, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none', textAlign: 'center', letterSpacing: '.02em' }}>
              Load Credits
            </Link>
          )}
          <Link href="/dashboard/support" style={{ flex: account.status === 'active' ? 0 : 1, padding: '10px 14px', background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.25)', borderRadius: 10, color: '#fbbf24', fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center', whiteSpace: 'nowrap' }}>
            Support
          </Link>
        </div>
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
  const [tab, setTab]               = useState('all')

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
    const [{ data: gamesData }, accountsRes] = await Promise.all([
      supabase.from('game_panels').select('*').eq('is_active', true).order('sort_order'),
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
      showToast(`${game.name} account requested. Our team will set it up shortly.`, 'success')
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
      showToast(data.message, 'success')
      loadData()
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error')
    } finally {
      setPwRequesting(null)
    }
  }

  const stats = [
    { label: 'Total Games', value: games.length,                                       color: '#fbbf24' },
    { label: 'My Accounts', value: accounts.length,                                      color: '#10b981' },
    { label: 'Active',      value: accounts.filter(a => a.status === 'active').length,   color: '#f59e0b' },
    { label: 'Pending',     value: accounts.filter(a => a.status === 'pending').length,  color: '#94a3b8' },
  ]

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

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
        {stats.map(s => (
          <div key={s.label} style={{ padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.04)', padding: 4, borderRadius: 12 }}>
          {[['all', 'All Games'], ['mine', 'My Games']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '9px 26px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700,
              background: tab === key ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : 'transparent',
              color: tab === key ? '#fff' : 'rgba(255,255,255,.45)', transition: 'all .2s',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px,46%),1fr))', gap: 16 }}>
            {games.map(game => (
              <GameCard
                key={game.id}
                game={game}
                myAccount={accountByGame[game.id]}
                onRequest={handleRequest}
                requesting={requesting === game.id}
              />
            ))}
          </div>
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
