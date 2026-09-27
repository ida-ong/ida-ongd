import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ACTIVITY_TYPES, createActivity, getLeaderActivities, getLeaderMissions, listNeighborhoods } from '../lib/phase5'

const initial = { title: '', activityType: 'meeting', description: '', activityDate: '', location: '', neighborhoodId: '', participantsCount: 0, missionId: '' }
export default function LeaderActivities() {
  const [values, setValues] = useState(initial); const [activities, setActivities] = useState([]); const [missions, setMissions] = useState([]); const [neighborhoods, setNeighborhoods] = useState([]); const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false)
  async function load() { const [a, m, n] = await Promise.all([getLeaderActivities(), getLeaderMissions(), listNeighborhoods()]); setActivities(a); setMissions(m.filter((item) => item.status !== 'cancelled')); setNeighborhoods(n) }
  useEffect(() => {
    let active = true
    async function loadActivities() {
      try {
        const [activityData, missionData, neighborhoodData] = await Promise.all([getLeaderActivities(), getLeaderMissions(), listNeighborhoods()])
        if (!active) return
        setActivities(activityData)
        setMissions(missionData.filter((item) => item.status !== 'cancelled'))
        setNeighborhoods(neighborhoodData)
      } catch {
        if (active) setMessage('Les activités ne sont pas disponibles.')
      }
    }
    void loadActivities()
    return () => { active = false }
  }, [])
  function update(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })) }
  async function submit(event) { event.preventDefault(); setSaving(true); try { await createActivity(values); setValues(initial); await load(); setMessage('Activité enregistrée.') } catch (error) { setMessage(error.message || 'L’activité n’a pas pu être enregistrée.') } finally { setSaving(false) } }
  return <main className="page-section dashboard-page"><div className="container"><div className="dashboard-heading"><div><span className="eyebrow">Espace leader</span><h1>Activités communautaires</h1></div><Link to="/leader" className="button button-outline">Retour</Link></div>{message && <div className="form-notice notice-info">{message}</div>}<div className="admin-layout"><section className="admin-panel"><span className="eyebrow">Nouvelle activité</span><h2>Enregistrer une activité</h2><form className="phase5-form" onSubmit={submit}><label>Titre<input required name="title" value={values.title} onChange={update} /></label><label>Type<select name="activityType" value={values.activityType} onChange={update}>{ACTIVITY_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Description<textarea required name="description" value={values.description} onChange={update} /></label><div className="form-grid-two"><label>Date<input required type="date" name="activityDate" value={values.activityDate} onChange={update} /></label><label>Participants<input required min="0" type="number" name="participantsCount" value={values.participantsCount} onChange={update} /></label></div><label>Lieu<input name="location" value={values.location} onChange={update} /></label><label>Quartier<select name="neighborhoodId" value={values.neighborhoodId} onChange={update}><option value="">Non précisé</option>{neighborhoods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Mission associée<select name="missionId" value={values.missionId} onChange={update}><option value="">Aucune</option>{missions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><button className="button button-primary" disabled={saving} type="submit">{saving ? 'Enregistrement…' : 'Enregistrer l’activité'}</button></form></section><section className="admin-panel"><span className="eyebrow">Historique</span><h2>Mes activités</h2><div className="list-stack">{activities.map((activity) => <div className="list-row" key={activity.id}><div><strong>{activity.title}</strong><small>{activity.activity_date} · {activity.participants_count} participant(s)</small></div><span className="status-pill status-ready">Enregistrée</span></div>)}{activities.length === 0 && <p className="muted-text">Aucune activité enregistrée.</p>}</div></section></div></div></main>
}
