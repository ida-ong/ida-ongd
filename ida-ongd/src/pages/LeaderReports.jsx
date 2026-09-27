import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderReports } from '../lib/phase5'

const labels = {
  submitted: 'Envoyé',
  under_review: 'En révision',
  approved: 'Approuvé',
  validated: 'Validé',
  rejected: 'Rejeté',
  needs_revision: 'À corriger',
  correction_requested: 'Correction demandée',
  resubmitted: 'Renvoyé',
}

export default function LeaderReports() {
  const [reports, setReports] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    getLeaderReports().then(setReports).catch(() => setMessage('Les rapports ne sont pas disponibles.'))
  }, [])

  return (
    <main className="page-section dashboard-page">
      <div className="container">
        <div className="dashboard-heading">
          <div><span className="eyebrow">Espace leader</span><h1>Mes rapports</h1></div>
          <Link to="/leader/rapports/nouveau" className="button button-primary">Nouveau rapport</Link>
        </div>

        {message && <div className="form-notice notice-error">{message}</div>}

        <div className="admin-panel">
          <div className="list-stack">
            {reports.map((report) => (
              <div className="list-row" key={report.id}>
                <div>
                  <strong>{report.mission?.title || 'Mission'}</strong>
                  <small>Réalisé le {report.performed_on} · {report.participants_count} participant(s)</small>
                  {report.review_comment && <small>Commentaire admin : {report.review_comment}</small>}
                </div>
                <div className="row-actions">
                  <span className={`status-pill status-${report.status}`}>{labels[report.status] || report.status}</span>
                  {['correction_requested', 'rejected'].includes(report.status) && (
                    <Link className="button button-primary small-button" to={`/leader/rapports/${report.id}/modifier`}>Modifier et renvoyer</Link>
                  )}
                </div>
              </div>
            ))}
            {reports.length === 0 && !message && <p className="muted-text">Aucun rapport envoyé.</p>}
          </div>
        </div>
      </div>
    </main>
  )
}
