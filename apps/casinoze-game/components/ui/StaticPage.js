import Head from 'next/head'
import SiteNav from '../site/SiteNav'
import SiteFooter from '../site/SiteFooter'
import Reveal from '../site/Reveal'
import { BRAND, pageTitle } from '../../lib/brand'

export const panel = { background: 'linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.015))', border: '1px solid rgba(231,216,195,.12)', borderRadius: 14, padding: 26 }

// Public page shell (no login needed): same nav + footer as the landing page.
export default function StaticPage({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', backgroundAttachment: 'fixed', color: '#fff', fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>{pageTitle(title)}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500;1,9..144,700&family=Cinzel:wght@600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <SiteNav />
      <main style={{ flex: 1, width: '100%', maxWidth: 820, margin: '0 auto', padding: '56px 24px 64px' }}>
        <Reveal><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, color: '#ef4444', fontSize: 11, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase' }}><span style={{ fontSize: 9 }}>◆</span>{BRAND.name}<span style={{ flex: '0 0 46px', height: 1, background: 'linear-gradient(90deg,rgba(239,68,68,.7),transparent)' }} /></div></Reveal>
        <Reveal delay={80}><h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(34px,6vw,56px)', fontWeight: 700, lineHeight: 1.05, margin: '0 0 12px', letterSpacing: '-.01em' }}>{title}</h1></Reveal>
        {subtitle && <Reveal delay={140}><p style={{ color: 'rgba(255,255,255,.55)', fontSize: 17, lineHeight: 1.7, margin: '0 0 34px' }}>{subtitle}</p></Reveal>}
        <Reveal delay={200}>{children}</Reveal>
      </main>
      <SiteFooter />
    </div>
  )
}
