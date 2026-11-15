import { supabase } from './supabase'
import { TENANT_ID } from './tenant'

// ─── SIGN UP with email ────────────────────────────────────
export async function signUpWithEmail({ fullName, email, password }) {
  // tenant_id is read by the handle_new_user DB trigger so the player, their
  // wallet and KYC row all land in THIS casino. Only send it when configured —
  // an empty value would fail the uuid cast in the trigger.
  const data_meta = { full_name: fullName }
  if (TENANT_ID) data_meta.tenant_id = TENANT_ID

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: data_meta },
  })
  if (error) throw error
  return data
}

// ─── SIGN IN with email ────────────────────────────────────
export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ─── CONFIRM SIGN UP with email OTP ────────────────────────
// After signUpWithEmail, Supabase emails a 6-digit code. This verifies it and
// returns a logged-in session (no magic link, no redirect).
export async function verifyEmailOtp({ email, token }) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  })
  if (error) throw error
  return data
}

// ─── RESEND the sign-up OTP ────────────────────────────────
export async function resendSignupOtp(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw error
}

// ─── SIGN OUT ──────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ─── GET current session ───────────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ─── GET current user + profile ───────────────────────────
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, wallets(*)')
    .eq('id', user.id)
    .single()

  return { ...user, profile }
}

// ─── UPDATE profile ────────────────────────────────────────
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── PASSWORD RESET ────────────────────────────────────────
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  if (error) throw error
}
