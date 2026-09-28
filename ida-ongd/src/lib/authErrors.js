export function friendlyAuthError(error) {
  const message = String(error?.message ?? '').toLowerCase()
  const code = String(error?.code ?? '').toLowerCase()
  if (message.includes('already registered') || message.includes('already exists')) return 'Cette adresse email est déjà utilisée.'
  if (message.includes('invalid login credentials')) return 'Adresse email ou mot de passe incorrect.'
  if (message.includes('email not confirmed')) return 'Veuillez confirmer votre adresse email avant de vous connecter.'
  if (message.includes('password should be at least')) return 'Le mot de passe ne respecte pas les exigences de sécurité.'
  if (message.includes('database error saving new user')) return 'Supabase n’a pas pu créer le profil du compte. Vérifiez le déclencheur de création de profil dans Supabase.'
  if (code === 'pgrst202' || message.includes('could not find the function')) return 'La configuration Supabase est incomplète : appliquez les migrations SQL IDA dans Supabase.'
  if (message.includes('smtp') || message.includes('error sending confirmation')) return 'Le compte n’a pas pu recevoir son email de confirmation. Vérifiez la configuration email de Supabase.'
  if (message.includes('rate limit') || message.includes('too many requests')) return 'Trop de tentatives. Veuillez patienter avant de réessayer.'
  if (message.includes('network') || message.includes('fetch')) return 'Connexion impossible. Vérifiez votre accès à Internet puis réessayez.'
  return 'Une erreur est survenue. Veuillez vérifier vos informations et réessayer.'
}