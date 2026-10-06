import { useEffect, useState } from 'react'
import { ArrowRight, Newspaper } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionTitle from './SectionTitle'
import { formatJoinDate } from '../lib/date'
import { getPublishedContent } from '../lib/content'

function usePreview(type) {
  const [state, setState] = useState({ items: [], loading: true, error: false })

  useEffect(() => {
    let active = true
    getPublishedContent(type, { limit: 3 })
      .then((items) => { if (active) setState({ items, loading: false, error: false }) })
      .catch(() => { if (active) setState({ items: [], loading: false, error: true }) })
    return () => { active = false }
  }, [type])

  return state
}

function PreviewCards({ type, state }) {
  const isNews = type === 'news'
  const path = isNews ? '/actualites' : '/actions'
  const label = isNews ? 'Actualité publiée' : 'Publication d’action'
  const Icon = isNews ? Newspaper : ArrowRight

  if (state.loading) return <p className="content-state" role="status">Chargement…</p>
  if (state.error) return <p className="muted-text" role="status">Ces contenus ne sont pas disponibles pour le moment.</p>
  if (!state.items.length) return <p className="content-state">Aucune publication disponible pour le moment.</p>

  return <div className="editorial-grid">
    {state.items.map((item) => <article className="editorial-card home-preview-card" key={item.id}>
      {item.image_url ? <img className="editorial-image" src={item.image_url} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true }} /> : <div className="editorial-image editorial-image-placeholder"><Icon size={32} aria-hidden="true" /></div>}
      <div className="editorial-card-content">
        <span className="editorial-date">{label}{(item.published_at || item.date_action) && ` · ${formatJoinDate(item.published_at || item.date_action)}`}</span>
        {item.category && <span className="editorial-category">{item.category}</span>}
        <h3>{item.title}</h3>
        <p>{isNews ? item.summary : item.description}</p>
        <Link className="button button-outline" to={isNews ? `${path}/${encodeURIComponent(item.slug)}` : `${path}/${item.id}`}>En savoir plus <ArrowRight size={16} /></Link>
      </div>
    </article>)}
  </div>
}

export default function HomeContentPreview() {
  const actions = usePreview('actions')
  const news = usePreview('news')

  return <section className="page-section home-content-preview">
    <div className="container">
      <SectionTitle eyebrow="La vie de l’ONGD IDA" title="Actions et actualités">Retrouvez les publications validées par l’équipe. Les textes précisent s’il s’agit d’une action réalisée, d’un projet en cours ou d’un objectif à venir.</SectionTitle>
      <div className="home-content-columns">
        <section aria-labelledby="home-actions-title">
          <div className="home-preview-heading"><h2 id="home-actions-title">Nos actions et programmes</h2><Link to="/actions">Toutes les actions <ArrowRight size={15} /></Link></div>
          <PreviewCards type="actions" state={actions} />
        </section>
        <section aria-labelledby="home-news-title">
          <div className="home-preview-heading"><h2 id="home-news-title">Actualités</h2><Link to="/actualites">Toutes les actualités <ArrowRight size={15} /></Link></div>
          <PreviewCards type="news" state={news} />
        </section>
      </div>
    </div>
  </section>
}
