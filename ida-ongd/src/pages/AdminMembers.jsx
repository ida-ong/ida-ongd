import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import RoleBadge from '../components/RoleBadge'
import { getAdminMembers, nominateMemberRole } from '../lib/admin'
import { useAuth } from '../auth/useAuth'
import { normalizeRole } from '../lib/roles'
import ConfirmDialog from '../components/ConfirmDialog'

export default function AdminMembers() {
  useAuth()
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [geoFilter, setGeoFilter] = useState({ province: '', locality: '', commune: '', quartier: '', road: '', ruralUnit: '', grouping: '', village: '' })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [pendingRoleChange, setPendingRoleChange] = useState(null)

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

  const uniqueOptions = (rows, idField, nameField) => [...new Map(rows.filter((row) => row[idField] && row[nameField]).map((row) => [row[idField], { id: row[idField], name: row[nameField], locality_type: row.geo_locality_type }])).values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  const provinceOptions = useMemo(() => uniqueOptions(members, 'geo_province_id', 'geo_province_name'), [members])
  const provinceMembers = useMemo(() => members.filter((member) => !geoFilter.province || member.geo_province_id === geoFilter.province), [members, geoFilter.province])
  const localityOptions = useMemo(() => uniqueOptions(provinceMembers, 'geo_locality_id', 'geo_locality_name'), [provinceMembers])
  const localityMembers = useMemo(() => provinceMembers.filter((member) => !geoFilter.locality || member.geo_locality_id === geoFilter.locality), [provinceMembers, geoFilter.locality])
  const communeOptions = useMemo(() => uniqueOptions(localityMembers, 'geo_commune_id', 'geo_commune_name'), [localityMembers])
  const communeMembers = useMemo(() => localityMembers.filter((member) => !geoFilter.commune || member.geo_commune_id === geoFilter.commune), [localityMembers, geoFilter.commune])
  const quartierOptions = useMemo(() => uniqueOptions(communeMembers, 'geo_quartier_id', 'geo_quartier_name'), [communeMembers])
  const quartierMembers = useMemo(() => communeMembers.filter((member) => !geoFilter.quartier || member.geo_quartier_id === geoFilter.quartier), [communeMembers, geoFilter.quartier])
  const roadOptions = useMemo(() => uniqueOptions(quartierMembers, 'geo_road_id', 'geo_road_name'), [quartierMembers])
  const ruralUnitOptions = useMemo(() => uniqueOptions(localityMembers, 'geo_rural_unit_id', 'geo_rural_unit_name'), [localityMembers])
  const ruralMembers = useMemo(() => localityMembers.filter((member) => !geoFilter.ruralUnit || member.geo_rural_unit_id === geoFilter.ruralUnit), [localityMembers, geoFilter.ruralUnit])
  const groupingOptions = useMemo(() => uniqueOptions(ruralMembers, 'geo_groupement_id', 'geo_groupement_name'), [ruralMembers])
  const groupingMembers = useMemo(() => ruralMembers.filter((member) => !geoFilter.grouping || member.geo_groupement_id === geoFilter.grouping), [ruralMembers, geoFilter.grouping])
  const villageOptions = useMemo(() => uniqueOptions(groupingMembers, 'geo_village_id', 'geo_village_name'), [groupingMembers])

  const filteredMembers = useMemo(() => members.filter((member) => {
    const term = search.trim().toLowerCase()
    const text = [member.first_name, member.last_name, member.member_number, member.email].filter(Boolean).join(' ').toLowerCase()
    const matchesText = !term || text.includes(term)
    const matchesRole = roleFilter === 'all' || normalizeRole(member.role) === roleFilter
    const matchesGeo = (!geoFilter.province || member.geo_province_id === geoFilter.province)
      && (!geoFilter.locality || member.geo_locality_id === geoFilter.locality)
      && (!geoFilter.commune || member.geo_commune_id === geoFilter.commune)
      && (!geoFilter.quartier || member.geo_quartier_id === geoFilter.quartier)
      && (!geoFilter.road || member.geo_road_id === geoFilter.road)
      && (!geoFilter.ruralUnit || member.geo_rural_unit_id === geoFilter.ruralUnit)
      && (!geoFilter.grouping || member.geo_groupement_id === geoFilter.grouping)
      && (!geoFilter.village || member.geo_village_id === geoFilter.village)
    return matchesText && matchesRole && matchesGeo
  }), [members, geoFilter, roleFilter, search])

  function updateGeoFilter(field, value) {
    setGeoFilter((current) => {
      const next = { ...current, [field]: value }
      const descendants = {
        province: ['locality', 'commune', 'quartier', 'road', 'ruralUnit', 'grouping', 'village'],
        locality: ['commune', 'quartier', 'road', 'ruralUnit', 'grouping', 'village'],
        commune: ['quartier', 'road'],
        quartier: ['road'],
        ruralUnit: ['grouping', 'village'],
        grouping: ['village'],
      }
      descendants[field]?.forEach((child) => { next[child] = '' })
      return next
    })
  }

  const localityIsRural = localityOptions.find((locality) => locality.id === geoFilter.locality)?.locality_type === 'territory'
  const locationLabel = (member) => [
    member.geo_province_name,
    member.geo_locality_name,
    member.geo_commune_name,
    member.geo_quartier_name,
    member.geo_road_name,
    member.geo_rural_unit_name,
    member.geo_groupement_name,
    member.geo_village_name,
  ].filter(Boolean).join(' › ') || member.neighborhood_name || '—'

  async function handleLeaderNomination(memberId, nextRole) {
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

          <select value={geoFilter.province} onChange={(event) => updateGeoFilter('province', event.target.value)}>
            <option value="">Toutes les provinces</option>
            {provinceOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
          <select value={geoFilter.locality} onChange={(event) => updateGeoFilter('locality', event.target.value)} disabled={!provinceMembers.length}>
            <option value="">Toutes les villes / territoires</option>
            {localityOptions.map((item) => <option value={item.id} key={item.id}>{item.name}{item.locality_type === 'territory' ? ' · territoire' : ''}</option>)}
          </select>
          {!localityIsRural && <>
            <select value={geoFilter.commune} onChange={(event) => updateGeoFilter('commune', event.target.value)} disabled={!localityMembers.length}>
              <option value="">Toutes les communes</option>
              {communeOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
            <select value={geoFilter.quartier} onChange={(event) => updateGeoFilter('quartier', event.target.value)} disabled={!communeMembers.length}>
              <option value="">Tous les quartiers</option>
              {quartierOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
            <select value={geoFilter.road} onChange={(event) => updateGeoFilter('road', event.target.value)} disabled={!quartierMembers.length}>
              <option value="">Toutes les avenues / rues</option>
              {roadOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </>}
          {localityIsRural && <>
            <select value={geoFilter.ruralUnit} onChange={(event) => updateGeoFilter('ruralUnit', event.target.value)} disabled={!localityMembers.length}>
              <option value="">Tous les secteurs / chefferies</option>
              {ruralUnitOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
            <select value={geoFilter.grouping} onChange={(event) => updateGeoFilter('grouping', event.target.value)} disabled={!ruralMembers.length}>
              <option value="">Tous les groupements</option>
              {groupingOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
            <select value={geoFilter.village} onChange={(event) => updateGeoFilter('village', event.target.value)} disabled={!groupingMembers.length}>
              <option value="">Tous les villages</option>
              {villageOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </>}
        </section>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Contact</th>
                <th>Localisation</th>
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
                  <td>{locationLabel(member)}</td>
                  <td><RoleBadge role={member.role} /></td>
                  <td>{member.network_count ?? 0}</td>
                  <td>{member.created_at ? new Date(member.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                  <td>
                    {normalizeRole(member.role) === 'leader' ? (
                      <button className="button button-outline small-button" type="button" onClick={() => setPendingRoleChange({ member, role: 'member' })}>Retirer le rôle</button>
                    ) : normalizeRole(member.role) === 'member' && Number(member.network_count) >= 20 ? (
                      <button className="button button-primary small-button" type="button" onClick={() => setPendingRoleChange({ member, role: 'leader' })}>Nommer leader</button>
                    ) : normalizeRole(member.role) === 'member' ? <span>{member.network_count ?? 0}/20 personnes</span> : <span>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ConfirmDialog open={Boolean(pendingRoleChange)} title={pendingRoleChange?.role === 'leader' ? 'Nommer ce leader ?' : 'Retirer le rôle leader ?'} message={pendingRoleChange ? `${[pendingRoleChange.member.first_name, pendingRoleChange.member.last_name].filter(Boolean).join(' ')} — ${pendingRoleChange.role === 'leader' ? 'la nomination sera vérifiée par Supabase' : 'le profil redeviendra membre'}.` : ''} confirmLabel={pendingRoleChange?.role === 'leader' ? 'Nommer leader' : 'Retirer le rôle'} danger={pendingRoleChange?.role === 'member'} onCancel={() => setPendingRoleChange(null)} onConfirm={async () => { const pending = pendingRoleChange; setPendingRoleChange(null); if (pending) await handleLeaderNomination(pending.member.id, pending.role) }} />
      </div>
    </main>
  )
}
