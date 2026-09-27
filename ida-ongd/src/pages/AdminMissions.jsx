import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createMission, getAdminMissions, listLeaders, listNeighborhoods } from '../lib/phase5'

const initial = { title: '', description: '', objective: '', location: '', scheduledDate: '', scheduledTime: '', deadline: '', leaderId: '', neighborhoodId: '' }
const statusLabels = { pending: 'En attente', assigned: 'Assignée', in_progress: 'En cours', completed: 'Réalisée', cancelled: 'Annulée' }

export default function AdminMissions() {
  const [missions, setMissions] = useState([])
  const [leaders, setLeaders] = useState([])
  const [neighborhoods, setNeighborhoods] = useState([])
  const [values, setValues] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    const [missionData, leaderData, neighborhoodData] = await Promise.all([getAdminMissions(), listLeaders(), listNeighborhoods()])
    setMissions(missionData)
    setLeaders(leaderData)
    setNeighborhoods(neighborhoodData)
  }

  useEffect(() => {
    let active = true
    async function loadMissions() {
      try {
        const [missionData, leaderData, neighborhoodData] = await Promise.all([getAdminMissions(), listLeaders(), listNeighborhoods()])
        if (!active) return
        setMissions(missionData)
        setLeaders(leaderData)
        setNeighborhoods(neighborhoodData)
      } catch {
        if (active) setMessage('Les données des missions sont indisponibles.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadMissions()
    return () => { active = false }
  }, [])

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await createMission(values)
      setValues(initial)
      await load()
      setMessage('Mission créée et assignée au leader sélectionné.')
    } catch (error) {
      setMessage(error.message || 'La mission n’a pas pu être créée.')
    } finally {
      setSaving(false)
    }
  }

  return <main className="page-section dashboard-page"><div className="container">
    <div className="dashboard-heading"><div><span className="eyebrow">Administration</span><h1>Missions communautaires</h1></div><Link to="/admin" className="button button-outline">Retour au tableau</Link></div>
    {message && <div className="form-notice notice-info">{message}</div>}
    <div className="admin-layout">
      <section className="admin-panel">
        <span className="eyebrow">Nouvelle mission</span><h2>Créer une mission</h2>
        <form className="phase5-form" onSubmit={submit}>
          <label>Titre<input required name="title" value={values.title} onChange={update} /></label>
          <label>Description<textarea required name="description" value={values.description} onChange={update} /></label>
          <label>Objectif<textarea required name="objective" value={values.objective} onChange={update} /></label>
          <div className="form-grid-two"><label>Lieu<input name="location" value={values.location} onChange={update} /></label><label>Quartier<select name="neighborhoodId" value={values.neighborhoodId} onChange={update}><option value="">Non précisé</option>{neighborhoods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
          <div className="form-grid-two"><label>Date prévue<input type="date" name="scheduledDate" value={values.scheduledDate} onChange={update} /></label><label>Heure<input type="time" name="scheduledTime" value={values.scheduledTime} onChange={update} /></label></div>
          <label>Date limite<input type="date" name="deadline" value={values.deadline} onChange={update} /></label>
          <label>Leader assigné<select required name="leaderId" value={values.leaderId} onChange={update}><option value="">Sélectionner un leader</option>{leaders.map((leader) => <option key={leader.id} value={leader.id}>{[leader.first_name, leader.last_name].filter(Boolean).join(' ')} {leader.member_number ? `(${leader.member_number})` : ''}</option>)}</select></label>
          <button className="button button-primary" type="submit" disabled={saving || leaders.length === 0}>{saving ? 'Création…' : 'Créer la mission'}</button>
        </form>
      </section>
      <section className="admin-panel"><span className="eyebrow">Suivi</span><h2>Missions créées</h2>{loading ? <p className="muted-text">Chargement…</p> : <div className="list-stack">{missions.map((mission) => <article className="list-row" key={mission.id}><div><strong>{mission.title}</strong><small>{mission.leader ? [mission.leader.first_name, mission.leader.last_name].filter(Boolean).join(' ') : 'Leader non assigné'}</small></div><span className={`status-pill status-${mission.status}`}>{statusLabels[mission.status] || mission.status}</span></article>)}{missions.length === 0 && <p className="muted-text">Aucune mission.</p>}</div>}</section>
    </div>
  </div></main>
}
