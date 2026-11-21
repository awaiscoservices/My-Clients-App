/**
 * Central brand config for this player app.
 *
 * A copy of this app for another casino overrides these on its own deployment
 * via NEXT_PUBLIC_* env vars — no code edits, so cloning is env + assets only.
 * The defaults below are Casinoze Room's. Keep ALL user-facing brand text here;
 * do not hardcode the casino name, tagline or logo wording in pages/components.
 *
 * (Code comments that mention "Casinoze" for context are fine — only rendered
 * text needs to come from here. Theme colors live in CSS variables, not here.)
 */
const pick = (v, d) => (v && String(v).trim()) || d

export const BRAND = {
  // Full name, e.g. page titles and headings: "Casinoze Game"
  name:       pick(process.env.NEXT_PUBLIC_BRAND_NAME, 'Casinoze Game'),
  // Short name used in casual copy: "your Casinoze account"
  short:      pick(process.env.NEXT_PUBLIC_BRAND_SHORT, 'Casinoze'),
  // Small eyebrow tagline on the auth screens
  tagline:    pick(process.env.NEXT_PUBLIC_BRAND_TAGLINE, 'Premium Fish Game Platform'),
  // Two-line logo wordmark (mark + these two lines of text)
  markTop:    pick(process.env.NEXT_PUBLIC_BRAND_MARK_TOP, 'CASINOZE'),
  markBottom: pick(process.env.NEXT_PUBLIC_BRAND_MARK_BOTTOM, 'GAME'),
  // Optional support address shown in copy; blank hides it
  supportEmail: pick(process.env.NEXT_PUBLIC_SUPPORT_EMAIL, ''),
  // Logo mark image. A copy either drops its own file at this default path or
  // points this env var at a different asset under /public.
  logoSrc:    pick(process.env.NEXT_PUBLIC_BRAND_LOGO, '/images/logo/logo.png'),
}

// Browser tab titles: pageTitle('Deposit') -> "Deposit — Casinoze Room"
export const pageTitle = (t) => (t ? `${t} — ${BRAND.name}` : BRAND.name)
