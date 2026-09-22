import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/utils/cn'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    features: ['Digital Profile', 'Basic QR code', 'One Business', 'Basic Card template'],
    cta: 'Get started',
  },
  {
    name: 'Pro',
    price: '$9',
    highlighted: true,
    features: [
      'Unlimited Businesses',
      'Premium Card Templates',
      'Logo QR Codes',
      'PDF Export',
      'Analytics',
      'Custom Profile Themes',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    name: 'Business',
    price: '$29',
    features: ['Team Members', 'Bulk Card Generation', 'Employee Profiles', 'Company Branding', 'Admin Dashboard'],
    cta: 'Talk to us',
  },
]

export default function Pricing() {
  useSeo({ title: 'Pricing | One-Tap', description: 'Simple plans for individuals, professionals and teams.' })
  return (
    <div className="container-app py-20">
      <h1 className="text-center text-4xl font-bold text-navy-900">Simple, transparent pricing</h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-navy-500">
        Start free. Upgrade when you need more businesses, premium templates or analytics.
      </p>
      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={cn('flex flex-col gap-5', plan.highlighted && 'border-2 border-brand-500 shadow-lg')}>
            <div>
              <p className="font-semibold text-navy-800">{plan.name}</p>
              <p className="mt-1 text-3xl font-extrabold text-navy-900">
                {plan.price}
                <span className="text-sm font-medium text-navy-400">/mo</span>
              </p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 text-sm text-navy-600">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-brand-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button fullWidth variant={plan.highlighted ? 'primary' : 'outline'}>
                {plan.cta}
              </Button>
            </Link>
          </Card>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-navy-400">
        Payment integration is coming soon — every account currently has full access while we finish billing.
      </p>
    </div>
  )
}
