import { BookOpen, HeartHandshake, ShieldCheck } from 'lucide-react'
import SectionTitle from '../components/SectionTitle'
import Button from '../components/Button'
import founderImage from '../assets/fondateur.jpg'
import ClaudiaImage from '../assets/coofondatrice.jpg'
import MarieImage from '../assets/coofondatrice2.jpg'

const values = [
  [ShieldCheck, 'Protéger', 'Prévenir les violences et défendre la dignité et les droits des enfants.'],
  [BookOpen, 'Éduquer', 'Favoriser l’éducation, la formation et l’inclusion comme leviers d’avenir.'],
  [HeartHandshake, 'Autonomiser', 'Accompagner les jeunes filles et les communautés vers plus d’autonomie.'],
]

const founders = [
  { image: founderImage, name: 'Prospère MBUYI KAYUMBA', role: 'Fondateur', position: 'center 16%' },
  { image: ClaudiaImage, name: 'Claudia ILUNGA', role: 'Cofondatrice', position: 'center 35%' },
  { image: MarieImage, name: 'Marie MBOMBO', role: 'Cofondatrice', position: 'center 55%' },
]

export default function About() {
  return (
    <main className="page-section inner-page">
      <div className="container">
        <SectionTitle eyebrow="Notre organisation" title="À propos d’IDA">
          Initiative Dignité et Autonomisation — protéger les enfants et autonomiser les jeunes filles.
        </SectionTitle>
        <div className="about-page-copy">
          <p>ONGD IDA — Initiative Dignité et Autonomisation est une organisation non gouvernementale qui œuvre principalement pour protéger les enfants, autonomiser les jeunes filles et contribuer à construire un avenir digne et durable pour les communautés vulnérables.</p>
          <p>À Lubumbashi, en République démocratique du Congo, ses domaines d’intervention comprennent la protection de l’enfant, l’éducation et le soutien scolaire, la formation professionnelle et numérique, l’accompagnement social et psychosocial ainsi que l’aide humanitaire selon les ressources disponibles.</p>
          <p>IDA entend prévenir les violences, soutenir l’entrepreneuriat, l’inclusion et l’égalité des chances, et encourager la participation communautaire au développement durable. Les publications du site doivent distinguer les actions réalisées, les projets en cours et les objectifs futurs.</p>
          <p><strong>Créée le 26 septembre 2026.</strong></p>
        </div>

        <div className="about-values">
          {values.map(([Icon, title, text]) => (
            <article className="domain-card" key={title}>
              <span><Icon size={22} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div className="about-cta"><Button to="/objectifs" variant="outline">Nos objectifs</Button> <Button to="/dons">Faire un don</Button> <Button to="/inscription" variant="text">Rejoindre IDA</Button></div>

        <section className="about-founders" aria-label="Équipe fondatrice d’IDA">
          <SectionTitle eyebrow="Notre équipe" title="Les personnes fondatrices">
            Les fondatrices et le fondateur d’IDA.
          </SectionTitle>
          <div className="founder-grid">
            {founders.map(({ image, name, role, position }) => (
              <article className="founder-card" key={name}>
                <img src={image} alt={name} loading="lazy" style={{ objectPosition: position }} />
                <div><span>{role}</span><h3>{name}</h3></div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}