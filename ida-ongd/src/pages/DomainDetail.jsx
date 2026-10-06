import { ArrowLeft, ArrowRight, HeartHandshake } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button'
import SectionTitle from '../components/SectionTitle'
import { objectiveSlug, objectives } from '../lib/objectives'

export default function DomainDetail() {
  const { slug } = useParams()
  const objective = objectives.find(([title]) => objectiveSlug(title) === slug)

  if (!objective) {
    return <main className="page-section inner-page"><div className="container">
      <div className="coming-soon-card"><h1>Domaine introuvable</h1><p>Ce domaine d’intervention n’est pas disponible.</p><Link className="button button-primary" to="/">Retour à l’accueil <ArrowLeft size={16} /></Link></div>
    </div></main>
  }

  const [title, description, Icon] = objective

  return <main className="page-section inner-page domain-detail-page">
    <div className="container">
      <Link className="network-back-link" to="/#domaines-intervention"><ArrowLeft size={16} /> Tous les domaines</Link>
      <SectionTitle eyebrow="Domaine d’intervention" title={title}>{description}</SectionTitle>
      <article className="domain-detail-panel">
        <span className="domain-detail-icon"><Icon size={29} /></span>
        <h2>Notre engagement</h2>
        <p>{description}</p>
        <p>Les actions concrètes, les projets en cours et les objectifs futurs liés à ce domaine sont publiés séparément par l’équipe de l’ONGD IDA. Consultez les publications pour découvrir les informations validées, sans confondre projets et réalisations.</p>
        <div className="domain-detail-actions">
          <Button to="/actions" variant="outline">Consulter nos actions <ArrowRight size={16} /></Button>
          <Button to="/actualites" variant="outline">Lire nos actualités <ArrowRight size={16} /></Button>
          <Button to="/dons"><HeartHandshake size={16} /> Soutenir cette mission</Button>
        </div>
      </article>
    </div>
  </main>
}