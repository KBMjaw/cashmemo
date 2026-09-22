/**
 * Mode 1 ("Quick QR") short-link encoding.
 *
 * Two code shapes ever exist, and they're mutually exclusive by
 * construction so a route like `/:slug` can tell them apart from a
 * username with zero ambiguity and no network round-trip:
 *
 * - DB-backed codes: uppercase letters + digits only (e.g. `X7K92AB`),
 *   generated when Supabase is reachable and stored in `short_links`.
 * - Self-encoded codes: `e-<base64url(url)>`, used when Supabase isn't
 *   configured/reachable. The destination lives entirely in the code
 *   itself, so resolving it needs no backend at all.
 *
 * Usernames are always lowercase (`^[a-z0-9_]{3,30}$`, enforced in
 * utils/validation.ts and the DB), so neither shape can ever collide
 * with a real username.
 */

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I/L
const CODE_LENGTH = 7
const SELF_ENCODED_PREFIX = 'e-'

export function generateShortCode(length = CODE_LENGTH): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return code
}

export function isDbStyleCode(slug: string): boolean {
  return /^[A-Z0-9]{6,10}$/.test(slug)
}

export function isSelfEncodedCode(slug: string): boolean {
  return slug.startsWith(SELF_ENCODED_PREFIX)
}

function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeSelfLink(url: string): string {
  return `${SELF_ENCODED_PREFIX}${base64UrlEncode(url)}`
}

/** Returns the decoded URL, or null if the code isn't valid self-encoded data. */
export function decodeSelfLink(slug: string): string | null {
  if (!isSelfEncodedCode(slug)) return null
  try {
    const url = base64UrlDecode(slug.slice(SELF_ENCODED_PREFIX.length))
    return isValidHttpUrl(url) ? url : null
  } catch {
    return null
  }
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
