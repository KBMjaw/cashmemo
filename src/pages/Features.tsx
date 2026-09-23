import { Card } from '@/components/ui/Card'
import { useSeo } from '@/hooks/useSeo'

const FEATURES = [
  { title: 'Digital Profile', desc: 'A public page with your photo, bio, businesses and contact details, always up to date.' },
  { title: 'Multiple Businesses', desc: 'Add every company you run, with its own contact info, socials and a primary flag.' },
  { title: 'Portfolio & Experience', desc: 'Show off projects and your professional history.' },
  { title: 'Social Links', desc: 'LinkedIn, Instagram, X, GitHub and more — reorderable and toggleable.' },
  { title: 'QR Codes', desc: 'Standard or logo-branded QR codes that always resolve to your live profile.' },
  { title: 'Business Card Designer', desc: 'Professionally designed templates you can customize and export.' },
  { title: 'Save Contact', desc: 'One tap saves you straight to a visitor’s phone as a vCard.' },
  { title: 'Analytics', desc: 'See profile views, QR scans and every click, broken down by time range.' },
  { title: 'Privacy Controls', desc: 'Choose exactly what’s public — email, phone and location are opt-in.' },
]

export default function Features() {
  useSeo({ title: 'Features | One-Tap', description: 'Everything One-Tap gives you to manage your digital identity.' })
  return (
    <div className="container-app py-20">
      <h1 className="text-center text-4xl font-bold text-navy-900">Features</h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-navy-500">
        Everything you need to put your identity, your businesses and your work in one place.
      </p>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <p className="font-semibold text-navy-800">{f.title}</p>
            <p className="mt-1 text-sm text-navy-500">{f.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
