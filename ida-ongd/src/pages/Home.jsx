import {
  ArrowDown, ArrowRight, BookOpen, HandHeart, HeartHandshake, HeartPulse,
  Leaf, MapPin, Megaphone, ShieldCheck, Sparkles, Users, UsersRound,
} from 'lucide-react'
import Button from '../components/Button'
import ImportantInformationPreview from '../components/ImportantInformationPreview'
import SectionTitle from '../components/SectionTitle'
import heroImage from '../assets/hero.png'

const objectives = [
  ['Protection', 'Contribuer à la protection des enfants et des personnes vulnérables contre les différentes formes de violence, d’abus, d’exploitation et de discrimination.', ShieldCheck],
  ['Éducation', 'Promouvoir l’éducation et la sensibilisation des enfants, des jeunes, des femmes et des communautés sur leurs droits, leurs responsabilités et les enjeux sociaux.', BookOpen],
  ['Intégrité', 'Contribuer à la lutte contre les antivaleurs et promouvoir l’intégrité, la responsabilité, la solidarité et la cohésion sociale.', Sparkles],
  ['Autonomisation', 'Favoriser l’autonomisation des femmes et des jeunes à travers le renforcement des capacités, l’accompagnement et des initiatives adaptées aux réalités locales.', HeartPulse],
  ['Participation', 'Renforcer la participation communautaire et encourager les citoyens à contribuer à l’identification et à la résolution des problèmes de leur communauté.', UsersRound],
  ['Action humanitaire', 'Mobiliser les communautés vulnérables autour d’actions humanitaires et sociales.', HandHeart],
  ['Réseaux locaux', 'Développer des réseaux communautaires de sensibilisation et de mobilisation dans les quartiers de Lubumbashi.', Megaphone],
  ['Collaboration', 'Développer des collaborations et partenariats avec les acteurs qui partagent les objectifs humanitaires et sociaux de l’ONGD.', HeartHandshake],
]

const domains = [
  ['Protection de l’enfant', ShieldCheck], ['Autonomisation de la femme', HeartPulse],
  ['Accompagnement des jeunes', Users], ['Éducation et sensibilisation', BookOpen],
  ['Lutte contre les antivaleurs', Sparkles], ['Mobilisation communautaire', Megaphone],
  ['Développement communautaire', Leaf], ['Soutien aux personnes vulnérables', HandHeart],
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
          <span className="hero-kicker"><span /> ONGD humanitaire · Lubumbashi, RDC</span>
          <h1>Initiative Dignité <span>Autonomisation</span></h1>
          <p className="hero-lead">Agir ensemble pour des communautés plus dignes, autonomes et résilientes.</p>
          <p className="hero-description">IDA est une organisation non gouvernementale de développement à vocation humanitaire, engagée auprès des enfants, des jeunes et des femmes en situation de vulnérabilité.</p>
          <div className="hero-actions"><Button to="/inscription">Devenir membre <ArrowRight size={17} /></Button><Button to="/actions" variant="outline">Découvrir nos actions</Button></div>
          <Button to="/dons" variant="text" className="hero-donate"><HeartHandshake size={17} /> Faire un don</Button>
        </div>
        <div className="hero-visual"><img src={heroImage} alt="Enfant souriant, symbole d’espoir et de dignité" /><div className="hero-visual-note"><span className="note-icon"><HeartHandshake size={20} /></span><span><strong>La force du collectif</strong><small>Une communauté qui agit, ensemble</small></span></div></div>
      </div>
      <a className="hero-scroll" href="#qui-sommes-nous"><ArrowDown size={15} /> Découvrir IDA</a>
    </section>

    <section className="intro-strip"><div className="container intro-strip-inner"><span className="intro-mark">IDA</span><p>Protéger <i /> Éduquer <i /> Autonomiser <i /> Mobiliser</p><span className="intro-location">Lubumbashi · RDC</span></div></section>

    <ImportantInformationPreview />

    <section className="page-section about-section" id="qui-sommes-nous"><div className="container about-grid"><div className="about-mark"><div className="about-logo-frame"><img src={heroImage} alt="Communauté soutenue par IDA" /></div><div className="founded-badge"><span>Depuis</span><strong>26.09.2026</strong><small>Création d’IDA</small></div></div><div className="about-copy"><span className="eyebrow">Notre identité</span><h2>Qui sommes-nous ?</h2><p className="lead">IDA — Initiative Dignité Autonomisation est une organisation non gouvernementale de développement à vocation humanitaire.</p><p>Nous œuvrons pour contribuer à l’amélioration des conditions de vie des enfants, des jeunes et des femmes en situation de vulnérabilité. À Lubumbashi, nos actions s’articulent autour de la protection, de la sensibilisation, de l’éducation, de l’autonomisation et de la mobilisation communautaire.</p><p>Nous encourageons la participation active des communautés pour identifier les défis, développer des réponses adaptées et contribuer durablement au développement local.</p><div className="about-meta"><span><MapPin size={16} /> Lubumbashi, RDC</span><span><CalendarMark /> Créée le 26 septembre 2026</span></div><Button to="/a-propos" variant="text">En savoir plus sur IDA <ArrowRight size={16} /></Button></div></div></section>

    <section className="purpose-section"><div className="container purpose-inner"><div><span className="eyebrow eyebrow-light">Notre raison d’agir</span><h2>Notre objectif général</h2><p>Contribuer à l’amélioration des conditions de vie des enfants, des jeunes et des femmes en situation de vulnérabilité, en favorisant leur protection, leur accès à l’éducation, leur autonomisation et leur pleine participation au développement de leur communauté.</p></div><div className="purpose-emblem"><HeartHandshake size={52} strokeWidth={1.2} /><span>Dignité<br />&amp; action</span></div></div></section>

    <section className="page-section objectives-section"><div className="container"><SectionTitle eyebrow="Notre engagement" title="Nos objectifs">Des actions ancrées dans les besoins des communautés, pour construire des changements durables.</SectionTitle><div className="objective-grid">{objectives.map(([title, text, Icon], index) => <article className="objective-card" key={title}><span className="card-index">{String(index + 1).padStart(2, '0')}</span><span className="card-icon"><Icon size={21} strokeWidth={1.8} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

    <section className="domains-section page-section"><div className="container"><SectionTitle eyebrow="Nos champs d’action" title="Nos domaines d’intervention">Une approche globale au service de la dignité humaine et du développement local.</SectionTitle><div className="domain-grid">{domains.map(([title, Icon]) => <article className="domain-card" key={title}><span><Icon size={22} strokeWidth={1.8} /></span><h3>{title}</h3><ArrowRight className="domain-arrow" size={18} /></article>)}</div></div></section>

    <section className="network-section page-section"><div className="container network-layout"><div className="network-intro"><span className="eyebrow">Notre mobilisation citoyenne</span><h2>Devenir acteur du changement</h2><p>Le système communautaire IDA permet à chacun de participer à la sensibilisation et à la mobilisation dans son quartier. C’est un engagement citoyen, sans rémunération ni gain financier.</p><Button to="/inscription">Devenir membre <ArrowRight size={17} /></Button><div className="eligibility-note"><ShieldCheck size={20} /><span>À partir de 20 personnes mobilisées, un membre peut être éligible à une nomination comme leader. La nomination est validée par l’administration.</span></div></div><ol className="network-steps">{networkSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol></div></section>

    <section className="action-section"><div className="container action-panel"><div><span className="eyebrow eyebrow-light">Chaque geste compte</span><h2>Vous pouvez agir avec nous</h2><p>Rejoignez une communauté qui s’engage pour la dignité, les droits et l’avenir des personnes vulnérables à Lubumbashi.</p></div><div className="action-links"><Button to="/inscription" variant="white">Devenir membre <ArrowRight size={17} /></Button><Button to="/actions" variant="outline-light">Participer à nos actions</Button><Button to="/dons" variant="text-light">Soutenir par un don <HeartHandshake size={17} /></Button></div></div></section>

    <section className="donation-section page-section"><div className="container donation-layout"><div className="donation-icon"><HandHeart size={40} strokeWidth={1.5} /></div><div className="donation-copy"><span className="eyebrow">Solidarité en action</span><h2>Soutenir les actions humanitaires d’IDA</h2><p>Votre soutien contribue aux initiatives de protection de l’enfant, d’éducation, d’autonomisation des femmes, d’accompagnement des jeunes et d’appui aux communautés vulnérables.</p><p className="donation-disclaimer">Les campagnes et modalités de soutien seront présentées ici. Aucun moyen de paiement n’est activé pour le moment.</p></div><Button to="/dons">Voir les campagnes et faire un don <ArrowRight size={17} /></Button></div></section>
  </main>
}

function CalendarMark() {
  return <span aria-hidden="true" className="calendar-mark">26</span>
}