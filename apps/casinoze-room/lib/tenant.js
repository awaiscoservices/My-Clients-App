/**
 * The casino (tenant) this deployment belongs to.
 *
 * Every casino — Casinoze included — sets NEXT_PUBLIC_TENANT_ID on its Vercel
 * project to its OWN tenant UUID. There is no hardcoded fallback: we never
 * silently drop a signup into Casinoze. If the env var is missing the signup
 * simply doesn't stamp a tenant (a misconfiguration to fix, not a default).
 *
 * This is what makes a new player land in the RIGHT casino: email signup passes
 * it in the auth metadata (the handle_new_user trigger reads it), and Google
 * signup stamps it after the OAuth callback.
 */
export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || ''
