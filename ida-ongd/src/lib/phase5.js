import { supabase } from './supabase'

export const MISSION_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']
export const REPORT_STATUSES = ['submitted', 'under_review', 'approved', 'validated', 'rejected', 'needs_revision', 'correction_requested', 'resubmitted']
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
  const { data, error } = await supabase.from('reports').select('*, mission:missions(title, scheduled_date), history:report_history(*, actor:profiles!report_history_actor_id_fkey(first_name, last_name))').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAdminReports() {
  const { data, error } = await supabase.from('reports').select('*, mission:missions(title, objective, scheduled_date, location, neighborhood_id), leader:profiles!reports_leader_id_fkey(first_name, last_name, member_number, neighborhood_id), reviewer:profiles!reports_reviewed_by_fkey(first_name, last_name), history:report_history(*, actor:profiles!report_history_actor_id_fkey(first_name, last_name))').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getDashboardStats() {
  const [{ data: profiles, error: profilesError }, { data: missions, error: missionsError }, { data: activities, error: activitiesError }, { data: reports, error: reportsError }] = await Promise.all([
    supabase.from('profiles').select('id, role, is_active, neighborhood_id'),
    supabase.from('missions').select('id, status, created_at, leader_id, neighborhood_id'),
    supabase.from('activities').select('id, activity_date, leader_id, neighborhood_id, participants_count'),
    supabase.from('reports').select('id, status, leader_id, mission_id, created_at')
  ])

  if (profilesError) throw profilesError
  if (missionsError) throw missionsError
  if (activitiesError) throw activitiesError
  if (reportsError) throw reportsError

  const profilesList = profiles ?? []
  const missionsList = missions ?? []
  const activitiesList = activities ?? []
  const reportsList = reports ?? []

  const leaderCount = profilesList.filter((profile) => String(profile.role ?? '').toLowerCase() === 'leader').length
  const adminCount = profilesList.filter((profile) => ['admin', 'administrator'].includes(String(profile.role ?? '').toLowerCase())).length
  const activeMembers = profilesList.filter((profile) => profile.is_active !== false).length
  const neighborhoodsCount = new Set(profilesList.filter((profile) => profile.neighborhood_id).map((profile) => profile.neighborhood_id)).size

  const pendingReports = reportsList.filter((report) => ['submitted', 'under_review', 'resubmitted'].includes(String(report.status ?? '').toLowerCase())).length
  const validatedReports = reportsList.filter((report) => ['approved', 'validated'].includes(String(report.status ?? '').toLowerCase())).length
  const correctionReports = reportsList.filter((report) => ['needs_revision', 'correction_requested'].includes(String(report.status ?? '').toLowerCase())).length

  return {
    totalMembers: profilesList.length,
    leaders: leaderCount,
    admins: adminCount,
    neighborhoods: neighborhoodsCount,
    activeMembers,
    activeMissions: missionsList.filter((mission) => ['assigned', 'in_progress'].includes(String(mission.status ?? '').toLowerCase())).length,
    completedMissions: missionsList.filter((mission) => String(mission.status ?? '').toLowerCase() === 'completed').length,
    pendingReports,
    validatedReports,
    correctionReports,
    activities: activitiesList.length,
    participants: activitiesList.reduce((sum, activity) => sum + Number(activity.participants_count || 0), 0),
  }
}

export async function getLeaderDashboardSummary() {
  const [{ data: missions, error: missionError }, { data: reports, error: reportsError }, { data: activities, error: activitiesError }] = await Promise.all([
    supabase.from('missions').select('id, status, title').eq('leader_id', (await supabase.auth.getUser()).data.user?.id || ''),
    supabase.from('reports').select('id, status, created_at, mission_id').eq('leader_id', (await supabase.auth.getUser()).data.user?.id || ''),
    supabase.from('activities').select('id, activity_date, leader_id').eq('leader_id', (await supabase.auth.getUser()).data.user?.id || '')
  ])

  if (missionError) throw missionError
  if (reportsError) throw reportsError
  if (activitiesError) throw activitiesError

  const missionList = missions ?? []
  const reportList = reports ?? []

  return {
    missionsInProgress: missionList.filter((mission) => ['assigned', 'in_progress'].includes(String(mission.status ?? '').toLowerCase())).length,
    missionsCompleted: missionList.filter((mission) => String(mission.status ?? '').toLowerCase() === 'completed').length,
    reportsToFix: reportList.filter((report) => ['needs_revision', 'correction_requested', 'rejected'].includes(String(report.status ?? '').toLowerCase())).length,
    reportsValidated: reportList.filter((report) => ['approved', 'validated'].includes(String(report.status ?? '').toLowerCase())).length,
    activitiesCount: activities?.length ?? 0,
  }
}

export async function getReportById(id) {
  const { data, error } = await supabase.from('reports').select('*, mission:missions(title, objective, description, location, scheduled_date, scheduled_time, deadline, neighborhood_id), leader:profiles!reports_leader_id_fkey(first_name, last_name, member_number, neighborhood_id), reviewer:profiles!reports_reviewed_by_fkey(first_name, last_name), history:report_history(*, actor:profiles!report_history_actor_id_fkey(first_name, last_name))').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function validateReport(id, comment) {
  const { data, error } = await supabase.rpc('validate_report', { p_report_id: id, p_comment: comment || null })
  if (error) throw error
  return data
}

export async function requestCorrection(id, comment) {
  const { data, error } = await supabase.rpc('request_report_correction', { p_report_id: id, p_comment: comment || null })
  if (error) throw error
  return data
}

export async function rejectReport(id, comment) {
  const { data, error } = await supabase.rpc('reject_report', { p_report_id: id, p_comment: comment || null })
  if (error) throw error
  return data
}

export async function resubmitReport(id, values) {
  const { data, error } = await supabase.rpc('resubmit_report', {
    p_report_id: id,
    p_summary: values.summary,
    p_activities_done: values.activitiesDone,
    p_results: values.results,
    p_difficulties: values.difficulties || null,
    p_recommendations: values.recommendations || null,
    p_participants_count: Number(values.participantsCount),
    p_performed_on: values.performedOn,
    p_observations: values.observations || null,
    p_comment: values.comment || null,
  })
  if (error) throw error
  return data
}

export async function reviewReport(id, status, comment) {
  if (status === 'validated') return validateReport(id, comment)
  if (status === 'correction_requested') return requestCorrection(id, comment)
  if (status === 'rejected') return rejectReport(id, comment)
  const { data, error } = await supabase.rpc('review_report', { p_report_id: id, p_status: status, p_comment: comment || null })
  if (error) throw error
  return data
}
