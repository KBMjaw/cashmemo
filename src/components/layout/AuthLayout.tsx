import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'

interface AuthLayoutProps {
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-10" />
          <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-navy-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          <p className="mt-10 text-xs text-navy-400 lg:hidden">
            Developed by{' '}
            <a href="https://www.cubecorpsol.com/" target="_blank" rel="noreferrer" className="font-medium text-navy-500 hover:underline">
              Cube Corpsol
            </a>
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-navy-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(49,130,246,0.35), transparent 40%), radial-gradient(circle at 80% 70%, rgba(49,130,246,0.25), transparent 45%)',
          }}
        />
        <Link to="/" className="relative z-10 text-sm font-medium text-white/70 hover:text-white">
          ← Back to home
        </Link>
        <div className="relative z-10">
          <p className="text-3xl font-bold leading-tight text-white">
            Your Identity.
            <br />
            One Tap Away.
          </p>
          <p className="mt-4 max-w-sm text-navy-200">
            Create your digital identity, business profile and professional business card — all connected through
            one simple QR code.
          </p>
        </div>
        <div className="relative z-10 flex items-center justify-between text-sm text-navy-300">
          <span>© {new Date().getFullYear()} One-Tap</span>
          <span>
            Developed by{' '}
            <a href="https://www.cubecorpsol.com/" target="_blank" rel="noreferrer" className="font-medium text-navy-200 hover:text-white hover:underline">
              Cube Corpsol
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}
