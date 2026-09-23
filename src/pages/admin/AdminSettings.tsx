import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { AdminPageHeader, Pagination, StatusBadge } from '@/components/admin/AdminUi'
import { PAGE_SIZE, useAdminAuditLog, useAdminDashboardStats } from '@/hooks/useAdmin'
import { useMyProfile } from '@/hooks/useProfile'

export default function AdminSettings() {
  const { data: profile } = useMyProfile()
  const { data: stats } = useAdminDashboardStats('all')
  const [page, setPage] = useState(0)
  const { data: log, isLoading } = useAdminAuditLog(page)

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title="Settings" description="Admin profile, role and platform statistics." />

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={profile?.profile_photo_url} name={profile?.full_name} size="lg" />
          <div>
            <p className="font-semibold text-navy-800">{profile?.full_name}</p>
            <p className="text-sm text-navy-500">{profile?.email}</p>
          </div>
        </div>
        <StatusBadge tone={profile?.role === 'super_admin' ? 'success' : 'neutral'}>{profile?.role ?? 'admin'}</StatusBadge>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-navy-800">Platform statistics (all time)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Users" value={stats?.total_users} />
          <Stat label="Published profiles" value={stats?.total_public_profiles} />
          <Stat label="Business cards" value={stats?.total_business_cards} />
          <Stat label="Profile views" value={stats?.total_profile_views} />
        </div>
      </Card>

      <Card className="p-0">
        <h2 className="px-5 pt-5 font-semibold text-navy-800">Recent admin activity</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-navy-100 text-xs font-semibold uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Target</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-navy-400">
                    <Spinner className="mx-auto h-5 w-5" />
                  </td>
                </tr>
              )}
              {!isLoading && log?.rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-navy-400">
                    No admin actions logged yet.
                  </td>
                </tr>
              )}
              {log?.rows.map((entry) => (
                <tr key={entry.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-navy-800">{entry.action}</td>
                  <td className="px-5 py-3 text-navy-500">{entry.target_type ? `${entry.target_type} · ${entry.target_id?.slice(0, 8)}` : '—'}</td>
                  <td className="px-5 py-3 text-navy-500">{new Date(entry.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-5 pt-2">
          <Pagination page={page} total={log?.total ?? 0} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div>
      <p className="text-2xl font-bold text-navy-900">{(value ?? 0).toLocaleString()}</p>
      <p className="text-xs uppercase text-navy-400">{label}</p>
    </div>
  )
}
