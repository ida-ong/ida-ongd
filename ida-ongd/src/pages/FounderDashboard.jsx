import { Activity, Building2, ShieldCheck, Users, Warehouse } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getDashboardStats } from '../lib/phase5'
import { useAuth } from '../auth/useAuth'

export default function FounderDashboard() {
  const { profile } = useAuth()
  const founderName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Fondateur'
  const [stats, setStats] = useState({ totalMembers: 0, leaders: 0, admins: 0, neighborhoods: 0, activeMembers: 0, activeMissions: 0, completedMissions: 0, pendingReports: 0, validatedReports: 0, correctionReports: 0, activities: 0, participants: 0 })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await getDashboardStats()
        if (active) setStats(data)
      } catch {
        if (active) setStats((current) => current)
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
            <span className="eyebrow">Espace fondateur</span>
            <h1>Bienvenue, {founderName}</h1>
          </div>
          <span className="role-pill"><ShieldCheck size={16} /> Fondateur</span>
        </div>

        <div className="stats-grid">
          <div className="stats-card"><span className="stats-accent stats-green" /><div><p>Membres</p><strong>{stats.totalMembers}</strong></div></div>
          <div className="stats-card"><span className="stats-accent stats-blue" /><div><p>Leaders</p><strong>{stats.leaders}</strong></div></div>
          <div className="stats-card"><span className="stats-accent stats-gold" /><div><p>Administrateurs</p><strong>{stats.admins}</strong></div></div>
          <div className="stats-card"><span className="stats-accent stats-navy" /><div><p>Quartiers</p><strong>{stats.neighborhoods}</strong></div></div>
          <div className="stats-card"><span className="stats-accent stats-green" /><div><p>Missions</p><strong>{stats.activeMissions}</strong></div></div>
          <div className="stats-card"><span className="stats-accent stats-blue" /><div><p>Rapports validés</p><strong>{stats.validatedReports}</strong></div></div>
        </div>

        <div className="admin-layout">
          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Membres</span>
                <h2>Vue d’ensemble</h2>
              </div>
              <Users size={22} />
            </div>
            <p className="lead">Le fondateur supervise l’organisation et la gouvernance de l’ONGD IDA.</p>
            <div className="panel-actions">
              <Link to="/admin/membres" className="button button-primary">Voir les membres</Link>
              <Link to="/founder/administrateurs" className="button button-outline">Gérer les admins</Link>
            </div>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Administrateurs</span>
                <h2>Protection du rôle</h2>
              </div>
              <ShieldCheck size={22} />
            </div>
            <p className="muted-text">Le rôle fondateur est protégé. Seul le fondateur peut gérer les administrateurs et les promotions de rôle sensibles.</p>
          </section>

          <section className="admin-panel full-width">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Réseaux</span>
                <h2>Supervision</h2>
              </div>
              <Warehouse size={22} />
            </div>
            <p className="muted-text">Les données de supervision sont consultables dans les espaces d’administration protégés selon les permissions du fondateur.</p>
            <div className="panel-actions"><Link to="/admin/membres" className="button button-outline">Membres et leaders</Link><Link to="/admin/eligibles" className="button button-outline">Éligibilité des leaders</Link></div>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Missions</span>
                <h2>Missions et rapports</h2>
              </div>
              <Activity size={22} />
            </div>
            <p className="muted-text">Superviser l’attribution des missions, les activités transmises et la validation des rapports.</p>
            <div className="panel-actions"><Link to="/admin/missions" className="button button-outline">Missions</Link><Link to="/admin/rapports" className="button button-outline">Rapports</Link></div>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Actualités</span>
                <h2>Publications et dons</h2>
              </div>
              <Building2 size={22} />
            </div>
            <p className="muted-text">Superviser les actualités, actions, annonces et l’état de configuration du registre des dons.</p>
            <div className="panel-actions"><Link to="/admin/actualites" className="button button-outline">Actualités</Link><Link to="/admin/actions" className="button button-outline">Actions</Link><Link to="/admin/informations" className="button button-outline">Informations</Link><Link to="/admin/dons" className="button button-primary">État des dons</Link></div>
          </section>
        </div>
      </div>
    </main>
  )
}
