# Email Infrastructure Plan — Amazon SES + Listmonk

> **Status:** PENDING — scheduled to start ~week of 2026-11-24.
> **Hard blocker:** no real domain yet. Nothing in Phases 1–5 can start without one.
> **Reference:** mirrors the stack competitors use. DNS + email headers confirm
> `highrollers.game` and `gilded.game` both send via **Amazon SES** on a `mail.`
> subdomain, with Microsoft 365 for corporate inboxes. Gilded's welcome email
> header: `mailed-by: eu-north-1.amazonses.com`, `signed-by: gilded.game`,
> `from: Support@gilded.game`.

---

## Why SES (not Resend/Mailchimp/Klaviyo)
Most mainstream ESPs **ban gambling** in their AUP (Mailchimp, Klaviyo, Resend,
Postmark, MailerSend). **Amazon SES has no blanket gambling ban** — it's the
pragmatic engine, which is why the competitors use it. It's also the cheapest
(~$0.10 per 1,000 emails).

---

## Phase 0 — Prerequisites (blockers)
- [ ] **Buy a real domain** (~$10/yr). SES verifies by DNS — `vercel.app` can't be used.
      Cloudflare Registrar preferred (you're adding Cloudflare security too), else
      Namecheap / Porkbun.
- [ ] **Repoint the sites** at the domain (also retires the `*.vercel.app` URLs).
- [ ] **Update Supabase redirect URLs** to the new domain.
- [ ] **Decide sending identities:**
  - `noreply@` or `Support@yourdomain.com` → transactional (auth, welcome)
  - `mail.yourdomain.com` subdomain → marketing/promo (isolates bulk reputation)

## Phase 1 — Amazon SES
- [ ] AWS account → SES. Pick a **region** near players (Gilded uses `eu-north-1`;
      `us-east-1` common). Region = where identities/config live.
- [ ] **Verify domain:** 3 DKIM CNAMEs + custom MAIL FROM (`mail.yourdomain.com`,
      SPF `include:amazonses.com` + feedback MX) + DMARC (`p=none` to start).
- [ ] **Request production access** (exit sandbox) — AWS reviews use case, opt-in
      source, bounce/complaint handling. ~1 day. Answer honestly.
- [ ] **Configuration Set** with event publishing → SNS/CloudWatch for bounces,
      complaints, deliveries. Turn on the **account suppression list**.
- [ ] Generate **SES SMTP credentials** (for Supabase + Listmonk).

## Phase 2 — Transactional / auth email (Supabase)
- [ ] Supabase → Auth → SMTP Settings:
  - Host `email-smtp.<region>.amazonaws.com`, port **587** (STARTTLS)
  - User/pass = SES SMTP creds, Sender `noreply@yourdomain.com`
- [ ] **Raise the email rate limit** 2/h → 100+/h (safe once on SES).
- [ ] Brand confirm/reset templates. Test with a password reset to yourself.

## Phase 3 — Welcome + promo (two patterns)
- [ ] **Triggered emails** (welcome "account is ready + match bonus", deposit
      confirmations): fire from the **backend via SES API/SMTP** at signup/deposit.
- [ ] **Broadcast campaigns** (weekly promos): SES has no campaign UI — add a layer:
  - **Listmonk** (free, self-hosted, ~$5/mo VPS): lists, segments, templates,
    scheduling, unsubscribe; sends via SES SMTP. ← recommended
  - or **AWS Pinpoint** (SES-native campaigns, more AWS-coupled).

## Phase 4 — Deliverability & reputation
- [ ] **Warm up** a new domain/IP: ~50/day, roughly double every few days.
- [ ] Optional **dedicated IP** (~$25/mo) once volume is steady.
- [ ] Keep **bounce <5%**, **complaint <0.1%** — or AWS suspends.
- [ ] Sync **unsubscribes + hard bounces** out immediately (SES suppression + Listmonk).
- [ ] Keep transactional and marketing on **separate subdomains** so a promo
      reputation hit never breaks password resets.

## Phase 5 — App integration
- [ ] Capture **opt-in consent at signup** (checkbox + timestamp in Supabase).
- [ ] Sync player email + consent flag Supabase → Listmonk (edge function/cron or
      CSV). Email only opted-in players.

---

## Cost
| Item | Cost |
|---|---|
| Domain | ~$10/yr |
| SES sending | ~$0.10 / 1,000 emails (100k ≈ $10/mo) |
| Listmonk VPS | ~$5/mo |
| Dedicated IP (optional) | ~$25/mo |
| **Realistic total** | **~$15–40/mo** |

## First actions, in order
1. Buy the domain → repoint sites → update Supabase redirect URLs.
2. SES: verify domain (DKIM/SPF/DMARC) → request production access.
3. Wire SES SMTP into Supabase + raise the rate limit → test auth mail.
4. Stand up Listmonk on a VPS → connect SES → import opted-in players.
5. Build welcome + promo templates (unsubscribe + physical address +
   responsible-gambling footer).
6. Warm up; watch bounce/complaint rates.

---

## Compliance note (unchanged, and real)
Operator is **unlicensed**. SES will carry it technically (competitors prove it),
but SES's "follow the law" stance means the legal exposure of emailing regulated
markets lands on the operator — and the bigger risks (payment processors,
regulators) sit outside email entirely. Minimum hygiene regardless: explicit
opt-in, working unsubscribe, real sender identity + physical address,
responsible-gambling footer, never mail minors or self-excluded users.

---
*Saved 2026-11-17. When ready, ask Claude to draft the exact DNS records and the
SES→Supabase SMTP values once the domain name is chosen.*
