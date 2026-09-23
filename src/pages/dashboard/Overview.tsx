import { Link } from 'react-router-dom'
import { Card, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useMyProfile } from '@/hooks/useProfile'
import { useAnalyticsSummary } from '@/hooks/useAnalytics'
import { profileUrl } from '@/lib/supabase'

const STAT_CARDS: { key: 'profile_view' | 'qr_scan' | 'phone_click' | 'whatsapp_click' | 'website_click'; label: string }[] = [
  { key: 'profile_view', label: 'Profile Views' },
  { key: 'qr_scan', label: 'QR Scans' },
  { key: 'phone_click', label: 'Phone Clicks' },
  { key: 'whatsapp_click', label: 'WhatsApp Clicks' },
  { key: 'website_click', label: 'Website Clicks' },
]

export default function Overview() {
  const { data: profile, isLoading } = useMyProfile()
  const { data: stats } = useAnalyticsSummary('30d')

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-navy-500">Here&apos;s how your One-Tap identity is performing.</p>
        </div>
        {profile && (
          <Link to={`/u/${profile.username}`} target="_blank" rel="noreferrer">
            <Button variant="outline">View public profile ↗</Button>
          </Link>
        )}
      </div>

      <Card className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-navy-500">Profile Status</p>
          <div className="mt-1 flex items-center gap-2">
            {isLoading ? (
              <span className="text-navy-400">Loading…</span>
            ) : profile?.visibility === 'published' ? (
              <Badge tone="success">Published</Badge>
            ) : (
              <Badge tone="warning">Draft</Badge>
            )}
            {profile && <span className="text-sm text-navy-400">onetap.com/u/{profile.username}</span>}
          </div>
        </div>
        <Link to="/dashboard/profile">
          <Button variant={profile?.visibility === 'published' ? 'outline' : 'primary'}>
            {profile?.visibility === 'published' ? 'Edit Profile' : 'Complete & Publish'}
          </Button>
        </Link>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map((s) => (
          <Card key={s.key} className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">{s.label}</p>
            <p className="text-2xl font-bold text-navy-900">{stats ? stats[s.key].toLocaleString() : '—'}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink to="/dashboard/businesses" title="Add a business" description="Showcase every company you run." />
        <QuickLink to="/dashboard/qr" title="Generate your QR" description="Point visitors straight to your profile." />
        <QuickLink to="/dashboard/cards" title="Design a business card" description="Print-ready cards in minutes." />
      </div>

      {profile && (
        <p className="text-center text-sm text-navy-400">
          Your permanent profile link:{' '}
          <a href={profileUrl(profile.username)} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:underline">
            {profileUrl(profile.username)}
          </a>
        </p>
      )}
    </div>
  )
}

function QuickLink({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link to={to} className="group">
      <Card interactive className="h-full">
        <p className="font-semibold text-navy-800 transition-colors group-hover:text-brand-600">{title}</p>
        <p className="mt-1 text-sm text-navy-400">{description}</p>
      </Card>
    </Link>
  )
}
