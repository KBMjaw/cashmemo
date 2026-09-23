import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { AdminPageHeader, Pagination, SearchInput, StatusBadge } from '@/components/admin/AdminUi'
import {
  PAGE_SIZE,
  adminLogAction,
  useAdminSetAccountStatus,
  useAdminUserDetail,
  useAdminUsers,
} from '@/hooks/useAdmin'
import { profileUrl } from '@/lib/supabase'
import type { AdminUserRow } from '@/types/database'

function profileCompletion(userId: string, detail: ReturnType<typeof useAdminUserDetail>['data']) {
  if (!detail || detail.profile.id !== userId) return null
  const p = detail.profile
  const fields = [p.full_name, p.professional_title, p.bio, p.phone, p.profile_photo_url, p.location]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<AdminUserRow | null>(null)
  const { data, isLoading } = useAdminUsers(search, page)
  const toast = useToast()
  const setStatus = useAdminSetAccountStatus()

  async function handleToggleStatus(u: AdminUserRow) {
    const disabling = !u.is_banned && u.account_status !== 'disabled'
    try {
      await setStatus.mutateAsync({ userId: u.id, disabled: disabling })
      toast.show(disabling ? `${u.full_name} disabled.` : `${u.full_name} re-enabled.`, 'success')
      setSelected(null)
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Could not update account status.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Users"
        description="Every registered One-Tap account."
        action={<SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0) }} placeholder="Search name, username, email, phone…" />}
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-navy-100 text-xs font-semibold uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Username</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Last Sign-in</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-navy-400">
                  <Spinner className="mx-auto h-5 w-5" />
                </td>
              </tr>
            )}
            {!isLoading && data?.rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-navy-400">
                  No users match your search.
                </td>
              </tr>
            )}
            {data?.rows.map((u) => (
              <tr key={u.id} className="border-b border-navy-50 transition-colors last:border-0 hover:bg-navy-50/60">
                <td className="max-w-[180px] truncate px-5 py-3 font-medium text-navy-800">{u.full_name || '—'}</td>
                <td className="px-5 py-3 text-navy-600">@{u.username}</td>
                <td className="max-w-[200px] truncate px-5 py-3 text-navy-600">{u.email}</td>
                <td className="px-5 py-3 text-navy-600">{u.phone || '—'}</td>
                <td className="px-5 py-3 text-navy-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-navy-500">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
                <td className="px-5 py-3">
                  {u.is_banned ? <StatusBadge tone="danger">Disabled</StatusBadge> : <StatusBadge tone="success">Active</StatusBadge>}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelected(u)
                        adminLogAction('USER_VIEWED', 'user', u.id)
                      }}
                    >
                      View
                    </Button>
                    <Link to={profileUrl(u.username)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost">
                        Profile ↗
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 pb-5">
          <Pagination page={page} total={data?.total ?? 0} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </Card>

      <UserDetailModal user={selected} onClose={() => setSelected(null)} onToggleStatus={handleToggleStatus} toggling={setStatus.isPending} />
    </div>
  )
}

function UserDetailModal({
  user,
  onClose,
  onToggleStatus,
  toggling,
}: {
  user: AdminUserRow | null
  onClose: () => void
  onToggleStatus: (u: AdminUserRow) => void
  toggling: boolean
}) {
  const { data: detail, isLoading } = useAdminUserDetail(user?.id ?? null)
  const completion = user ? profileCompletion(user.id, detail) : null

  return (
    <Modal open={!!user} onClose={onClose} title={user ? user.full_name || user.username : ''} size="lg">
      {!user ? null : isLoading || !detail ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar src={detail.profile.profile_photo_url} name={detail.profile.full_name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy-800">{detail.profile.full_name}</p>
              <p className="text-sm text-navy-500">@{detail.profile.username} · {user.email}</p>
              <p className="text-sm text-navy-400">{detail.profile.professional_title || 'No title set'}</p>
            </div>
            {completion !== null && (
              <div className="text-right">
                <p className="text-xs uppercase text-navy-400">Profile completion</p>
                <p className="text-lg font-bold text-navy-800">{completion}%</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Businesses" value={detail.businesses.length} />
            <MiniStat label="Portfolio" value={detail.portfolio.length} />
            <MiniStat label="Social Links" value={detail.socials.length} />
            <MiniStat label="Cards" value={detail.cards.length} />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Analytics summary</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(detail.analyticsCounts).length === 0 && <span className="text-sm text-navy-400">No events yet.</span>}
              {Object.entries(detail.analyticsCounts).map(([type, count]) => (
                <StatusBadge key={type} tone="neutral">
                  {type.replace('_', ' ')}: {count}
                </StatusBadge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-navy-100 pt-4">
            <Link to={profileUrl(detail.profile.username)} target="_blank" rel="noreferrer">
              <Button variant="outline">View public profile ↗</Button>
            </Link>
            <Button variant={user.is_banned ? 'primary' : 'danger'} loading={toggling} onClick={() => onToggleStatus(user)}>
              {user.is_banned ? 'Enable account' : 'Disable account'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-navy-100 px-3 py-2 text-center">
      <p className="text-lg font-bold text-navy-800">{value}</p>
      <p className="text-xs text-navy-400">{label}</p>
    </div>
  )
}
