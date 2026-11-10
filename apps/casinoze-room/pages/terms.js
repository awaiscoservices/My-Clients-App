import StaticPage, { panel } from '../components/ui/StaticPage'
import { TERMS, LEGAL_UPDATED } from '../lib/legalContent'

export default function Page() {
  return (
    <StaticPage title="Terms of Service" subtitle={LEGAL_UPDATED ? `Last updated: ${LEGAL_UPDATED}` : undefined}>
      {TERMS.length === 0 ? (
        <div style={panel}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#fbbf24' }}>This document is being finalized</div>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 15, lineHeight: 1.8, margin: 0 }}>
            Our Terms of Service is not published yet. If you have questions, please contact support from your dashboard.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 22 }}>
          {TERMS.map(s => (
            <section key={s.heading}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>{s.heading}</h2>
              {s.body.split(/\n\s*\n/).map((para, i) => <p key={i} style={{ color: 'rgba(255,255,255,.65)', fontSize: 15, lineHeight: 1.85, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{para}</p>)}
            </section>
          ))}
        </div>
      )}
    </StaticPage>
  )
}
