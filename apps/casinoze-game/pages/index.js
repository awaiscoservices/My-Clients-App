import { useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import SiteNav from '../components/site/SiteNav'
import SiteFooter from '../components/site/SiteFooter'
import { BRAND } from '../lib/brand'
import Reveal from '../components/site/Reveal'
import Ico from '../components/ui/Icons'
import { GAME_CATALOG } from '../lib/gameCatalog'
import { FAQS } from '../lib/siteContent'

const GAMES = GAME_CATALOG   // the 23 games live in lib/gameCatalog.js

// ═══════════════════════════════════════════════════════════════════
//  EDIT HERE. Only put things in this block that are TRUE for your business.
//  Anything left empty ('' / null / []) is simply hidden on the page.
// ═══════════════════════════════════════════════════════════════════
const SITE = {
  signupBonus: '',      // e.g. '100% first-deposit bonus'  → replaces the small line above the headline
  playersOnline: null,  // a REAL number, e.g. 312            → shows a slim bar at the very top
  contactEmail: '',     // your support email. Fills the Contact form (opens the visitor's email app).
                        // Left empty, the form is replaced by a "create an account and use Support" box.
  reviews: [],          // REAL player reviews, e.g. [{ name:'Jay G.', tag:'Fire Kirin', stars:5, text:'…' }]
                        // (the Reviews section is hidden while this is empty)
}

const FONTS = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500;1,9..144,600&family=Cinzel:wght@500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap'
const byName = (n) => GAMES.find(g => g.name === n)
const tint = (g) => `linear-gradient(165deg,${g.tint[0]},${g.tint[1]})`

const STEPS = [
  ['I',   'user', 'Create your account', 'Sign up free in under a minute. Your private wallet is set up for you on the spot.'],
  ['II',  'card', 'Fund your wallet', 'Choose a payment method and upload your proof. Our team reviews it and credits your wallet.'],
  ['III', 'gamepad', 'Load & play', 'Open an account in any room, load credits from your wallet, and take your seat.'],
  ['IV',  'out', 'Redeem & cash out', 'Send winnings back to your wallet, then withdraw once your identity is verified.'],
]

// Ornamental crest — a faceted diamond emblem used behind the hero and as a
// section divider. Pure SVG so it scales crisply and tints with crimson.
function Crest({ size = 40, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.1" opacity=".9">
        <path d="M24 3l15 10v22L24 45 9 35V13L24 3z" />
        <path d="M24 10l9 6v16l-9 6-9-6V16l9-6z" opacity=".6" />
        <path d="M24 3v42M9 13l30 22M39 13L9 35" opacity=".25" />
      </g>
      <circle cx="24" cy="24" r="3" fill="currentColor" />
    </svg>
  )
}

// A centred hairline with a crest in the middle — the luxe section break.
function Rule() {
  return (
    <div className="rule" aria-hidden="true">
      <span /><Crest size={26} className="rule-crest" /><span />
    </div>
  )
}

/* ───────────────────────── HERO ───────────────────────── */
function Hero() {
  const stage = useRef(null)
  const raf = useRef(0)
  const deck = ['Orion Stars', 'Fire Kirin', 'Dragon Fury'].map(byName)
  const move = (e) => {
    const el = stage.current
    if (!el || window.innerWidth < 900) return
    const r = el.getBoundingClientRect()
    const mx = (e.clientX - (r.left + r.width / 2)) / r.width, my = (e.clientY - (r.top + r.height / 2)) / r.height
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => { el.style.setProperty('--mx', mx.toFixed(3)); el.style.setProperty('--my', my.toFixed(3)) })
  }
  const leave = () => { const el = stage.current; if (el) { el.style.setProperty('--mx', 0); el.style.setProperty('--my', 0) } }

  return (
    <section className="hero" onMouseMove={move} onMouseLeave={leave}>
      <div className="hero-in">
        <div className="hero-copy">
          <div className="eyebrow"><Crest size={15} className="eb-crest" />{SITE.signupBonus || `${GAMES.length} rooms · one wallet · one account`}</div>
          <h1 className="hero-h1">
            <span className="ml"><span>The whole floor.</span></span>
            <span className="ml"><span className="goldtxt">One wallet.</span></span>
          </h1>
          <p className="hero-p">Fund your wallet once, open an account in any of our {GAMES.length} rooms, and load credits in seconds. Every deposit, load, redemption and withdrawal is tracked in one refined dashboard.</p>
          <div className="hero-cta">
            <Link href="/auth/register" className="btn-gold">Create free account <Ico name="arrow" size={17} stroke={2.3} /></Link>
            <a href="#games" className="btn-link">Browse the games <Ico name="arrow" size={15} stroke={2} /></a>
          </div>
          <ul className="facts">
            <li><Ico name="card" size={17} />Hand-reviewed deposits</li>
            <li><Ico name="shield" size={17} />Verified, secure withdrawals</li>
            <li><Ico name="device" size={17} />Flawless on any device</li>
          </ul>
        </div>

        <div className="stage" ref={stage} aria-hidden="true">
          <Crest size={520} className="stage-crest" />
          <svg className="rings" viewBox="0 0 600 600"><g fill="none" stroke="#ef4444"><circle cx="300" cy="300" r="186" opacity=".14" /><circle cx="300" cy="300" r="250" opacity=".09" strokeDasharray="1 10" /><circle cx="300" cy="300" r="300" opacity=".06" /></g></svg>
          <div className="fan">
            {deck.map((g, i) => (
              <div key={g.name} className={`fc fc${i}`} style={{ background: tint(g) }}>
                <img src={g.src} alt="" /><span>{g.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hero-fade" aria-hidden="true" />
    </section>
  )
}

/* ───────────────────────── LOGO MARQUEE ───────────────────────── */
function Marquee() {
  const row = (items, reverse, dur) => (
    <div className="mq-row">
      <div className="mq" style={{ animationDirection: reverse ? 'reverse' : 'normal', animationDuration: dur }}>
        {[...items, ...items].map((g, i) => <div key={i} className="mq-i" style={{ background: tint(g) }}><img src={g.src} alt="" loading="lazy" /></div>)}
      </div>
    </div>
  )
  return <div className="mqw" aria-hidden="true">{row(GAMES, false, '70s')}{row([...GAMES].reverse(), true, '85s')}</div>
}

/* ───────────────────────── GAME TILE ───────────────────────── */
function GameCard({ game }) {
  const [failed, setFailed] = useState(false)
  return (
    <Link href="/auth/register" className="gtile" aria-label={`${game.name}: join to play`} style={{ '--g1': game.tint[0], '--g2': game.tint[1], '--accent': game.accent, '--glow': game.accent + '55' }}>
      {game.bonus > 0 && <span className="gtile-badge gtile-bonus">{game.bonus}%</span>}
      {game.hot && <span className="gtile-badge gtile-hot">HOT</span>}
      <div className="gtile-art">
        {failed ? <span style={{ color: 'rgba(255,255,255,.4)', display: 'flex' }}><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 12h4M8 10v4M15 13h.01M18 11h.01M7 7h10a4 4 0 014 4v2a4 4 0 01-4 4l-2-2H9l-2 2a4 4 0 01-4-4v-2a4 4 0 014-4z" /></svg></span> : <img src={game.src} alt={game.name} loading="lazy" onError={() => setFailed(true)} />}
      </div>
      <div className="gtile-bar"><span className="gtile-play"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg></span><span className="gtile-name">{game.name}</span></div>
    </Link>
  )
}

/* ───────────────────────── FEATURE TILE (cursor spotlight) ───────────────────────── */
function Bento({ cls = '', icon, title, desc, children, delay = 0 }) {
  const spot = (e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--sx', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--sy', `${e.clientY - r.top}px`) }
  return (
    <Reveal delay={delay} className={`bt ${cls}`} onMouseMove={spot}>
      <div className="bt-ico"><Ico name={icon} size={20} /></div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div className="bt-art">{children}</div>
    </Reveal>
  )
}

/* ───────────────────────── CONTACT ───────────────────────── */
function ContactForm() {
  const [f, setF] = useState({ first: '', last: '', email: '', msg: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  if (!SITE.contactEmail) return (
    <div className="panel">
      <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 15, lineHeight: 1.8, margin: '0 0 18px' }}>The fastest way to reach us is from your dashboard: create a free account, open Support and send a message. Our reply shows up right on your ticket. You can also check the FAQ first.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link href="/auth/register" className="btn-gold sm">Create free account</Link>
        <Link href="/faq" className="btn-line">Read the FAQ</Link>
      </div>
    </div>
  )
  const send = () => {
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Please enter a valid email address')
    if (f.msg.trim().length < 5) return setErr('Please write your message')
    setErr('')
    const name = `${f.first} ${f.last}`.trim() || 'Website visitor'
    window.location.href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent('Message from ' + name)}&body=${encodeURIComponent(`${f.msg.trim()}\n\n${name}\n${f.email}`)}`
  }
  return (
    <div className="panel" style={{ display: 'grid', gap: 12 }}>
      <div className="two"><input className="fld" placeholder="First name" value={f.first} onChange={set('first')} /><input className="fld" placeholder="Last name" value={f.last} onChange={set('last')} /></div>
      <input className="fld" type="email" placeholder="Email" value={f.email} onChange={set('email')} />
      <textarea className="fld" rows={4} placeholder="How can we help?" value={f.msg} onChange={set('msg')} style={{ resize: 'vertical' }} />
      {err && <div style={{ color: '#f87171', fontSize: 13, fontWeight: 600 }}>{err}</div>}
      <button className="btn-gold sm" onClick={send} style={{ justifySelf: 'start' }}>Send message <Ico name="arrow" size={16} stroke={2.2} /></button>
    </div>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <div>
      {FAQS.map((f, i) => (
        <div key={f.q} className={`fq${open === i ? ' on' : ''}`}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><span>{f.q}</span><i>{open === i ? '−' : '+'}</i></button>
          <div className="fq-a" style={{ gridTemplateRows: open === i ? '1fr' : '0fr' }}><div><p>{f.a}</p></div></div>
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────── PAGE ───────────────────────── */
export default function Home() {
  const n = GAMES.length
  const deck = ['Fire Kirin', 'Orion Stars', 'Royal Treasure'].map(byName)
  const mini = ['Ultra Thunder', 'Dragon Fury', 'Milky Way', 'Yolo 777'].map(byName)

  return (
    <div className="lp">
      <Head>
        <title>{`${BRAND.name} — The whole floor. One wallet.`}</title>
        <meta name="description" content="One account and one wallet for every game room. Fund once, load credits and play." />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href={FONTS} rel="stylesheet" />
        <style>{CSS}</style>
        <noscript><style>{'.rv{opacity:1!important;transform:none!important}.ml>span{transform:none!important;animation:none!important}'}</style></noscript>
      </Head>

      {SITE.playersOnline && <div className="topbar"><i className="pulse" />{Number(SITE.playersOnline).toLocaleString()} players online right now</div>}
      <SiteNav landing />
      <Hero />
      <Marquee />

      {/* GAMES */}
      <section id="games" className="sec">
        <div className="wrap">
          <Reveal className="shead">
            <div><div className="lab">The floor</div><h2>{n} rooms.<br /><em>One account.</em></h2></div>
            <p>Open an account in any room. Once it's live, load credits from your wallet and take your seat.</p>
          </Reveal>
          <div className="game-grid">
            {GAMES.map((g, i) => <Reveal key={g.name} delay={(i % 6) * 60} y={30}><GameCard game={g} /></Reveal>)}
          </div>
        </div>
      </section>

      <Rule />

      {/* HOW IT WORKS */}
      <section id="how" className="sec">
        <div className="wrap">
          <Reveal className="shead">
            <div><div className="lab">How it works</div><h2>Sign-up to<br /><em>first spin,</em> in four steps.</h2></div>
          </Reveal>
          <div className="steps">
            {STEPS.map(([num, icon, title, desc], i) => (
              <Reveal key={num} delay={i * 110} className="step">
                <div className="step-top"><span className="step-num">{num}</span>{i < STEPS.length - 1 && <span className="step-rule" style={{ transitionDelay: `${0.4 + i * 0.2}s` }} />}</div>
                <div className="step-ico"><Ico name={icon} size={22} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="sec">
        <div className="wrap">
          <Reveal className="shead">
            <div><div className="lab">Your dashboard</div><h2>It all lives<br /><em>in one place.</em></h2></div>
            <p>No spreadsheets, no chasing replies. Every request carries a status, and you're notified the moment it changes.</p>
          </Reveal>
          <div className="bento">
            <Bento cls="b-wide" icon="wallet" title="One wallet, two balances" desc="Cash and bonus credits are kept separate, so you always know what you can withdraw." delay={0}>
              <div className="bars"><div><b>Cash</b><span><i style={{ '--w': '78%' }} /></span></div><div><b>Bonus</b><span><i className="alt" style={{ '--w': '34%' }} /></span></div></div>
            </Bento>
            <Bento cls="b-wide" icon="gamepad" title={`${n} game rooms`} desc="Open an account in any room. Your logins and status stay one tap away." delay={90}>
              <div className="stack">{mini.map((g, i) => <div key={g.name} style={{ background: tint(g), zIndex: 9 - i }}><img src={g.src} alt="" loading="lazy" /></div>)}</div>
            </Bento>
            <Bento cls="b-third" icon="swap" title="Loads & redemptions" desc="Move money to a game and winnings back to your wallet." delay={0}>
              <div className="flow"><span /><span /><span /></div>
            </Bento>
            <Bento cls="b-third" icon="shield" title="Safe withdrawals" desc="Verify your ID once, then withdraw. Every request is reviewed by hand." delay={90}>
              <div className="chip"><Ico name="check" size={14} stroke={2.6} />ID verified</div>
            </Bento>
            <Bento cls="b-third" icon="star" title="Levels & referrals" desc="Earn XP as you play and share your referral code with friends." delay={180}>
              <div className="xp"><span><i /></span><b>Level up</b></div>
            </Bento>
          </div>
        </div>
      </section>

      <Rule />

      {/* WHY */}
      <section id="about" className="sec">
        <div className="wrap why">
          <Reveal className="why-copy">
            <div className="lab">{`Why ${BRAND.name}`}</div>
            <h2>Always know<br /><em>where your money is.</em></h2>
            <p>Every deposit, load, redemption and withdrawal passes a human review, and its status is in your dashboard whenever you want it.</p>
            <ul className="ticks">
              {['One account, one wallet, every room', 'A status and an alert on every request', 'Identity checks guard every withdrawal', 'Built for your phone as much as your desktop'].map(t => <li key={t}><span><Ico name="check" size={14} stroke={2.8} /></span>{t}</li>)}
            </ul>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <Link href="/auth/register" className="btn-gold sm">Get started <Ico name="arrow" size={16} stroke={2.2} /></Link>
              <Link href="/about" className="btn-line">About us</Link>
            </div>
          </Reveal>
          <Reveal delay={150} className="deck" aria-hidden="true">
            {deck.map((g, i) => <div key={g.name} className={`dk dk${i}`} style={{ background: tint(g) }}><img src={g.src} alt="" loading="lazy" /><span>{g.name}</span></div>)}
          </Reveal>
        </div>
      </section>

      {/* REVIEWS: only with real reviews */}
      {SITE.reviews.length > 0 && (
        <section className="sec"><div className="wrap">
          <Reveal className="shead"><div><div className="lab">Players</div><h2>What players <em>say.</em></h2></div></Reveal>
          <div className="revs">{SITE.reviews.map((r, i) => (
            <Reveal key={i} delay={i * 90} className="panel"><div style={{ color: '#ef4444', letterSpacing: 2, marginBottom: 10 }}>{'★'.repeat(r.stars || 5)}</div><p style={{ color: 'rgba(255,255,255,.75)', lineHeight: 1.8, margin: '0 0 16px' }}>{r.text}</p><b>{r.name}</b>{r.tag && <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}> · {r.tag}</span>}</Reveal>))}
          </div>
        </div></section>
      )}

      <Rule />

      {/* FAQ + CONTACT */}
      <section id="faq" className="sec">
        <div className="wrap faqwrap">
          <Reveal><div className="lab">FAQ</div><h2 style={{ marginBottom: 26 }}>Questions,<br /><em>answered.</em></h2><Faq /></Reveal>
          <Reveal delay={120}><div className="lab">Contact</div><h2 style={{ marginBottom: 26 }}>Still need<br /><em>a hand?</em></h2><ContactForm /></Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="sec" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <Reveal className="cta">
            <div className="cta-in">
              <Crest size={64} className="cta-crest" />
              <div className="cta-float c1" style={{ background: tint(byName('Fire Kirin')) }}><img src={byName('Fire Kirin').src} alt="" /></div>
              <div className="cta-float c2" style={{ background: tint(byName('Yolo 777')) }}><img src={byName('Yolo 777').src} alt="" /></div>
              <div className="cta-float c3" style={{ background: tint(byName('Orion Stars')) }}><img src={byName('Orion Stars').src} alt="" /></div>
              <div className="lab" style={{ justifyContent: 'center' }}>Ready when you are</div>
              <h2>Take a seat.<br /><em>Start playing.</em></h2>
              <p>Create your free account in a minute and open your first room.</p>
              <Link href="/auth/register" className="btn-gold">Create free account <Ico name="arrow" size={18} stroke={2.3} /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

/* ───────────────────────── STYLES ───────────────────────── */
const CSS = `
  *,*::before,*::after{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--bg-gradient);background-attachment:fixed;color:#fff;font-family:'Outfit',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  .lp{position:relative}
  /* A faint vignette + a cool top light, so the page reads like a dim room. */
  .lp::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(120% 70% at 50% -10%,rgba(239,68,68,.08),transparent 60%),radial-gradient(100% 100% at 50% 120%,rgba(0,0,0,.55),transparent 55%)}
  .lp>*{position:relative;z-index:1}
  .lp h1,.lp h2{font-family:'Fraunces',serif;font-weight:600;letter-spacing:-.018em;margin:0}
  .lp h2{font-size:clamp(34px,4.6vw,60px);line-height:1.05}
  .lp h2 em,.goldtxt{font-style:italic;font-weight:500;background:linear-gradient(100deg,#fecaca,#ef4444 48%,#b91c1c);-webkit-background-clip:text;background-clip:text;color:transparent}
  .wrap{max-width:1240px;margin:0 auto;padding:0 24px}
  .sec{padding:120px 0 34px;scroll-margin-top:60px}

  /* ornaments */
  .lab{display:flex;align-items:center;gap:13px;color:#ef4444;font-size:11px;font-weight:800;letter-spacing:.3em;text-transform:uppercase;margin-bottom:20px}
  .lab::before{content:'◆';font-size:9px;color:#ef4444}
  .lab::after{content:'';flex:0 0 46px;height:1px;background:linear-gradient(90deg,rgba(239,68,68,.7),transparent)}
  .rule{display:flex;align-items:center;justify-content:center;gap:22px;max-width:1240px;margin:8px auto;padding:0 24px}
  .rule span{height:1px;flex:1;max-width:380px;background:linear-gradient(90deg,transparent,rgba(231,216,195,.22),transparent)}
  .rule-crest{color:rgba(239,68,68,.55);flex-shrink:0}
  .shead{display:flex;justify-content:space-between;align-items:flex-end;gap:40px;margin-bottom:50px}
  .shead p{max-width:380px;color:rgba(255,255,255,.52);font-size:16px;line-height:1.75;margin:0}
  .pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 0 0 rgba(52,211,153,.6);animation:pulse 2s infinite}
  .topbar{text-align:center;padding:8px 12px;font-size:12px;font-weight:700;letter-spacing:.06em;color:#34d399;background:rgba(4,7,13,.7);border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;gap:10px}

  /* buttons — refined, squared, with a bright top edge + shimmer */
  .btn-gold{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:10px;padding:16px 32px;border-radius:3px;background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;font-weight:800;font-size:13px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border:0;cursor:pointer;font-family:inherit;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 14px 34px rgba(239,68,68,.22);transition:transform .25s,box-shadow .25s}
  .btn-gold.sm{padding:13px 24px;font-size:12px}
  .btn-gold::after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-20deg);transition:left .6s}
  .btn-gold:hover{transform:translateY(-3px);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 20px 44px rgba(239,68,68,.4)}
  .btn-gold:hover::after{left:130%}
  .btn-gold svg{transition:transform .25s}.btn-gold:hover svg{transform:translateX(4px)}
  .btn-line{display:inline-flex;align-items:center;gap:8px;padding:13px 24px;border-radius:3px;border:1px solid rgba(231,216,195,.26);color:#f3ece1;font-weight:700;font-size:12px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;transition:background .25s,border-color .25s,color .25s}
  .btn-line:hover{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.7);color:#fff}
  .btn-link{display:inline-flex;align-items:center;gap:8px;color:rgba(255,255,255,.72);font-weight:600;font-size:13px;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;padding:16px 4px;border-bottom:1px solid transparent;transition:color .2s,gap .25s}
  .btn-link:hover{color:#ef4444;gap:13px}

  /* hero */
  .hero{position:relative;overflow:hidden}
  .hero::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
  .hero-fade{position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(180deg,transparent,rgba(4,6,11,.6));pointer-events:none}
  .hero-in{position:relative;z-index:1;max-width:1240px;margin:0 auto;padding:48px 24px 78px;display:grid;grid-template-columns:1.04fr .96fr;gap:30px;align-items:center;min-height:calc(100vh - 72px)}
  .eyebrow{display:inline-flex;align-items:center;gap:11px;font-size:12px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.66);margin-bottom:28px}
  .eb-crest{color:#ef4444}
  .lp .hero-h1{font-size:clamp(44px,5.4vw,86px);line-height:1;margin-bottom:30px;font-weight:600}
  .ml{display:block;overflow:hidden;padding:.04em .1em .14em 0}
  .ml>span{display:inline-block;transform:translateY(112%);animation:maskUp 1.05s cubic-bezier(.2,.85,.2,1) .15s both}
  .ml+.ml>span{animation-delay:.32s}
  .hero-p{max-width:520px;font-size:17px;line-height:1.8;color:rgba(255,255,255,.6);margin:0 0 36px;animation:fadeUp .9s .55s both}
  .hero-cta{display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:44px;animation:fadeUp .9s .7s both}
  .facts{display:flex;gap:14px 26px;flex-wrap:wrap;list-style:none;margin:0;padding:24px 0 0;border-top:1px solid rgba(231,216,195,.12);max-width:640px;animation:fadeUp .9s .85s both}
  .facts li{display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:600;letter-spacing:.02em;color:rgba(255,255,255,.58)}
  .facts svg{color:#ef4444}

  /* hero stage — a fanned trio of cards over a slow-turning crest emblem */
  .stage{position:relative;width:100%;max-width:560px;height:600px;margin-left:auto;--mx:0;--my:0;display:flex;align-items:center;justify-content:center}
  .stage-crest{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:rgba(239,68,68,.16);animation:breathe 9s ease-in-out infinite}
  .rings{position:absolute;left:50%;top:50%;width:108%;transform:translate(-50%,-50%);animation:spin 90s linear infinite}
  .fan{position:relative;width:260px;height:300px;transform:translate3d(calc(var(--mx)*14px),calc(var(--my)*14px),0);transition:transform .3s ease-out}
  .fc{position:absolute;left:50%;top:50%;width:216px;border-radius:14px;padding:18px 16px 14px;border:1px solid rgba(231,216,195,.2);background-clip:padding-box;box-shadow:0 36px 70px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.22);animation:fcIn 1s cubic-bezier(.2,.85,.2,1) both}
  .fc::after{content:'';position:absolute;inset:0;border-radius:14px;box-shadow:inset 0 0 0 1px rgba(239,68,68,.18);pointer-events:none}
  .fc img{display:block;width:100%;aspect-ratio:1;object-fit:contain;filter:drop-shadow(0 12px 16px rgba(0,0,0,.55))}
  .fc span{display:block;margin-top:10px;font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.85);text-align:center;font-family:'Cinzel',serif}
  .fc0{transform:translate(-78%,-46%) rotate(-11deg);z-index:1;animation-delay:.3s}
  .fc1{transform:translate(-50%,-54%) rotate(0deg) scale(1.06);z-index:3;animation-delay:.42s}
  .fc2{transform:translate(-22%,-44%) rotate(11deg);z-index:2;animation-delay:.54s}
  .stage:hover .fc0{transform:translate(-86%,-48%) rotate(-14deg)}
  .stage:hover .fc1{transform:translate(-50%,-58%) rotate(0deg) scale(1.09)}
  .stage:hover .fc2{transform:translate(-14%,-46%) rotate(14deg)}

  /* marquee */
  .mqw{position:relative;padding:20px 0 8px;display:grid;gap:14px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent);mask-image:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent)}
  .mq-row{overflow:hidden}
  .mq{display:flex;gap:14px;width:max-content;animation:mq 70s linear infinite}
  .mq-row:hover .mq{animation-play-state:paused}
  .mq-i{width:90px;height:90px;border-radius:12px;padding:12px;border:1px solid rgba(231,216,195,.12);background-clip:padding-box;flex-shrink:0}
  .mq-i img{width:100%;height:100%;object-fit:contain}

  /* games */
  .game-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(190px,46%),1fr));gap:18px;padding-top:14px}
  .gtile{position:relative;display:block;text-decoration:none;color:#fff;border-radius:12px;overflow:hidden;cursor:pointer;background:linear-gradient(165deg,var(--g1) 0%,var(--g2) 62%,#0a0e18 100%);border:1px solid rgba(231,216,195,.12);box-shadow:0 8px 24px rgba(0,0,0,.45);transition:transform .3s cubic-bezier(.2,.9,.3,1.2),box-shadow .3s,border-color .3s;will-change:transform;-webkit-tap-highlight-color:transparent}
  .gtile::after{content:'';position:absolute;top:0;left:-70%;width:45%;height:100%;pointer-events:none;background:linear-gradient(105deg,transparent,rgba(255,255,255,.24),transparent);transform:skewX(-18deg);transition:left .75s ease}
  .gtile-art{aspect-ratio:1/1.02;display:flex;align-items:center;justify-content:center;padding:20px 16px 8px}
  .gtile-art img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 10px 16px rgba(0,0,0,.55))}
  .gtile-bar{display:flex;align-items:center;gap:8px;padding:13px 14px;background:linear-gradient(180deg,rgba(0,0,0,.14),rgba(0,0,0,.66));border-top:1px solid rgba(231,216,195,.1);font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.85);font-family:'Cinzel',serif}
  .gtile-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .gtile-play{font-size:9px;color:var(--accent);transition:transform .3s;flex-shrink:0}
  .gtile-badge{position:absolute;top:0;z-index:2;font-size:10px;font-weight:800;padding:4px 9px;color:#fff;letter-spacing:.04em}
  .gtile-bonus{right:0;background:#b91c1c;border-bottom-left-radius:8px}
  .gtile-hot{left:0;background:linear-gradient(135deg,#ef4444,#f97316);border-bottom-right-radius:8px}
  .gtile:hover,.gtile:focus-visible,.gtile:active{transform:translateY(-10px) scale(1.05);z-index:5;border-color:rgba(239,68,68,.6);outline:none;box-shadow:0 30px 54px rgba(0,0,0,.65),0 0 0 1px rgba(239,68,68,.5),0 0 44px var(--glow)}
  .gtile:hover::after,.gtile:focus-visible::after,.gtile:active::after{left:135%}
  .gtile:hover .gtile-art img,.gtile:focus-visible .gtile-art img,.gtile:active .gtile-art img{animation:gfloat 2.2s ease-in-out infinite}
  .gtile:hover .gtile-play{transform:translateX(3px)}

  /* steps */
  .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:30px}
  .step-top{display:flex;align-items:center;gap:16px;margin-bottom:26px;height:64px}
  .step-num{font-family:'Cinzel',serif;font-size:46px;font-weight:700;line-height:1;color:transparent;-webkit-text-stroke:1px rgba(239,68,68,.65);flex-shrink:0;letter-spacing:.02em}
  .step-rule{flex:1;height:1px;background:linear-gradient(90deg,rgba(239,68,68,.55),rgba(231,216,195,.05));transform:scaleX(0);transform-origin:left;transition:transform 1.2s cubic-bezier(.3,.7,.2,1)}
  .rv.in .step-rule{transform:scaleX(1)}
  .step-ico{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#ef4444;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.22);margin-bottom:18px;transition:transform .35s,background .35s}
  .step:hover .step-ico{transform:translateY(-4px);background:rgba(239,68,68,.16)}
  .step h3{font-size:20px;font-weight:600;font-family:'Fraunces',serif;margin:0 0 8px}
  .step p{margin:0;color:rgba(255,255,255,.52);font-size:14.5px;line-height:1.75;max-width:280px}

  /* bento */
  .bento{display:grid;grid-template-columns:repeat(6,1fr);gap:18px}
  .b-wide{grid-column:span 3}.b-third{grid-column:span 2}
  .bt{position:relative;overflow:hidden;border-radius:16px;padding:30px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.015));border:1px solid rgba(231,216,195,.12);transition:border-color .3s}
  .bt::before{content:'';position:absolute;inset:0;background:radial-gradient(380px circle at var(--sx,50%) var(--sy,0%),rgba(239,68,68,.14),transparent 58%);opacity:0;transition:opacity .35s;pointer-events:none}
  .bt:hover{border-color:rgba(239,68,68,.34)}.bt:hover::before{opacity:1}
  .bt-ico{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#ef4444;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);margin-bottom:20px}
  .bt h3{font-size:20px;font-weight:600;font-family:'Fraunces',serif;margin:0 0 8px}
  .bt p{margin:0;color:rgba(255,255,255,.52);font-size:14.5px;line-height:1.7;max-width:380px}
  .bt-art{margin-top:24px;min-height:62px}
  .bars{display:grid;gap:14px}.bars div{display:flex;align-items:center;gap:14px}.bars b{width:50px;font-size:12px;color:rgba(255,255,255,.55);font-weight:700}
  .bars span{flex:1;height:10px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden}
  .bars i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#34d399,#10b981);transition:width 1.4s cubic-bezier(.2,.8,.2,1) .4s}.bars i.alt{background:linear-gradient(90deg,#fca5a5,#b91c1c)}
  .rv.in .bars i{width:var(--w)}
  .stack{display:flex}.stack div{width:62px;height:62px;border-radius:14px;padding:8px;border:1px solid rgba(231,216,195,.16);margin-left:-14px;box-shadow:0 8px 18px rgba(0,0,0,.4);transition:transform .35s}
  .stack div:first-child{margin-left:0}.stack img{width:100%;height:100%;object-fit:contain}.stack div:hover{transform:translateY(-8px)}
  .flow{display:flex;gap:8px;align-items:center}.flow span{height:6px;flex:1;border-radius:99px;background:linear-gradient(90deg,rgba(239,68,68,.12),#ef4444,rgba(239,68,68,.12));background-size:200% 100%;animation:flow 2.2s linear infinite}
  .flow span:nth-child(2){animation-delay:-.7s}.flow span:nth-child(3){animation-delay:-1.4s}
  .chip{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:99px;font-size:13px;font-weight:700;color:#34d399;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3)}
  .xp{display:flex;align-items:center;gap:14px}.xp span{flex:1;height:10px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden}
  .xp i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#ef4444,#b91c1c);transition:width 1.6s cubic-bezier(.2,.8,.2,1) .5s}.rv.in .xp i{width:68%}
  .xp b{font-size:12px;color:#ef4444;font-weight:800;letter-spacing:.06em;text-transform:uppercase}

  /* why */
  .why{display:grid;grid-template-columns:1.05fr .95fr;gap:60px;align-items:center}
  .why-copy p{color:rgba(255,255,255,.58);font-size:17px;line-height:1.8;margin:22px 0 26px;max-width:520px}
  .ticks{list-style:none;margin:0;padding:0;display:grid;gap:15px}
  .ticks li{display:flex;align-items:center;gap:13px;font-size:15.5px;color:rgba(255,255,255,.8)}
  .ticks li span{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(135deg,#ef4444,#b91c1c);flex-shrink:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}
  .deck{position:relative;height:460px}
  .dk{position:absolute;width:230px;border-radius:16px;padding:20px 18px 14px;border:1px solid rgba(231,216,195,.18);box-shadow:0 30px 60px rgba(0,0,0,.5);transition:transform .6s cubic-bezier(.2,.8,.2,1)}
  .dk img{display:block;width:100%;aspect-ratio:1;object-fit:contain;filter:drop-shadow(0 10px 14px rgba(0,0,0,.5))}
  .dk span{display:block;margin-top:8px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-family:'Cinzel',serif}
  .dk0{left:8%;top:8%;transform:rotate(-9deg);z-index:1}.dk1{left:38%;top:0;transform:rotate(6deg);z-index:2}.dk2{left:22%;top:34%;transform:rotate(-2deg);z-index:3}
  .deck:hover .dk0{transform:rotate(-15deg) translate(-26px,6px)}.deck:hover .dk1{transform:rotate(12deg) translate(30px,-6px)}.deck:hover .dk2{transform:rotate(0) translateY(14px) scale(1.04)}

  /* faq + contact */
  .faqwrap{display:grid;grid-template-columns:1.1fr .9fr;gap:70px;align-items:start}
  .fq{border-bottom:1px solid rgba(231,216,195,.1)}
  .fq button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:21px 0;background:none;border:0;color:#fff;font:600 17px 'Fraunces',serif;text-align:left;cursor:pointer;transition:color .2s}
  .fq button:hover,.fq.on button{color:#ef4444}.fq i{font-style:normal;font-size:24px;color:#ef4444;width:26px;text-align:center;flex-shrink:0}
  .fq-a{display:grid;transition:grid-template-rows .4s cubic-bezier(.2,.8,.2,1)}.fq-a>div{overflow:hidden}
  .fq-a p{margin:0;padding:0 36px 22px 0;color:rgba(255,255,255,.56);font-size:15.5px;line-height:1.8}
  .panel{background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.015));border:1px solid rgba(231,216,195,.12);border-radius:16px;padding:28px}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .fld{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(231,216,195,.16);border-radius:8px;padding:14px 16px;color:#fff;font:15px 'Outfit',sans-serif;outline:none;transition:border-color .2s,background .2s}
  .fld:focus{border-color:#ef4444;background:rgba(239,68,68,.05)}
  .revs{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:18px}

  /* final cta */
  .cta{padding:1px;border-radius:20px;background:conic-gradient(from var(--a),rgba(231,216,195,.08) 0 50%,#ef4444 78%,rgba(231,216,195,.08) 100%);animation:rot 8s linear infinite}
  .cta-in{position:relative;overflow:hidden;border-radius:19px;background:linear-gradient(180deg,#0b0f1a,#070a12);text-align:center;padding:92px 24px}
  .cta-in::before{content:'';position:absolute;left:50%;top:-40%;width:80%;height:100%;transform:translateX(-50%);background:radial-gradient(closest-side,rgba(239,68,68,.16),transparent 70%)}
  .cta-crest{position:absolute;left:50%;top:30px;transform:translateX(-50%);color:rgba(239,68,68,.4)}
  .cta-in>*{position:relative}.cta h2{font-size:clamp(36px,5.4vw,70px);margin-bottom:18px}
  .cta p{color:rgba(255,255,255,.58);font-size:17px;margin:0 auto 34px;max-width:460px}
  .cta-float{position:absolute!important;width:94px;height:106px;border-radius:14px;padding:12px;border:1px solid rgba(231,216,195,.16);box-shadow:0 20px 40px rgba(0,0,0,.45);animation:hfloat 7s ease-in-out infinite}
  .cta-float img{width:100%;height:100%;object-fit:contain}
  .c1{left:7%;top:18%;transform:rotate(-10deg)}.c2{right:8%;top:14%;transform:rotate(9deg);animation-delay:-2s}.c3{right:17%;bottom:12%;transform:rotate(-5deg);animation-delay:-4s;width:78px;height:90px}

  /* keyframes */
  @property --a{syntax:'<angle>';initial-value:0deg;inherits:false}
  @keyframes rot{to{--a:360deg}}
  @keyframes maskUp{to{transform:translateY(0)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
  @keyframes fcIn{from{opacity:0;transform:translate(-50%,-30%) scale(.9)}}
  @keyframes hfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
  @keyframes gfloat{0%,100%{transform:scale(1.13) translateY(0) rotate(-1deg)}50%{transform:scale(1.17) translateY(-6px) rotate(1deg)}}
  @keyframes spin{to{transform:translate(-50%,-50%) rotate(360deg)}}
  @keyframes breathe{0%,100%{opacity:.7;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.04)}}
  @keyframes mq{to{transform:translateX(-50%)}}
  @keyframes flow{to{background-position:-200% 0}}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(52,211,153,.55)}70%{box-shadow:0 0 0 9px rgba(52,211,153,0)}100%{box-shadow:0 0 0 0 rgba(52,211,153,0)}}

  /* responsive */
  @media(max-width:1020px){
    .hero-in{grid-template-columns:1fr;min-height:0;padding-top:24px}.stage{margin:20px auto 0;height:440px}
    .steps{grid-template-columns:1fr 1fr;gap:42px 28px}.b-wide,.b-third{grid-column:span 3}.b-third:last-child{grid-column:span 6}
    .why{grid-template-columns:1fr;gap:30px}.deck{height:400px;max-width:480px;margin:0 auto;width:100%}
    .faqwrap{grid-template-columns:1fr;gap:50px}.shead{flex-direction:column;align-items:flex-start;gap:16px}
  }
  @media(max-width:640px){
    .sec{padding-top:84px}.stage{height:380px}.fc{width:168px}.fc span{font-size:9px}
    .steps{grid-template-columns:1fr}.step-rule{display:none}.step-top{height:auto;margin-bottom:14px}.step-num{font-size:40px}
    .bento{grid-template-columns:1fr}.b-wide,.b-third,.b-third:last-child{grid-column:auto}
    .game-grid{grid-template-columns:repeat(2,1fr);gap:12px}.gtile-bar{font-size:10px;padding:11px 10px}
    .mq-i{width:72px;height:72px;border-radius:12px;padding:10px}.two{grid-template-columns:1fr}
    .dk{width:170px}.deck{height:340px}.cta-in{padding:72px 20px}.cta-float{display:none}
    .hero-cta{gap:10px}.facts{gap:14px 20px}
  }
  @media(prefers-reduced-motion:reduce){
    html{scroll-behavior:auto}.ml>span,.hero-p,.hero-cta,.facts,.fc{animation:none;transform:none;opacity:1}
    .fc0{transform:translate(-78%,-46%) rotate(-11deg)}.fc1{transform:translate(-50%,-54%) scale(1.06)}.fc2{transform:translate(-22%,-44%) rotate(11deg)}
    .stage-crest,.rings,.mq,.cta,.cta-float,.flow span,.pulse{animation:none}.gtile:hover,.gtile:active{transform:none}
  }
`
