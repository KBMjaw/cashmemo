import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { Spinner } from '@/components/ui/Spinner'
import { decodeSelfLink, isDbStyleCode, isSelfEncodedCode } from '@/utils/shortLink'
import { resolveDbShortLink } from '@/lib/shortLinks'
import PublicProfile from '@/pages/PublicProfile'

type Outcome = { kind: 'loading' } | { kind: 'username' } | { kind: 'redirecting' } | { kind: 'not_found' }

/**
 * Handles the clean `/{slug}` route. A slug is either:
 *  - a self-encoded short link (`e-...`) — decoded and redirected client-side
 *  - a DB-backed short code (uppercase letters + digits) — looked up in
 *    Supabase and redirected
 *  - anything else — treated as a username and rendered as a public profile
 *
 * Explicit app routes (e.g. /login, /dashboard) always win over this route
 * in React Router's ranking, so they never reach here.
 */
export default function ProfileOrShortLink() {
  const { slug } = useParams<{ slug: string }>()
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      if (!slug) {
        setOutcome({ kind: 'not_found' })
        return
      }

      if (isSelfEncodedCode(slug)) {
        const target = decodeSelfLink(slug)
        if (target) {
          if (!cancelled) setOutcome({ kind: 'redirecting' })
          window.location.replace(target)
        } else if (!cancelled) {
          setOutcome({ kind: 'not_found' })
        }
        return
      }

      if (isDbStyleCode(slug)) {
        const target = await resolveDbShortLink(slug)
        if (cancelled) return
        if (target) {
          setOutcome({ kind: 'redirecting' })
          window.location.replace(target)
        } else {
          // Shape matched a short code but nothing resolved — could still
          // theoretically be a username, so give profile lookup a chance
          // before declaring it missing.
          setOutcome({ kind: 'username' })
        }
        return
      }

      setOutcome({ kind: 'username' })
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (outcome.kind === 'username') {
    return <PublicProfile usernameOverride={slug} />
  }

  if (outcome.kind === 'not_found') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <Logo className="mb-4" />
        <h1 className="text-xl font-bold text-navy-900">Link not found</h1>
        <p className="text-navy-500">This One-Tap link doesn&apos;t exist or has expired.</p>
        <Link to="/" className="mt-2 text-brand-600 hover:underline">
          Go to One-Tap home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8 text-brand-600" />
    </div>
  )
}
