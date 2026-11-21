/**
 * The casino (tenant) this deployment belongs to.
 *
 * This folder is the Casinoze Game app, so its fallback is Casinoze Game's own
 * tenant UUID — never Casinoze Room's. A deploy may still override it with
 * NEXT_PUBLIC_TENANT_ID, but with a dedicated folder the default is safe: a
 * signup here can only ever land in Casinoze Game, never another casino.
 *
 * This is what makes a new player land in the RIGHT casino: email signup passes
 * it in the auth metadata, which the handle_new_user trigger reads.
 */
export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || '88d01f8f-be77-411c-b328-669b45ce678f'
