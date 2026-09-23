import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { ADMIN_RANGES, type AdminRange } from '@/hooks/useAdmin'

export function StatCard({ label, value, loading }: { label: string; value: number | string; loading?: boolean }) {
  return (
    <Card interactive className="flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</p>
      <p className="text-2xl font-bold text-navy-900">{loading ? '—' : typeof value === 'number' ? value.toLocaleString() : value}</p>
    </Card>
  )
}

export function DateRangeTabs({ value, onChange }: { value: AdminRange; onChange: (v: AdminRange) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-navy-200 bg-white p-1">
      {ADMIN_RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === r.value ? 'bg-navy-900 text-white' : 'text-navy-500 hover:bg-navy-50 hover:text-navy-900',
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (pageCount <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-navy-100 px-1 pt-4 text-sm text-navy-500">
      <span>
        Page {page + 1} of {pageCount} · {total.toLocaleString()} total
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

export function StatusBadge({ tone, children }: { tone: 'success' | 'warning' | 'neutral' | 'danger'; children: React.ReactNode }) {
  const tones = {
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    neutral: 'bg-navy-100 text-navy-600',
    danger: 'bg-red-100 text-red-700',
  }
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', tones[tone])}>{children}</span>
}

export function AdminPageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        className="h-10 w-full rounded-lg border border-navy-200 bg-white pl-9 pr-3 text-sm text-navy-800 outline-none transition-colors placeholder:text-navy-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  )
}
