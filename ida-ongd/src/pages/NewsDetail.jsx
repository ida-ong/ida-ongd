import { useEffect, useState } from 'react'
import { ArrowLeft, Newspaper } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { formatJoinDate } from '../lib/date'
import { getNewsBySlug } from '../lib/content'

export default function NewsDetail() {
  const { slug } = useParams()
  const [state, setState] = useState({ slug: null, article: null, loading: true, error: false })

  useEffect(() => {
    let active = true
    getNewsBySlug(slug)
      .then((article) => { if (active) setState({ slug, article, loading: false, error: false }) })
      .catch(() => { if (active) setState({ slug, article: null, loading: false, error: true }) })
    return () => { active = false }
  }, [slug])

  if (state.loading || state.slug !== slug) return <main className="page-section inner-page"><div className="container"><p className="content-state" role="status">Chargement de l’article…</p></div></main>
  if (!state.article) return <main className="page-section inner-page"><div className="container"><div className="coming-soon-card"><Newspaper size={34} /><h1>{state.error ? 'Article indisponible' : 'Article introuvable'}</h1><p>{state.error ? 'Impossible de charger cet article pour le moment.' : 'Cet article n’est pas publié ou n’existe plus.'}</p><Link className="button button-primary" to="/actualites"><ArrowLeft size={16} /> Retour aux actualités</Link></div></div></main>

  const { article } = state
  return <main className="page-section inner-page">
    <article className="container editorial-detail">
      <Link className="network-back-link" to="/actualites"><ArrowLeft size={17} /> Toutes les actualités</Link>
      <header className="editorial-detail-header"><span className="eyebrow">Actualités IDA</span><h1>{article.title}</h1><time className="editorial-date" dateTime={article.published_at}>{formatJoinDate(article.published_at)}</time>{article.author && <p className="editorial-byline">Par {article.author}</p>}</header>
      {article.image_url && <img className="editorial-detail-image" src={article.image_url} alt="" onError={(event) => { event.currentTarget.hidden = true }} />}
      <p className="editorial-lead">{article.summary}</p>
      <div className="editorial-body">{article.content}</div>
    </article>
  </main>
}
