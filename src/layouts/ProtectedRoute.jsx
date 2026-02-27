import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/hooks/useRedux'
import { selectAuth } from '@/app/store/authSlice'
import { PageLoader } from '@/components/ui/Loader'

/**
 * ProtectedRoute — token না থাকলে /login এ redirect
 * allowedRoles দিলে role check করে
 */
export function ProtectedRoute({ allowedRoles }) {
  const { isLoggedIn, loading, user } = useAppSelector(selectAuth)

  if (loading) return <PageLoader />

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
