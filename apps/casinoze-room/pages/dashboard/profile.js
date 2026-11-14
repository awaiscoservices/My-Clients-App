import { useState, useEffect } from 'react'
import PlayerLayout from '../../components/layout/PlayerLayout'
import { supabase } from '../../lib/supabase'
import { WaitPopup, WAIT_MESSAGES } from '../../components/ui/kit'
import Icon from '../../components/ui/Icon'

const gold = '#fbbf24', green = '#22c55e', red = '#ef4444'

const money = c => '$' + ((c || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const clamp = (n, a, b) => Math.max(a, Math.min(b, n))

function Card({ children, style }) {
  return <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 22, ...style }}>{children}</div>
}

function BenefitRow({ label, value, mute }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, padding: '7px 9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: mute ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.88)', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

function StatTile({ label, value, accent, icon }) {
  return (
    <div style={{ background: `${accent}0f`, border: `1px solid ${accent}2e`, borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: accent }}>
        {icon && <Icon name={icon} size={15} color={accent} />}
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: "'Fraunces',serif" }}>{value}</div>
    </div>
  )
}

export default function ProfilePage() {
  const [p, setP] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const [pwForm, setPwForm] = useState({ new_password: '', confirm_password: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [popup, setPopup] = useState(null)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      const res = await fetch('/api/player/profile', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) setP(await res.json())
      setLoading(false)
    })()
  }, [])

  const changePassword = async () => {
    if (pwForm.new_password.length < 8) { setPwMsg('Password must be at least 8 characters'); return }
    if (pwForm.new_password !== pwForm.confirm_password) { setPwMsg('Passwords do not match'); return }
    setPwSaving(true); setPwMsg(''); setPwSuccess(false)
    const { error } = await supabase.auth.updateUser({ password: pwForm.new_password })
    setPwSaving(false)
    if (error) setPwMsg(error.message)
    else { setPwSuccess(true); setPwForm({ new_password: '', confirm_password: '' }); setPopup(WAIT_MESSAGES.password) }
  }

  const copyRef = () => {
    navigator.clipboard?.writeText(p?.my_referral_code || '').then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) }, () => {})
  }

  if (loading) return (
    <PlayerLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'rgba(255,255,255,.3)', fontFamily: 'Outfit, sans-serif' }}>Loading…</div>
    </PlayerLayout>
  )

  const lvl       = p?.level || {}
  const accent    = lvl.color || gold
  const next      = p?.next_level
  const xp        = p?.xp_points || 0
  const lvlMin    = lvl.min_xp || 0
  const nextMin   = next?.min_xp
  const pct       = next ? clamp(Math.round(((xp - lvlMin) / Math.max(1, nextMin - lvlMin)) * 100), 0, 100) : 100
  const xpToNext  = next ? Math.max(0, nextMin - xp) : 0
  const kyc       = (p?.kyc_status || '').toLowerCase() === 'verified'
  const initial   = (p?.full_name || p?.username || 'P').trim().charAt(0).toUpperCase()
  const perks     = Array.isArray(lvl.perks) ? lvl.perks : (lvl.perks ? [lvl.perks] : [])
  const total     = (p?.cash_balance_cents || 0) + (p?.bonus_balance_cents || 0)

  const pill = (text, color) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: `${color}1f`, border: `1px solid ${color}44`, color }}>{text}</span>
  )

  return (
    <PlayerLayout>
      <WaitPopup data={popup} onClose={() => setPopup(null)} />
      <style>{`
        .pf-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 18px; align-items: start; }
        .pf-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 900px) { .pf-grid { grid-template-columns: 1fr; } .pf-stats { grid-template-columns: repeat(2, 1fr); } }
        .pf-input { width: 100%; padding: '11px 14px'; }
        .pf-field { width: 100%; padding: 11px 14px; border-radius: 10px; box-sizing: border-box; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); color: #fff; font-size: 14px; font-family: 'Outfit', sans-serif; outline: none; }
      `}</style>

      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff' }}>

        {/* Hero */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: 26, marginBottom: 18,
          background: `linear-gradient(135deg, ${accent}26, rgba(255,255,255,.02) 60%)`, border: `1px solid ${accent}33` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 }}>
              <div style={{ width: 74, height: 74, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, fontWeight: 800, color: '#050505', fontFamily: "'Fraunces',serif",
                background: `linear-gradient(135deg, ${accent}, ${accent}aa)`, boxShadow: `0 8px 24px ${accent}55` }}>{initial}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Fraunces',serif", lineHeight: 1.1 }}>{p?.full_name || '—'}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>
                  {p?.username ? `@${p.username}` : p?.email}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>
                  Member since {p?.member_since ? new Date(p.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              {pill(lvl.name || 'Bronze', accent)}
              {kyc ? pill('KYC Verified', green) : pill('KYC Pending', gold)}
              {pill(p?.status === 'suspended' ? 'Suspended' : 'Active', p?.status === 'suspended' ? red : green)}
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="pf-stats" style={{ marginBottom: 18 }}>
          <StatTile label="Cash Balance"  value={money(p?.cash_balance_cents)}  accent={green} icon="wallet" />
          <StatTile label="Bonus Balance" value={money(p?.bonus_balance_cents)} accent="#a855f7" icon="gift" />
          <StatTile label="Total Balance" value={money(total)}                 accent={gold}  icon="gem" />
          <StatTile label="XP Points"     value={xp.toLocaleString()}          accent="#38bdf8" icon="star" />
        </div>

        <div className="pf-grid">
          {/* Left column */}
          <div>
            {/* Level progress */}
            <Card style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `${accent}1f`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                    <Icon name={lvl.icon || 'star'} size={20} color={accent} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>Current Level</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: accent, fontFamily: "'Fraunces',serif" }}>{lvl.name || 'Bronze'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Fraunces',serif" }}>{pct}%</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{next ? `to ${next.name}` : 'Max level'}</div>
                </div>
              </div>

              <div style={{ height: 12, borderRadius: 99, background: 'rgba(255,255,255,.06)', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: `linear-gradient(90deg, ${accent}, ${accent}99)`, transition: 'width .5s ease', boxShadow: `0 0 16px ${accent}66` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,.45)' }}>
                <span>{xp.toLocaleString()} XP</span>
                <span>{next ? `${xpToNext.toLocaleString()} XP to ${next.name}` : 'Highest tier reached'}</span>
              </div>

              {perks.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {perks.map((perk, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 9, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
                      <Icon name="checkCircle" size={13} color={accent} /> {perk}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Game accounts */}
            {p?.game_accounts?.length > 0 && (
              <Card>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: gold, margin: '0 0 14px', letterSpacing: '.02em' }}>My Game Accounts</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {p.game_accounts.map(ga => (
                    <div key={ga.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 11 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{ga.game_name || 'Game'}</div>
                        {ga.username && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontFamily: 'monospace', marginTop: 2 }}>{ga.username}</div>}
                      </div>
                      {pill(ga.status === 'active' ? 'Active' : 'Pending', ga.status === 'active' ? green : gold)}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Level benefits — same rules shown on the Levels page */}
            <Card style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <Icon name={lvl.icon || 'star'} size={16} color={accent} />
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '.02em' }}>{lvl.name || 'Level'} Benefits</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Wallet */}
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(96,165,250,.35)' }}>
                  <div style={{ background: 'rgba(96,165,250,.16)', padding: '7px 9px', borderBottom: '1px solid rgba(96,165,250,.28)', textAlign: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: '#93c5fd', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="wallet" size={12} /> Wallet</span>
                  </div>
                  <div style={{ background: 'rgba(96,165,250,.05)', padding: 9, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <BenefitRow label="Min WD" value={lvl.min_withdrawal_cents != null ? money(lvl.min_withdrawal_cents) : '—'} />
                    <BenefitRow label="Max WD" value={lvl.max_withdrawal_cents != null ? money(lvl.max_withdrawal_cents) : '—'} />
                    <BenefitRow label="Window" value="24h" mute />
                  </div>
                </div>
                {/* Game */}
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(167,139,250,.35)' }}>
                  <div style={{ background: 'rgba(167,139,250,.16)', padding: '7px 9px', borderBottom: '1px solid rgba(167,139,250,.28)', textAlign: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: '#c4b5fd', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="gamepad" size={12} /> Game</span>
                  </div>
                  <div style={{ background: 'rgba(167,139,250,.05)', padding: 9, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <BenefitRow label="Min x" value={lvl.min_redeem_multiplier != null ? parseFloat(lvl.min_redeem_multiplier).toFixed(1) + 'x' : '—'} />
                    <BenefitRow label="Max x" value={lvl.max_redeem_multiplier != null ? parseFloat(lvl.max_redeem_multiplier).toFixed(1) + 'x' : '—'} />
                    <BenefitRow label="Cap" value={lvl.max_redeem_cap_cents != null ? money(lvl.max_redeem_cap_cents) : '—'} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick actions */}
            <Card style={{ marginTop: 18 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: gold, margin: '0 0 14px', letterSpacing: '.02em' }}>Quick Actions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { href: '/dashboard/deposit', label: 'Deposit', icon: 'plus', bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)', fg: '#050505' },
                  { href: '/dashboard/load-game', label: 'Load Credits', icon: 'arrowUp', bg: 'linear-gradient(135deg,#2dd4bf,#0891b2)', fg: '#fff' },
                  { href: '/dashboard/redeem', label: 'Redeem', icon: 'arrowDown', bg: 'rgba(255,255,255,.05)', fg: '#fff', border: '1px solid rgba(255,255,255,.12)' },
                  { href: '/dashboard/withdraw', label: 'Withdraw', icon: 'wallet', bg: 'rgba(255,255,255,.05)', fg: '#fff', border: '1px solid rgba(255,255,255,.12)' },
                ].map((a, i) => (
                  <a key={i} href={a.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, textDecoration: 'none', color: a.fg, background: a.bg, border: a.border || 'none', fontFamily: 'Outfit, sans-serif' }}>
                    <Icon name={a.icon} size={15} color={a.fg} /> {a.label}
                  </a>
                ))}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div>
            {/* Referral */}
            <Card style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: gold, margin: '0 0 6px', letterSpacing: '.02em' }}>Your Referral Code</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', margin: '0 0 14px' }}>Share it — you earn a bonus when a friend deposits.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, padding: '13px 16px', borderRadius: 11, background: 'rgba(251,191,36,.08)', border: '1px dashed rgba(251,191,36,.4)', color: gold, fontSize: 18, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '.12em', textAlign: 'center' }}>
                  {p?.my_referral_code || '—'}
                </div>
                <button onClick={copyRef} disabled={!p?.my_referral_code} style={{ padding: '0 18px', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 800, color: '#050505', background: `linear-gradient(135deg, ${gold}, #f59e0b)` }}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </Card>

            {/* Change password */}
            <Card>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: gold, margin: '0 0 16px', letterSpacing: '.02em' }}>Change Password</h2>
              {pwSuccess && (
                <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                  <p style={{ color: green, fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="checkCircle" size={15} /> Password updated successfully!</p>
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>New Password</label>
                <input type="password" className="pf-field" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} placeholder="Min. 8 characters" />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Confirm Password</label>
                <input type="password" className="pf-field" value={pwForm.confirm_password} onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))} placeholder="Repeat new password" />
              </div>
              {pwMsg && <div style={{ color: red, fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="alert" size={13} /> {pwMsg}</div>}
              <button onClick={changePassword} disabled={pwSaving} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: pwSaving ? 'rgba(251,191,36,.2)' : `linear-gradient(135deg, #f59e0b, ${gold})`, color: pwSaving ? 'rgba(255,255,255,.4)' : '#050505', fontSize: 15, fontWeight: 800, cursor: pwSaving ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </Card>
          </div>
        </div>
      </div>
    </PlayerLayout>
  )
}
