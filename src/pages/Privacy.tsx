import { Link } from 'react-router-dom'
import { LegalPage } from '@/components/layout/LegalPage'
import { useSeo } from '@/hooks/useSeo'

export default function Privacy() {
  useSeo({ title: 'Privacy Policy | One-Tap' })
  return (
    <LegalPage title="Privacy Policy" updated="September 2026">
      <p>We collect only what&apos;s needed to run your digital profile and to show you accurate analytics.</p>
      <h2>What we store</h2>
      <p>
        Your account details, the profile information you add, and anonymous interaction analytics (views, scans,
        clicks) for your own profile. Your date of birth and login email are private by default and are never shown
        on your public profile unless you explicitly choose to display your email.
      </p>
      <h2>Public profile data</h2>
      <p>
        Only the fields you choose to make public — via your Privacy settings — are visible to visitors of your
        profile URL.
      </p>
      <h2>Data deletion</h2>
      <p>
        You can permanently delete your account and all associated data — profile, businesses, cards, QR codes and
        uploaded files — from{' '}
        <Link to="/dashboard/settings" className="text-brand-600 hover:underline">
          Settings
        </Link>
        .
      </p>
      <h2>Third parties</h2>
      <p>We use Supabase for authentication, database and file storage. We never sell your data.</p>
    </LegalPage>
  )
}
