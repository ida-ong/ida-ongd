import { useEffect, useState } from 'react'
import { ArrowRight, HeartHandshake } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionTitle from '../components/SectionTitle'
import { formatJoinDate } from '../lib/date'
import { getPublishedContent } from '../lib/content'
import { useAuth } from '../auth/useAuth'
import { getDefaultRouteForRole } from '../lib/roles'

export default function Activities() {
  const { user, role, registrationPending } = useAuth()
  const memberRoute = user ? getDefaultRouteForRole(role) : registrationPending ? '/connexion' : '/inscription'
  const [state, setState] = useState({ items: [], loading: true, error: false })

  useEffect(() => {
    let active = true
    getPublishedContent('actions')
      .then((items) => { if (active) setState({ items, loading: false, error: false }) })
      .catch(() => { if (active) setState({ items: [], loading: false, error: true }) })
    return () => { active = false }
  }, [])

  return <main className="page-section inner-page"><div className="container">
    <SectionTitle eyebrow="Agir ensemble" title="Nos actions">Nos actions s’inscrivent dans la protection de l’enfant, l’éducation, l’autonomisation des jeunes filles et le soutien aux communautés vulnérables. Chaque publication décrit les informations communiquées par IDA.</SectionTitle>
    {state.loading && <p className="content-state" role="status">Chargement des actions…</p>}
    {state.error && <p className="form-notice notice-info" role="status">Les actions ne sont pas disponibles pour le moment. Réessayez ultérieurement.</p>}
    {!state.loading && !state.error && state.items.length === 0 && <div className="coming-soon-card"><HeartHandshake size={36} /><h2>Activités en préparation</h2><p>Les actions publiques seront présentées ici au fur et à mesure de leur organisation. Pour participer à la mobilisation communautaire, vous pouvez rejoindre IDA.</p><Link className="button button-primary" to={memberRoute}>{user ? 'Accéder à mon espace' : registrationPending ? 'Confirmer mon compte' : 'Devenir membre'} <ArrowRight size={16} /></Link></div>}
    {state.items.length > 0 && <div className="editorial-grid">{state.items.map((action) => <article className="editorial-card" key={action.id}>
      {action.image_url ? <img className="editorial-image" src={action.image_url} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true }} /> : <div className="editorial-image editorial-image-placeholder"><HeartHandshake size={34} aria-hidden="true" /></div>}
      <div className="editorial-card-content"><time className="editorial-date" dateTime={action.date_action || action.published_at}>{formatJoinDate(action.date_action || action.published_at)}</time><h2>{action.title}</h2><p>{action.description}</p>{action.location && <p className="editorial-meta"><strong>Lieu :</strong> {action.location}</p>}<Link className="button button-outline" to={`/actions/${action.id}`}>Découvrir l’action <ArrowRight size={16} /></Link></div>
    </article>)}</div>}
  </div></main>
}