import {
  ArrowDown, ArrowRight, BookOpen, BriefcaseBusiness, GraduationCap,
  HandHeart, HeartHandshake, HeartPulse, Laptop, Leaf, MapPin, Megaphone,
  ShieldCheck, Users,
} from 'lucide-react'
import Button from '../components/Button'
import ImportantInformationPreview from '../components/ImportantInformationPreview'
import SectionTitle from '../components/SectionTitle'
import { objectives } from '../lib/objectives'
import logo from '../assets/logo.png'

const domains = [
  ['Protection de l’enfant', ShieldCheck], ['Jeunes filles', HeartPulse],
  ['Éducation et soutien scolaire', BookOpen], ['Formation professionnelle', GraduationCap],
  ['Formation et inclusion numériques', Laptop], ['Accompagnement social et psychosocial', Users],
  ['Aide humanitaire', HandHeart], ['Prévention des violences', Megaphone],
  ['Entrepreneuriat', BriefcaseBusiness], ['Développement communautaire', Leaf],
]

const networkSteps = [
  'Créer son compte membre.',
  'Recevoir son identifiant et son lien d’affiliation.',
  'Sensibiliser et mobiliser son entourage.',
  'Développer son réseau dans son quartier.',
  'À partir de 20 personnes, devenir éligible à la nomination comme leader communautaire.',
  'Après nomination par l’administration, organiser des activités, réunions, sensibilisations et mobilisations.',
  'Envoyer les rapports des activités à l’administration.',
]

export default function Home() {
  return <main>
    <section className="hero-section">
      <div className="container hero-content">
        <div className="hero-copy">
          <span className="hero-kicker"><span /> ONGD IDA · Lubumbashi, RDC</span>
          <h1>Protéger les enfants. <span>Autonomiser les jeunes filles.</span></h1>
          <p className="hero-lead">Construire un avenir meilleur.</p>
          <p className="hero-description">L’ONGD IDA agit pour protéger les enfants vulnérables, favoriser l’éducation et contribuer à l’autonomisation des jeunes filles et des communautés.</p>
          <div className="hero-actions"><Button to="/dons" className="hero-donate"><HeartHandshake size={18} /> FAIRE UN DON</Button><Button to="/actions" variant="outline">Découvrir nos actions</Button></div>
        </div>
        <div className="hero-visual hero-visual-brand"><img src={logo} alt="ONGD IDA — Initiative Dignité et Autonomisation" /><div className="hero-visual-note"><span className="note-icon"><HeartHandshake size={20} /></span><span><strong>Agir avec dignité</strong><small>Protéger · Éduquer · Autonomiser</small></span></div></div>
      </div>
      <a className="hero-scroll" href="#qui-sommes-nous"><ArrowDown size={15} /> Découvrir IDA</a>
    </section>

    <section className="intro-strip"><div className="container intro-strip-inner"><span className="intro-mark">IDA</span><p>Protéger <i /> Éduquer <i /> Autonomiser <i /> Mobiliser</p><span className="intro-location">Lubumbashi · RDC</span></div></section>

    <section className="audience-strip" aria-label="Publics accompagnés"><div className="container"><span>À qui s’adressent nos actions ?</span><p>Enfants vulnérables <i /> Jeunes filles <i /> Familles et communautés vulnérables</p></div></section>

    <ImportantInformationPreview />

    <section className="page-section about-section" id="qui-sommes-nous"><div className="container about-grid"><div className="about-mark"><div className="about-logo-frame about-logo-brand"><img src={logo} alt="Logo de l’ONGD IDA" /></div><div className="founded-badge"><span>Depuis</span><strong>26.09.2026</strong><small>Création d’IDA</small></div></div><div className="about-copy"><span className="eyebrow">Notre identité</span><h2>Qui sommes-nous ?</h2><p className="lead">ONGD IDA — Initiative Dignité et Autonomisation.</p><p>Nous œuvrons principalement pour protéger les enfants, autonomiser les jeunes filles et contribuer à construire un avenir digne et durable pour les communautés vulnérables.</p><p>À Lubumbashi, en République démocratique du Congo, nos priorités incluent la protection, l’éducation, la formation, l’accompagnement social et le développement communautaire. Les actions réalisées et les projets à venir sont présentés séparément dans nos publications.</p><div className="about-meta"><span><MapPin size={16} /> Lubumbashi, RDC</span><span><CalendarMark /> Créée le 26 septembre 2026</span></div><Button to="/a-propos" variant="text">En savoir plus sur IDA <ArrowRight size={16} /></Button></div></div></section>

    <section className="purpose-section"><div className="container purpose-inner"><div><span className="eyebrow eyebrow-light">Notre raison d’agir</span><h2>Notre objectif général</h2><p>Protéger les enfants, autonomiser les jeunes filles et contribuer à construire un avenir digne et durable pour les communautés vulnérables, par l’éducation, la prévention, l’accompagnement et des initiatives de développement local.</p></div><div className="purpose-emblem"><HeartHandshake size={52} strokeWidth={1.2} /><span>Dignité<br />&amp; action</span></div></div></section>

    <section className="page-section objectives-section" id="nos-objectifs"><div className="container"><SectionTitle eyebrow="Notre engagement" title="Nos objectifs">Protéger les enfants, autonomiser les jeunes filles et contribuer à construire un avenir digne et durable pour les communautés vulnérables.</SectionTitle><div className="objective-grid">{objectives.map(([title, text, Icon], index) => <article className="objective-card" key={title}><span className="card-index">{String(index + 1).padStart(2, '0')}</span><span className="card-icon"><Icon size={21} strokeWidth={1.8} /></span><h3>{title}</h3><p>{text}</p></article>)}</div><div className="objectives-more"><Button to="/objectifs" variant="outline">Voir nos objectifs en détail <ArrowRight size={16} /></Button></div></div></section>

    <section className="domains-section page-section"><div className="container"><SectionTitle eyebrow="Nos champs d’action" title="Nos domaines d’intervention">Une approche globale au service de la dignité humaine et du développement local.</SectionTitle><div className="domain-grid">{domains.map(([title, Icon]) => <article className="domain-card" key={title}><span><Icon size={22} strokeWidth={1.8} /></span><h3>{title}</h3><ArrowRight className="domain-arrow" size={18} /></article>)}</div></div></section>

    <section className="network-section page-section"><div className="container network-layout"><div className="network-intro"><span className="eyebrow">Notre mobilisation citoyenne</span><h2>Devenir acteur du changement</h2><p>Le système communautaire IDA permet à chacun de participer à la sensibilisation et à la mobilisation dans son quartier. C’est un engagement citoyen, sans rémunération ni gain financier.</p><Button to="/inscription">Devenir membre <ArrowRight size={17} /></Button><div className="eligibility-note"><ShieldCheck size={20} /><span>À partir de 20 personnes mobilisées, un membre peut être éligible à une nomination comme leader. La nomination est validée par l’administration.</span></div></div><ol className="network-steps">{networkSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol></div></section>

    <section className="action-section"><div className="container action-panel"><div><span className="eyebrow eyebrow-light">Chaque geste compte</span><h2>Vous pouvez agir avec nous</h2><p>Faites un don, soutenez nos actions, rejoignez l’organisation ou partagez nos initiatives.</p></div><div className="action-links"><Button to="/dons" variant="white"><HeartHandshake size={17} /> Faire un don</Button><Button to="/inscription" variant="outline-light">Rejoindre IDA</Button><Button to="/actions" variant="text-light">Découvrir nos actions <ArrowRight size={17} /></Button></div></div></section>

    <section className="transparency-section page-section"><div className="container transparency-inner"><span className="card-icon"><ShieldCheck size={22} /></span><div><span className="eyebrow">Engagement de transparence</span><h2>Des ressources au service de notre mission</h2><p>IDA s’engage à utiliser ses ressources de manière responsable et conformément à sa mission, dans le respect de la dignité, de la protection et de la confidentialité des personnes accompagnées. Nous ne publions pas de chiffres ni de résultats financiers non vérifiés.</p></div><Button to="/dons" variant="outline">Comprendre les dons <ArrowRight size={16} /></Button></div></section>

    <section className="donation-section page-section"><div className="container donation-layout"><div className="donation-icon"><HandHeart size={40} strokeWidth={1.5} /></div><div className="donation-copy"><span className="eyebrow">Solidarité en action</span><h2>Votre don soutient la mission d’IDA</h2><p>Votre contribution peut aider à protéger les enfants, soutenir l’éducation des jeunes filles et renforcer l’autonomie des communautés vulnérables.</p><p className="donation-disclaimer">Le paiement en ligne sera proposé dès qu’un fournisseur sécurisé sera configuré. La page vous permet actuellement de choisir une priorité et de contacter IDA.</p></div><Button to="/dons">Choisir un objectif de don <ArrowRight size={17} /></Button></div></section>
  </main>
}

function CalendarMark() {
  return <span aria-hidden="true" className="calendar-mark">26</span>
}