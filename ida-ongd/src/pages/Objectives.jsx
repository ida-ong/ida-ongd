import { ArrowRight } from 'lucide-react'
import Button from '../components/Button'
import SectionTitle from '../components/SectionTitle'
import { objectives } from '../lib/objectives'

export default function Objectives() {
  return <main className="page-section inner-page objectives-page">
    <div className="container">
      <SectionTitle eyebrow="Notre mission" title="Nos objectifs">
        Protéger les enfants, autonomiser les jeunes filles et contribuer à construire un avenir digne et durable pour les communautés vulnérables.
      </SectionTitle>
      <div className="objectives-detail-list">
        {objectives.map(([title, description, Icon], index) => <article className="objective-detail-card" key={title}>
          <span className="objective-detail-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="card-icon"><Icon size={22} /></span>
          <div><h2>{title}</h2><p>{description}</p></div>
        </article>)}
      </div>
      <div className="objectives-page-cta">
        <p>Vous souhaitez soutenir ces objectifs ?</p>
        <Button to="/dons">Faire un don <ArrowRight size={17} /></Button>
      </div>
    </div>
  </main>
}