import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import RoleBadge from '../components/RoleBadge'
import { getAdminMembers, nominateMemberRole } from '../lib/admin'
import { useAuth } from '../auth/useAuth'
import { normalizeRole } from '../lib/roles'

export default function AdminMembers() {
  useAuth()
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all')
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
        setMessage('Les données des membres ne sont pas actuellement accessibles.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadMembers()
    return () => { active = false }
  }, [])

  const neighborhoodOptions = useMemo(() => [...new Set(members.map((member) => member.neighborhood_name).filter(Boolean))], [members])

  const filteredMembers = useMemo(() => members.filter((member) => {
    const term = search.trim().toLowerCase()
    const text = [member.first_name, member.last_name, member.member_number, member.email].filter(Boolean).join(' ').toLowerCase()
    const matchesText = !term || text.includes(term)
    const matchesRole = roleFilter === 'all' || normalizeRole(member.role) === roleFilter
    const matchesNeighborhood = neighborhoodFilter === 'all' || member.neighborhood_name === neighborhoodFilter
    return matchesText && matchesRole && matchesNeighborhood
  }), [members, neighborhoodFilter, roleFilter, search])

  async function handleLeaderNomination(memberId, nextRole) {
    const ok = window.confirm('Confirmez-vous ce changement de rôle ?')
    if (!ok) return
    try {
      await nominateMemberRole(memberId, nextRole)
      const refreshed = await getAdminMembers()
      setMembers(refreshed)
      setMessage('Le rôle a bien été mis à jour.')
    } catch {
      setMessage('Le changement de rôle est refusé par les règles de sécurité Supabase.')
    }
  }

  return (
    <main className="page-section dashboard-page">
      <div className="container">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Administration</span>
            <h1>Membres</h1>
          </div>
          <Link to="/admin" className="button button-outline">Retour au tableau</Link>
        </div>

        {message && <div className="form-notice notice-info">{message}</div>}

        <section className="table-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Recherche par nom ou numéro" />
          </label>

          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">Tous les rôles</option>
            <option value="member">Membre</option>
            <option value="leader">Leader</option>
            <option value="admin">Admin</option>
            <option value="founder">Fondateur</option>
          </select>

          <select value={neighborhoodFilter} onChange={(event) => setNeighborhoodFilter(event.target.value)}>
            <option value="all">Tous les quartiers</option>
            {neighborhoodOptions.map((neighborhood) => (
              <option value={neighborhood} key={neighborhood}>{neighborhood}</option>
            ))}
          </select>
        </section>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Contact</th>
                <th>Quartier</th>
                <th>Rôle</th>
                <th>Réseau</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="table-empty">Chargement…</td></tr>
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan="7" className="table-empty">Aucun membre ne correspond à ces critères.</td></tr>
              ) : filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{[member.first_name, member.last_name].filter(Boolean).join(' ') || '—'}</strong>
                    <small>{member.member_number || '—'}</small>
                  </td>
                  <td>
                    <span>{member.email || '—'}</span>
                    <small>{member.whatsapp || '—'}</small>
                  </td>
                  <td>{member.neighborhood_name || '—'}</td>
                  <td><RoleBadge role={member.role} /></td>
                  <td>{member.network_count ?? 0}</td>
                  <td>{member.created_at ? new Date(member.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                  <td>
                    {normalizeRole(member.role) === 'leader' ? (
                      <button className="button button-outline small-button" type="button" onClick={() => handleLeaderNomination(member.id, 'member')}>Retirer le rôle</button>
                    ) : (
                      <button className="button button-primary small-button" type="button" onClick={() => handleLeaderNomination(member.id, 'leader')}>Nommer leader</button>
                    )}
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
