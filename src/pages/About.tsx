import { useSeo } from '@/hooks/useSeo'

export default function About() {
  useSeo({ title: 'About | One-Tap', description: 'Why we built One-Tap.' })
  return (
    <div className="container-app max-w-2xl py-20">
      <h1 className="text-4xl font-bold text-navy-900">About One-Tap</h1>
      <div className="mt-6 flex flex-col gap-4 text-navy-600">
        <p>
          Business cards get lost, printed details go stale, and most digital profiles are just a wall of links. We
          built One-Tap so your identity — your businesses, your work, your contact details — lives in one place
          that&apos;s always current.
        </p>
        <p>
          Print a card once. Scan the QR anytime. Whatever you update on your One-Tap profile shows up instantly for
          everyone who has ever scanned it.
        </p>
        <p>
          One-Tap is built for professionals, founders and teams who want a single, trustworthy link for everything
          about how to reach them.
        </p>
      </div>
    </div>
  )
}
