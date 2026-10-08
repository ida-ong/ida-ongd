import { supabase } from './supabase'

export function countNetworkSizeForMember(member, members) {
  const allMembers = Array.isArray(members) ? members : []
  const byParent = new Map()

  allMembers.forEach((item) => {
    const parentId = item.referred_by || null
    if (parentId) {
      const next = byParent.get(parentId) ?? []
      next.push(item)
      byParent.set(parentId, next)
    }
  })

  const visited = new Set()
  function traverse(currentId) {
    if (!currentId || visited.has(currentId)) return 0
    visited.add(currentId)
    const children = byParent.get(currentId) ?? []
    let total = 0
    children.forEach((child) => {
      total += 1 + traverse(child.id)
    })
    return total
  }

  return traverse(member.id)
}

export async function getAdminStats() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, is_active, neighborhood_id, created_at, referred_by')

  if (error) throw error

  const profiles = data ?? []
  const memberCount = profiles.length
  const leaderCount = profiles.filter((profile) => String(profile.role ?? '').toLowerCase() === 'leader').length
  const adminCount = profiles.filter((profile) => ['admin', 'administrator'].includes(String(profile.role ?? '').toLowerCase())).length
  const activeCount = profiles.filter((profile) => profile.is_active !== false).length
  const neighborhoods = new Set(profiles.filter((profile) => profile.neighborhood_id).map((profile) => profile.neighborhood_id))

  const eligibleMembers = profiles.filter((profile) => String(profile.role ?? '').toLowerCase() === 'member' && countNetworkSizeForMember(profile, profiles) >= 20)

  return {
    totalMembers: memberCount,
    leaders: leaderCount,
    admins: adminCount,
    neighborhoods: neighborhoods.size,
    eligible: eligibleMembers.length,
    active: activeCount,
  }
}

export async function getAdminMembers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone, whatsapp, role, member_number, affiliate_code, referred_by, neighborhood_id, created_at, is_active, geo_province_id, geo_locality_id, geo_commune_id, geo_quartier_id, geo_road_id, geo_rural_unit_id, geo_groupement_id, geo_village_id')
    .order('created_at', { ascending: false })

  if (error) throw error

  const profiles = data ?? []
  async function loadNames(table, idColumn) {
    const ids = [...new Set(profiles.map((profile) => profile[idColumn]).filter(Boolean))]
    if (!ids.length) return new Map()
    const { data: rows, error: lookupError } = await supabase.from(table).select('*').in('id', ids)
    if (lookupError) throw lookupError
    return new Map((rows ?? []).map((row) => [row.id, row]))
  }

  const [neighborhoodMap, provinceMap, localityMap, communeMap, quartierMap, roadMap, ruralUnitMap, groupingMap, villageMap] = await Promise.all([
    loadNames('neighborhoods', 'neighborhood_id'),
    loadNames('ida_geo_provinces', 'geo_province_id'),
    loadNames('ida_geo_localities', 'geo_locality_id'),
    loadNames('ida_geo_communes', 'geo_commune_id'),
    loadNames('ida_geo_quartiers', 'geo_quartier_id'),
    loadNames('ida_geo_roads', 'geo_road_id'),
    loadNames('ida_geo_rural_units', 'geo_rural_unit_id'),
    loadNames('ida_geo_groupements', 'geo_groupement_id'),
    loadNames('ida_geo_villages', 'geo_village_id'),
  ])

  const label = (map, id) => {
    const row = id ? map.get(id) : null
    if (!row) return ''
    return `${row.name}${row.verification_status === 'needs_review' ? ' (à vérifier)' : ''}`
  }

  return profiles.map((profile) => ({
    ...profile,
    neighborhood_name: label(quartierMap, profile.geo_quartier_id) || neighborhoodMap.get(profile.neighborhood_id)?.name || '—',
    geo_province_name: label(provinceMap, profile.geo_province_id),
    geo_locality_name: label(localityMap, profile.geo_locality_id),
    geo_locality_type: localityMap.get(profile.geo_locality_id)?.locality_type ?? '',
    geo_commune_name: label(communeMap, profile.geo_commune_id),
    geo_quartier_name: label(quartierMap, profile.geo_quartier_id),
    geo_road_name: label(roadMap, profile.geo_road_id),
    geo_rural_unit_name: label(ruralUnitMap, profile.geo_rural_unit_id),
    geo_groupement_name: label(groupingMap, profile.geo_groupement_id),
    geo_village_name: label(villageMap, profile.geo_village_id),
    network_count: countNetworkSizeForMember(profile, profiles),
  }))
}

export async function getEligibleMembers() {
  const members = await getAdminMembers()
  return members.filter((member) => normalizeMemberRole(member.role) === 'member' && Number(member.network_count) >= 20)
}

function normalizeMemberRole(role) {
  const value = String(role ?? '').trim().toLowerCase()
  if (value === 'administrator') return 'admin'
  if (value === 'fondateur') return 'founder'
  return value || 'member'
}

export async function nominateMemberRole(targetId, nextRole) {
  const { data, error } = await supabase.rpc('set_member_role', {
    p_target_id: targetId,
    p_new_role: nextRole,
    p_reason: 'Nomination ou retrait de rôle via l’interface d’administration.',
  })

  if (error) throw error
  return data
}

export function roleMutationErrorMessage(error) {
  const message = String(error?.message ?? '').toLowerCase()
  if (error?.code === 'PGRST202' || error?.code === '42883') {
    return 'La fonction Supabase de changement de rôle est absente du cache. Appliquez la migration Phase 4, puis rechargez le schéma PostgREST.'
  }
  if (error?.code === '42501' || message.includes('permission denied') || message.includes('row-level security')) {
    return 'Supabase a refusé la nomination. Vérifiez que votre compte est bien fondateur et que la policy/RPC de changement de rôle est appliquée.'
  }
  if (error?.code === '22023') return error.message || 'La nomination est refusée par une règle métier (par exemple le seuil d’éligibilité du leader).'
  if (error?.code === 'P0002') return 'Le profil à modifier est introuvable dans Supabase.'
  if (message.includes('failed to fetch') || message.includes('network')) return 'Supabase est inaccessible. Vérifiez la connexion puis réessayez.'
  return error?.message || 'Le changement de rôle a échoué. Consultez le code d’erreur Supabase et les policies RLS.'
}
