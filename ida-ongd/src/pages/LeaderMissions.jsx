import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderMissions } from '../lib/phase5'

const labels = { assigned: 'Assignée', in_progress: 'En cours', completed: 'Réalisée', cancelled: 'Annulée', pending: 'En attente' }

export default function LeaderMissions() {
  const [missions, setMissions] = useState([])
  const [message, setMessage] = useState('')
  useEffect(() => { getLeaderMissions().then(setMissions).catch(() => setMessage('Les missions ne sont pas disponibles.')) }, [])
  return <main className="page-section dashboard-page"><div className="container"><div className="dashboard-heading"><div><span className="eyebrow">Espace leader</span><h1>Mes missions</h1></div><Link to="/leader" className="button button-outline">Retour</Link></div>{message && <div className="form-notice notice-error">{message}</div>}<div className="admin-layout">{missions.map((mission) => <article className="admin-panel" key={mission.id}><span className={`status-pill status-${mission.status}`}>{labels[mission.status] || mission.status}</span><h2>{mission.title}</h2><p className="muted-text">{mission.objective}</p><p><strong>Date prévue :</strong> {mission.scheduled_date || 'Non précisée'}<br /><strong>Date limite :</strong> {mission.deadline || 'Non précisée'}</p><Link className="button button-primary" to={`/leader/missions/${mission.id}`}>Consulter la mission</Link></article>)}{missions.length === 0 && !message && <p className="muted-text">Aucune mission ne vous est assignée.</p>}</div></div></main>
}
