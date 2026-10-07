import { useEffect, useState } from 'react'
import { ArrowRight, BellRing } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatJoinDate } from '../lib/date'
import { getPublishedContent } from '../lib/content'

const priorityLabels = { normal: 'Information', important: 'À retenir', urgent: 'Urgent' }

export default function ImportantInformationPreview() {
  const [state, setState] = useState({ items: [], loading: true, error: false })

  useEffect(() => {
    let active = true
    getPublishedContent('information', { limit: 3 })
      .then((items) => { if (active) setState({ items, loading: false, error: false }) })
      .catch(() => { if (active) setState({ items: [], loading: false, error: true }) })
    return () => { active = false }
  }, [])

  return <section className="important-section page-section">
    <div className="container">
      <div className="important-section-heading"><div><span className="eyebrow"><BellRing size={15} /> Informations de l’organisation</span><h2>Informations importantes</h2><p>Les annonces et informations utiles partagées par l’équipe IDA.</p></div><Link className="button button-outline" to="/informations">Toutes les informations <ArrowRight size={16} /></Link></div>
      {state.loading && <p className="content-state" role="status">Chargement des informations…</p>}
      {state.error && <p className="muted-text" role="status">Les informations ne sont pas disponibles pour le moment.</p>}
      {!state.loading && !state.error && state.items.length === 0 && <p className="content-state">Aucune information importante n’a été publiée récemment.</p>}
      {state.items.length > 0 && <div className="important-list">{state.items.map((item) => <article className={`important-card priority-${item.priority}`} key={item.id}>
        <span className="important-priority">{priorityLabels[item.priority] || priorityLabels.normal}</span>
        <div><h3>{item.title}</h3><p>{item.content}</p>{item.image_url && <img className="information-media-image" src={item.image_url} alt="" loading="lazy" />}{item.video_url && <video className="information-media-video" src={item.video_url} controls preload="metadata" />}</div>
        <time dateTime={item.published_at}>{formatJoinDate(item.published_at)}</time>
      </article>)}</div>}
    </div>
  </section>
}
