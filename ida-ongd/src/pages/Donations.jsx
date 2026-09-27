import { ArrowRight, BookOpen, HandHeart, HeartPulse, Users } from 'lucide-react'
import SectionTitle from '../components/SectionTitle'

const areas = [['Protection de l’enfant', HeartPulse], ['Éducation', BookOpen], ['Autonomisation des femmes', HandHeart], ['Accompagnement des jeunes', Users]]

export default function Donations() {
  return <main className="page-section inner-page"><div className="container"><SectionTitle eyebrow="Solidarité" title="Soutenir les actions d’IDA">Votre soutien peut contribuer aux actions humanitaires et sociales auprès des communautés vulnérables de Lubumbashi.</SectionTitle><div className="donation-page-grid">{areas.map(([name, Icon]) => <article className="domain-card" key={name}><span><Icon size={22} /></span><h3>{name}</h3></article>)}</div><div className="donation-coming"><HandHeart size={32} /><h2>Campagnes de soutien</h2><p>Les campagnes et modalités de soutien seront publiées ici prochainement. Aucun moyen de paiement n’est activé pour le moment.</p><a href="/contact">Nous contacter <ArrowRight size={16} /></a></div></div></main>
}