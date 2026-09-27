import { HeartHandshake, ShieldCheck, UsersRound } from 'lucide-react'
import SectionTitle from '../components/SectionTitle'
import Button from '../components/Button'
import founderImage from '../assets/fondateur.jpg'
import ClaudiaImage from '../assets/coofondatrice.jpg'
import MarieImage from '../assets/coofondatrice2.jpg'

const values = [
  [ShieldCheck, 'Protéger', 'Défendre la dignité et les droits des personnes vulnérables.'],
  [UsersRound, 'Mobiliser', 'Faire de la participation communautaire un levier d’action.'],
  [HeartHandshake, 'Autonomiser', 'Soutenir des capacités et des initiatives adaptées au contexte local.'],
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
          Initiative Dignité Autonomisation — agir avec et pour les communautés.
        </SectionTitle>
        <div className="about-page-copy">
          <p>IDA — Initiative Dignité Autonomisation est une organisation non gouvernementale de développement à vocation humanitaire qui œuvre pour contribuer à l’amélioration des conditions de vie des enfants, des jeunes et des femmes en situation de vulnérabilité.</p>
          <p>L’organisation agit actuellement à Lubumbashi, en République démocratique du Congo, à travers des actions de protection, de sensibilisation, d’éducation, d’autonomisation et de mobilisation communautaire.</p>
          <p>IDA encourage la participation active des communautés afin d’identifier les problèmes, développer des réponses adaptées et contribuer durablement au développement local.</p>
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

        <div className="about-cta"><Button to="/inscription">Rejoindre IDA</Button></div>

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