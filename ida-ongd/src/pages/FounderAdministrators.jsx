import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { getAdminMembers, nominateMemberRole } from '../lib/admin'
import RoleBadge from '../components/RoleBadge'
import { normalizeRole } from '../lib/roles'

export default function FounderAdministrators() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    async function loadMembers() {
      try {
        const data = await getAdminMembers()
        if (!active) return
        setMembers(data)
      } catch {
        setMessage('Les informations administrateurs sont indisponibles pour le moment.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadMembers()
    return () => { active = false }
  }, [])

  async function updateRole(memberId, nextRole) {
    const ok = window.confirm('Confirmez-vous ce changement de rôle ?')
    if (!ok) return
    try {
      await nominateMemberRole(memberId, nextRole)
      const refreshed = await getAdminMembers()
      setMembers(refreshed)
      setMessage('Le rôle a bien été mis à jour.')
    } catch {
      setMessage('Seul le fondateur peut effectuer cette action.')
    }
  }

  const administrators = members.filter((member) => ['admin', 'administrator'].includes(normalizeRole(member.role)))
  const candidates = members.filter((member) => normalizeRole(member.role) === 'member')

  return (
    <main className="page-section dashboard-page">
      <div className="container">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Fondateur</span>
            <h1>Gestion des administrateurs</h1>
          </div>
          <Link to="/founder" className="button button-outline">Retour au tableau</Link>
        </div>

        {message && <div className="form-notice notice-info">{message}</div>}

        <div className="admin-layout">
          <section className="admin-panel full-width">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Administrateurs</span>
                <h2>Rôles actuels</h2>
              </div>
              <ShieldCheck size={22} />
            </div>
            {loading ? <p className="muted-text">Chargement…</p> : administrators.length === 0 ? <p className="muted-text">Aucun administrateur n’est actuellement nommé.</p> : <div className="list-stack">{administrators.map((member) => (
              <div key={member.id} className="list-row">
                <div>
                  <strong>{[member.first_name, member.last_name].filter(Boolean).join(' ') || '—'}</strong>
                  <small>{member.email || '—'}</small>
                </div>
                <div className="row-actions">
                  <RoleBadge role={member.role} />
                  <button className="button button-outline small-button" type="button" onClick={() => updateRole(member.id, 'member')}>Retirer le rôle</button>
                </div>
              </div>
            ))}</div>}
          </section>

          <section className="admin-panel full-width">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Membres</span>
                <h2>Nommer un administrateur</h2>
              </div>
              <ShieldCheck size={22} />
            </div>
            {loading ? <p className="muted-text">Chargement…</p> : candidates.length === 0 ? <p className="muted-text">Aucun membre n’est éligible pour être nommé.</p> : <div className="list-stack">{candidates.map((member) => (
              <div key={member.id} className="list-row">
                <div>
                  <strong>{[member.first_name, member.last_name].filter(Boolean).join(' ') || '—'}</strong>
                  <small>{member.email || '—'}</small>
                </div>
                <button className="button button-primary small-button" type="button" onClick={() => updateRole(member.id, 'admin')}>Nommer administrateur</button>
              </div>
            ))}</div>}
          </section>
        </div>
      </div>
    </main>
  )
}
