import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { usePublicProfile } from '@/hooks/useProfile'
import {
  usePublicBusinesses,
  usePublicExperience,
  usePublicPortfolio,
  usePublicSocialLinks,
} from '@/hooks/usePublicCollections'
import { trackEvent } from '@/hooks/useAnalytics'
import { useSeo } from '@/hooks/useSeo'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { SocialIcon, socialLabel } from '@/components/profile/SocialIcon'
import { ReportProfileModal } from '@/components/profile/ReportProfileModal'
import { profileUrl } from '@/lib/supabase'
import { buildVCard, downloadVCard } from '@/utils/vcard'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import type { Business, Profile } from '@/types/database'

interface PublicProfileProps {
  /** Renders for this username directly instead of reading the `/u/:username` route param — used by the clean `/{username}` route. */
  usernameOverride?: string
}

export default function PublicProfile({ usernameOverride }: PublicProfileProps) {
  const params = useParams<{ username: string }>()
  const username = usernameOverride ?? params.username
  const { data: profile, isLoading, isError } = usePublicProfile(username)
  const userId = profile?.id as string | undefined

  const { data: businesses = [] } = usePublicBusinesses(userId)
  const { data: social = [] } = usePublicSocialLinks(userId)
  const { data: portfolio = [] } = usePublicPortfolio(userId)
  const { data: experience = [] } = usePublicExperience(userId)

  const [reportOpen, setReportOpen] = useState(false)
  const trackedView = useRef(false)

  useEffect(() => {
    if (userId && !trackedView.current) {
      trackedView.current = true
      trackEvent(userId, 'profile_view', 'public_profile')
    }
  }, [userId])

  useSeo({
    title: profile ? `${profile.full_name} | ${profile.professional_title ?? 'One-Tap Profile'}` : 'One-Tap Profile',
    description: profile
      ? `Connect with ${profile.full_name}. View businesses, contact information, social links and professional profile.`
      : undefined,
    image: profile?.profile_photo_url ?? undefined,
    canonical: username ? profileUrl(username) : undefined,
    noindex: profile ? !profile.search_engine_visible : true,
    type: 'profile',
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <Logo className="mb-4" />
        <h1 className="text-xl font-bold text-navy-900">Profile not found</h1>
        <p className="text-navy-500">This One-Tap profile doesn&apos;t exist or isn&apos;t published.</p>
        <Link to="/" className="mt-2 text-brand-600 hover:underline">
          Go to One-Tap home
        </Link>
      </div>
    )
  }

  const primaryBusiness = businesses.find((b) => b.is_primary) ?? businesses[0] ?? null
  const otherBusinesses = businesses.filter((b) => b.id !== primaryBusiness?.id)

  function track(eventType: Parameters<typeof trackEvent>[1]) {
    if (userId) trackEvent(userId, eventType, 'public_profile')
  }

  function handleSaveContact() {
    track('save_contact')
    const vcard = buildVCard(profile as unknown as Profile, primaryBusiness, social, profileUrl(username!))
    downloadVCard(`${username}.vcf`, vcard)
  }

  return (
    <div className="min-h-screen bg-navy-50/40 pb-16">
      <div className="relative h-48 w-full bg-gradient-to-br from-navy-800 to-navy-950 sm:h-64">
        {profile.cover_photo_url && (
          <img src={profile.cover_photo_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="container-app -mt-16 max-w-2xl">
        <Card className="flex flex-col items-center gap-3 text-center">
          <Avatar src={profile.profile_photo_url} name={profile.full_name} size="xl" className="-mt-20 border-4" />
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{profile.professional_name || profile.full_name}</h1>
            {profile.professional_title && <p className="mt-0.5 font-medium text-brand-600">{profile.professional_title}</p>}
            {profile.location && <p className="mt-1 text-sm text-navy-400">📍 {profile.location}</p>}
          </div>
          {profile.bio && <p className="max-w-md text-sm leading-relaxed text-navy-600">{profile.bio}</p>}

          <div className="mt-2 grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            {profile.phone && (
              <a href={`tel:${profile.phone}`} onClick={() => track('phone_click')}>
                <Button variant="outline" fullWidth size="sm">
                  Call
                </Button>
              </a>
            )}
            {profile.whatsapp && (
              <a
                href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => track('whatsapp_click')}
              >
                <Button variant="outline" fullWidth size="sm">
                  WhatsApp
                </Button>
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} onClick={() => track('email_click')}>
                <Button variant="outline" fullWidth size="sm">
                  Email
                </Button>
              </a>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" onClick={() => track('website_click')}>
                <Button variant="outline" fullWidth size="sm">
                  Website
                </Button>
              </a>
            )}
          </div>

          <Button fullWidth onClick={handleSaveContact} className="mt-1">
            Save Contact
          </Button>
        </Card>

        {social.length > 0 && (
          <Card className="mt-4">
            <div className="flex flex-wrap justify-center gap-3">
              {social.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  title={socialLabel(link.platform)}
                  onClick={() => track('social_click')}
                >
                  <SocialIcon platform={link.platform} />
                </a>
              ))}
            </div>
          </Card>
        )}

        {primaryBusiness && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-400">Business</h2>
            <BusinessCard business={primaryBusiness} highlighted />
          </section>
        )}

        {otherBusinesses.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-400">Other Businesses</h2>
            <div className="flex flex-col gap-3">
              {otherBusinesses.map((b) => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
          </section>
        )}

        {portfolio.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-400">Portfolio</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {portfolio.map((p) => (
                <Card key={p.id}>
                  {p.cover_image_url && <img src={p.cover_image_url} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />}
                  <p className="font-semibold text-navy-800">{p.title}</p>
                  {p.category && <p className="text-xs font-medium uppercase text-brand-500">{p.category}</p>}
                  {p.description && <p className="mt-1 text-sm text-navy-500">{p.description}</p>}
                  {p.website_url && (
                    <a href={p.website_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">
                      View project ↗
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        {experience.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-400">Experience</h2>
            <div className="flex flex-col gap-3">
              {experience.map((e) => (
                <Card key={e.id}>
                  <p className="font-semibold text-navy-800">{e.position}</p>
                  <p className="text-sm text-navy-500">{e.company}</p>
                  <p className="text-xs text-navy-400">
                    {e.start_date ?? '—'} – {e.is_current ? 'Present' : e.end_date ?? '—'}
                  </p>
                  {e.description && <p className="mt-2 text-sm text-navy-500">{e.description}</p>}
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-col items-center gap-2">
          <Link to="/signup" className="text-sm text-navy-400 hover:text-brand-600">
            Create your own One-Tap profile →
          </Link>
          <button onClick={() => setReportOpen(true)} className="text-xs text-navy-300 hover:text-red-500">
            Report Profile
          </button>
        </div>
      </div>

      <footer className="mt-10 py-6 text-center text-xs text-navy-400">
        Developed by{' '}
        <a href="https://www.cubecorpsol.com/" target="_blank" rel="noreferrer" className="font-medium text-navy-500 hover:text-brand-600 hover:underline">
          Cube Corpsol
        </a>
      </footer>

      {userId && <ReportProfileModal userId={userId} open={reportOpen} onClose={() => setReportOpen(false)} />}
    </div>
  )
}

function BusinessCard({ business, highlighted }: { business: Business; highlighted?: boolean }) {
  return (
    <Card className={highlighted ? 'border-brand-200 bg-brand-50/30' : undefined}>
      <div className="flex items-start gap-4">
        <Avatar src={business.logo_url} name={business.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy-800">{business.name}</p>
          {business.designation && <p className="text-sm text-navy-500">{business.designation}</p>}
          {business.description && <p className="mt-1 text-sm text-navy-500">{business.description}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {business.website && (
              <a href={business.website} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:underline">
                Website
              </a>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="font-medium text-brand-600 hover:underline">
                Call
              </a>
            )}
            {business.whatsapp && (
              <a
                href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-600 hover:underline"
              >
                WhatsApp
              </a>
            )}
            {business.maps_url && (
              <a href={business.maps_url} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:underline">
                Map
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
