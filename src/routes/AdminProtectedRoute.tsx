import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useIsAdmin } from '@/hooks/useAdmin'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Gates every /admin/* route. Authorization is enforced at the database
 * level (RLS + the is_admin()-gated RPCs) — this route guard only controls
 * the UI: a non-admin who somehow reached an admin page would still get
 * empty data and "Not authorized" errors from every query.
 */
export function AdminProtectedRoute() {
  const { isAuthenticated, initialized } = useAuth()
  const { isAdmin, loading } = useIsAdmin()
  const location = useLocation()

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <Spinner className="h-8 w-8 text-white" />
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location.pathname + location.search }} replace />
  }

  return <Outlet />
}
