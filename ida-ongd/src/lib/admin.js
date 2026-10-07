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
    .select('id, first_name, last_name, email, phone, whatsapp, role, member_number, affiliate_code, referred_by, neighborhood_id, created_at, is_active')
    .order('created_at', { ascending: false })

  if (error) throw error

  const profiles = data ?? []
  const neighborhoodIds = [...new Set(profiles.filter((profile) => profile.neighborhood_id).map((profile) => profile.neighborhood_id))]
  const { data: neighborhoodsData, error: neighborhoodsError } = neighborhoodIds.length
    ? await supabase.from('neighborhoods').select('id, name').in('id', neighborhoodIds)
    : { data: [], error: null }

  if (neighborhoodsError) throw neighborhoodsError

  const neighborhoodMap = new Map((neighborhoodsData ?? []).map((neighborhood) => [neighborhood.id, neighborhood.name]))

  return profiles.map((profile) => ({
    ...profile,
    neighborhood_name: neighborhoodMap.get(profile.neighborhood_id) ?? '—',
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
