import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type {
  AdminAuditLogEntry,
  AdminUserRow,
  Business,
  BusinessCard,
  Profile,
  ShortLink,
} from '@/types/database'

export type AdminRange = 'today' | '7d' | '30d' | '90d' | 'all'

export const ADMIN_RANGES: { value: AdminRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
]

const PAGE_SIZE = 20

/** profiles columns minus date_of_birth — the admin panel never reads or displays DOB. */
const PROFILE_COLUMNS_NO_DOB =
  'id, username, full_name, professional_name, professional_title, bio, email, phone, whatsapp, website, location, profile_photo_url, cover_photo_url, visibility, show_email, show_phone, show_location, search_engine_visible, role, account_status, created_at, updated_at'

/** True once we know the signed-in user's role — never grants access before this resolves. */
export function useIsAdmin() {
  const { user, initialized } = useAuth()
  const query = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin')
      if (error) throw error
      return Boolean(data)
    },
    enabled: !!user,
    staleTime: 60_000,
  })
  return {
    isAdmin: !!query.data,
    loading: !initialized || (!!user && query.isLoading),
  }
}

export interface DashboardStats {
  total_users: number
  new_users_today: number
  new_users_month: number
  total_public_profiles: number
  total_profile_views: number
  total_qr_scans: number
  total_contact_actions: number
  total_business_cards: number
}

export function useAdminDashboardStats(range: AdminRange) {
  return useQuery({
    queryKey: ['admin-dashboard-stats', range],
    queryFn: async (): Promise<DashboardStats> => {
      const { data, error } = await supabase.rpc('admin_dashboard_stats', { p_range: range })
      if (error) throw error
      return data[0] as DashboardStats
    },
  })
}

const CONTACT_ACTION_TYPES = ['phone_click', 'email_click', 'whatsapp_click', 'website_click', 'social_click', 'save_contact'] as const

/** Per-action-type breakdown for the Analytics page (Call/WhatsApp/Email/Website/Social/Save Contact). */
export function useAdminActionBreakdown(range: AdminRange) {
  return useQuery({
    queryKey: ['admin-action-breakdown', range],
    queryFn: async () => {
      let query = supabase.from('analytics_events').select('event_type').in('event_type', CONTACT_ACTION_TYPES)
      if (range !== 'all') {
        const days = range === 'today' ? 0 : range === '7d' ? 7 : range === '30d' ? 30 : 90
        const start = new Date()
        start.setDate(start.getDate() - days)
        if (range === 'today') start.setHours(0, 0, 0, 0)
        query = query.gte('created_at', start.toISOString())
      }
      const { data, error } = await query
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of data ?? []) counts[row.event_type] = (counts[row.event_type] ?? 0) + 1
      return CONTACT_ACTION_TYPES.map((type) => ({ label: type.replace('_', ' '), value: counts[type] ?? 0 }))
    },
  })
}

export type TimeseriesMetric = 'visitors' | 'profile_views' | 'qr_scans' | 'new_users'

export function useAdminTimeseries(metric: TimeseriesMetric, range: AdminRange) {
  return useQuery({
    queryKey: ['admin-timeseries', metric, range],
    queryFn: async (): Promise<{ bucket: string; value: number }[]> => {
      const { data, error } = await supabase.rpc('admin_timeseries', { p_metric: metric, p_range: range })
      if (error) throw error
      return data as { bucket: string; value: number }[]
    },
  })
}

export function useAdminUsers(search: string, page: number) {
  return useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_users')
      if (error) throw error
      const rows = data as AdminUserRow[]
      const q = search.trim().toLowerCase()
      const filtered = q
        ? rows.filter(
            (r) =>
              r.full_name.toLowerCase().includes(q) ||
              r.username.toLowerCase().includes(q) ||
              r.email.toLowerCase().includes(q) ||
              (r.phone ?? '').toLowerCase().includes(q),
          )
        : rows
      const start = page * PAGE_SIZE
      return {
        rows: filtered.slice(start, start + PAGE_SIZE),
        total: filtered.length,
      }
    },
  })
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      if (!userId) return null
      const [profile, businesses, cards, socials, portfolio, experience] = await Promise.all([
        supabase.from('profiles').select(PROFILE_COLUMNS_NO_DOB).eq('id', userId).single(),
        supabase.from('businesses').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('business_cards').select('*').eq('user_id', userId),
        supabase.from('social_links').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('portfolio').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('experience').select('*').eq('user_id', userId).order('sort_order'),
      ])
      if (profile.error) throw profile.error
      const eventCounts = await supabase.from('analytics_events').select('event_type').eq('user_id', userId)
      const counts: Record<string, number> = {}
      for (const row of eventCounts.data ?? []) {
        counts[row.event_type] = (counts[row.event_type] ?? 0) + 1
      }
      return {
        profile: profile.data as Profile,
        businesses: (businesses.data ?? []) as Business[],
        cards: (cards.data ?? []) as BusinessCard[],
        socials: socials.data ?? [],
        portfolio: portfolio.data ?? [],
        experience: experience.data ?? [],
        analyticsCounts: counts,
      }
    },
    enabled: !!userId,
  })
}

export function useAdminSetAccountStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, disabled }: { userId: string; disabled: boolean }) => {
      const { error } = await supabase.rpc('admin_set_account_status', { p_user_id: userId, p_disabled: disabled })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-user-detail'] })
    },
  })
}

export function useAdminSetProfileVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, visibility }: { userId: string; visibility: string }) => {
      const { error } = await supabase.rpc('admin_set_profile_visibility', { p_user_id: userId, p_visibility: visibility })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-profiles'] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-user-detail'] })
    },
  })
}

/** Fire-and-forget admin action logging; never blocks the calling UI. */
export async function adminLogAction(action: string, targetType?: string, targetId?: string, meta?: Record<string, unknown>) {
  try {
    await supabase.rpc('admin_log_action', {
      p_action: action,
      p_target_type: targetType ?? null,
      p_target_id: targetId ?? null,
      p_meta: meta ?? null,
    })
  } catch {
    // Audit logging must never break the admin UI.
  }
}

interface ProfileRow extends Profile {
  analytics_events?: { event_type: string }[]
}

export function useAdminProfiles(search: string, page: number) {
  return useQuery({
    queryKey: ['admin-profiles', search, page],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(PROFILE_COLUMNS_NO_DOB, { count: 'exact' })
        .order('created_at', { ascending: false })
      const q = search.trim()
      if (q) {
        query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%,professional_title.ilike.%${q}%,location.ilike.%${q}%`)
      }
      const start = page * PAGE_SIZE
      const { data, error, count } = await query.range(start, start + PAGE_SIZE - 1)
      if (error) throw error
      return { rows: (data ?? []) as ProfileRow[], total: count ?? 0 }
    },
  })
}

export function useAdminBusinesses(search: string, page: number) {
  return useQuery({
    queryKey: ['admin-businesses', search, page],
    queryFn: async () => {
      let query = supabase
        .from('businesses')
        .select('*, owner:profiles!businesses_user_id_fkey(username, full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
      const q = search.trim()
      if (q) {
        query = query.or(`name.ilike.%${q}%,designation.ilike.%${q}%,website.ilike.%${q}%`)
      }
      const start = page * PAGE_SIZE
      const { data, error, count } = await query.range(start, start + PAGE_SIZE - 1)
      if (error) throw error
      return { rows: (data ?? []) as (Business & { owner: { username: string; full_name: string } | null })[], total: count ?? 0 }
    },
  })
}

export function useAdminQrLinks(search: string, page: number) {
  return useQuery({
    queryKey: ['admin-qr-links', search, page],
    queryFn: async () => {
      let query = supabase.from('short_links').select('*', { count: 'exact' }).order('created_at', { ascending: false })
      const q = search.trim()
      if (q) {
        query = query.or(`code.ilike.%${q}%,target_url.ilike.%${q}%`)
      }
      const start = page * PAGE_SIZE
      const { data, error, count } = await query.range(start, start + PAGE_SIZE - 1)
      if (error) throw error
      return { rows: (data ?? []) as ShortLink[], total: count ?? 0 }
    },
  })
}

export function useAdminQrStats() {
  return useQuery({
    queryKey: ['admin-qr-stats'],
    queryFn: async () => {
      const [{ count: total }, { data: scans }] = await Promise.all([
        supabase.from('short_links').select('id', { count: 'exact', head: true }),
        supabase.from('short_links').select('scan_count'),
      ])
      const totalRedirects = (scans ?? []).reduce((sum, r) => sum + (r.scan_count ?? 0), 0)
      const activeLinks = (scans ?? []).filter((r) => (r.scan_count ?? 0) > 0).length
      return { totalLinks: total ?? 0, totalRedirects, activeLinks }
    },
  })
}

export function useAdminCards(search: string, page: number) {
  return useQuery({
    queryKey: ['admin-cards', search, page],
    queryFn: async () => {
      let query = supabase
        .from('business_cards')
        .select('*, owner:profiles!business_cards_user_id_fkey(username, full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
      const q = search.trim()
      if (q) query = query.ilike('name', `%${q}%`)
      const start = page * PAGE_SIZE
      const { data, error, count } = await query.range(start, start + PAGE_SIZE - 1)
      if (error) throw error
      return { rows: (data ?? []) as (BusinessCard & { owner: { username: string; full_name: string } | null })[], total: count ?? 0 }
    },
  })
}

export function useAdminCardStats() {
  return useQuery({
    queryKey: ['admin-card-stats'],
    queryFn: async () => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)
      const [{ count: total }, { count: today }, { count: month }, templateUsage] = await Promise.all([
        supabase.from('business_cards').select('id', { count: 'exact', head: true }),
        supabase.from('business_cards').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
        supabase.from('business_cards').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
        supabase.rpc('admin_card_template_usage'),
      ])
      if (templateUsage.error) throw templateUsage.error
      return {
        total: total ?? 0,
        today: today ?? 0,
        month: month ?? 0,
        templateUsage: (templateUsage.data ?? []) as { template_id: string; card_count: number }[],
      }
    },
  })
}

export function useAdminAuditLog(page: number) {
  return useQuery({
    queryKey: ['admin-audit-log', page],
    queryFn: async () => {
      const start = page * PAGE_SIZE
      const { data, error, count } = await supabase
        .from('admin_audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, start + PAGE_SIZE - 1)
      if (error) throw error
      return { rows: (data ?? []) as AdminAuditLogEntry[], total: count ?? 0 }
    },
  })
}

export { PAGE_SIZE }
