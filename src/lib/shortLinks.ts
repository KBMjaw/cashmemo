import { supabase, APP_URL } from '@/lib/supabase'
import { encodeSelfLink, generateShortCode, isValidHttpUrl } from '@/utils/shortLink'

const SUPABASE_CONFIGURED = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export interface ShortLinkResult {
  code: string
  shortUrl: string
  targetUrl: string
  /** True when the code is resolvable by anyone from any device (stored in Supabase). */
  persisted: boolean
}

/**
 * Creates a Quick QR short link for `targetUrl`. Tries to persist a short,
 * DB-backed code in Supabase first (works from any device); if Supabase
 * isn't configured or the request fails, falls back to a self-encoded code
 * that resolves entirely client-side, so Mode 1 never depends on the
 * backend being up.
 */
export async function createShortLink(targetUrl: string, userId?: string): Promise<ShortLinkResult> {
  if (!isValidHttpUrl(targetUrl)) {
    throw new Error('Please enter a valid http:// or https:// URL.')
  }

  if (SUPABASE_CONFIGURED) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateShortCode()
      const { error } = await supabase
        .from('short_links')
        .insert({ code, target_url: targetUrl, user_id: userId ?? null })
      if (!error) {
        return { code, shortUrl: `${APP_URL}/${code}`, targetUrl, persisted: true }
      }
      // Unique violation on code: retry with a new one. Any other error: fall through to self-encoded.
      if (!error.message.toLowerCase().includes('duplicate')) break
    }
  }

  const code = encodeSelfLink(targetUrl)
  return { code, shortUrl: `${APP_URL}/${code}`, targetUrl, persisted: false }
}

/** Looks up a DB-backed short link's destination. Returns null if not found or unreachable. */
export async function resolveDbShortLink(code: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.from('short_links').select('target_url').eq('code', code).maybeSingle()
    if (error || !data) return null
    return data.target_url as string
  } catch {
    return null
  }
}

const HISTORY_KEY = 'onetap_quick_qr_history'
const HISTORY_LIMIT = 10

export interface QuickQrHistoryItem {
  code: string
  shortUrl: string
  targetUrl: string
  createdAt: string
}

export function loadQuickQrHistory(): QuickQrHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveQuickQrHistoryItem(item: QuickQrHistoryItem) {
  try {
    const existing = loadQuickQrHistory().filter((h) => h.code !== item.code)
    const next = [item, ...existing].slice(0, HISTORY_LIMIT)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    // Best-effort only; history is a convenience, not critical data.
  }
}
