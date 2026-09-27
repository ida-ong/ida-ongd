import { Activity, BarChart3, Users, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import StatsCard from '../components/StatsCard'
import { getLeaderDashboardSummary } from '../lib/phase5'

export default function LeaderDashboard() {
  const { profile } = useAuth()
  const [summary, setSummary] = useState({ missionsInProgress: 0, missionsCompleted: 0, reportsToFix: 0, reportsValidated: 0, activitiesCount: 0 })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await getLeaderDashboardSummary()
        if (active) setSummary(data)
      } catch {
        if (active) setSummary({ missionsInProgress: 0, missionsCompleted: 0, reportsToFix: 0, reportsValidated: 0, activitiesCount: 0 })
      }
    }
    void load()
    return () => { active = false }
  }, [])

  return (
    <main className="page-section dashboard-page">
      <div className="container">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Espace leader</span>
            <h1>Tableau de bord du leader</h1>
          </div>
          <span className="role-pill"><ShieldCheck size={16} /> Leader</span>
        </div>

        <div className="stats-grid">
          <StatsCard label="Missions en cours" value={summary.missionsInProgress} />
          <StatsCard label="Missions terminées" value={summary.missionsCompleted} accent="green" />
          <StatsCard label="Rapports à corriger" value={summary.reportsToFix} accent="gold" />
          <StatsCard label="Rapports validés" value={summary.reportsValidated} accent="blue" />
          <StatsCard label="Activités" value={summary.activitiesCount} accent="navy" />
          <StatsCard label="Quartier" value={profile?.neighborhood_id ? 'Enregistré' : 'À compléter'} accent="green" />
        </div>

        <div className="admin-layout">
          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Mon groupe communautaire</span>
                <h2>Présentation</h2>
              </div>
              <Users size={22} />
            </div>
            <p className="lead">Le leader organise, mobilise et coordonne son groupe communautaire selon les missions et orientations de l’ONGD IDA.</p>
            <ul className="feature-list">
              <li>Organiser des réunions communautaires</li>
              <li>Participer à la sensibilisation</li>
              <li>Mobiliser son groupe</li>
              <li>Transmettre des informations</li>
              <li>Recevoir des missions de l’administration</li>
              <li>Produire des rapports</li>
            </ul>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Activités</span>
                <h2>À faire</h2>
              </div>
              <Activity size={22} />
            </div>
            <p className="muted-text">Consultez vos missions, enregistrez les activités réalisées et transmettez vos rapports.</p>
            <div className="panel-actions"><Link to="/leader/missions" className="button button-primary">Mes missions</Link><Link to="/leader/activites" className="button button-outline">Mes activités</Link><Link to="/leader/rapports" className="button button-outline">Mes rapports</Link></div>
            {summary.reportsToFix > 0 && <p className="form-notice notice-info">{summary.reportsToFix} rapport(s) nécessitent votre attention.</p>}
          </section>

          <section className="admin-panel full-width">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Suivi</span>
                <h2>Mon réseau</h2>
              </div>
              <BarChart3 size={22} />
            </div>
            <p className="muted-text">Les informations de supervision s’alimentent directement depuis les données Supabase selon les permissions du leader.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
