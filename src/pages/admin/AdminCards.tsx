import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { AdminPageHeader, Pagination, SearchInput, StatCard } from '@/components/admin/AdminUi'
import { BarChart } from '@/components/admin/MiniChart'
import { PAGE_SIZE, useAdminCardStats, useAdminCards } from '@/hooks/useAdmin'
import { CARD_TEMPLATES } from '@/lib/cardTemplates'

function templateName(id: string) {
  return CARD_TEMPLATES.find((t) => t.id === id)?.name ?? id
}

export default function AdminCards() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const { data, isLoading } = useAdminCards(search, page)
  const { data: stats } = useAdminCardStats()

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Business Cards"
        description="Every digital business card created on One-Tap."
        action={<SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0) }} placeholder="Search card name…" />}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Cards Created" value={stats?.total ?? 0} />
        <StatCard label="Created Today" value={stats?.today ?? 0} />
        <StatCard label="Created This Month" value={stats?.month ?? 0} />
      </div>

      <Card>
        <h2 className="mb-4 font-semibold text-navy-800">Template usage</h2>
        <BarChart
          data={(stats?.templateUsage ?? []).map((t) => ({ label: templateName(t.template_id), value: t.card_count }))}
          color="#3182f6"
        />
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-navy-100 text-xs font-semibold uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-5 py-3">Card Name</th>
              <th className="px-5 py-3">Owner</th>
              <th className="px-5 py-3">Template</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Updated</th>
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
                  No business cards match your search.
                </td>
              </tr>
            )}
            {data?.rows.map((c) => (
              <tr key={c.id} className="border-b border-navy-50 transition-colors last:border-0 hover:bg-navy-50/60">
                <td className="max-w-[220px] truncate px-5 py-3 font-medium text-navy-800">{c.name}</td>
                <td className="px-5 py-3 text-navy-600">{c.owner ? `@${c.owner.username}` : '—'}</td>
                <td className="px-5 py-3 text-navy-600">{templateName(c.template_id)}</td>
                <td className="px-5 py-3 text-navy-500">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-navy-500">{new Date(c.updated_at).toLocaleDateString()}</td>
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
