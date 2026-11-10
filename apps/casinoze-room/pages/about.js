import Link from 'next/link'
import StaticPage, { panel } from '../components/ui/StaticPage'

const STEPS = [
  ['Register', 'Create a free account. Your wallet is set up for you.'],
  ['Add money', 'Pick a payment method and upload your payment proof. Our team reviews it and adds the funds to your wallet.'],
  ['Get a game account', 'Request an account in the game room you want. Our team sets it up and sends you the login details.'],
  ['Load & play', 'Load credits from your wallet into your game account and play.'],
  ['Redeem & withdraw', 'Redeem winnings back to your wallet, then request a withdrawal once your identity is verified.'],
]

export default function About() {
  return (
    <StaticPage title="About Casinoze Room" subtitle="One account and one wallet for all your game rooms.">
      <div style={{ ...panel, marginBottom: 20 }}>
        <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 15, lineHeight: 1.9, margin: 0 }}>
          Casinoze Room lets you manage everything in one place: your wallet, your game accounts, and every deposit,
          load, redemption and withdrawal. Requests are reviewed and processed by our team, and you are notified
          as soon as something changes.
        </p>
      </div>
      <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 22, margin: '28px 0 14px' }}>How it works</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {STEPS.map(([t, d], i) => (
          <div key={t} style={{ ...panel, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#050505', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
            <div><div style={{ fontWeight: 700, marginBottom: 2 }}>{t}</div><div style={{ color: 'rgba(255,255,255,.55)', fontSize: 14, lineHeight: 1.7 }}>{d}</div></div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/auth/register" style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#050505', fontWeight: 800, textDecoration: 'none', fontSize: 14 }}>Create free account</Link>
        <Link href="/faq" style={{ padding: '12px 28px', borderRadius: 12, border: '1px solid rgba(251,191,36,.4)', color: '#fbbf24', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>Read the FAQ</Link>
      </div>
      <p style={{ marginTop: 28, color: 'rgba(255,255,255,.35)', fontSize: 13 }}>You must be 18 or older to use Casinoze Room. Please play responsibly.</p>
    </StaticPage>
  )
}
