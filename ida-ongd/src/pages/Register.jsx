import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import AuthFormShell from '../components/AuthFormShell'
import FormField from '../components/FormField'
import GeoLocationFields from '../components/GeoLocationFields'
import { friendlyAuthError } from '../lib/authErrors'
import { clearReferralCode, getSavedReferralCode } from '../lib/community'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/useAuth'

const initialValues = { firstName: '', lastName: '', phone: '', whatsapp: '', email: '', password: '', passwordConfirm: '' }

function validate(values) {
  const errors = {}
  if (!values.firstName.trim()) errors.firstName = 'Le prénom est obligatoire.'
  if (!values.lastName.trim()) errors.lastName = 'Le nom est obligatoire.'
  if (!values.phone.trim()) errors.phone = 'Le numéro de téléphone est obligatoire.'
  if (!values.whatsapp.trim()) errors.whatsapp = 'Le numéro WhatsApp est obligatoire.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Saisissez une adresse email valide.'
  if (values.password.length < 10 || !/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) errors.password = 'Utilisez au moins 10 caractères, dont une lettre et un chiffre.'
  if (values.passwordConfirm !== values.password) errors.passwordConfirm = 'Les deux mots de passe ne correspondent pas.'
  return errors
}

export default function Register() {
  const { markRegistrationPending, clearRegistrationPending } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(initialValues)
  const [geoLocation, setGeoLocation] = useState({ geo_province_id: '', geo_locality_id: '', geo_commune_id: '', geo_quartier_id: '', geo_road_id: '', geo_rural_unit_id: '', geo_groupement_id: '', geo_village_id: '' })
  const [errors, setErrors] = useState({})
  const [referralCode, setReferralCode] = useState(getSavedReferralCode)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  function update(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setStatus({ type: '', message: '' })
  }

  async function submit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || loading) return
    setLoading(true)
    setStatus({ type: '', message: '' })
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/connexion`,
          data: {
            first_name: values.firstName.trim(),
            last_name: values.lastName.trim(),
            phone: values.phone.trim(),
            whatsapp: values.whatsapp.trim(),
            ...Object.fromEntries(Object.entries(geoLocation).filter(([, id]) => id)),
            ...(referralCode ? { referral_code: referralCode.trim() } : {}),
          },
        },
      })
      if (error) {
        setStatus({ type: 'error', message: friendlyAuthError(error) })
        return
      }
      clearReferralCode()
      setReferralCode('')
      const confirmationRequired = !data.session
      if (confirmationRequired) {
        markRegistrationPending()
        try { window.sessionStorage.setItem('ida-confirmation-email', values.email.trim()) } catch { /* Navigation state still carries the address. */ }
        navigate('/confirmation-email', { replace: true, state: { email: values.email.trim() } })
      } else {
        clearRegistrationPending()
        setStatus({ type: 'success', message: 'Votre compte a été créé. Votre rattachement communautaire est en cours de préparation.' })
      }
      setValues(initialValues)
    } catch (error) {
      setStatus({ type: 'error', message: friendlyAuthError(error) })
    } finally {
      setLoading(false)
    }
  }

  return <AuthFormShell eyebrow="Rejoindre la communauté" title="Devenir membre" intro="Créez votre compte et prenez part à la mobilisation communautaire d’IDA." footer={<>Vous avez déjà un compte ? <Link to="/connexion">Se connecter</Link></>}>
    {status.message && <div className={`form-notice notice-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.type === 'success' && <CheckCircle2 size={19} />}{status.message}</div>}
    {referralCode && <div className="form-notice notice-info" role="status">Invitation communautaire détectée. Le code sera validé de façon sécurisée par Supabase pendant la création du compte.</div>}
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="form-grid-two">
        <FormField label="Prénom" name="firstName" autoComplete="given-name" value={values.firstName} onChange={update} error={errors.firstName} />
        <FormField label="Nom" name="lastName" autoComplete="family-name" value={values.lastName} onChange={update} error={errors.lastName} />
      </div>
      <div className="form-grid-two">
        <FormField label="Téléphone" name="phone" type="tel" autoComplete="tel" placeholder="+243…" value={values.phone} onChange={update} error={errors.phone} />
        <FormField label="Numéro WhatsApp" name="whatsapp" type="tel" autoComplete="tel" placeholder="+243…" value={values.whatsapp} onChange={update} error={errors.whatsapp} />
      </div>
      <FormField label="Adresse email" name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" value={values.email} onChange={update} error={errors.email} />
      <GeoLocationFields value={geoLocation} onChange={setGeoLocation} errors={errors} />
      <FormField label="Mot de passe" name="password" type="password" autoComplete="new-password" value={values.password} onChange={update} error={errors.password} />
      <FormField label="Confirmer le mot de passe" name="passwordConfirm" type="password" autoComplete="new-password" value={values.passwordConfirm} onChange={update} error={errors.passwordConfirm} />
      <p className="password-hint">10 caractères minimum, avec au moins une lettre et un chiffre.</p>
      <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'Création du compte…' : 'Créer mon compte'}</button>
    </form>
  </AuthFormShell>
}