import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getReportById } from '../lib/phase5'

const statusLabels = {
  submitted: 'Envoyé',
  under_review: 'En révision',
  approved: 'Approuvé',
  validated: 'Validé',
  rejected: 'Rejeté',
  needs_revision: 'À corriger',
  correction_requested: 'Correction demandée',
  resubmitted: 'Renvoyé',
}

export default function AdminReportDetail() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await getReportById(id)
        if (active) setReport(data)
      } catch {
        if (active) setMessage('Le rapport est indisponible.')
      }
    }
    void load()
    return () => { active = false }
  }, [id])

  if (!report && !message) {
    return (
      <main className="page-section dashboard-page">
        <div className="container"><p>Chargement…</p></div>
      </main>
    )
  }

  if (!report) {
    return (
      <main className="page-section dashboard-page">
        <div className="container">
          <Link to="/admin/rapports" className="network-back-link">← Retour</Link>
          <div className="form-notice notice-error">{message}</div>
        </div>
      </main>
    )
  }

  const leaderName = [report.leader?.first_name, report.leader?.last_name].filter(Boolean).join(' ')

  return (
    <main className="page-section dashboard-page">
      <div className="container">
        <Link to="/admin/rapports" className="network-back-link">← Rapports</Link>
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Administration</span>
            <h1>{report.mission?.title || 'Rapport'}</h1>
          </div>
          <span className={`status-pill status-${report.status}`}>{statusLabels[report.status] || report.status}</span>
        </div>

        {message && <div className="form-notice notice-info">{message}</div>}

        <section className="admin-panel mission-detail">
          <dl className="profile-details">
            <div><dt>Leader</dt><dd>{leaderName || '—'}</dd></div>
            <div><dt>Numéro de membre</dt><dd>{report.leader?.member_number || '—'}</dd></div>
            <div><dt>Mission</dt><dd>{report.mission?.title || '—'}</dd></div>
            <div><dt>Objectif</dt><dd>{report.mission?.objective || '—'}</dd></div>
            <div><dt>Lieu</dt><dd>{report.mission?.location || '—'}</dd></div>
            <div><dt>Date</dt><dd>{report.performed_on || report.mission?.scheduled_date || '—'}</dd></div>
            <div><dt>Participants</dt><dd>{report.participants_count ?? '—'}</dd></div>
            <div><dt>Statut</dt><dd>{statusLabels[report.status] || report.status}</dd></div>
          </dl>

          <h2>Résumé</h2>
          <p>{report.summary}</p>

          <h2>Activités réalisées</h2>
          <p>{report.activities_done}</p>

          <h2>Résultats obtenus</h2>
          <p>{report.results}</p>

          {report.difficulties && <><h2>Difficultés</h2><p>{report.difficulties}</p></>}
          {report.recommendations && <><h2>Recommandations</h2><p>{report.recommendations}</p></>}
          {report.observations && <><h2>Observations</h2><p>{report.observations}</p></>}

          {report.review_comment && <><h2>Commentaire de l’administration</h2><p>{report.review_comment}</p></>}

          {report.history?.length > 0 && (
            <>
              <h2>Historique</h2>
              <ul className="feature-list">
                {report.history.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((item) => (
                  <li key={item.id}>
                    {item.action} — {item.actor ? [item.actor.first_name, item.actor.last_name].filter(Boolean).join(' ') : 'Système'}
                    {item.comment ? ` : ${item.comment}` : ''}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
