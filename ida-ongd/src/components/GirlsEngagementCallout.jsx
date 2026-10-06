import { ArrowRight, BookOpen, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function GirlsEngagementCallout() {
  const { user, registrationPending } = useAuth()
  const networkRoute = user ? '/dashboard/reseau' : registrationPending ? '/connexion' : '/inscription'
  const networkLabel = user
    ? 'Développer mon réseau'
    : registrationPending
      ? 'Confirmer mon compte'
      : 'Rejoindre la communauté'

  return <section className="girls-engagement-section" aria-labelledby="girls-engagement-title">
    <div className="container girls-engagement-panel">
      <span className="girls-engagement-icon" aria-hidden="true"><BookOpen size={25} /></span>
      <div className="girls-engagement-copy">
        <span className="eyebrow eyebrow-light">Une communauté qui apprend et avance ensemble</span>
        <h2 id="girls-engagement-title">Jeunes filles, votre voix compte.</h2>
        <p>Lisez nos articles, revenez découvrir les nouvelles publications et partagez les idées qui vous inspirent. Ensemble, tissons des liens autour de la protection, de l’éducation et de l’autonomie.</p>
      </div>
      <div className="girls-engagement-actions">
        <Link className="button button-white" to="/actualites">Lire les articles <ArrowRight size={16} /></Link>
        <Link className="button button-outline-light" to={networkRoute}><UsersRound size={16} /> {networkLabel}</Link>
      </div>
    </div>
  </section>
}
