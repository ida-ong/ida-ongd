import { supabase } from './supabase'

const tables = {
  news: 'news_articles',
  actions: 'public_actions',
  information: 'important_information',
}

function tableFor(type) {
  const table = tables[type]
  if (!table) throw new Error('Type de contenu IDA inconnu.')
  return supabase.from(table)
}

export async function getPublishedContent(type, { limit } = {}) {
  let query = tableFor(type)
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getNewsBySlug(slug) {
  const { data, error } = await tableFor('news')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getPublicActionById(id) {
  const { data, error } = await tableFor('actions')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getAdminContent(type) {
  const { data, error } = await tableFor(type)
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function saveAdminContent(type, values, userId) {
  const query = tableFor(type)
  const { id, ...fields } = values
  const result = id
    ? await query.update(fields).eq('id', id).select().single()
    : await query.insert({ ...fields, created_by: userId }).select().single()
  if (result.error) throw result.error
  return result.data
}

export async function deleteAdminContent(type, id) {
  const { error } = await tableFor(type).delete().eq('id', id)
  if (error) throw error
}

export function createSlug(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
