import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import { useAnalyticsSummary, type AnalyticsRange } from '@/hooks/useAnalytics'
import type { AnalyticsEventType } from '@/types/database'

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

const METRICS: { key: AnalyticsEventType; label: string }[] = [
  { key: 'profile_view', label: 'Profile Views' },
  { key: 'qr_scan', label: 'QR Scans' },
  { key: 'phone_click', label: 'Phone Clicks' },
  { key: 'email_click', label: 'Email Clicks' },
  { key: 'whatsapp_click', label: 'WhatsApp Clicks' },
  { key: 'website_click', label: 'Website Clicks' },
  { key: 'social_click', label: 'Social Link Clicks' },
  { key: 'save_contact', label: 'Save Contact' },
]

export default function Analytics() {
  const [range, setRange] = useState<AnalyticsRange>('30d')
  const { data: stats, isLoading } = useAnalyticsSummary(range)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Analytics</h1>
        <p className="mt-1 text-sm text-navy-500">See how visitors are engaging with your public profile.</p>
      </div>

      <div className="inline-flex w-fit rounded-lg border border-navy-100 bg-navy-50 p-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              range === r.value ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {METRICS.map((m) => (
          <Card key={m.key} className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">{m.label}</p>
            <p className="text-2xl font-bold text-navy-900">{isLoading ? '—' : (stats?.[m.key] ?? 0).toLocaleString()}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
