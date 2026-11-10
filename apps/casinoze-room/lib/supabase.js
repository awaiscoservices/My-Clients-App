import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Cookie-based session so middleware.js can see that the user is logged in.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
