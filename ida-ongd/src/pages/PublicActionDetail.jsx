import { useEffect, useState } from 'react'
import { ArrowLeft, HeartHandshake } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { formatJoinDate } from '../lib/date'
import { getPublicActionById } from '../lib/content'

export default function PublicActionDetail() {
  const { id } = useParams()
  const [state, setState] = useState({ id: null, action: null, loading: true, error: false })

  useEffect(() => {
    let active = true
    getPublicActionById(id)
      .then((action) => { if (active) setState({ id, action, loading: false, error: false }) })
      .catch(() => { if (active) setState({ id, action: null, loading: false, error: true }) })
    return () => { active = false }
  }, [id])

  if (state.loading || state.id !== id) return <main className="page-section inner-page"><div className="container"><p className="content-state" role="status">Chargement de l’action…</p></div></main>
  if (!state.action) return <main className="page-section inner-page"><div className="container"><div className="coming-soon-card"><HeartHandshake size={34} /><h1>{state.error ? 'Action indisponible' : 'Action introuvable'}</h1><p>{state.error ? 'Impossible de charger cette action pour le moment.' : 'Cette action n’est pas publiée ou n’existe plus.'}</p><Link className="button button-primary" to="/actions"><ArrowLeft size={16} /> Retour aux actions</Link></div></div></main>

  const { action } = state
  return <main className="page-section inner-page">
    <article className="container editorial-detail">
      <Link className="network-back-link" to="/actions"><ArrowLeft size={17} /> Toutes les actions</Link>
      <header className="editorial-detail-header"><span className="eyebrow">Action communautaire IDA</span><h1>{action.title}</h1>{action.date_action && <time className="editorial-date" dateTime={action.date_action}>{formatJoinDate(action.date_action)}</time>}</header>
      {action.image_url && <img className="editorial-detail-image" src={action.image_url} alt="" onError={(event) => { event.currentTarget.hidden = true }} />}
      {action.video_url && <video className="editorial-detail-video" src={action.video_url} controls preload="metadata" />}
      <section className="action-detail-summary"><h2>Objectif</h2><p>{action.objective}</p>{action.location && <p><strong>Lieu :</strong> {action.location}</p>}</section>
      <div className="editorial-body">{action.description}</div>
    </article>
  </main>
}
