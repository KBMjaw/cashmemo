import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useSeo } from '@/hooks/useSeo'

const STEPS = [
  { n: '01', title: 'Create Your Profile', desc: 'Add your name, photo, title and bio in minutes.' },
  { n: '02', title: 'Add Your Businesses', desc: 'List every company you run with full contact details.' },
  { n: '03', title: 'Generate Your QR', desc: 'A permanent QR that always points to your live profile.' },
  { n: '04', title: 'Share Everywhere', desc: 'Print it on a card, share the link, or scan it in person.' },
]

const FEATURES = [
  { title: 'Digital Profile', desc: 'One page for your identity — bio, contact info, and more.' },
  { title: 'Business Card', desc: 'Design and export print-ready cards in seconds.' },
  { title: 'QR Code', desc: 'One QR, always current — no reprinting when details change.' },
  { title: 'Multiple Businesses', desc: 'Showcase every company you run, all in one place.' },
  { title: 'Portfolio', desc: 'Show off projects and work samples.' },
  { title: 'Social Links', desc: 'Connect every social profile you use.' },
  { title: 'Save Contact', desc: 'Visitors save you to their phone in one tap.' },
  { title: 'Analytics', desc: 'Track views, scans and clicks on your profile.' },
]

export default function Landing() {
  useSeo({
    title: 'One-Tap — Your Identity. One Tap Away.',
    description:
      'Create your digital identity, business profile and professional business card — all connected through one simple QR code.',
  })

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 py-24 text-white sm:py-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(49,130,246,0.35), transparent 40%), radial-gradient(circle at 85% 30%, rgba(49,130,246,0.2), transparent 45%)',
          }}
        />
        <div className="container-app relative text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Your Identity. <span className="text-brand-400">One Tap Away.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-navy-200">
            Create your digital identity, business profile and professional business card — all connected through
            one simple QR code.
          </p>
        </div>
      </section>

      {/* Two modes */}
      <section className="container-app -mt-16 pb-16 sm:-mt-20">
        <div className="relative z-10 grid gap-6 sm:grid-cols-2">
          <Card className="flex flex-col gap-4 border-navy-100 shadow-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Quick QR</p>
              <h2 className="mt-1 text-xl font-bold text-navy-900">Create a QR from any existing link</h2>
              <p className="mt-2 text-sm text-navy-500">Paste a URL → Get a short link → Generate QR.</p>
            </div>
            <Link to="/quick-qr" className="mt-auto">
              <Button fullWidth>Create Quick QR</Button>
            </Link>
            <p className="text-center text-xs text-navy-400">No login required.</p>
          </Card>

          <Card className="flex flex-col gap-4 border-brand-200 shadow-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Digital Identity</p>
              <h2 className="mt-1 text-xl font-bold text-navy-900">Create your digital identity</h2>
              <p className="mt-2 text-sm text-navy-500">Profile → Business → QR → Digital Business Card.</p>
            </div>
            <Link to="/signup" className="mt-auto">
              <Button fullWidth variant="secondary">
                Create My One-Tap
              </Button>
            </Link>
            <p className="text-center text-xs text-navy-400">Login/signup required.</p>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="container-app py-20">
        <h2 className="text-center text-3xl font-bold text-navy-900">How Digital Identity Works</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n} className="flex flex-col gap-2">
              <span className="text-3xl font-extrabold text-brand-200">{step.n}</span>
              <h3 className="font-semibold text-navy-900">{step.title}</h3>
              <p className="text-sm text-navy-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-navy-50/60 py-20">
        <div className="container-app">
          <h2 className="text-center text-3xl font-bold text-navy-900">Everything you need in one identity</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} interactive>
                <p className="font-semibold text-navy-800">{f.title}</p>
                <p className="mt-1 text-sm text-navy-500">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Example profile */}
      <section className="container-app py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-navy-900">A profile that works as hard as you do</h2>
            <p className="mt-4 text-navy-500">
              Businesses, portfolio, social links and contact details — all on one page visitors can reach in one
              tap, and save straight to their phone.
            </p>
            <Link to="/signup" className="mt-6 inline-block">
              <Button>Create your profile</Button>
            </Link>
          </div>
          <Card className="mx-auto w-full max-w-sm">
            <div className="-mx-5 -mt-5 h-24 rounded-t-xl2 bg-gradient-to-br from-navy-800 to-navy-950" />
            <div className="-mt-10 flex flex-col items-center gap-2 text-center">
              <div className="h-20 w-20 rounded-full border-4 border-white bg-brand-500" />
              <p className="font-bold text-navy-900">Navaneethan Gunasekaran</p>
              <p className="text-sm text-brand-600">Founder & CEO, Cube CorpSol</p>
              <p className="text-xs text-navy-400">Erode, India</p>
              <div className="mt-2 grid w-full grid-cols-2 gap-2">
                <div className="rounded-lg border border-navy-100 py-2 text-xs font-medium text-navy-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700">
                  Call
                </div>
                <div className="rounded-lg border border-navy-100 py-2 text-xs font-medium text-navy-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700">
                  WhatsApp
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* QR section */}
      <section className="bg-navy-950 py-20 text-white">
        <div className="container-app grid items-center gap-12 lg:grid-cols-2">
          <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl bg-white p-6 shadow-2xl">
            <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-1">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className={i % 3 === 0 ? 'rounded-sm bg-navy-950' : 'rounded-sm bg-navy-100'} />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold">One QR. Your Complete Identity.</h2>
            <p className="mt-4 max-w-md text-navy-300">
              Print it once — every scan pulls your latest details straight from your live profile. Change your
              number next year, and your existing cards keep working.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-app py-24 text-center">
        <h2 className="text-3xl font-bold text-navy-900">Create your One-Tap profile today.</h2>
        <Link to="/signup" className="mt-8 inline-block">
          <Button size="lg">Create Your One-Tap</Button>
        </Link>
      </section>
    </div>
  )
}
