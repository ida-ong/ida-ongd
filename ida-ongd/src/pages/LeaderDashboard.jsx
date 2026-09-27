import { Activity, BarChart3, Users, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import StatsCard from '../components/StatsCard'

export default function LeaderDashboard() {
  const { profile } = useAuth()

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
          <StatsCard label="Mon réseau" value="—" />
          <StatsCard label="Membres directs" value="—" />
          <StatsCard label="Quartier" value={profile?.neighborhood_id ? 'Enregistré' : 'À compléter'} />
          <StatsCard label="Progression" value="—" />
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
                <h2>À venir</h2>
              </div>
              <Activity size={22} />
            </div>
            <p className="muted-text">Consultez vos missions, enregistrez les activités réalisées et transmettez vos rapports.</p>
            <div className="panel-actions"><Link to="/leader/missions" className="button button-primary">Mes missions</Link><Link to="/leader/activites" className="button button-outline">Mes activités</Link><Link to="/leader/rapports" className="button button-outline">Mes rapports</Link></div>
          </section>

          <section className="admin-panel full-width">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Suivi</span>
                <h2>Mon réseau</h2>
              </div>
              <BarChart3 size={22} />
            </div>
            <p className="muted-text">Le nombre total de personnes, les membres directs et le quartier seront alimentés à partir des données Supabase existantes une fois les politiques et les données disponibles.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
