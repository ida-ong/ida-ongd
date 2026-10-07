import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { getAdminMembers, nominateMemberRole, roleMutationErrorMessage } from '../lib/admin'
import RoleBadge from '../components/RoleBadge'
import { normalizeRole } from '../lib/roles'
import ConfirmDialog from '../components/ConfirmDialog'

export default function FounderAdministrators() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyMemberId, setBusyMemberId] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [pendingRoleChange, setPendingRoleChange] = useState(null)

  useEffect(() => {
    let active = true
    async function loadMembers() {
      try {
        const data = await getAdminMembers()
        if (!active) return
        setMembers(data)
      } catch (error) {
        console.error('[IDA] Lecture des profils pour la gestion des administrateurs échouée.', error)
        setMessage({ type: 'error', text: roleMutationErrorMessage(error) })
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadMembers()
    return () => { active = false }
  }, [])

  async function updateRole(memberId, nextRole) {
    if (busyMemberId) return
    setBusyMemberId(memberId)
    setMessage({ type: '', text: '' })
    try {
      await nominateMemberRole(memberId, nextRole)
      setMessage({ type: 'success', text: nextRole === 'admin' ? 'Le rôle administrateur a été enregistré dans Supabase. Le compte concerné récupérera ses permissions à sa prochaine actualisation de profil.' : 'Le rôle administrateur a été retiré.' })
      try {
        const refreshed = await getAdminMembers()
        setMembers(refreshed)
      } catch (error) {
        setMessage({ type: 'info', text: `Le changement de rôle est enregistré, mais la liste n’a pas pu être actualisée : ${roleMutationErrorMessage(error)}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: roleMutationErrorMessage(error) })
    } finally {
      setBusyMemberId('')
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

        {message.text && <div className={`form-notice notice-${message.type || 'info'}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</div>}

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
                  <button className="button button-outline small-button" type="button" disabled={Boolean(busyMemberId)} onClick={() => setPendingRoleChange({ member, role: 'member' })}>{busyMemberId === member.id ? 'Mise à jour…' : 'Retirer le rôle'}</button>
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
                <button className="button button-primary small-button" type="button" disabled={Boolean(busyMemberId)} onClick={() => setPendingRoleChange({ member, role: 'admin' })}>{busyMemberId === member.id ? 'Mise à jour…' : 'Nommer administrateur'}</button>
              </div>
            ))}</div>}
          </section>
        </div>
        <ConfirmDialog open={Boolean(pendingRoleChange)} title={pendingRoleChange?.role === 'admin' ? 'Nommer administrateur ?' : 'Retirer le rôle administrateur ?'} message={pendingRoleChange ? `${[pendingRoleChange.member.first_name, pendingRoleChange.member.last_name].filter(Boolean).join(' ')} sera ${pendingRoleChange.role === 'admin' ? 'nommé administrateur' : 'rétabli au rôle membre'}. Cette modification sera enregistrée dans le journal d’administration.` : ''} confirmLabel={pendingRoleChange?.role === 'admin' ? 'Nommer administrateur' : 'Retirer le rôle'} danger={pendingRoleChange?.role === 'member'} onCancel={() => setPendingRoleChange(null)} onConfirm={async () => { const pending = pendingRoleChange; setPendingRoleChange(null); if (pending) await updateRole(pending.member.id, pending.role) }} />
      </div>
    </main>
  )
}
