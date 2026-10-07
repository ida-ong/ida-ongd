import { useEffect, useState } from 'react'
import { BellRing } from 'lucide-react'
import SectionTitle from '../components/SectionTitle'
import { formatJoinDate } from '../lib/date'
import { getPublishedContent } from '../lib/content'

const priorityLabels = { normal: 'Information', important: 'À retenir', urgent: 'Urgent' }

export default function Information() {
  const [state, setState] = useState({ items: [], loading: true, error: false })

  useEffect(() => {
    let active = true
    getPublishedContent('information')
      .then((items) => { if (active) setState({ items, loading: false, error: false }) })
      .catch(() => { if (active) setState({ items: [], loading: false, error: true }) })
    return () => { active = false }
  }, [])

  return <main className="page-section inner-page">
    <div className="container">
      <SectionTitle eyebrow="Annonces de l’organisation" title="Informations importantes">Les annonces officielles et informations utiles communiquées par l’équipe de l’ONGD IDA.</SectionTitle>
      {state.loading && <p className="content-state" role="status">Chargement des informations…</p>}
      {state.error && <p className="form-notice notice-info" role="status">Les informations ne sont pas disponibles pour le moment. Réessayez ultérieurement.</p>}
      {!state.loading && !state.error && state.items.length === 0 && <div className="coming-soon-card"><BellRing size={34} /><h2>Aucune annonce pour le moment</h2><p>Les informations publiques paraîtront ici dès leur publication par l’équipe IDA.</p></div>}
      {state.items.length > 0 && <div className="important-list important-list-page">{state.items.map((item) => <article className={`important-card priority-${item.priority}`} key={item.id}><span className="important-priority">{priorityLabels[item.priority] || priorityLabels.normal}</span><div><h2>{item.title}</h2><p>{item.content}</p>{item.image_url && <img className="information-media-image" src={item.image_url} alt="" loading="lazy" />}{item.video_url && <video className="editorial-detail-video" src={item.video_url} controls preload="metadata" />}</div><time dateTime={item.published_at}>{formatJoinDate(item.published_at)}</time></article>)}</div>}
    </div>
  </main>
}
