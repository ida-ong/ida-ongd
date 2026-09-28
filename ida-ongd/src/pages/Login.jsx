import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthFormShell from '../components/AuthFormShell'
import FormField from '../components/FormField'
import { friendlyAuthError } from '../lib/authErrors'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  async function submit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Saisissez une adresse email valide.'
    if (!password) nextErrors.password = 'Le mot de passe est obligatoire.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || loading) return
    setLoading(true)
    setMessage('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        console.error('[IDA] Échec Supabase Auth', {
          stage: 'signInWithPassword',
          message: error.message,
          code: error.code ?? null,
          status: error.status ?? null,
          userId: data?.user?.id ?? null,
        })
        setMessage(friendlyAuthError(error))
        return
      }
      console.info('[IDA] Résultat Supabase Auth', {
        stage: 'signInWithPassword',
        userId: data?.user?.id ?? null,
        sessionEstablished: Boolean(data?.session),
      })
      if (!data.session) { setMessage('La session n’a pas pu être établie. Veuillez réessayer.'); return }
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (error) {
      console.error('[IDA] Exception pendant Supabase Auth', {
        stage: 'signInWithPassword',
        message: error?.message ?? String(error),
        code: error?.code ?? null,
        status: error?.status ?? null,
        userId: null,
      })
      setMessage(friendlyAuthError(error))
    } finally {
      setLoading(false)
    }
  }

  return <AuthFormShell eyebrow="Espace membre" title="Connexion" intro="Connectez-vous pour accéder à votre espace membre." footer={<>Pas encore membre ? <Link to="/inscription">Créer un compte</Link></>}>
    {message && <div className="form-notice notice-error" role="alert">{message}</div>}
    <form className="auth-form" onSubmit={submit} noValidate>
      <FormField label="Adresse email" name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" value={email} onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined })) }} error={errors.email} />
      <FormField label="Mot de passe" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })) }} error={errors.password} />
      <div className="forgot-link"><Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link></div>
      <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
    </form>
  </AuthFormShell>
}