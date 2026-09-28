import { useState } from 'react'
import { ArrowRight, BookOpen, HandHeart, HeartPulse, ShieldCheck, Users, UsersRound } from 'lucide-react'
import SectionTitle from '../components/SectionTitle'
import { WHATSAPP_NUMBER } from '../lib/contact'

const areas = [
  ['Protection de l’enfant', HeartPulse],
  ['Éducation', BookOpen],
  ['Autonomisation des femmes', HandHeart],
  ['Accompagnement des jeunes', Users],
  ['Aide aux personnes vulnérables', ShieldCheck],
  ['Mobilisation communautaire', UsersRound],
  ['Développement communautaire', ArrowRight],
]

const initialValues = { objective: '', amount: '', name: '', email: '', phone: '', message: '' }

export default function Donations() {
  const [values, setValues] = useState(initialValues)
  const [notice, setNotice] = useState('')

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
    setNotice('')
  }

  function contactAboutContribution(event) {
    event.preventDefault()
    const objective = areas.find(([name]) => name === values.objective)?.[0]
    const lines = [
      'Bonjour IDA, je souhaite échanger au sujet d’une contribution.',
      `Objectif choisi : ${objective}`,
      values.amount ? `Montant indicatif : ${values.amount} (devise à confirmer avec IDA)` : '',
      values.name ? `Nom : ${values.name}` : '',
      values.email ? `Email : ${values.email}` : '',
      values.phone ? `Téléphone : ${values.phone}` : '',
      values.message ? `Message : ${values.message}` : '',
    ].filter(Boolean)
    const url = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setNotice('Votre demande de contact est prête dans WhatsApp. Aucun paiement ni engagement n’a été effectué sur ce site.')
  }

  return <main className="page-section inner-page donation-page">
    <div className="container">
      <SectionTitle eyebrow="Solidarité" title="Soutenir les actions d’IDA">Votre soutien peut contribuer aux objectifs humanitaires de l’organisation auprès des communautés de Lubumbashi.</SectionTitle>
      <section className="donation-intro"><span className="donation-icon"><HandHeart size={34} /></span><div><h2>Pourquoi soutenir IDA ?</h2><p>IDA agit avec les communautés pour contribuer à la protection, à l’éducation, à l’autonomisation et au développement local. Une contribution peut être discutée avec l’équipe et orientée selon l’objectif choisi.</p></div></section>
      <div className="donation-page-grid">{areas.map(([name, Icon]) => <article className="domain-card donation-area-card" key={name}><span><Icon size={22} /></span><h3>{name}</h3></article>)}</div>

      <section className="donation-request-layout">
        <div className="donation-request-copy"><span className="eyebrow">Parlons de votre contribution</span><h2>Choisir un objectif de soutien</h2><p>Indiquez votre objectif et, si vous le souhaitez, un montant indicatif et vos coordonnées. Le bouton prépare un message que vous pourrez vérifier et envoyer via WhatsApp.</p><p className="donation-disclaimer">Aucun paiement en ligne n’est activé. Aucune contribution n’est prélevée ni enregistrée par ce formulaire. Le montant et la devise seront confirmés avec l’équipe IDA.</p><a className="button button-outline" href="/contact">Contacter IDA <ArrowRight size={16} /></a></div>
        <form className="donation-form" onSubmit={contactAboutContribution}>
          <label className="form-field"><span>Objectif du don</span><select name="objective" required value={values.objective} onChange={update}><option value="">Sélectionner un domaine</option>{areas.map(([name]) => <option key={name} value={name}>{name}</option>)}</select></label>
          <label className="form-field"><span>Montant indicatif (facultatif)</span><input name="amount" type="number" min="1" step="any" inputMode="decimal" placeholder="À discuter avec IDA" value={values.amount} onChange={update} /></label>
          <div className="form-grid-two">
            <label className="form-field"><span>Nom (facultatif)</span><input name="name" autoComplete="name" value={values.name} onChange={update} /></label>
            <label className="form-field"><span>Email (facultatif)</span><input name="email" type="email" autoComplete="email" value={values.email} onChange={update} /></label>
          </div>
          <label className="form-field"><span>Numéro WhatsApp (facultatif)</span><input name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={update} /></label>
          <label className="form-field"><span>Message (facultatif)</span><textarea name="message" rows="4" value={values.message} onChange={update} /></label>
          <p className="donation-privacy-note">Les renseignements saisis seront inclus uniquement dans le message WhatsApp que vous choisissez d’ouvrir.</p>
          <button className="button button-primary" type="submit">Continuer vers WhatsApp <ArrowRight size={17} /></button>
          {notice && <p className="form-notice notice-info" role="status">{notice}</p>}
        </form>
      </section>
    </div>
  </main>
}