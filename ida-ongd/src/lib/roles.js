export const ROLE_PRIORITY = {
  member: 0,
  leader: 1,
  admin: 2,
  founder: 3,
}

export function normalizeRole(value) {
  const raw = String(value ?? 'member').trim().toLowerCase()
  if (!raw) return 'member'
  if (raw === 'administrator') return 'admin'
  if (raw === 'fondateur') return 'founder'
  return raw
}

export function getRoleLabel(value) {
  switch (normalizeRole(value)) {
    case 'leader':
      return 'Leader'
    case 'admin':
      return 'Administrateur'
    case 'founder':
      return 'Fondateur'
    default:
      return 'Membre'
  }
}

export function isRoleAtLeast(role, minimumRole) {
  const current = normalizeRole(role)
  const minimum = normalizeRole(minimumRole)
  return (ROLE_PRIORITY[current] ?? 0) >= (ROLE_PRIORITY[minimum] ?? 0)
}

export function getDefaultRouteForRole(role) {
  const normalized = normalizeRole(role)
  if (normalized === 'founder') return '/founder'
  if (normalized === 'admin') return '/admin'
  if (normalized === 'leader') return '/leader'
  return '/dashboard'
}
