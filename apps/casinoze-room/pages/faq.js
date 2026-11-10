import { useState } from 'react'
import Link from 'next/link'
import StaticPage, { panel } from '../components/ui/StaticPage'
import { FAQS } from '../lib/siteContent'

export default function FAQ() {
  const [open, setOpen] = useState(0)
  return (
    <StaticPage title="Frequently Asked Questions" subtitle="Quick answers about using Casinoze Room.">
      <div style={{ ...panel, padding: '4px 24px' }}>
        {FAQS.map((f, i) => (
          <div key={f.q} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid rgba(255,255,255,.07)' : 'none' }}>
            <button onClick={() => setOpen(open === i ? -1 : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '18px 0', background: 'none', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
              {f.q}<span style={{ color: '#fbbf24', fontSize: 22, flexShrink: 0 }}>{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 15, lineHeight: 1.8, paddingBottom: 18, margin: 0 }}>{f.a}</p>}
          </div>
        ))}
      </div>
      <p style={{ marginTop: 24, color: 'rgba(255,255,255,.5)', fontSize: 14 }}>
        Still have a question? <Link href="/dashboard/support" style={{ color: '#fbbf24', fontWeight: 700 }}>Contact support</Link> from your dashboard.
      </p>
    </StaticPage>
  )
}
