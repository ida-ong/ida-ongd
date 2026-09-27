import { supabase } from './supabase'

export const REFERRAL_STORAGE_KEY = 'ida_referral_code'
export const NETWORK_GOAL = 20

export async function findInviterByCode(affiliateCode) {
  const { data, error } = await supabase.rpc('get_referral_inviter', {
    p_affiliate_code: affiliateCode.trim(),
  })
  if (error) throw error
  return Array.isArray(data) ? data[0] ?? null : data ?? null
}

export async function getMyNetworkStats() {
  const [countResult, statsResult] = await Promise.all([
    supabase.rpc('get_network_member_count'),
    supabase.rpc('get_my_network_stats'),
  ])
  if (countResult.error) throw countResult.error
  if (statsResult.error) throw statsResult.error
  const stats = Array.isArray(statsResult.data) ? statsResult.data[0] ?? null : statsResult.data ?? null
  const networkCount = Number(countResult.data)
  return stats ? { ...stats, network_count: Number.isFinite(networkCount) ? networkCount : null } : null
}

export async function getMyNetworkMembers() {
  const { data, error } = await supabase.rpc('get_my_network_members')
  if (error) throw error
  return data ?? []
}

export function getSavedReferralCode() {
  try {
    return window.sessionStorage.getItem(REFERRAL_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function saveReferralCode(code) {
  try {
    window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, code)
  } catch {
    // Registration still works when browser storage is unavailable.
  }
}

export function clearReferralCode() {
  try {
    window.sessionStorage.removeItem(REFERRAL_STORAGE_KEY)
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}
