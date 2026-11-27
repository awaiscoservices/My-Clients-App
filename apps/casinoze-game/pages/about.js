import Link from 'next/link'
import StaticPage, { panel } from '../components/ui/StaticPage'
import { BRAND } from '../lib/brand'

const STEPS = [
  ['Create your account', 'Sign up free in under a minute. Your private wallet is ready on the spot.'],
  ['Fund your wallet', 'Choose a payment method and upload your proof. Our team reviews it and credits your wallet.'],
  ['Open a game account', 'Request an account in the room you want. Our team sets it up and sends you the login details.'],
  ['Load & play', 'Load credits from your wallet into your game account and take your seat.'],
  ['Redeem & cash out', 'Send winnings back to your wallet, then request a withdrawal once your identity is verified.'],
]

export default function About() {
  return (
    <StaticPage title={`About ${BRAND.name}`} subtitle="One account and one wallet for every game room you play.">
      <div style={{ ...panel, marginBottom: 20 }}>
        <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 15, lineHeight: 1.9, margin: 0 }}>
          {BRAND.name} brings everything under one roof: your wallet, your game accounts, and every deposit,
          load, redemption and withdrawal. Each request is reviewed and handled by our team, and you are
          notified the moment anything changes.
        </p>
      </div>
      <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 22, margin: '28px 0 14px' }}>How it works</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {STEPS.map(([t, d], i) => (
          <div key={t} style={{ ...panel, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#050505', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
            <div><div style={{ fontWeight: 700, marginBottom: 2 }}>{t}</div><div style={{ color: 'rgba(255,255,255,.55)', fontSize: 14, lineHeight: 1.7 }}>{d}</div></div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/auth/register" style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#050505', fontWeight: 800, textDecoration: 'none', fontSize: 14 }}>Create free account</Link>
        <Link href="/faq" style={{ padding: '12px 28px', borderRadius: 12, border: '1px solid rgba(239,68,68,.4)', color: '#ef4444', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>Read the FAQ</Link>
      </div>
      <p style={{ marginTop: 28, color: 'rgba(255,255,255,.35)', fontSize: 13 }}>You must be 18 or older to use {BRAND.name}. Please play responsibly.</p>
    </StaticPage>
  )
}
