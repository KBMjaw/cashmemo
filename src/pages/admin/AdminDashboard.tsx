import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { AdminPageHeader, DateRangeTabs, StatCard } from '@/components/admin/AdminUi'
import { LineChart } from '@/components/admin/MiniChart'
import { useAdminDashboardStats, useAdminTimeseries, type AdminRange } from '@/hooks/useAdmin'

export default function AdminDashboard() {
  const [range, setRange] = useState<AdminRange>('30d')
  const { data: stats, isLoading } = useAdminDashboardStats(range)

  const visitors = useAdminTimeseries('visitors', range)
  const profileViews = useAdminTimeseries('profile_views', range)
  const qrScans = useAdminTimeseries('qr_scans', range)
  const newUsers = useAdminTimeseries('new_users', range)

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Dashboard"
        description="Platform-wide overview — separate from any individual user's public profile analytics."
        action={<DateRangeTabs value={range} onChange={setRange} />}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats?.total_users ?? 0} loading={isLoading} />
        <StatCard label="New Users Today" value={stats?.new_users_today ?? 0} loading={isLoading} />
        <StatCard label="New Users This Month" value={stats?.new_users_month ?? 0} loading={isLoading} />
        <StatCard label="Total Public Profiles" value={stats?.total_public_profiles ?? 0} loading={isLoading} />
        <StatCard label="Total Profile Views" value={stats?.total_profile_views ?? 0} loading={isLoading} />
        <StatCard label="Total QR Scans" value={stats?.total_qr_scans ?? 0} loading={isLoading} />
        <StatCard label="Total Contact Actions" value={stats?.total_contact_actions ?? 0} loading={isLoading} />
        <StatCard label="Total Business Cards" value={stats?.total_business_cards ?? 0} loading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-navy-800">Visitors over time</h2>
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
          <h2 className="mb-4 font-semibold text-navy-800">New user registrations</h2>
          <LineChart data={newUsers.data ?? []} color="#059669" />
        </Card>
      </div>
    </div>
  )
}
