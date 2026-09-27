import { getRoleLabel, normalizeRole } from '../lib/roles'

export default function RoleBadge({ role }) {
  const normalized = normalizeRole(role)

  const tone = {
    member: 'badge-member',
    leader: 'badge-leader',
    admin: 'badge-admin',
    founder: 'badge-founder',
  }[normalized] ?? 'badge-member'

  return <span className={`role-badge ${tone}`}>{getRoleLabel(role)}</span>
}
