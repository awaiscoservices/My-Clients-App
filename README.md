# My-Clients-App

Player-facing casino sites. One folder per tenant, one Vercel project per folder.

Staff never sign in here — Super Admin and Admin live in **My-Admins-App**
(Casinoze Support, `casinozoesupport.com`), a separate repo and a separate
deployment.

## Structure

```
apps/
  casinoze-room/     Tenant 1 — Casinoze Room — casinozeroom.com
  <next-tenant>/     copy casinoze-room, rebrand, point at its own domain
```

Each `apps/*` is a complete, standalone Next.js app. There is deliberately no
root `package.json` and no npm workspace yet: with one tenant it would add
config risk for no benefit, and Vercel does not need it (see below).

### When tenant 2 arrives

Pull the genuinely shared parts up into `packages/ui/` then — player layout,
wallet UI, auth screens — and add `transpilePackages` to each app's
`next.config.js`. Doing it now, with one consumer, would be guesswork about
what is actually shared.

## Running one app locally

```bash
cd apps/casinoze-room
cp .env.example .env.local      # then fill in the values
npm install
npm run dev
```

## Vercel: several domains, one repo

Create **one Vercel project per tenant**, all pointing at this same repo, each
with a different **Root Directory**:

| Vercel project | Root Directory | Domain |
|---|---|---|
| `casinoze-room` | `apps/casinoze-room` | `casinozeroom.com` |
| `<next-tenant>` | `apps/<next-tenant>` | their domain |

Root Directory is under *Project → Settings → General*. One `git push` triggers
every affected project; Vercel only rebuilds the apps whose files changed.

Environment variables are set per Vercel project, so each tenant can point at
different values without touching code.

## Environment variables

| Variable | Secret? | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | no | ships to the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | ships to the browser; RLS protects the data |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** | see the warning below |
| `NEXT_PUBLIC_SUPPORT_URL` | no | where staff are told to sign in instead |

All tenants share one Supabase database. Rows are separated by `tenant_id`,
which 30 of the 32 tables already carry.

## Known issues, in priority order

### 1. The player API routes use the service-role key

The nine routes under `apps/casinoze-room/pages/api/` each build a Supabase
client with `SUPABASE_SERVICE_ROLE_KEY`, which **bypasses every RLS policy**.
The intended design is for player sites to run on the anon key alone.

Until these are rewritten, this app needs that key in its Vercel project, and
a bug in any one of those routes could read or write another tenant's data.

The groundwork already exists: `request_withdrawal`, `request_game_load`,
`request_redemption` and `apply_referral` are `SECURITY DEFINER` Postgres
functions granted to `authenticated`, written precisely so a player's own
session can call them safely. Rewriting the routes onto those functions plus
RLS is the fix.

### 2. Two API routes are missing

Player pages call `/api/payout-methods/add` and `/api/payout-methods/list`.
Neither file exists — only `remove.js` does. That feature is broken, and was
already broken before the split.

### 3. Tenant scoping is not applied here

These routes do not filter by `tenant_id`. With one tenant that is harmless;
it must be fixed before a second tenant goes live. `lib/adminGuard.js` in
My-Admins-App is the pattern to follow.

## What was moved, and what was left behind

Moved from My-Admins-App: all player pages, the public marketing pages,
`components/player`, `components/site`, `components/ui`, and the player-side
`lib/` modules.

Left behind on purpose: everything under `pages/admin`, `pages/api/admin`,
`pages/superadmin`, `pages/api/superadmin`, `components/admin`,
`AdminLayout.js`, and `lib/admin*.js`.

Two changes were needed rather than a straight copy:

- **`pages/auth/login.js`** in My-Admins-App had been rebranded as the
  *Casinoze Support staff* login, but 18 places in the player app link to
  `/auth/login`. The player version was restored from commit `dde925c`, and
  staff accounts signing in there are now signed out and pointed at Casinoze
  Support.
- **`pages/login.js` and `pages/register.js`** were dropped. They were an
  older duplicate pair that only linked to each other; the live app uses
  `/auth/login` and `/auth/register`.
