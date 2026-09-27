import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminReports, reviewReport } from '../lib/phase5'
const labels = { submitted: 'Envoyé', under_review: 'En révision', approved: 'Approuvé', rejected: 'Rejeté', needs_revision: 'À corriger' }
export default function AdminReports() {
	const [reports, setReports] = useState([])
	const [message, setMessage] = useState('')

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
		const comment = window.prompt('Commentaire de validation (facultatif)') || ''
		try {
			await reviewReport(id, status, comment)
			const data = await getAdminReports()
			setReports(data)
			setMessage('Le rapport a été mis à jour.')
		} catch (error) {
			setMessage(error.message || 'La validation a échoué.')
		}
	}

	return <main className="page-section dashboard-page"><div className="container"><div className="dashboard-heading"><div><span className="eyebrow">Administration</span><h1>Rapports des leaders</h1></div><Link to="/admin" className="button button-outline">Retour</Link></div>{message && <div className="form-notice notice-info">{message}</div>}<div className="admin-panel"><div className="list-stack">{reports.map((report) => <article className="list-row" key={report.id}><div><strong>{report.mission?.title || 'Mission'}</strong><small>{report.leader ? [report.leader.first_name, report.leader.last_name].filter(Boolean).join(' ') : 'Leader'} · {report.performed_on}</small></div><div className="row-actions"><span className={`status-pill status-${report.status}`}>{labels[report.status] || report.status}</span>{report.status !== 'approved' && <button className="button button-primary small-button" type="button" onClick={() => review(report.id, 'approved')}>Valider</button>}{report.status !== 'needs_revision' && <button className="button button-outline small-button" type="button" onClick={() => review(report.id, 'needs_revision')}>Demander correction</button>}</div></article>)}{reports.length === 0 && !message && <p className="muted-text">Aucun rapport reçu.</p>}</div></div></div></main>
}
