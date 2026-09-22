import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project credentials.',
  )
}

// Fall back to a syntactically valid placeholder so the client can construct
// without crashing the whole app when env vars are missing (e.g. first run
// before .env is configured) — requests will simply fail until real
// credentials are provided.
export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const STORAGE_BUCKETS = {
  profile: import.meta.env.VITE_STORAGE_BUCKET_PROFILE || 'profile-images',
  cover: import.meta.env.VITE_STORAGE_BUCKET_COVER || 'cover-images',
  logo: import.meta.env.VITE_STORAGE_BUCKET_LOGO || 'business-logos',
  portfolio: import.meta.env.VITE_STORAGE_BUCKET_PORTFOLIO || 'portfolio-images',
  card: import.meta.env.VITE_STORAGE_BUCKET_CARD || 'card-assets',
  qr: import.meta.env.VITE_STORAGE_BUCKET_QR || 'qr-assets',
} as const

export const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

/** Canonical public profile URL — the clean `/{username}` form. */
export function profileUrl(username: string) {
  return `${APP_URL}/${username}`
}

/** Legacy `/u/{username}` form, kept working for links/cards printed before the clean URL shipped. */
export function legacyProfileUrl(username: string) {
  return `${APP_URL}/u/${username}`
}
