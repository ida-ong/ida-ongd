import { ArrowRight, HeartHandshake } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionTitle from '../components/SectionTitle'

export default function Activities() {
  return <main className="page-section inner-page"><div className="container"><SectionTitle eyebrow="Agir ensemble" title="Nos actions">IDA agit autour de la protection, de l’éducation, de l’autonomisation et de la mobilisation communautaire à Lubumbashi.</SectionTitle><div className="coming-soon-card"><HeartHandshake size={36} /><h2>Activités en préparation</h2><p>Les activités publiques seront présentées ici au fur et à mesure de leur organisation. Pour participer à la mobilisation communautaire, vous pouvez rejoindre IDA.</p><Link className="button button-primary" to="/inscription">Devenir membre <ArrowRight size={16} /></Link></div></div></main>
}