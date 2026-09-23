import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { AnalyticsEventType } from '@/types/database'

/** Fire-and-forget visitor event tracking; failures never block the UI. */
export async function trackEvent(userId: string, eventType: AnalyticsEventType, source?: string) {
  try {
    await supabase.from('analytics_events').insert({ user_id: userId, event_type: eventType, source: source ?? null })
  } catch {
    // Analytics must never break the visitor experience.
  }
}

export type AnalyticsRange = 'today' | '7d' | '30d' | 'all'

function rangeStart(range: AnalyticsRange): string | null {
  const now = new Date()
  switch (range) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return start.toISOString()
    }
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    case 'all':
    default:
      return null
  }
}

export function useAnalyticsSummary(range: AnalyticsRange = '30d') {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['analytics-summary', user?.id, range],
    queryFn: async () => {
      if (!user) return null
      let query = supabase.from('analytics_events').select('event_type').eq('user_id', user.id)
      const start = rangeStart(range)
      if (start) query = query.gte('created_at', start)
      const { data, error } = await query
      if (error) throw error

      const counts: Record<AnalyticsEventType, number> = {
        profile_view: 0,
        qr_scan: 0,
        phone_click: 0,
        email_click: 0,
        whatsapp_click: 0,
        website_click: 0,
        social_click: 0,
        save_contact: 0,
      }
      for (const row of data ?? []) {
        const type = row.event_type as AnalyticsEventType
        counts[type] = (counts[type] ?? 0) + 1
      }
      return counts
    },
    enabled: !!user,
  })
}
