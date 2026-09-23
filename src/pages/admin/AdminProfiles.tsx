import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { AdminPageHeader, Pagination, SearchInput, StatusBadge } from '@/components/admin/AdminUi'
import { PAGE_SIZE, adminLogAction, useAdminProfiles, useAdminSetProfileVisibility } from '@/hooks/useAdmin'
import { profileUrl } from '@/lib/supabase'

export default function AdminProfiles() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const { data, isLoading } = useAdminProfiles(search, page)
  const setVisibility = useAdminSetProfileVisibility()
  const toast = useToast()

  async function toggle(id: string, current: string) {
    const next = current === 'published' ? 'unpublished' : 'published'
    try {
      await setVisibility.mutateAsync({ userId: id, visibility: next })
      adminLogAction('PROFILE_VIEWED', 'profile', id, { visibility: next })
      toast.show(`Profile ${next === 'published' ? 'published' : 'unpublished'}.`, 'success')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Could not update visibility.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Profiles"
        description="Every public profile on One-Tap."
        action={<SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0) }} placeholder="Search name, title, location…" />}
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-navy-100 text-xs font-semibold uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-5 py-3">Profile</th>
              <th className="px-5 py-3">Username</th>
              <th className="px-5 py-3">Designation</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-navy-400">
                  <Spinner className="mx-auto h-5 w-5" />
                </td>
              </tr>
            )}
            {!isLoading && data?.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-navy-400">
                  No profiles match your search.
                </td>
              </tr>
            )}
            {data?.rows.map((p) => (
              <tr key={p.id} className="border-b border-navy-50 transition-colors last:border-0 hover:bg-navy-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={p.profile_photo_url} name={p.full_name} size="sm" />
                    <span className="max-w-[160px] truncate font-medium text-navy-800">{p.full_name || '—'}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-navy-600">@{p.username}</td>
                <td className="max-w-[180px] truncate px-5 py-3 text-navy-600">{p.professional_title || '—'}</td>
                <td className="px-5 py-3 text-navy-600">{p.location || '—'}</td>
                <td className="px-5 py-3 text-navy-500">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <StatusBadge tone={p.visibility === 'published' ? 'success' : p.visibility === 'draft' ? 'neutral' : 'warning'}>
                    {p.visibility}
                  </StatusBadge>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={profileUrl(p.username)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        View ↗
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" loading={setVisibility.isPending} onClick={() => toggle(p.id, p.visibility)}>
                      {p.visibility === 'published' ? 'Unpublish' : 'Publish'}
                    </Button>
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
    </div>
  )
}
