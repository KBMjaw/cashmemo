import { LegalPage } from '@/components/layout/LegalPage'
import { useSeo } from '@/hooks/useSeo'

export default function Cookies() {
  useSeo({ title: 'Cookie Policy | One-Tap' })
  return (
    <LegalPage title="Cookie Policy" updated="September 2026">
      <p>
        One-Tap uses essential cookies and local storage to keep you signed in and to remember your session. We do
        not use third-party advertising cookies.
      </p>
      <h2>Essential storage</h2>
      <p>Authentication tokens are stored locally in your browser by Supabase Auth to keep you logged in securely.</p>
    </LegalPage>
  )
}
