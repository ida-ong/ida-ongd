import { Activity, ClipboardList, HandHeart, ShieldCheck, Users, Warehouse } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import StatsCard from '../components/StatsCard'
import { getDashboardStats } from '../lib/phase5'

export default function AdminDashboard() {
  const { role } = useAuth()
  const [stats, setStats] = useState({ totalMembers: 0, leaders: 0, admins: 0, neighborhoods: 0, activeMembers: 0, eligibleMembers: 0, activeMissions: 0, completedMissions: 0, pendingReports: 0, validatedReports: 0, correctionReports: 0, activities: 0, participants: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    async function loadStats() {
      try {
        const data = await getDashboardStats()
        if (!active) return
        setStats(data)
      } catch (error) {
        console.error('[IDA] Impossible de charger les statistiques administratives.', error)
        if (active) setLoadError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadStats()
    return () => { active = false }
  }, [])

  return (
    <main className="page-section dashboard-page">
      <div className="container">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Espace administration</span>
            <h1>Vue générale</h1>
          </div>
          <span className="role-pill"><ShieldCheck size={16} /> {role === 'founder' ? 'Fondateur' : 'Administrateur'}</span>
        </div>

        {loadError && <p className="form-notice notice-error" role="status">Les statistiques ne sont pas disponibles. Vérifiez l’accès Supabase et les migrations appliquées.</p>}
        <div className="stats-grid">
          <StatsCard label="Membres au total" value={loading ? '…' : loadError ? '—' : stats.totalMembers} accent="navy" />
          <StatsCard label="Membres actifs" value={loading ? '…' : loadError ? '—' : stats.activeMembers} accent="green" />
          <StatsCard label="Leaders" value={loading ? '…' : loadError ? '—' : stats.leaders} accent="blue" />
          <StatsCard label="Éligibles (20+)" value={loading ? '…' : loadError ? '—' : stats.eligibleMembers} accent="gold" />
          <StatsCard label="Administrateurs" value={loading ? '…' : loadError ? '—' : stats.admins} accent="gold" />
          <StatsCard label="Quartiers" value={loading ? '…' : loadError ? '—' : stats.neighborhoods} accent="navy" />
          <StatsCard label="Missions en cours" value={loading ? '…' : loadError ? '—' : stats.activeMissions} accent="green" />
          <StatsCard label="Missions terminées" value={loading ? '…' : loadError ? '—' : stats.completedMissions} accent="blue" />
          <StatsCard label="Rapports en attente" value={loading ? '…' : loadError ? '—' : stats.pendingReports} accent="gold" />
          <StatsCard label="Rapports validés" value={loading ? '…' : loadError ? '—' : stats.validatedReports} accent="green" />
          <StatsCard label="Rapports à corriger" value={loading ? '…' : loadError ? '—' : stats.correctionReports} accent="navy" />
          <StatsCard label="Activités" value={loading ? '…' : loadError ? '—' : stats.activities} accent="blue" />
          <StatsCard label="Participants" value={loading ? '…' : loadError ? '—' : stats.participants} accent="gold" />
        </div>

        <div className="admin-layout">
          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Membres</span>
                <h2>Liste et suivi</h2>
              </div>
              <Users size={22} />
            </div>
            <p className="lead">Gérer les profils, les rôles et la progression communautaire.</p>
            <div className="panel-actions">
              <Link to="/admin/membres" className="button button-primary">Voir les membres</Link>
              <Link to="/admin/eligibles" className="button button-outline">Voir les éligibles</Link>
            </div>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Leaders</span>
                <h2>Nomination</h2>
              </div>
              <ShieldCheck size={22} />
            </div>
            <p className="muted-text">La nomination d’un leader est réservée aux administrateurs autorisés et ne se fait pas automatiquement.</p>
          </section>

          <section className="admin-panel full-width">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Réseaux</span>
                <h2>Suivi et éligibilité</h2>
              </div>
              <Warehouse size={22} />
            </div>
            <p className="muted-text">Les statistiques sont calculées à partir des données Supabase. La nomination ou la progression ne modifie pas automatiquement le rôle.</p>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Missions</span>
                <h2>Gestion et suivi</h2>
              </div>
              <ClipboardList size={22} />
            </div>
            <p className="muted-text">Créer, assigner et suivre les missions destinées aux leaders communautaires.</p>
            <Link to="/admin/missions" className="button button-primary">Gérer les missions</Link>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Actualités</span>
                <h2>Publications et rapports</h2>
              </div>
              <Activity size={22} />
            </div>
            <p className="muted-text">Modérer les actualités, actions publiques, informations importantes et rapports des leaders.</p>
            <div className="panel-actions"><Link to="/admin/actualites" className="button button-outline">Actualités</Link><Link to="/admin/actions" className="button button-outline">Actions</Link><Link to="/admin/informations" className="button button-outline">Informations</Link><Link to="/admin/rapports" className="button button-primary">Rapports</Link></div>
          </section>

          <section className="admin-panel">
            <div className="panel-header">
              <div><span className="eyebrow">Soutien à la mission</span><h2>Gestion des dons</h2></div>
              <HandHeart size={22} />
            </div>
            <p className="muted-text">Les statistiques et transactions resteront indisponibles jusqu’à la configuration d’un paiement réel et la vérification du schéma Supabase.</p>
            <Link to="/admin/dons" className="button button-outline">État du registre des dons</Link>
          </section>
        </div>
      </div>
    </main>
  )
}
