import { useEffect, useState } from 'react'
import Head from 'next/head'
import '../styles/globals.css'

// Site-wide maintenance screen. Driven by the admin Settings "Maintenance
// mode" switch (read via /api/settings/flags for this casino). While it is on,
// every page shows this instead of the app. Money actions are also blocked
// server-side in the deposit/withdraw APIs, so this is the visible half.
function MaintenanceScreen({ message }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-gradient)', backgroundAttachment: 'fixed', fontFamily: "'Outfit', sans-serif", padding: '32px 16px' }}>
      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 20, padding: 'clamp(28px, 6vw, 48px)', backdropFilter: 'blur(20px)' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🛠️</div>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 700, color: '#fbbf24', margin: '0 0 12px' }}>Under Maintenance</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
          {message || "We're performing scheduled maintenance. We'll be back shortly."}
        </p>
      </div>
    </div>
  )
}

export default function App({ Component, pageProps }) {
  const [flags, setFlags] = useState(null)

  useEffect(() => {
    let on = true
    fetch('/api/settings/flags')
      .then(r => r.json())
      .then(f => { if (on) setFlags(f) })
      .catch(() => { if (on) setFlags({ maintenance_mode: false }) })
    return () => { on = false }
  }, [])

  const underMaintenance = flags?.maintenance_mode === true

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500;1,9..144,700&family=Cinzel:wght@600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      {underMaintenance
        ? <MaintenanceScreen message={flags?.maintenance_message} />
        : <Component {...pageProps} />}
    </>
  )
}
