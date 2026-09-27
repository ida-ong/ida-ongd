import { Newspaper } from 'lucide-react'
import SectionTitle from '../components/SectionTitle'

export default function News() {
  return <main className="page-section inner-page"><div className="container"><SectionTitle eyebrow="La vie de l’organisation" title="Actualités">Retrouvez les nouvelles et annonces de l’Initiative Dignité Autonomiser.</SectionTitle><div className="coming-soon-card"><Newspaper size={36} /><h2>Les actualités arrivent bientôt</h2><p>Aucune publication n’est disponible pour le moment. Les actualités seront publiées ici lorsqu’elles seront prêtes.</p></div></div></main>
}