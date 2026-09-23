import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { AdminPageHeader, Pagination, SearchInput, StatCard, StatusBadge } from '@/components/admin/AdminUi'
import { PAGE_SIZE, useAdminQrLinks, useAdminQrStats } from '@/hooks/useAdmin'

export default function AdminQr() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const { data, isLoading } = useAdminQrLinks(search, page)
  const { data: stats } = useAdminQrStats()

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Quick QR"
        description="Every short link created via Quick QR (login and no-login)."
        action={<SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0) }} placeholder="Search code or destination…" />}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Quick QRs" value={stats?.totalLinks ?? 0} />
        <StatCard label="Total Redirects" value={stats?.totalRedirects ?? 0} />
        <StatCard label="Active Links" value={stats?.activeLinks ?? 0} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-navy-100 text-xs font-semibold uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Destination</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Scans</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-navy-400">
                  <Spinner className="mx-auto h-5 w-5" />
                </td>
              </tr>
            )}
            {!isLoading && data?.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-navy-400">
                  No Quick QR links match your search.
                </td>
              </tr>
            )}
            {data?.rows.map((link) => (
              <tr key={link.id} className="border-b border-navy-50 transition-colors last:border-0 hover:bg-navy-50/60">
                <td className="px-5 py-3 font-mono text-navy-800">{link.code}</td>
                <td className="max-w-[280px] truncate px-5 py-3">
                  <a href={link.target_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                    {link.target_url}
                  </a>
                </td>
                <td className="px-5 py-3 text-navy-500">{new Date(link.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 font-medium text-navy-800">{link.scan_count}</td>
                <td className="px-5 py-3">
                  {link.scan_count > 0 ? <StatusBadge tone="success">Active</StatusBadge> : <StatusBadge tone="neutral">Unused</StatusBadge>}
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
