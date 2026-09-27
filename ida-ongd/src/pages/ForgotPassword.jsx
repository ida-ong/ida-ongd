import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthFormShell from '../components/AuthFormShell'
import FormField from '../components/FormField'
import { friendlyAuthError } from '../lib/authErrors'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  async function submit(event) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMessage({ type: 'error', text: 'Saisissez une adresse email valide.' }); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/connexion` })
    setLoading(false)
    setMessage(error ? { type: 'error', text: friendlyAuthError(error) } : { type: 'success', text: 'Si un compte correspond à cette adresse, un lien de réinitialisation vous sera envoyé.' })
  }
  return <AuthFormShell eyebrow="Récupération du compte" title="Mot de passe oublié ?" intro="Saisissez l’adresse email associée à votre compte.">
    {message && <div className={`form-notice notice-${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</div>}
    <form className="auth-form" onSubmit={submit}><FormField label="Adresse email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /><button className="button button-primary auth-submit" disabled={loading}>{loading ? 'Envoi…' : 'Envoyer le lien'}</button></form>
    <div className="auth-footer"><Link to="/connexion">Retour à la connexion</Link></div>
  </AuthFormShell>
}