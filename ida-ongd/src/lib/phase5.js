import { supabase } from './supabase'

export const MISSION_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']
export const REPORT_STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'needs_revision']
export const ACTIVITY_TYPES = [
  ['meeting', 'Réunion communautaire'],
  ['awareness', 'Sensibilisation'],
  ['mobilization', 'Mobilisation'],
  ['community_visit', 'Visite communautaire'],
  ['education', 'Activité éducative'],
  ['protection', 'Activité de protection'],
  ['empowerment', 'Activité d’autonomisation'],
  ['other', 'Autre activité'],
]

export async function listLeaders() {
  const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, member_number, neighborhood_id').eq('role', 'leader').order('last_name')
  if (error) throw error
  return data ?? []
}

export async function listNeighborhoods() {
  const { data, error } = await supabase.from('neighborhoods').select('id, name').eq('is_active', true).order('name')
  if (error) throw error
  return data ?? []
}

export async function createMission(values) {
  const { data, error } = await supabase.rpc('create_mission', {
    p_title: values.title,
    p_description: values.description,
    p_objective: values.objective,
    p_location: values.location || null,
    p_scheduled_date: values.scheduledDate || null,
    p_scheduled_time: values.scheduledTime || null,
    p_deadline: values.deadline || null,
    p_leader_id: values.leaderId,
    p_neighborhood_id: values.neighborhoodId || null,
  })
  if (error) throw error
  return data
}

export async function getAdminMissions() {
  const { data, error } = await supabase.from('missions').select('*, leader:profiles!missions_leader_id_fkey(first_name, last_name, member_number), creator:profiles!missions_created_by_fkey(first_name, last_name)').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getLeaderMissions() {
  const { data, error } = await supabase.from('missions').select('*, creator:profiles!missions_created_by_fkey(first_name, last_name)').order('scheduled_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getMission(id) {
  const { data, error } = await supabase.from('missions').select('*, leader:profiles!missions_leader_id_fkey(first_name, last_name, member_number), creator:profiles!missions_created_by_fkey(first_name, last_name)').eq('id', id).single()
  if (error) throw error
  return data
}

export async function updateMissionStatus(id, status) {
  const { data, error } = await supabase.rpc('update_mission_status', { p_mission_id: id, p_status: status })
  if (error) throw error
  return data
}

export async function createActivity(values) {
  const { data, error } = await supabase.rpc('create_activity', {
    p_title: values.title,
    p_activity_type: values.activityType,
    p_description: values.description,
    p_activity_date: values.activityDate,
    p_location: values.location || null,
    p_neighborhood_id: values.neighborhoodId || null,
    p_participants_count: Number(values.participantsCount),
    p_mission_id: values.missionId || null,
  })
  if (error) throw error
  return data
}

export async function getLeaderActivities() {
  const { data, error } = await supabase.from('activities').select('*, mission:missions(title)').order('activity_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createReport(values) {
  const { data, error } = await supabase.rpc('create_report', {
    p_mission_id: values.missionId,
    p_summary: values.summary,
    p_activities_done: values.activitiesDone,
    p_results: values.results,
    p_difficulties: values.difficulties || null,
    p_recommendations: values.recommendations || null,
    p_participants_count: Number(values.participantsCount),
    p_performed_on: values.performedOn,
    p_observations: values.observations || null,
  })
  if (error) throw error
  return data
}

export async function getLeaderReports() {
  const { data, error } = await supabase.from('reports').select('*, mission:missions(title, scheduled_date)').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAdminReports() {
  const { data, error } = await supabase.from('reports').select('*, mission:missions(title), leader:profiles!reports_leader_id_fkey(first_name, last_name, member_number)').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function reviewReport(id, status, comment) {
  const { data, error } = await supabase.rpc('review_report', { p_report_id: id, p_status: status, p_comment: comment || null })
  if (error) throw error
  return data
}
