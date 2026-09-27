import { Activity, Building2, ShieldCheck, Users, Warehouse } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FounderDashboard() {
  return (
    <main className="page-section dashboard-page">
      <div className="container">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Espace fondateur</span>
            <h1>Bienvenue, Prospère MBUYI KAYUMBA</h1>
          </div>
          <span className="role-pill"><ShieldCheck size={16} /> Fondateur</span>
        </div>

        <div className="stats-grid">
          <div className="stats-card"><span className="stats-accent stats-green" /><div><p>Vue générale</p><strong>—</strong></div></div>
          <div className="stats-card"><span className="stats-accent stats-blue" /><div><p>Membres</p><strong>—</strong></div></div>
          <div className="stats-card"><span className="stats-accent stats-gold" /><div><p>Administrateurs</p><strong>—</strong></div></div>
          <div className="stats-card"><span className="stats-accent stats-navy" /><div><p>Leaders</p><strong>—</strong></div></div>
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
            <p className="muted-text">Les réseaux, leaders et statistiques de supervision seront supportés par les tableaux de bord Supabase existants et les futures évolutions.</p>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Missions</span>
                <h2>À venir</h2>
              </div>
              <Activity size={22} />
            </div>
            <p className="muted-text">Ce bloc est réservé aux phases suivantes.</p>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Actualités</span>
                <h2>Informations importantes</h2>
              </div>
              <Building2 size={22} />
            </div>
            <p className="muted-text">La gouvernance et les mises à jour importantes seront présentées ici dans les phases suivantes.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
