import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getDefaultRouteForRole } from '../lib/roles'
import { useAuth } from '../auth/useAuth'

export default function AccessDenied({ requiredRoles = [], currentRole }) {
  const navigate = useNavigate()
  const { role } = useAuth()
  const effectiveRole = currentRole ?? role

  return (
    <main className="page-section access-denied-page">
      <div className="container">
        <div className="access-denied-card">
          <span className="access-denied-icon"><ShieldAlert size={28} /></span>
          <span className="eyebrow">Accès refusé</span>
          <h1>Vous n’avez pas les permissions nécessaires.</h1>
          <p>
            {requiredRoles.length
              ? `Cette page est réservée aux rôles : ${requiredRoles.join(', ')}.`
              : 'Cette section est protégée.'}
          </p>
          <button type="button" className="button button-primary" onClick={() => navigate(getDefaultRouteForRole(effectiveRole))}>
            Revenir à mon espace
          </button>
        </div>
      </div>
    </main>
  )
}
