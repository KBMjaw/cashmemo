import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { AdminPageHeader, DateRangeTabs, StatCard } from '@/components/admin/AdminUi'
import { BarChart, LineChart } from '@/components/admin/MiniChart'
import { useAdminActionBreakdown, useAdminDashboardStats, useAdminTimeseries, type AdminRange } from '@/hooks/useAdmin'

export default function AdminAnalytics() {
  const [range, setRange] = useState<AdminRange>('30d')
  const { data: stats } = useAdminDashboardStats(range)
  const visitors = useAdminTimeseries('visitors', range)
  const profileViews = useAdminTimeseries('profile_views', range)
  const qrScans = useAdminTimeseries('qr_scans', range)
  const actions = useAdminActionBreakdown(range)

  const totalVisitors = (visitors.data ?? []).reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Platform Analytics"
        description="Website traffic, public-profile activity and QR/contact actions — kept as separate, non-mixed metrics."
        action={<DateRangeTabs value={range} onChange={setRange} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsGroup title="One-Tap Website" tone="navy">
          <StatCard label="Visitors" value={totalVisitors} />
        </AnalyticsGroup>
        <AnalyticsGroup title="Public Profiles" tone="brand">
          <StatCard label="Profile Views" value={stats?.total_profile_views ?? 0} />
        </AnalyticsGroup>
        <AnalyticsGroup title="QR" tone="navy">
          <StatCard label="Scans" value={stats?.total_qr_scans ?? 0} />
        </AnalyticsGroup>
        <AnalyticsGroup title="Actions" tone="brand">
          <StatCard label="Contact Clicks" value={stats?.total_contact_actions ?? 0} />
        </AnalyticsGroup>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-navy-800">Website visitors over time</h2>
          <LineChart data={visitors.data ?? []} color="#1c63e0" />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-navy-800">Profile views over time</h2>
          <LineChart data={profileViews.data ?? []} color="#3182f6" />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-navy-800">QR scans over time</h2>
          <LineChart data={qrScans.data ?? []} color="#194392" />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-navy-800">Contact actions by type</h2>
          <BarChart data={actions.data ?? []} color="#059669" />
        </Card>
      </div>

      <Card className="bg-navy-50/60">
        <p className="text-sm text-navy-500">
          <span className="font-semibold text-navy-700">Note on privacy:</span> visitor tracking uses an anonymous,
          per-browser session identifier only — no IP addresses, dates of birth, or other personal data are stored in
          analytics events.
        </p>
      </Card>
    </div>
  )
}

function AnalyticsGroup({ title, tone, children }: { title: string; tone: 'navy' | 'brand'; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl2 border p-1 ${tone === 'navy' ? 'border-navy-200 bg-navy-50/40' : 'border-brand-200 bg-brand-50/40'}`}>
      <p className={`px-3 pt-2 text-xs font-bold uppercase tracking-wide ${tone === 'navy' ? 'text-navy-500' : 'text-brand-600'}`}>{title}</p>
      {children}
    </div>
  )
}
