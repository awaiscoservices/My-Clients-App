import { useState, useEffect } from 'react'
import PlayerLayout from '../../components/layout/PlayerLayout'
import { supabase } from '../../lib/supabase'
import { WaitPopup, WAIT_MESSAGES } from '../../components/ui/kit'

const gold = '#fbbf24'; const green = '#22c55e'; const red = '#ef4444'; const purple = '#a855f7'


function Section({ title, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: gold, margin: '0 0 20px' }}>{title}</h2>
      {children}
    </div>
  )
}

function InputRow({ label, value, readOnly }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <input value={value || ''} readOnly={readOnly} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box', background: readOnly ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', border: `1px solid ${readOnly ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`, color: readOnly ? 'rgba(255,255,255,0.4)' : '#fff', fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Add payout method form

  // Change password form
  const [pwForm, setPwForm] = useState({ new_password: '', confirm_password: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [popup, setPopup] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setToken(session.access_token)
      await fetchProfile(session.access_token)
      setLoading(false)
    }
    init()
  }, [])

  const fetchProfile = async (tok) => {
    const res = await fetch('/api/player/profile', { headers: { Authorization: `Bearer ${tok}` } })
    if (res.ok) { const d = await res.json(); setProfile(d.profile) }
  }




  const changePassword = async () => {
    if (pwForm.new_password.length < 8) { setPwMsg('Password must be at least 8 characters'); return }
    if (pwForm.new_password !== pwForm.confirm_password) { setPwMsg('Passwords do not match'); return }
    setPwSaving(true); setPwMsg(''); setPwSuccess(false)
    const { error } = await supabase.auth.updateUser({ password: pwForm.new_password })
    setPwSaving(false)
    if (error) setPwMsg(error.message)
    else { setPwSuccess(true); setPwForm({ new_password: '', confirm_password: '' }); setPopup(WAIT_MESSAGES.password) }
  }

  if (loading) return (
    <PlayerLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit, sans-serif' }}>Loading…</div>
    </PlayerLayout>
  )

  return (
    <PlayerLayout>
      <WaitPopup data={popup} onClose={() => setPopup(null)} />
      <div style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: gold, marginBottom: 24 }}>👤 My Profile</h1>

        {/* Profile Info */}
        <Section title="Account Details">
          <InputRow label="Full Name" value={profile?.full_name} readOnly />
          <InputRow label="Email Address" value={profile?.email} readOnly />
          <InputRow label="Username" value={profile?.username} readOnly />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <InputRow label="KYC Status" value={profile?.kyc_verified ? '✅ Verified' : '⏳ Pending'} readOnly />
            <InputRow label="Member Since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'} readOnly />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>XP Points</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: gold }}>{(profile?.xp_points || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase' }}>Level</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: purple }}>{profile?.level_name || 'Bronze'}</div>
            </div>
          </div>
        </Section>


        {/* Change Password */}
        <Section title="🔐 Change Password">
          {pwSuccess && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ color: green, fontSize: 13, margin: 0 }}>✅ Password updated successfully!</p>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>New Password</label>
            <input type="password" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} placeholder="Min. 8 characters"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase' }}>Confirm Password</label>
            <input type="password" value={pwForm.confirm_password} onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))} placeholder="Repeat new password"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none' }} />
          </div>
          {pwMsg && <div style={{ color: red, fontSize: 12, marginBottom: 12 }}>⚠ {pwMsg}</div>}
          <button onClick={changePassword} disabled={pwSaving} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: pwSaving ? 'rgba(251,191,36,0.2)' : `linear-gradient(135deg, #b45309, ${gold})`, color: pwSaving ? 'rgba(255,255,255,0.4)' : '#000', fontSize: 15, fontWeight: 700, cursor: pwSaving ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </Section>
      </div>
    </PlayerLayout>
  )
}
