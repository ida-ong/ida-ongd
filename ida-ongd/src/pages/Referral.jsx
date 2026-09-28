import { useEffect, useState } from 'react'
import { ArrowRight, HeartHandshake, MapPin, ShieldCheck, UsersRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button'
import { clearReferralCode, findInviterByCode, saveReferralCode } from '../lib/community'

export default function Referral() {
  const { affiliateCode } = useParams()
  const [state, setState] = useState({ status: 'loading', inviter: null })

  useEffect(() => {
    let active = true
    clearReferralCode()
    async function validateCode() {
      try {
        const inviter = await findInviterByCode(affiliateCode ?? '')
        if (!active) return
        if (!inviter) {
          setState({ status: 'invalid', inviter: null })
          return
        }
        saveReferralCode(affiliateCode)
        setState({ status: 'valid', inviter })
      } catch {
        if (active) {
          saveReferralCode(affiliateCode)
          setState({ status: 'unverified', inviter: null })
        }
      }
    }
    void validateCode()
    return () => { active = false }
  }, [affiliateCode])

  return (
    <main className="referral-page page-section">
      <section className="referral-invite-card container">
        <span className="referral-invite-icon"><HeartHandshake size={31} /></span>
        <span className="eyebrow">Invitation communautaire · <MapPin size={14} /> Lubumbashi</span>
        <h1>Vous êtes invité(e) à rejoindre la communauté IDA</h1>
        <p className="referral-invite-lead">Initiative Dignité Autonomisation mobilise les communautés de Lubumbashi autour de la protection, de l’éducation, de l’autonomisation et du développement communautaire.</p>

        {state.status === 'loading' && <p className="form-notice notice-info" role="status">Vérification de votre invitation…</p>}
        {state.status === 'valid' && <p className="form-notice notice-success" role="status">Invitation partagée par <strong>{[state.inviter?.first_name, state.inviter?.last_name].filter(Boolean).join(' ') || 'un membre IDA'}</strong>.</p>}
        {state.status === 'invalid' && <div className="form-notice notice-error" role="alert">Ce lien d'invitation n'est plus valide ou n'existe pas.</div>}
        {state.status === 'unverified' && <div className="form-notice notice-info" role="status">La vérification immédiate est indisponible. Vous pouvez poursuivre l’inscription ; Supabase vérifiera le code lors de la création du compte.</div>}

        <div className="referral-how"><h2>Rejoindre la communauté</h2><p><UsersRound size={18} /> Créez votre compte, participez aux initiatives locales et mobilisez votre entourage.</p><p><ShieldCheck size={18} /> Le réseau permet de suivre la mobilisation. Toute nomination de leader est validée par l’administration.</p></div>
        <div className="referral-invite-actions">
          {state.status === 'loading'
            ? <button className="button button-primary" type="button" disabled>Vérification de l’invitation…</button>
            : <Button to="/inscription">{state.status === 'valid' ? 'Créer mon compte' : state.status === 'unverified' ? 'Continuer mon inscription' : 'Créer un compte sans invitation'} <ArrowRight size={17} /></Button>}
          <Link className="button button-outline" to="/connexion" onClick={clearReferralCode}>J’ai déjà un compte</Link>
        </div>
        <p className="referral-privacy-note">Aucune promesse financière : l’invitation concerne uniquement la mobilisation communautaire.</p>
      </section>
    </main>
  )
}