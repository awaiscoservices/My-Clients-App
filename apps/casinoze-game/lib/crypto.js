import crypto from 'crypto'

/**
 * SERVER-SIDE ONLY. Never import this from a page or component — it reads
 * ENCRYPTION_KEY, which must not reach the browser.
 *
 * Game passwords are stored in game_accounts.game_password_enc, written by the
 * admin app as:
 *
 *   <iv hex>:<auth tag hex>:<ciphertext hex>        AES-256-GCM
 *
 * Two historical quirks this has to cope with:
 *
 *  1. Two IV lengths. The admin app originally used a 16-byte IV in
 *     game-accounts/setup.js and 12 in games/upsert.js. 12 is correct for GCM
 *     and setup.js now uses it, but a row written in between could hold
 *     either, so the IV length is taken from the stored value rather than
 *     assumed.
 *
 *  2. An "UNENCRYPTED:" prefix. When ENCRYPTION_KEY was missing, the admin app
 *     silently stored the password in clear text behind that marker. That
 *     fallback is gone, but old rows may still carry it. They are returned so
 *     the player is not locked out of their own account, and flagged so the
 *     caller can tell.
 */

const LEGACY_PREFIX = 'UNENCRYPTED:'

function getKey() {
  const key = process.env.ENCRYPTION_KEY
  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters')
  }
  return Buffer.from(key, 'hex')
}

/**
 * Decrypt one stored game password.
 *
 * Never throws on bad data — a single unreadable row must not break the whole
 * page. Returns null when the value cannot be read.
 *
 * @returns {{ value: string|null, legacyPlaintext: boolean }}
 */
export function decryptPassword(stored) {
  if (!stored || typeof stored !== 'string') {
    return { value: null, legacyPlaintext: false }
  }

  if (stored.startsWith(LEGACY_PREFIX)) {
    return { value: stored.slice(LEGACY_PREFIX.length), legacyPlaintext: true }
  }

  const parts = stored.split(':')
  if (parts.length !== 3) return { value: null, legacyPlaintext: false }

  const [ivHex, tagHex, dataHex] = parts

  try {
    const iv = Buffer.from(ivHex, 'hex')          // 12 or 16 bytes, as stored
    const tag = Buffer.from(tagHex, 'hex')
    const data = Buffer.from(dataHex, 'hex')

    if (iv.length !== 12 && iv.length !== 16) return { value: null, legacyPlaintext: false }
    if (tag.length !== 16) return { value: null, legacyPlaintext: false }

    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv)
    decipher.setAuthTag(tag)
    const out = Buffer.concat([decipher.update(data), decipher.final()])
    return { value: out.toString('utf8'), legacyPlaintext: false }
  } catch {
    // Wrong key, tampered ciphertext, or malformed hex.
    return { value: null, legacyPlaintext: false }
  }
}
