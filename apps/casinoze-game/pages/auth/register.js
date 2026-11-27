import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signUpWithEmail, verifyEmailOtp, resendSignupOtp } from '../../lib/auth';
import { BRAND, pageTitle } from '../../lib/brand';
import Logo from '../../components/ui/Logo';
import AuthBackdrop from '../../components/site/AuthBackdrop'
import Icon from '../../components/ui/Icon'

const PARTICLES = ['♠', '♥', '♦', '♣'];

function Particle({ symbol, style }) {
  return (
    <div style={{ position: 'fixed', fontSize: style.size, color: style.color, left: style.left, top: style.top, opacity: style.opacity, animation: `floatUp ${style.duration}s linear ${style.delay}s infinite`, pointerEvents: 'none', zIndex: 0, userSelect: 'none', filter: style.glow ? `drop-shadow(0 0 6px ${style.color})` : 'none' }}>{symbol}</div>
  );
}

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [particles, setParticles] = useState([]);
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState('form'); // 'form' → 'otp'
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);
  const [regOpen, setRegOpen] = useState(true); // admin Settings → New Registrations
  const [refCode, setRefCode] = useState('');
  const [refLocked, setRefLocked] = useState(false); // true when the code came from a ?ref link

  // Respect the casino's "New Registrations" switch (maintenance is handled
  // site-wide in _app). Defaults open so a failed read never blocks signup.
  useEffect(() => {
    let on = true;
    fetch('/api/settings/flags')
      .then(r => r.json())
      .then(f => { if (on && f && f.registrations_enabled === false) setRegOpen(false); })
      .catch(() => {});
    return () => { on = false; };
  }, []);
  // ?ref=CODE → remember it (linked on first signed-in load) and show the banner
  useEffect(() => {
    try {
      const r = (new URLSearchParams(window.location.search).get('ref') || '').trim().slice(0, 32);
      if (r) { localStorage.setItem('referral_code', r.toUpperCase()); setRefCode(r.toUpperCase()); setRefLocked(true); }
      else setRefCode((localStorage.getItem('referral_code') || '').toUpperCase());
    } catch {}
  }, []);

  useEffect(() => {
    const generated = Array.from({ length: 22 }, (_, i) => ({
      id: i, symbol: PARTICLES[Math.floor(Math.random() * 4)],
      style: { left: `${Math.random() * 100}%`, top: `${100 + Math.random() * 20}%`, size: `${Math.random() * 18 + 10}px`, opacity: Math.random() * 0.18 + 0.04, duration: Math.random() * 14 + 10, delay: -(Math.random() * 20), color: Math.random() > 0.5 ? '#ef4444' : '#dc2626', glow: Math.random() > 0.65 },
    }));
    setParticles(generated);
  }, []);

  // Resend cooldown tick
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const setField = (key, value) => {
    setForm(p => ({ ...p, [key]: value }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    else if (form.fullName.trim().length < 2) e.fullName = 'Name must be at least 2 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      // Persist the referral code (linked or typed) so PlayerLayout can apply it
      // via apply_referral on first signed-in load. Empty clears any stale code.
      try {
        const code = (refCode || '').trim().slice(0, 32);
        if (code) localStorage.setItem('referral_code', code.toUpperCase());
        else localStorage.removeItem('referral_code');
      } catch {}
      await signUpWithEmail({ fullName: form.fullName, email: form.email, password: form.password });
      // Supabase emails a 6-digit code — move to the verify step.
      setStep('otp');
      setResendCooldown(45);
      showToast('We sent a 6-digit code to your email.', 'success');
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (ev) => {
    ev.preventDefault();
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) { setOtpError('Enter the 6-digit code'); return; }
    setOtpError('');
    setOtpLoading(true);
    try {
      // Verifying confirms the account AND signs the player in. The referral
      // code stays in localStorage and is linked on first signed-in load by
      // PlayerLayout → apply_referral.
      await verifyEmailOtp({ email: form.email, token: code });
      router.push('/dashboard');
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired code');
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendBusy) return;
    setResendBusy(true);
    try {
      await resendSignupOtp(form.email);
      setResendCooldown(45);
      showToast('New code sent.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not resend code');
    } finally {
      setResendBusy(false);
    }
  };

  const strengthLevel = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const strength = strengthLevel(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#dc2626', '#84cc16', '#22c55e'];

  const inputStyle = (field) => ({
    width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${focusedField === field ? errors[field] ? '#ef4444' : '#ef4444' : errors[field] ? 'rgba(239,68,68,0.5)' : 'rgba(231,216,195,0.2)'}`,
    borderRadius: 6, color: '#fff', fontSize: 15, fontFamily: 'Outfit, sans-serif',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.25s, box-shadow 0.25s',
    boxShadow: focusedField === field ? errors[field] ? '0 0 0 3px rgba(239,68,68,0.15)' : '0 0 0 3px rgba(239,68,68,0.15), 0 0 20px rgba(239,68,68,0.1)' : 'none',
    caretColor: '#ef4444',
  });

  return (
    <>
      <Head>
        <title>{pageTitle('Create Account')}</title>
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500;1,9..144,700&family=Cinzel:wght@600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{background:var(--bg-gradient);background-attachment:fixed;overflow-x:hidden}
          input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px rgba(10,4,30,1) inset!important;-webkit-text-fill-color:#ffffff!important;caret-color:#ef4444!important}
          @keyframes floatUp{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-110vh) rotate(360deg);opacity:0}}
          @keyframes fadeSlideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
          @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
          @keyframes pulse-glow{0%,100%{box-shadow:0 0 20px rgba(239,68,68,0.15)}50%{box-shadow:0 0 40px rgba(239,68,68,0.35)}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes orb-float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-30px) scale(1.06)}}
          @keyframes toastIn{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
          @keyframes successPop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
        `}</style>
      </Head>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, animation: 'toastIn .3s ease', background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)', border: `1px solid ${toast.type === 'error' ? '#ef4444' : '#10b981'}`, borderRadius: 12, padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name={toast.type === 'error' ? 'alert' : 'check'} size={16} stroke={2.4} /> {toast.msg}</span>
        </div>
      )}

      <AuthBackdrop />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', fontFamily: 'Outfit, sans-serif' }}>

        {/* Logo */}
        <div style={{ animation: 'fadeSlideUp 0.6s ease both', marginBottom: 32, textAlign: 'center' }}>
          <Logo variant="full" stack height={88} />
          <div style={{ marginTop: 6, fontSize: 11, letterSpacing: 4, color: 'rgba(239,68,68,0.7)', textTransform: 'uppercase', fontWeight: 500 }}>{BRAND.tagline}</div>
        </div>

        {/* OTP verification step */}
        {step === 'otp' ? (
          <div style={{ width: '100%', maxWidth: 460, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(231,216,195,0.14)', borderRadius: 4, padding: 'clamp(28px, 5vw, 44px)', backdropFilter: 'blur(20px)', animation: 'fadeSlideUp 0.5s ease both', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, #dc2626, #ef4444, #dc2626, transparent)' }} />
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center', color: '#ef4444' }}><Icon name="inbox" size={44} stroke={1.6} /></div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6, textAlign: 'center' }}>Verify Your Email</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', marginBottom: 26 }}>Enter the 6-digit code we sent to <span style={{ color: '#ef4444', fontWeight: 600 }}>{form.email}</span></p>

            <form onSubmit={handleVerify} noValidate>
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); if (otpError) setOtpError(''); }}
                onFocus={() => setFocusedField('otp')} onBlur={() => setFocusedField(null)}
                placeholder="______"
                style={{ ...inputStyle('otp'), textAlign: 'center', fontSize: 30, letterSpacing: 14, fontWeight: 700, padding: '16px' }}
              />
              {otpError && <p style={{ color: '#f87171', fontSize: 12, marginTop: 10, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="alert" size={13} /> {otpError}</p>}

              <button type="submit" disabled={otpLoading} style={{ width: '100%', marginTop: 22, padding: 15, background: otpLoading ? 'rgba(220,38,38,0.4)' : 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: 1.4, textTransform: 'uppercase', cursor: otpLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: otpLoading ? 'none' : '0 4px 24px rgba(220,38,38,0.35)' }}>
                {otpLoading ? (<><span style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Verifying…</>) : 'Verify & Continue'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Didn't get it?{' '}
              <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || resendBusy} style={{ background: 'none', border: 'none', padding: 0, color: resendCooldown > 0 ? 'rgba(255,255,255,0.3)' : '#ef4444', fontWeight: 600, fontFamily: 'Outfit, sans-serif', fontSize: 13, cursor: resendCooldown > 0 || resendBusy ? 'not-allowed' : 'pointer' }}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendBusy ? 'Sending…' : 'Resend code'}
              </button>
            </p>
            <p style={{ textAlign: 'center', marginTop: 10, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              Wrong email?{' '}
              <button type="button" onClick={() => { setStep('form'); setOtp(''); setOtpError(''); }} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(239,68,68,0.75)', fontWeight: 600, fontFamily: 'Outfit, sans-serif', fontSize: 12, cursor: 'pointer' }}>Go back</button>
            </p>
          </div>
        ) : !regOpen ? (
          <div style={{ width: '100%', maxWidth: 460, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(231,216,195,0.14)', borderRadius: 4, padding: 'clamp(28px, 5vw, 44px)', backdropFilter: 'blur(20px)', textAlign: 'center' }}>
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center', color: '#ef4444' }}><Icon name="lock" size={44} stroke={1.6} /></div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Registrations Closed</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>New sign-ups are paused right now. Please check back soon.</p>
            <p style={{ marginTop: 22, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: '#ef4444', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid rgba(239,68,68,0.3)', paddingBottom: 1 }}>Sign in →</Link>
            </p>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 460, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(231,216,195,0.14)', borderRadius: 4, padding: 'clamp(28px, 5vw, 44px)', backdropFilter: 'blur(20px)', animation: 'fadeSlideUp 0.7s ease 0.1s both', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, #dc2626, #ef4444, #dc2626, transparent)' }} />

            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6, textAlign: 'center' }}>Join the Table</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>Create your {BRAND.short} account and start playing</p>

            {refLocked && refCode && (
              <div style={{ margin: '0 0 18px', padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.35)', color: '#ef4444', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="gift" size={15} /> You were referred! <span style={{ opacity: .75, fontWeight: 600 }}>Code: {refCode}</span></span>
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate>
              {!refLocked && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 }}>Referral Code <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(optional)</span></label>
                  <input type="text" value={refCode} onChange={e => setRefCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32))} onFocus={() => setFocusedField('refCode')} onBlur={() => setFocusedField(null)} placeholder="Have a code? Enter it" style={inputStyle('refCode')} autoComplete="off" autoCapitalize="characters" spellCheck={false} />
                </div>
              )}
              {/* Full Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 }}>Full Name</label>
                <input type="text" value={form.fullName} onChange={e => setField('fullName', e.target.value)} onFocus={() => setFocusedField('fullName')} onBlur={() => setFocusedField(null)} placeholder="John Doe" style={inputStyle('fullName')} autoComplete="name" />
                {errors.fullName && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="alert" size={13} /> {errors.fullName}</p>}
              </div>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 }}>Email Address</label>
                <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="you@example.com" style={inputStyle('email')} autoComplete="email" />
                {errors.email && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="alert" size={13} /> {errors.email}</p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 }}>Password</label>
                <input type="password" value={form.password} onChange={e => setField('password', e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} placeholder="Min. 8 characters" style={inputStyle('password')} autoComplete="new-password" />
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />)}
                    </div>
                    <p style={{ fontSize: 11, color: strengthColor[strength], fontWeight: 600 }}>{strengthLabel[strength]} password</p>
                  </div>
                )}
                {errors.password && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="alert" size={13} /> {errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 }}>Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={e => setField('confirmPassword', e.target.value)} onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)} placeholder="••••••••"
                  style={{ ...inputStyle('confirmPassword'), ...(form.confirmPassword && form.password === form.confirmPassword ? { borderColor: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.12)' } : {}) }}
                  autoComplete="new-password" />
                {form.confirmPassword && form.password === form.confirmPassword && <p style={{ color: '#22c55e', fontSize: 12, marginTop: 6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={13} stroke={2.4} /> Passwords match</p>}
                {errors.confirmPassword && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="alert" size={13} /> {errors.confirmPassword}</p>}
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: 15, background: loading ? 'rgba(220,38,38,0.4)' : 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: 1.4, textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: loading ? 'none' : '0 4px 24px rgba(220,38,38,0.35)' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                {loading ? (<><span style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Creating Account…</>) : 'Create My Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 22, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: '#ef4444', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid rgba(239,68,68,0.3)', paddingBottom: 1 }}>Sign in →</Link>
            </p>
          </div>
        )}

        <p style={{ marginTop: 28, color: 'rgba(255,255,255,0.2)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', animation: 'fadeSlideUp 0.7s ease 0.3s both' }}>◆ {BRAND.name} · Play Responsibly ◆</p>
      </div>
    </>
  );
}
