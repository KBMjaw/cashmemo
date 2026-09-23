import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import { supabase } from '@/lib/supabase'
import { useMyProfile } from '@/hooks/useProfile'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: 'home', end: true },
  { to: '/admin/users', label: 'Users', icon: 'user' },
  { to: '/admin/profiles', label: 'Profiles', icon: 'id' },
  { to: '/admin/businesses', label: 'Businesses', icon: 'briefcase' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/admin/qr', label: 'Quick QR', icon: 'qr' },
  { to: '/admin/cards', label: 'Business Cards', icon: 'card' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
]

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
    id: <path d="M3 5h18v14H3zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-3 6c.5-2 2-3 3-3s2.5 1 3 3M14 9h5M14 13h5" />,
    briefcase: <path d="M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Zm5 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
    chart: <path d="M4 19V9m6 10V5m6 14v-7m4 7H3" />,
    qr: <path d="M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 3h7m-7 4h3m1-7h3v3" />,
    card: <path d="M3 6h18v12H3zM3 10h18" />,
    settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3a7 7 0 0 0-.2-1.6l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2.8-1.6L13 2h-4l-.6 2.8a7 7 0 0 0-2.8 1.6l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 3 12c0 .5 0 1.1.2 1.6l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2.8 1.6L11 22h4l.6-2.8a7 7 0 0 0 2.8-1.6l2.4 1 2-3.4-2-1.6c.1-.5.2-1.1.2-1.6Z" />,
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

export function AdminLayout() {
  const navigate = useNavigate()
  const { data: profile } = useMyProfile()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400">One-Tap</p>
        <p className="text-lg font-extrabold text-white">Admin</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-white/10 text-white' : 'text-navy-300 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <span className="transition-transform duration-150 group-hover:translate-x-0.5">
              <NavIcon name={item.icon} />
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar src={profile?.profile_photo_url} name={profile?.full_name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{profile?.full_name || 'Admin'}</p>
            <p className="truncate text-xs text-navy-400">{profile?.role ?? 'admin'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-navy-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-navy-50/40">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-950 lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-navy-950 shadow-xl">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-navy-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-navy-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <p className="text-sm font-bold text-navy-900">One-Tap Admin</p>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
