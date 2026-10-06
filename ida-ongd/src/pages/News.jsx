import { useEffect, useState } from 'react'
import { ArrowRight, Newspaper } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionTitle from '../components/SectionTitle'
import { formatJoinDate } from '../lib/date'
import { getPublishedContent } from '../lib/content'

export default function News() {
  const [state, setState] = useState({ items: [], loading: true, error: false })

  useEffect(() => {
    let active = true
    getPublishedContent('news')
      .then((items) => { if (active) setState({ items, loading: false, error: false }) })
      .catch(() => { if (active) setState({ items: [], loading: false, error: true }) })
    return () => { active = false }
  }, [])

  return <main className="page-section inner-page">
    <div className="container">
      <SectionTitle eyebrow="La vie de l’organisation" title="Actualités">Les nouvelles et annonces de l’ONGD IDA autour de la protection de l’enfant, de l’éducation, des jeunes filles et du développement communautaire.</SectionTitle>
      {state.loading && <p className="content-state" role="status">Chargement des actualités…</p>}
      {state.error && <p className="form-notice notice-info" role="status">Les actualités ne sont pas disponibles pour le moment. Réessayez ultérieurement.</p>}
      {!state.loading && !state.error && state.items.length === 0 && <div className="coming-soon-card"><Newspaper size={36} /><h2>Les actualités arrivent bientôt</h2><p>Aucune publication n’est disponible pour le moment. Les actualités paraîtront ici dès leur publication par l’équipe IDA.</p></div>}
      {state.items.length > 0 && <div className="editorial-grid">{state.items.map((article) => <article className="editorial-card" key={article.id}>
        {article.image_url ? <img className="editorial-image" src={article.image_url} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true }} /> : <div className="editorial-image editorial-image-placeholder"><Newspaper size={34} aria-hidden="true" /></div>}
        <div className="editorial-card-content"><time className="editorial-date" dateTime={article.published_at}>{formatJoinDate(article.published_at)}</time>{article.category && <span className="editorial-category">{article.category}</span>}<h2>{article.title}</h2><p>{article.summary}</p><Link className="button button-outline" to={`/actualites/${encodeURIComponent(article.slug)}`}>Lire la suite <ArrowRight size={16} /></Link></div>
      </article>)}</div>}
    </div>
  </main>
}