// Small shared helpers for dashboard pages (black & gold theme)
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export const G = '#fbbf24'
export const card = { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(251,191,36,.14)', borderRadius: 18, padding: 22 }
export const input = { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }

// Returns the logged-in user, or sends the visitor to the login page
export function useUser() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login')
      else setUser(data.user)
    })
  }, [])
  return user
}

export function Title({ children, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, marginBottom: 4 }}>{children}</h1>
      {sub && <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 14 }}>{sub}</p>}
    </div>
  )
}

export function Label({ children }) {
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>{children}</label>
}

export function Btn({ children, ghost, style, ...p }) {
  return (
    <button {...p} style={{
      padding: '12px 26px', borderRadius: 12, fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
      cursor: p.disabled ? 'not-allowed' : 'pointer', opacity: p.disabled ? .5 : 1,
      border: ghost ? '1px solid rgba(251,191,36,.4)' : 'none',
      background: ghost ? 'transparent' : 'linear-gradient(135deg,#fbbf24,#f59e0b)',
      color: ghost ? G : '#050505', ...style,
    }}>{children}</button>
  )
}

export function Notice({ kind = 'info', children }) {
  if (!children) return null
  const c = { error: ['239,68,68', '#f87171'], success: ['16,185,129', '#10b981'], info: ['251,191,36', G] }[kind]
  return <div style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: 600, background: `rgba(${c[0]},.1)`, border: `1px solid rgba(${c[0]},.3)`, color: c[1] }}>{children}</div>
}

export function Empty({ icon = '📭', text }) {
  return <div style={{ padding: '36px 16px', textAlign: 'center', color: 'rgba(255,255,255,.35)', fontSize: 13 }}><div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>{text}</div>
}

// Confirmation popup shown after a request is submitted, telling the player
// how long to wait before contacting support. `data` is { title, text } or
// null (hidden).
export function WaitPopup({ data, onClose, emoji = '✅' }) {
  if (!data) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0e1a2e', border: '1px solid rgba(251,191,36,.3)', borderRadius: 20, padding: '30px 28px', width: '100%', maxWidth: 420, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        <div style={{ fontSize: 46, marginBottom: 14 }}>{emoji}</div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>{data.title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,.6)', margin: '0 0 22px' }}>{data.text}</p>
        <Btn onClick={onClose} style={{ width: '100%' }}>Got it</Btn>
      </div>
    </div>
  )
}

// Standard wait messages, one per request type.
export const WAIT_MESSAGES = {
  deposit:  { title: 'Deposit Received', text: 'Your deposit request has been received. Please allow at least 3 to 5 minutes for it to be approved before contacting customer support.' },
  scores:   { title: 'Scores Request Received', text: 'Your scores request has been received. Please allow at least 3 to 5 minutes for the scores to be added before contacting customer support.' },
  redeem:   { title: 'Redeem Request Received', text: 'Your redeem request has been received. Please allow at least 3 to 5 minutes for it to be reviewed before contacting customer support.' },
  withdraw: { title: 'Withdraw Request Received', text: 'Your withdraw request has been received and your details will now be reviewed, then your withdraw will be processed. Please allow 5 to 10 minutes for the withdraw to process before contacting customer support.' },
  game_account: { title: 'Account Requested', text: 'Your game account request has been received. Our team is setting it up and your login details will be ready shortly — thank you for your patience.' },
  game_password: { title: 'Reset Requested', text: 'Your game password reset request has been received. Our team will update your login shortly — thank you for your patience.' },
  password: { title: 'Password Updated', text: 'Your password has been updated successfully. Please use your new password the next time you sign in.' },
}

export const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
export const toCents = (v) => Math.round(parseFloat(v) * 100)
