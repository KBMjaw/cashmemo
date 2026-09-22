import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      <h1 className="text-5xl font-extrabold text-navy-900">404</h1>
      <p className="text-navy-500">We couldn&apos;t find the page you&apos;re looking for.</p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  )
}
