import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import AuthFormShell from '../components/AuthFormShell'
import FormField from '../components/FormField'
import { friendlyAuthError } from '../lib/authErrors'
import { clearReferralCode, findInviterByCode, getSavedReferralCode } from '../lib/community'
import { supabase } from '../lib/supabase'

const initialValues = { firstName: '', lastName: '', phone: '', whatsapp: '', email: '', password: '', passwordConfirm: '', neighborhoodId: '' }

function validate(values, neighborhoods) {
  const errors = {}
  if (!values.firstName.trim()) errors.firstName = 'Le prénom est obligatoire.'
  if (!values.lastName.trim()) errors.lastName = 'Le nom est obligatoire.'
  if (!values.phone.trim()) errors.phone = 'Le numéro de téléphone est obligatoire.'
  if (!values.whatsapp.trim()) errors.whatsapp = 'Le numéro WhatsApp est obligatoire.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Saisissez une adresse email valide.'
  if (values.password.length < 10 || !/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) errors.password = 'Utilisez au moins 10 caractères, dont une lettre et un chiffre.'
  if (values.passwordConfirm !== values.password) errors.passwordConfirm = 'Les deux mots de passe ne correspondent pas.'
  if (neighborhoods.length > 0 && !values.neighborhoodId) errors.neighborhoodId = 'Veuillez choisir votre quartier.'
  return errors
}

export default function Register() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [neighborhoods, setNeighborhoods] = useState([])
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(true)
  const [neighborhoodNotice, setNeighborhoodNotice] = useState('')
  const [referralCode, setReferralCode] = useState(getSavedReferralCode)
  const [referralError, setReferralError] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  useEffect(() => {
    let active = true
    async function loadNeighborhoods() {
      try {
        const { data, error } = await supabase.from('neighborhoods').select('id, name').eq('is_active', true).order('name')
        if (!active) return
        if (error) {
          setNeighborhoods([])
          setNeighborhoodNotice('La liste des quartiers est indisponible pour le moment. Vous pouvez créer votre compte sans la renseigner ; votre quartier pourra être ajouté plus tard.')
        } else if (!data?.length) {
          setNeighborhoods([])
          setNeighborhoodNotice('Aucun quartier actif n’est disponible pour le moment. Vous pouvez poursuivre votre inscription sans sélectionner de quartier.')
        } else {
          setNeighborhoods(data)
          setNeighborhoodNotice('')
        }
      } catch {
        if (!active) return
        setNeighborhoods([])
        setNeighborhoodNotice('La liste des quartiers est momentanément inaccessible. Vous pouvez poursuivre votre inscription sans la renseigner.')
      } finally {
        if (active) setLoadingNeighborhoods(false)
      }
    }
    void loadNeighborhoods()
    return () => { active = false }
  }, [])

  function update(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setStatus({ type: '', message: '' })
  }

  async function submit(event) {
    event.preventDefault()
    const nextErrors = validate(values, neighborhoods)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || loading) return
    setLoading(true)
    setStatus({ type: '', message: '' })
    try {
      let inviter = null
      if (referralCode) {
        try {
          inviter = await findInviterByCode(referralCode)
        } catch {
          setReferralError('Impossible de vérifier ce lien auprès de Supabase. Réessayez ou créez votre compte sans invitation.')
          return
        }
        if (!inviter) {
          clearReferralCode()
          setReferralCode('')
          setReferralError("Ce lien d'invitation n'est plus valide ou n'existe pas.")
          return
        }
      }

      const neighborhood = neighborhoods.find((item) => String(item.id) === values.neighborhoodId)
      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          data: {
            first_name: values.firstName.trim(),
            last_name: values.lastName.trim(),
            phone: values.phone.trim(),
            whatsapp: values.whatsapp.trim(),
            ...(neighborhood ? { neighborhood_id: neighborhood.id } : {}),
            ...(inviter ? { referral_code: referralCode } : {}),
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
      setStatus({ type: 'success', message: confirmationRequired
        ? 'Votre demande d’inscription a bien été envoyée. Vérifiez votre email pour confirmer votre compte. Votre rattachement communautaire sera enregistré par IDA.'
        : 'Votre compte a été créé. Votre rattachement communautaire est en cours de préparation.' })
      setValues(initialValues)
    } catch {
      setStatus({ type: 'error', message: friendlyAuthError({ message: 'network error' }) })
    } finally {
      setLoading(false)
    }
  }

  function continueWithoutReferral() {
    clearReferralCode()
    setReferralCode('')
    setReferralError('')
  }

  return <AuthFormShell eyebrow="Rejoindre la communauté" title="Devenir membre" intro="Créez votre compte et prenez part à la mobilisation communautaire d’IDA." footer={<>Vous avez déjà un compte ? <Link to="/connexion">Se connecter</Link></>}>
    {status.message && <div className={`form-notice notice-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.type === 'success' && <CheckCircle2 size={19} />}{status.message}</div>}
    {referralCode && <div className="form-notice notice-info" role="status">Invitation communautaire détectée. Le code sera vérifié auprès de Supabase avant la création du compte.</div>}
    {referralError && <div className="form-notice notice-error" role="alert"><span>{referralError}</span><button className="referral-clear-button" type="button" onClick={continueWithoutReferral}>Créer un compte sans invitation</button></div>}
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
      <FormField label={neighborhoods.length ? 'Quartier' : 'Quartier (facultatif pour le moment)'} name="neighborhoodId" as="select" value={values.neighborhoodId} onChange={update} error={errors.neighborhoodId} disabled={loadingNeighborhoods || neighborhoods.length === 0}>
        <option value="">{loadingNeighborhoods ? 'Chargement des quartiers…' : neighborhoods.length ? 'Sélectionnez votre quartier' : 'Indisponible — vous pourrez le renseigner plus tard'}</option>
        {neighborhoods.map((neighborhood) => <option value={neighborhood.id} key={neighborhood.id}>{neighborhood.name}</option>)}
      </FormField>
      {neighborhoodNotice && <p className="neighborhood-notice" role="status">{neighborhoodNotice}</p>}
      <FormField label="Mot de passe" name="password" type="password" autoComplete="new-password" value={values.password} onChange={update} error={errors.password} />
      <FormField label="Confirmer le mot de passe" name="passwordConfirm" type="password" autoComplete="new-password" value={values.passwordConfirm} onChange={update} error={errors.passwordConfirm} />
      <p className="password-hint">10 caractères minimum, avec au moins une lettre et un chiffre.</p>
      <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'Création du compte…' : 'Créer mon compte'}</button>
    </form>
  </AuthFormShell>
}