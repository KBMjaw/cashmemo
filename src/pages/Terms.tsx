import { LegalPage } from '@/components/layout/LegalPage'
import { useSeo } from '@/hooks/useSeo'

export default function Terms() {
  useSeo({ title: 'Terms of Service | One-Tap' })
  return (
    <LegalPage title="Terms of Service" updated="September 2026">
      <p>
        These Terms govern your use of One-Tap. By creating an account you agree to use the platform responsibly and
        to keep the information on your profile accurate.
      </p>
      <h2>Your account</h2>
      <p>You are responsible for the security of your account credentials and for all activity under your account.</p>
      <h2>Content you publish</h2>
      <p>
        You retain ownership of the content you add to your profile. You must not publish content that is unlawful,
        impersonates another person, or infringes on anyone&apos;s rights. Reported profiles are reviewed and may be
        disabled.
      </p>
      <h2>Availability</h2>
      <p>We aim for high availability but do not guarantee uninterrupted access to the service.</p>
      <h2>Termination</h2>
      <p>You may delete your account at any time from Settings. We may suspend accounts that violate these Terms.</p>
    </LegalPage>
  )
}
