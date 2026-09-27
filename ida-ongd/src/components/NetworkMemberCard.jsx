import { MapPin, UserRound } from 'lucide-react'
import { formatJoinDate } from '../lib/date'

export default function NetworkMemberCard({ member }) {
  const name = [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Membre IDA'

  return (
    <article className="network-member-card">
      <span className="network-member-avatar" aria-hidden="true"><UserRound size={19} /></span>
      <div className="network-member-info">
        <h3>{name}</h3>
        <p><MapPin size={14} /> {member.neighborhood_name || 'Quartier non renseigné'}</p>
        <p>Inscription : {formatJoinDate(member.created_at)}</p>
      </div>
      {typeof member.is_active === 'boolean' && <span className={`network-member-status${member.is_active ? ' is-active' : ''}`}>
        {member.is_active ? 'Actif' : 'Inactif'}
      </span>}
    </article>
  )
}
