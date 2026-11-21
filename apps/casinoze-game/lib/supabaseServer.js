// SERVER-SIDE ONLY (used by /pages/api).
// Stand-in for the old `createPagesServerClient` from @supabase/auth-helpers-nextjs, built on @supabase/ssr.
//   createPagesServerClient({ req, res })                          → acts as the logged-in user (reads the session cookie)
//   createPagesServerClient({ req, res }, { supabaseKey, supabaseUrl }) → admin client (service role key), bypasses RLS
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export function createPagesServerClient({ req, res }, opts = {}) {
  const url = opts.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL

  if (opts.supabaseKey) {
    return createClient(url, opts.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } })
  }

  const client = createServerClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => Object.entries(req.cookies || {}).map(([name, value]) => ({ name, value })),
      setAll: () => {},   // API routes only read the session; the browser keeps it refreshed
    },
  })

  // A cookie alone can be forged, so confirm the token with Supabase before trusting the session.
  const readSession = client.auth.getSession.bind(client.auth)
  client.auth.getSession = async () => {
    const { data } = await readSession()
    if (!data?.session) return { data: { session: null }, error: null }
    const { data: u, error } = await client.auth.getUser()
    if (error || !u?.user) return { data: { session: null }, error: null }
    return { data: { session: { ...data.session, user: u.user } }, error: null }
  }
  return client
}
