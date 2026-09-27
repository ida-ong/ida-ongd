export function formatJoinDate(date) {
  if (!date) return 'Date non disponible'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime())
    ? 'Date non disponible'
    : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(parsed)
}