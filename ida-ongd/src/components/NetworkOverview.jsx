import { ShieldCheck, UsersRound } from 'lucide-react'
import { NETWORK_GOAL } from '../lib/community'
import NetworkMemberCard from './NetworkMemberCard'

export default function NetworkOverview({ stats, loading, error, directMembers = [] }) {
  const count = stats?.network_count == null ? null : Number(stats.network_count)
  const directCount = stats?.direct_count == null ? null : Number(stats.direct_count)
  const activeCount = stats?.active_count == null ? null : Number(stats.active_count)
  const neighborhoodCount = stats?.neighborhood_count == null ? null : Number(stats.neighborhood_count)
  const progress = count == null ? 0 : Math.min(100, Math.round((count / NETWORK_GOAL) * 100))
  const eligible = count != null && count >= NETWORK_GOAL

  return (
    <>
      <section className="dashboard-card network-card">
        <div className="dashboard-card-title"><span className="card-icon"><UsersRound size={21} /></span><div><span className="eyebrow">Mobilisation communautaire</span><h2>Mon réseau communautaire</h2></div></div>
        <p className="network-number">{loading ? '…' : count == null ? '—' : `${count} personnes`}<span> dans votre réseau</span></p>
        <div className="progress-track" role="progressbar" aria-label="Progression vers l’objectif de 20 membres" aria-valuemin="0" aria-valuemax={NETWORK_GOAL} aria-valuenow={count ?? 0}><span style={{ width: `${progress}%` }} /></div>
        <div className="progress-meta"><span>{loading ? 'Chargement du réseau…' : error ? 'Compteur réseau momentanément indisponible.' : `${progress}% de l’objectif`}</span><span>{count ?? '—'} / {NETWORK_GOAL}</span></div>
        <p className="network-goal-label">Objectif de qualification : {NETWORK_GOAL} personnes</p>
        {eligible
          ? <div className="eligibility-note"><ShieldCheck size={20} /><span>Félicitations ! Votre réseau a atteint {NETWORK_GOAL} personnes. Vous êtes éligible à une nomination comme leader communautaire. La nomination doit être effectuée et validée par l’administration.</span></div>
          : <p className="network-footnote">{count == null ? 'La progression sera affichée lorsque les données Supabase seront disponibles.' : `Encore ${Math.max(0, NETWORK_GOAL - count)} personne${NETWORK_GOAL - count === 1 ? '' : 's'} pour atteindre le seuil d’éligibilité.`} L’éligibilité ne confère pas automatiquement le rôle de leader.</p>}
      </section>
      <section className="dashboard-card network-stats-card" aria-label="Statistiques du réseau">
        <h2>Statistiques du réseau</h2>
        <dl className="network-stats-list">
          <div><dt>Membres directs</dt><dd>{loading ? '…' : directCount ?? '—'}</dd></div>
          <div><dt>Membres actifs</dt><dd>{loading ? '…' : activeCount ?? '—'}</dd></div>
          <div><dt>Quartiers représentés</dt><dd>{loading ? '…' : neighborhoodCount ?? '—'}</dd></div>
          <div><dt>Quartier de rattachement</dt><dd>{stats?.neighborhood_name || 'Non renseigné'}</dd></div>
        </dl>
        {error && <p className="network-footnote">Statistiques indisponibles. La migration du réseau doit être appliquée dans Supabase.</p>}
        <div className="network-direct-list">
          {directMembers.map((member) => <NetworkMemberCard key={member.id} member={member} />)}
        </div>
      </section>
    </>
  )
}
