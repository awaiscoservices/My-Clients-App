import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import PlayerLayout from '../../components/layout/PlayerLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import { useUser, Title, Label, Btn, Notice, card, input, fmtDate } from '../../components/ui/kit'

const MAX = 8 * 1024 * 1024
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const DOC_TYPES = [
  { value: 'national_id', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: 'Driving License' },
]

const BLANK = {
  first_name: '', middle_name: '', last_name: '', date_of_birth: '',
  country: '', state: '', city: '', zip_code: '', address: '',
  ssn: '', doc_type: '', doc_expiry: '',
}

// A labelled text/date input. Marks required fields with a red asterisk.
function Field({ label, req, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label>{label}{req && <span style={{ color: '#f87171', marginLeft: 4 }}>*</span>}</Label>
      {children}
    </div>
  )
}

// A dashed "upload" box that shows the chosen file name once picked.
function Upload({ label, req, file, onPick, disabled }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label>{label}{req && <span style={{ color: '#f87171', marginLeft: 4 }}>*</span>}</Label>
      <label style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '14px', borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
        border: `1px dashed ${file ? 'rgba(16,185,129,.5)' : 'rgba(251,191,36,.4)'}`,
        background: file ? 'rgba(16,185,129,.08)' : 'rgba(251,191,36,.05)',
        color: file ? '#10b981' : '#fbbf24', fontSize: 13, fontWeight: 700,
      }}>
        {file ? `✓ ${file.name}` : `+ ${label}`}
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={disabled} onChange={onPick} style={{ display: 'none' }} />
      </label>
    </div>
  )
}

export default function KycSubmit() {
  const user = useUser()
  const [latest, setLatest] = useState(undefined)   // undefined = loading, null = never submitted
  const [tenantId, setTenantId] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [front, setFront] = useState(null)
  const [back, setBack] = useState(null)
  const [selfie, setSelfie] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    const [{ data: rec }, { data: prof }] = await Promise.all([
      supabase.from('kyc_records').select('id, status, created_at, rejection_reason').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('profiles').select('tenant_id').eq('id', user.id).single(),
    ])
    setLatest(rec?.[0] || null)
    setTenantId(prof?.tenant_id || null)
  }
  useEffect(() => { if (user) load() }, [user])

  const locked = latest && ['pending', 'verified'].includes(latest.status)
  const needsBack = form.doc_type !== 'passport'   // passports are single-page

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function pick(setter) {
    return e => {
      const f = e.target.files?.[0]; if (!f) return setter(null)
      if (!OK_TYPES.includes(f.type)) { setMsg({ kind: 'error', text: 'Please upload a JPG, PNG, WebP or PDF file' }); e.target.value = ''; return setter(null) }
      if (f.size > MAX) { setMsg({ kind: 'error', text: 'Each file must be under 8 MB' }); e.target.value = ''; return setter(null) }
      setMsg(null); setter(f)
    }
  }
  async function upload(file, tag) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${user.id}/${Date.now()}-${tag}.${ext}`
    const { error } = await supabase.storage.from('kyc-documents').upload(path, file)
    if (error) throw error
    return path
  }

  function validate() {
    const req = ['first_name', 'last_name', 'date_of_birth', 'country', 'state', 'city', 'zip_code', 'address', 'ssn', 'doc_type', 'doc_expiry']
    for (const k of req) if (!String(form[k]).trim()) return 'Please fill in all required fields'
    if (!front) return 'Please upload the front of your document'
    if (needsBack && !back) return 'Please upload the back of your document'
    if (!selfie) return 'Please upload a selfie'
    return null
  }

  async function submit(e) {
    e.preventDefault(); setMsg(null)
    if (locked) return
    const err = validate()
    if (err) return setMsg({ kind: 'error', text: err })
    setBusy(true)
    try {
      const doc_front_url = await upload(front, 'front')
      const doc_back_url = needsBack ? await upload(back, 'back') : null
      const selfie_url = await upload(selfie, 'selfie')
      const full_legal_name = [form.first_name, form.middle_name, form.last_name].map(s => s.trim()).filter(Boolean).join(' ')
      const { error } = await supabase.from('kyc_records').insert({
        user_id: user.id,
        tenant_id: tenantId,
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || null,
        last_name: form.last_name.trim(),
        full_legal_name,
        date_of_birth: form.date_of_birth,
        country: form.country.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        zip_code: form.zip_code.trim(),
        address: form.address.trim(),
        ssn: form.ssn.trim(),
        doc_type: form.doc_type,
        doc_expiry: form.doc_expiry,
        doc_front_url, doc_back_url, selfie_url,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      if (error) throw error
      setForm(BLANK); setFront(null); setBack(null); setSelfie(null); await load()
    } catch (err) { setMsg({ kind: 'error', text: err.message || 'Submission failed. Please try again.' }) }
    setBusy(false)
  }

  const two = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }

  return (
    <PlayerLayout>
      <Head><title>Verify Identity — Casinoze Room</title></Head>
      <Title sub="Complete your identity verification to unlock withdrawals">KYC Verification</Title>
      <div style={{ maxWidth: 760 }}>
        {latest && (
          <div style={{ ...card, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div><div style={{ fontWeight: 700 }}>Latest submission</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{fmtDate(latest.created_at)}</div></div>
            <StatusBadge status={latest.status} />
          </div>
        )}
        {latest?.status === 'pending' && <Notice>Your documents are under review. You can’t submit again until we’ve checked them.</Notice>}
        {latest?.status === 'verified' && <Notice kind="success">You’re verified. Withdraws are unlocked. <Link href="/dashboard/withdraw" style={{ color: '#10b981', fontWeight: 800 }}>Go to Withdraw →</Link></Notice>}
        {latest && ['rejected', 'more_info_required'].includes(latest.status) && <Notice kind="error">{latest.status === 'rejected' ? 'Your last submission was rejected' : 'We need more information'}{latest.rejection_reason ? `: ${latest.rejection_reason}` : '.'} Please submit again below.</Notice>}

        <form onSubmit={submit} style={{ ...card, opacity: locked ? .5 : 1, pointerEvents: locked ? 'none' : 'auto' }}>
          <Notice kind={msg?.kind}>{msg?.text}</Notice>

          {/* 1 — Personal */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24', margin: '4px 0 16px' }}>Personal Information</h3>
          <div style={two}>
            <Field label="First Name" req><input style={input} value={form.first_name} onChange={set('first_name')} placeholder="Enter first name" disabled={busy} /></Field>
            <Field label="Middle Name"><input style={input} value={form.middle_name} onChange={set('middle_name')} placeholder="Optional" disabled={busy} /></Field>
            <Field label="Last Name" req><input style={input} value={form.last_name} onChange={set('last_name')} placeholder="Enter last name" disabled={busy} /></Field>
            <Field label="Date of Birth" req><input type="date" style={input} value={form.date_of_birth} onChange={set('date_of_birth')} disabled={busy} /></Field>
          </div>

          {/* 2 — Address */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24', margin: '18px 0 16px' }}>Address Information</h3>
          <div style={two}>
            <Field label="Country" req><input style={input} value={form.country} onChange={set('country')} placeholder="Enter country" disabled={busy} /></Field>
            <Field label="State/Province" req><input style={input} value={form.state} onChange={set('state')} placeholder="Enter state" disabled={busy} /></Field>
            <Field label="City" req><input style={input} value={form.city} onChange={set('city')} placeholder="Enter city" disabled={busy} /></Field>
            <Field label="ZIP Code" req><input style={input} value={form.zip_code} onChange={set('zip_code')} placeholder="Enter ZIP code" disabled={busy} /></Field>
          </div>
          <Field label="Address" req><input style={input} value={form.address} onChange={set('address')} placeholder="Enter street address" disabled={busy} /></Field>

          {/* 3 — Document */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24', margin: '18px 0 16px' }}>Document Information</h3>
          <div style={two}>
            <Field label="SSN" req><input style={input} value={form.ssn} onChange={set('ssn')} placeholder="Enter SSN" disabled={busy} /></Field>
            <Field label="Document Type" req>
              <select style={{ ...input, appearance: 'auto' }} value={form.doc_type} onChange={set('doc_type')} disabled={busy}>
                <option value="">Select document type</option>
                {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="Document Expiry Date" req><input type="date" style={input} value={form.doc_expiry} onChange={set('doc_expiry')} disabled={busy} /></Field>
          </div>

          {/* 4 — Images */}
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24', margin: '18px 0 16px' }}>Document Images</h3>
          <div style={two}>
            <Upload label="Document Front" req file={front} onPick={pick(setFront)} disabled={busy} />
            {needsBack && <Upload label="Document Back" req file={back} onPick={pick(setBack)} disabled={busy} />}
          </div>
          <Upload label="Selfie" req file={selfie} onPick={pick(setSelfie)} disabled={busy} />

          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', margin: '6px 0 18px' }}>Use a government-issued ID. JPG, PNG, WebP or PDF, up to 8 MB each. Make sure all corners and text are clearly visible.</div>
          <Btn type="submit" disabled={locked || busy || latest === undefined} style={{ width: '100%' }}>{busy ? 'Submitting…' : locked ? (latest.status === 'verified' ? 'Already verified' : 'Under review') : 'Submit for verification'}</Btn>
        </form>
        <div style={{ marginTop: 16 }}><Link href="/profile" style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>← Back to profile</Link></div>
      </div>
    </PlayerLayout>
  )
}
