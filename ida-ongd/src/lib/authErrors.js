export function friendlyAuthError(error) {
  const message = String(error?.message ?? '').toLowerCase()
  if (message.includes('already registered') || message.includes('already exists')) return 'Cette adresse email est déjà utilisée.'
  if (message.includes('invalid login credentials')) return 'Adresse email ou mot de passe incorrect.'
  if (message.includes('email not confirmed')) return 'Veuillez confirmer votre adresse email avant de vous connecter.'
  if (message.includes('password should be at least')) return 'Le mot de passe ne respecte pas les exigences de sécurité.'
  if (message.includes('rate limit') || message.includes('too many requests')) return 'Trop de tentatives. Veuillez patienter avant de réessayer.'
  if (message.includes('network') || message.includes('fetch')) return 'Connexion impossible. Vérifiez votre accès à Internet puis réessayez.'
  return 'Une erreur est survenue. Veuillez vérifier vos informations et réessayer.'
}