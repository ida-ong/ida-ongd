import { useState } from 'react'
import { ArrowRight, HandHeart, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionTitle from '../components/SectionTitle'
import { WHATSAPP_NUMBER } from '../lib/contact'

const objectives = [
  'Protection de l’enfant',
  'Éducation',
  'Autonomisation des jeunes filles',
  'Formation professionnelle',
  'Formation numérique',
  'Aide humanitaire',
  'Accompagnement social et psychosocial',
  'Développement communautaire',
  'Don général',
  'Je laisse l’ONGD IDA utiliser mon don là où les besoins sont prioritaires',
]
const suggestedAmounts = ['5', '10', '20', '50', '100']

const initialValues = {
  objective: 'Don général',
  amount: '20',
  currency: 'USD',
  customAmount: false,
  anonymous: false,
  firstName: '',
  lastName: '',
  name: '',
  email: '',
  phone: '',
}

export default function Donations() {
  const [values, setValues] = useState(initialValues)
  const [notice, setNotice] = useState('')

  function update(event) {
    const { name, value, checked, type } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setNotice('')
  }

  function contactAboutContribution(event) {
    event.preventDefault()
    const lines = [
      'Bonjour IDA, je souhaite connaître les modalités pour faire un don.',
      `Objectif souhaité : ${values.objective}`,
      `Montant envisagé : ${values.amount} ${values.currency}`,
      values.anonymous ? 'Je souhaite rester anonyme.' : '',
      !values.anonymous && values.firstName ? `Prénom : ${values.firstName}` : '',
      !values.anonymous && values.lastName ? `Nom : ${values.lastName}` : '',
      !values.anonymous && values.email ? `Email : ${values.email}` : '',
      !values.anonymous && values.phone ? `Téléphone : ${values.phone}` : '',
    ].filter(Boolean)
    const url = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setNotice('Votre demande de modalités est prête dans WhatsApp. Aucun paiement, don ni reçu n’a été effectué ou confirmé sur ce site.')
  }

  return <main className="page-section inner-page donation-page">
    <div className="container">
      <SectionTitle eyebrow="Soutenir la mission" title="Faire un don">
        Votre don peut contribuer à protéger un enfant, soutenir l’éducation d’une jeune fille et renforcer l’autonomie des communautés vulnérables.
      </SectionTitle>

      <section className="donation-intro">
        <span className="donation-icon"><HandHeart size={34} /></span>
        <div><h2>Choisissez ce que vous souhaitez soutenir</h2><p>Vous pouvez sélectionner un objectif ou laisser l’ONGD IDA utiliser votre don là où les besoins sont prioritaires.</p></div>
      </section>

      <section className="donation-transparency" aria-label="Transparence et protection">
        <ShieldCheck size={22} />
        <p>IDA s’engage à utiliser ses ressources conformément à sa mission, avec responsabilité et transparence, tout en protégeant la dignité et la confidentialité des personnes accompagnées. Aucun chiffre financier ou résultat non vérifié n’est avancé.</p>
      </section>

      <section className="donation-request-layout">
        <div className="donation-request-copy">
          <span className="eyebrow">Paiement sécurisé — mise en place</span>
          <h2>Le paiement en ligne n’est pas encore activé</h2>
          <p>Aucun fournisseur de paiement ni mécanisme de confirmation n’est configuré dans ce projet. Le formulaire ci-contre prépare uniquement une demande de modalités via WhatsApp : il ne prélève, n’enregistre et ne confirme aucun don.</p>
          <p>Nous activerons le paiement après sélection et configuration d’un prestataire disponible en RDC et, si nécessaire, à l’international.</p>
          <Link className="button button-outline" to="/contact">Contacter directement IDA <ArrowRight size={16} /></Link>
        </div>

        <form className="donation-form" onSubmit={contactAboutContribution}>
          <label className="form-field"><span>Objectif du don</span><select name="objective" required value={values.objective} onChange={update}>{objectives.map((objective) => <option key={objective} value={objective}>{objective}</option>)}</select></label>

          <fieldset className="donation-amount-fieldset">
            <legend>Montant souhaité</legend>
            <div className="donation-amount-options">
              {suggestedAmounts.map((amount) => <label className={`donation-amount-option${!values.customAmount && values.amount === amount ? ' selected' : ''}`} key={amount}>
                <input type="radio" name="suggestedAmount" value={amount} checked={!values.customAmount && values.amount === amount} onChange={() => { setValues((current) => ({ ...current, amount, customAmount: false })); setNotice('') }} />
                <span>{amount}</span>
              </label>)}
              <label className={`donation-amount-option${values.customAmount ? ' selected' : ''}`}>
                <input type="radio" name="suggestedAmount" value="custom" checked={values.customAmount} onChange={() => { setValues((current) => ({ ...current, customAmount: true, amount: '' })); setNotice('') }} />
                <span>Autre</span>
              </label>
            </div>
            <div className="donation-currency-row">
              {values.customAmount && <label className="form-field"><span>Montant personnalisé</span><input name="amount" type="number" min="1" step="any" inputMode="decimal" required placeholder="Saisir un montant" value={values.amount} onChange={update} /></label>}
              <label className="form-field"><span>Devise</span><select name="currency" value={values.currency} onChange={update}><option value="USD">USD — Dollar américain</option><option value="CDF">CDF — Franc congolais</option></select></label>
            </div>
            <p className="donation-amount-note">Le montant et la devise sont indicatifs tant que le moyen de paiement n’est pas configuré.</p>
          </fieldset>

          <label className="donation-anonymous"><input type="checkbox" name="anonymous" checked={values.anonymous} onChange={update} /><span>Je souhaite faire un don anonymement</span></label>
          {!values.anonymous && <div className="form-grid-two">
            <label className="form-field"><span>Prénom (facultatif)</span><input name="firstName" autoComplete="given-name" value={values.firstName} onChange={update} /></label>
            <label className="form-field"><span>Nom (facultatif)</span><input name="lastName" autoComplete="family-name" value={values.lastName} onChange={update} /></label>
            <label className="form-field"><span>Email (facultatif)</span><input name="email" type="email" autoComplete="email" value={values.email} onChange={update} /></label>
            <label className="form-field"><span>Téléphone / WhatsApp (facultatif)</span><input name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={update} /></label>
          </div>}

          <p className="donation-privacy-note">Vos coordonnées sont transmises uniquement si vous choisissez d’ouvrir et d’envoyer le message WhatsApp. Ne saisissez aucune donnée sensible.</p>
          <button className="button button-primary" type="submit">Demander les modalités du don <ArrowRight size={17} /></button>
          {notice && <p className="form-notice notice-info" role="status">{notice}</p>}
        </form>
      </section>
    </div>
  </main>
}