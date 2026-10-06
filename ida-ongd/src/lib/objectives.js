import {
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Laptop,
  Leaf,
  Megaphone,
  ShieldCheck,
  Users,
} from 'lucide-react'

export const objectives = [
  ['Protection de l’enfant', 'Lutter contre les violences, abus, exploitation, négligence et autres situations de vulnérabilité touchant les enfants.', ShieldCheck],
  ['Protection et autonomisation des jeunes filles', 'Favoriser la protection, l’éducation, la formation et l’autonomie des jeunes filles.', HeartPulse],
  ['Éducation', 'Contribuer à améliorer l’accès à l’éducation et le maintien des enfants à l’école.', BookOpen],
  ['Formation professionnelle', 'Développer les compétences professionnelles des jeunes filles et des personnes vulnérables.', BriefcaseBusiness],
  ['Formation numérique', 'Favoriser l’accès aux compétences numériques et à l’alphabétisation numérique.', Laptop],
  ['Accompagnement social et psychosocial', 'Apporter un accompagnement adapté et orienter les victimes vers les services compétents.', Users],
  ['Aide humanitaire', 'Contribuer, selon les ressources disponibles, à l’aide alimentaire, aux vêtements, aux fournitures scolaires et au soutien matériel.', HandHeart],
  ['Prévention des violences', 'Sensibiliser les familles et les communautés à la protection de l’enfant et à la prévention des violences.', Megaphone],
  ['Entrepreneuriat et autonomisation économique', 'Favoriser les initiatives économiques, entrepreneuriales et professionnelles qui renforcent l’autonomie.', GraduationCap],
  ['Développement communautaire', 'Soutenir des initiatives durables qui encouragent l’inclusion, la solidarité et la participation communautaire.', Leaf],
]

export function objectiveSlug(title) {
  return String(title ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}