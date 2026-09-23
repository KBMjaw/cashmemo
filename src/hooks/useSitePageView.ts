import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const SESSION_KEY = 'onetap_site_session_id'

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    // sessionStorage unavailable (privacy mode etc.) — fall back to a
    // per-load id; visitor tracking just won't dedupe across pages.
    return crypto.randomUUID()
  }
}

function deviceType(): string {
  const w = window.innerWidth
  if (w < 640) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function browserName(): string {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) return 'edge'
  if (ua.includes('Chrome/') && !ua.includes('Chromium')) return 'chrome'
  if (ua.includes('Firefox/')) return 'firefox'
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'safari'
  return 'other'
}

/**
 * Anonymous, privacy-conscious website page-view tracking (separate from
 * per-profile analytics_events). No IP addresses or personal data — only a
 * per-browser-session id, path, referrer, device and browser class.
 * Best-effort: never throws, never blocks rendering.
 */
export function useSitePageView() {
  const location = useLocation()

  useEffect(() => {
    const sessionId = getSessionId()
    supabase
      .from('site_events')
      .insert({
        session_id: sessionId,
        path: location.pathname,
        referrer: document.referrer || null,
        device_type: deviceType(),
        browser: browserName(),
      })
      .then(
        () => {},
        () => {},
      )
  }, [location.pathname])
}
