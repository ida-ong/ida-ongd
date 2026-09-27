import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { getEligibleMembers, nominateMemberRole } from '../lib/admin'

export default function AdminEligible() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    async function loadEligible() {
      try {
        const data = await getEligibleMembers()
        if (!active) return
        setMembers(data)
      } catch {
        setMessage('Les membres éligibles ne sont pas actuellement disponibles.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadEligible()
    return () => { active = false }
  }, [])

  async function nominateLeader(memberId) {
    const ok = window.confirm('Nommer ce membre comme leader communautaire ?')
    if (!ok) return
    try {
      await nominateMemberRole(memberId, 'leader')
      setMessage('Le membre a bien été nommé leader.')
      const refreshed = await getEligibleMembers()
      setMembers(refreshed)
    } catch {
      setMessage('La nomination est refusée par les règles de sécurité Supabase.')
    }
  }

  return (
    <main className="page-section dashboard-page">
      <div className="container">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Administration</span>
            <h1>Membres éligibles</h1>
          </div>
          <Link to="/admin" className="button button-outline">Retour au tableau</Link>
        </div>

        {message && <div className="form-notice notice-info">{message}</div>}

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Numéro</th>
                <th>Quartier</th>
                <th>Réseau</th>
                <th>Inscription</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="table-empty">Chargement…</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan="7" className="table-empty">Aucun membre n’est actuellement éligible.</td></tr>
              ) : members.map((member) => (
                <tr key={member.id}>
                  <td>{[member.first_name, member.last_name].filter(Boolean).join(' ') || '—'}</td>
                  <td>{member.member_number || '—'}</td>
                  <td>{member.neighborhood_name || '—'}</td>
                  <td>{member.network_count ?? 0}</td>
                  <td>{member.created_at ? new Date(member.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                  <td><span className="status-pill status-ready">Éligible</span></td>
                  <td>
                    <button type="button" className="button button-primary small-button" onClick={() => nominateLeader(member.id)}>
                      <CheckCircle2 size={15} /> Nommer leader
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
