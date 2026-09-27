import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getReportById, resubmitReport } from '../lib/phase5'

export default function LeaderReportEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    summary: '',
    activitiesDone: '',
    results: '',
    difficulties: '',
    recommendations: '',
    participantsCount: 0,
    performedOn: '',
    observations: '',
    comment: '',
  })
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await getReportById(id)
        if (!active) return
        if (!data) throw new Error('Rapport introuvable')
        setValues({
          summary: data.summary || '',
          activitiesDone: data.activities_done || '',
          results: data.results || '',
          difficulties: data.difficulties || '',
          recommendations: data.recommendations || '',
          participantsCount: data.participants_count ?? 0,
          performedOn: data.performed_on || '',
          observations: data.observations || '',
          comment: data.review_comment || '',
        })
      } catch {
        if (active) setMessage('Ce rapport ne peut pas être modifié dans son état actuel.')
      }
    }
    void load()
    return () => { active = false }
  }, [id])

  function update(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      await resubmitReport(id, values)
      navigate('/leader/rapports')
    } catch (error) {
      setMessage(error.message || 'Le rapport n’a pas pu être renvoyé.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page-section dashboard-page">
      <div className="container">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Espace leader</span>
            <h1>Modifier et renvoyer</h1>
          </div>
          <Link to="/leader/rapports" className="button button-outline">Retour</Link>
        </div>

        {message && <div className="form-notice notice-error">{message}</div>}

        <form className="admin-panel phase5-form" onSubmit={submit}>
          <label>Résumé<textarea required name="summary" value={values.summary} onChange={update} /></label>
          <label>Activités réalisées<textarea required name="activitiesDone" value={values.activitiesDone} onChange={update} /></label>
          <label>Résultats obtenus<textarea required name="results" value={values.results} onChange={update} /></label>
          <div className="form-grid-two">
            <label>Date de réalisation<input required type="date" name="performedOn" value={values.performedOn} onChange={update} /></label>
            <label>Participants<input required min="0" type="number" name="participantsCount" value={values.participantsCount} onChange={update} /></label>
          </div>
          <label>Difficultés<textarea name="difficulties" value={values.difficulties} onChange={update} /></label>
          <label>Recommandations<textarea name="recommendations" value={values.recommendations} onChange={update} /></label>
          <label>Observations<textarea name="observations" value={values.observations} onChange={update} /></label>
          <label>Commentaire administratif<textarea name="comment" value={values.comment} onChange={update} /></label>
          <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Envoi…' : 'Renvoyer le rapport'}</button>
        </form>
      </div>
    </main>
  )
}
