import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMission, updateMissionStatus } from '../lib/phase5'

const labels = { assigned: 'Assignée', in_progress: 'En cours', completed: 'Réalisée', cancelled: 'Annulée', pending: 'En attente' }

export default function LeaderMissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [mission, setMission] = useState(null)
  const [message, setMessage] = useState('')
  useEffect(() => { getMission(id).then(setMission).catch(() => setMessage('Cette mission est inaccessible.')) }, [id])
  async function changeStatus(status) { try { const data = await updateMissionStatus(id, status); setMission(data); setMessage('Le statut de la mission a été mis à jour.') } catch (error) { setMessage(error.message || 'Cette transition est refusée.') } }
  if (!mission) return <main className="page-section dashboard-page"><div className="container">{message ? <div className="form-notice notice-error">{message}</div> : <p>Chargement…</p>}<Link to="/leader/missions" className="button button-outline">Retour aux missions</Link></div></main>
  return <main className="page-section dashboard-page"><div className="container"><Link to="/leader/missions" className="network-back-link">← Mes missions</Link><section className="admin-panel mission-detail"><span className={`status-pill status-${mission.status}`}>{labels[mission.status]}</span><h1>{mission.title}</h1><p className="lead">{mission.description}</p><dl className="profile-details"><div><dt>Objectif</dt><dd>{mission.objective}</dd></div><div><dt>Lieu</dt><dd>{mission.location || '—'}</dd></div><div><dt>Date prévue</dt><dd>{mission.scheduled_date || '—'} {mission.scheduled_time || ''}</dd></div><div><dt>Date limite</dt><dd>{mission.deadline || '—'}</dd></div><div><dt>Administrateur responsable</dt><dd>{mission.creator ? [mission.creator.first_name, mission.creator.last_name].filter(Boolean).join(' ') : '—'}</dd></div></dl>{message && <div className="form-notice notice-info">{message}</div>}<div className="panel-actions">{mission.status === 'assigned' && <button className="button button-primary" type="button" onClick={() => changeStatus('assigned')}>Prendre connaissance</button>}{mission.status === 'assigned' && <button className="button button-outline" type="button" onClick={() => changeStatus('in_progress')}>Commencer la mission</button>}{mission.status === 'in_progress' && <button className="button button-primary" type="button" onClick={() => changeStatus('completed')}>Marquer comme réalisée</button>}{mission.status === 'completed' && <button className="button button-primary" type="button" onClick={() => navigate(`/leader/rapports/nouveau?mission=${mission.id}`)}>Envoyer le rapport</button>}</div></section></div></main>
}
