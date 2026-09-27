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

  const eligibleMembers = profiles.filter((profile) => countNetworkSizeForMember(profile, profiles) >= 20)

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
  return members.filter((member) => Number(member.network_count) >= 20)
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
