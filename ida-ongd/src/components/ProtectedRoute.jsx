import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { normalizeRole } from '../lib/roles'
import AccessDenied from './AccessDenied'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading, role } = useAuth()
  const location = useLocation()
  const normalizedRole = normalizeRole(role)
  const allowedRoles = roles.map(normalizeRole)

  if (loading) return <div className="route-loading" role="status">Vérification de votre session…</div>
  if (!user) return <Navigate to="/connexion" replace state={{ from: location }} />
  if (allowedRoles.length && !allowedRoles.includes(normalizedRole)) {
    return <AccessDenied requiredRoles={allowedRoles} currentRole={normalizedRole} />
  }

  return children
}