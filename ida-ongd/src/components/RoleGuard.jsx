import AccessDenied from './AccessDenied'
import { normalizeRole } from '../lib/roles'

export default function RoleGuard({ children, allowedRoles = [], currentRole }) {
  const normalizedRole = normalizeRole(currentRole)
  const allowed = allowedRoles.length === 0 || allowedRoles.map(normalizeRole).includes(normalizedRole)

  if (!allowed) {
    return <AccessDenied requiredRoles={allowedRoles.map(normalizeRole)} currentRole={normalizedRole} />
  }

  return <>{children}</>
}
