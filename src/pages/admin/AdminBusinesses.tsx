import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { AdminPageHeader, Pagination, SearchInput } from '@/components/admin/AdminUi'
import { PAGE_SIZE, useAdminBusinesses } from '@/hooks/useAdmin'

export default function AdminBusinesses() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const { data, isLoading } = useAdminBusinesses(search, page)

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Businesses"
        description="Every business added to a One-Tap profile."
        action={<SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0) }} placeholder="Search name, designation, website…" />}
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-navy-100 text-xs font-semibold uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-5 py-3">Business</th>
              <th className="px-5 py-3">Owner</th>
              <th className="px-5 py-3">Designation</th>
              <th className="px-5 py-3">Website</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-navy-400">
                  <Spinner className="mx-auto h-5 w-5" />
                </td>
              </tr>
            )}
            {!isLoading && data?.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-navy-400">
                  No businesses match your search.
                </td>
              </tr>
            )}
            {data?.rows.map((b) => (
              <tr key={b.id} className="border-b border-navy-50 transition-colors last:border-0 hover:bg-navy-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={b.logo_url} name={b.name} size="sm" />
                    <span className="max-w-[180px] truncate font-medium text-navy-800">{b.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-navy-600">{b.owner ? `@${b.owner.username}` : '—'}</td>
                <td className="max-w-[160px] truncate px-5 py-3 text-navy-600">{b.designation || '—'}</td>
                <td className="max-w-[180px] truncate px-5 py-3 text-navy-600">
                  {b.website ? (
                    <a href={b.website} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                      {b.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-3 text-navy-500">{new Date(b.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-right">
                  {b.owner && (
                    <Link to={`/${b.owner.username}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        View profile ↗
                      </Button>
                    </Link>
                  )}
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
