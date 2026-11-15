import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // getSession() waits for the OAuth code exchange to finish and
    // writes the session cookie before we redirect.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      // Google OAuth can't carry our tenant_id into the new auth user, so the
      // DB trigger put a brand-new Google signup in the default casino. Stamp
      // THIS casino onto the profile (the API only touches brand-new users, so
      // a returning player is never moved).
      try {
        await fetch('/api/auth/stamp-tenant', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
      } catch { /* non-blocking — worst case the trigger's default stands */ }
      router.replace('/dashboard')
    })
  }, [router])

  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-gradient)', color: '#fbbf24', fontFamily: 'Outfit, sans-serif', fontWeight: 600, letterSpacing: '.06em' }}>Signing you in…</div>
}
