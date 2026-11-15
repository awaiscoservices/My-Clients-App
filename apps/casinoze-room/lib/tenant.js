/**
 * The casino (tenant) this deployment belongs to.
 *
 * Every Vercel project for a casino sets NEXT_PUBLIC_TENANT_ID to that casino's
 * UUID. Without it we fall back to the original Casinoze tenant, so existing
 * deployments keep working unchanged.
 *
 * This is what makes a new player land in the RIGHT casino: email signup passes
 * it in the auth metadata (the handle_new_user trigger reads it), and Google
 * signup stamps it after the OAuth callback.
 */
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'
export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || DEFAULT_TENANT_ID
