import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

const NAV_LINKS = [
  { to: '/quick-qr', label: 'Quick QR' },
  { to: '/features', label: 'Features' },
  { to: '/templates', label: 'Templates' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
]

export function MarketingLayout() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-navy-100/80 bg-white/90 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn('text-sm font-medium text-navy-500 hover:text-navy-900', isActive && 'text-navy-900')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-navy-600 hover:text-navy-900">
                  Login
                </Link>
                <Link to="/signup">
                  <Button size="sm">Create Your One-Tap</Button>
                </Link>
              </>
            )}
          </div>
          <button onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 hover:bg-navy-50 md:hidden" aria-label="Toggle menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
        {open && (
          <div className="border-t border-navy-100 bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className="text-sm font-medium text-navy-600">
                  {link.label}
                </NavLink>
              ))}
              <hr className="border-navy-100" />
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  <Button fullWidth size="sm">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-navy-600">
                    Login
                  </Link>
                  <Link to="/signup" onClick={() => setOpen(false)}>
                    <Button fullWidth size="sm">Create Your One-Tap</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-navy-100 bg-navy-950 py-12 text-navy-300">
        <div className="container-app grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo dark />
            <p className="mt-3 max-w-xs text-sm text-navy-400">Your Identity. One Tap Away.</p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { to: '/features', label: 'Features' },
              { to: '/templates', label: 'Templates' },
              { to: '/pricing', label: 'Pricing' },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { to: '/about', label: 'About' },
              { to: '/contact', label: 'Contact' },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { to: '/terms', label: 'Terms of Service' },
              { to: '/privacy', label: 'Privacy Policy' },
              { to: '/cookies', label: 'Cookie Policy' },
            ]}
          />
        </div>
        <div className="container-app mt-10 flex flex-col gap-2 border-t border-navy-800 pt-6 text-xs text-navy-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} One-Tap. All rights reserved.</span>
          <span>
            Developed by{' '}
            <a
              href="https://www.cubecorpsol.com/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-navy-300 hover:text-white hover:underline"
            >
              Cube Corpsol
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-navy-400 hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
