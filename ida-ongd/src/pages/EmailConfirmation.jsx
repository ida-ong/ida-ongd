import { useState } from 'react'
import { CheckCircle2, ExternalLink, Mail, RefreshCw } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function EmailConfirmation() {
  const location = useLocation()
  const [email, setEmail] = useState(() => {
    try { return location.state?.email || window.sessionStorage.getItem('ida-confirmation-email') || '' } catch { return location.state?.email || '' }
  })
  const [resending, setResending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function resendConfirmation(event) {
    event.preventDefault()
    setResending(true)
    setNotice('')
    setError('')
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/connexion` },
    })
    if (resendError) setError(resendError.message || 'Le nouvel email de confirmation n’a pas pu être envoyé.')
    else setNotice('Un nouvel email de confirmation a été demandé. Vérifiez aussi vos courriers indésirables.')
    setResending(false)
  }

  return <main className="page-section email-confirmation-page"><section className="email-confirmation-card" aria-labelledby="confirmation-title">
    <span className="email-confirmation-icon"><Mail size={30} /></span>
    <span className="eyebrow">Dernière étape</span>
    <h1 id="confirmation-title">Confirmez votre adresse email</h1>
    <p>Votre demande de création de compte a été envoyée{email ? <> pour <strong>{email}</strong></> : ''}. Ouvrez le message de confirmation envoyé par ONGD IDA et cliquez sur le lien pour activer votre compte.</p>
    <p className="email-confirmation-tip">Vous utilisez Gmail ? Ouvrez votre boîte de réception, puis vérifiez également l’onglet Promotions et le dossier Spam.</p>
    <a className="button button-primary" href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noopener noreferrer">Ouvrir Gmail <ExternalLink size={17} /></a>
    {notice && <p className="form-notice notice-success" role="status"><CheckCircle2 size={18} />{notice}</p>}
    {error && <p className="form-notice notice-error" role="alert">{error}</p>}
    <form className="email-resend-form" onSubmit={resendConfirmation}>
      {!email && <label className="form-field"><span>Adresse email utilisée à l’inscription</span><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
      <button className="button button-outline" type="submit" disabled={resending || !email}>{resending ? 'Envoi…' : <><RefreshCw size={16} /> Renvoyer l’email de confirmation</>}</button>
    </form>
    <Link className="email-confirmation-back" to="/connexion">Retour à la connexion</Link>
  </section></main>
}
