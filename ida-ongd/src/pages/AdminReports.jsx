import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DateRangeFilter from '../components/DateRangeFilter'
import { getAdminReports, reviewReport } from '../lib/phase5'

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

const filters = {
  all: 'Tous',
  submitted: 'En attente',
  correction_requested: 'À corriger',
  validated: 'Validés',
  rejected: 'Rejetés',
}

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    let active = true
    async function loadReports() {
      try {
        const data = await getAdminReports()
        if (active) setReports(data)
      } catch {
        if (active) setMessage('Les rapports ne sont pas disponibles.')
      }
    }
    void loadReports()
    return () => { active = false }
  }, [])

  async function review(id, status) {
    const defaultPrompt = status === 'rejected' ? 'Justification du rejet (obligatoire)' : 'Commentaire de validation (facultatif)'
    const comment = window.prompt(defaultPrompt, '')
    if (status === 'rejected' && !comment) {
      setMessage('La justification du rejet est obligatoire.')
      return
    }
    try {
      await reviewReport(id, status, comment || '')
      const data = await getAdminReports()
      setReports(data)
      setMessage('Le rapport a été mis à jour.')
    } catch (error) {
      setMessage(error.message || 'La validation a échoué.')
    }
  }

  const visibleReports = reports.filter((report) => {
    const leaderName = [report.leader?.first_name, report.leader?.last_name].filter(Boolean).join(' ').toLowerCase()
    const missionName = (report.mission?.title || '').toLowerCase()
    const searched = search.trim().toLowerCase()
    const matchesText = !searched || leaderName.includes(searched) || missionName.includes(searched) || (report.mission?.location || '').toLowerCase().includes(searched)
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const dateValue = report.performed_on || report.created_at || ''
    const matchesStart = !startDate || !dateValue || dateValue >= startDate
    const matchesEnd = !endDate || !dateValue || dateValue <= endDate
    return matchesText && matchesStatus && matchesStart && matchesEnd
  })

  return <main className="page-section dashboard-page"><div className="container"><div className="dashboard-heading"><div><span className="eyebrow">Administration</span><h1>Rapports des leaders</h1></div><Link to="/admin" className="button button-outline">Retour</Link></div>{message && <div className="form-notice notice-info">{message}</div>}<div className="admin-panel"><div className="table-toolbar"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{Object.entries(filters).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label className="search-field"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Recherche par leader, mission, quartier…" /></label></div><DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onReset={() => { setStartDate(''); setEndDate('') }} /><div className="list-stack">{visibleReports.map((report) => <article className="list-row" key={report.id}><div><strong>{report.mission?.title || 'Mission'}</strong><small>{report.leader ? [report.leader.first_name, report.leader.last_name].filter(Boolean).join(' ') : 'Leader'} · {report.performed_on || report.created_at} · {report.mission?.location || 'Lieu non précisé'}</small></div><div className="row-actions"><span className={`status-pill status-${report.status}`}>{labels[report.status] || report.status}</span><Link className="button button-outline small-button" to={`/admin/rapports/${report.id}`}>Détail</Link>{report.status !== 'validated' && <button className="button button-primary small-button" type="button" onClick={() => review(report.id, 'validated')}>Valider</button>}{report.status !== 'correction_requested' && <button className="button button-outline small-button" type="button" onClick={() => review(report.id, 'correction_requested')}>Demander correction</button>}{report.status !== 'rejected' && <button className="button button-outline small-button" type="button" onClick={() => review(report.id, 'rejected')}>Rejeter</button>}</div></article>)}{visibleReports.length === 0 && !message && <p className="muted-text">Aucun rapport trouvé pour ce filtre.</p>}</div></div></div></main>
}
