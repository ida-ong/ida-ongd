import { supabase } from './supabase'

const tables = {
  news: 'news',
  actions: 'public_actions',
  information: 'important_information',
}

const writableColumns = {
  news: ['title', 'slug', 'summary', 'content', 'image_url', 'category', 'status'],
  actions: ['title', 'description', 'objective', 'location', 'date_action', 'image_url', 'status'],
  information: ['title', 'content', 'priority', 'status'],
}

let informationStatusColumnAvailable = true
let newsCategoryColumnAvailable = false

function isMissingStatusColumn(error) {
  const message = String(error?.message ?? '').toLowerCase()
  return message.includes("column 'status'") || message.includes('column important_information.status does not exist')
}

export function supportsInformationArchive() {
  return informationStatusColumnAvailable
}

export function supportsNewsCategories() {
  return newsCategoryColumnAvailable
}

function tableFor(type) {
  const table = tables[type]
  if (!table) throw new Error('Type de contenu IDA inconnu.')
  return supabase.from(table)
}

export async function getPublishedContent(type, { limit } = {}) {
  const makeQuery = (statusColumn) => {
    let query = tableFor(type)
      .select('*')
      .order('published_at', { ascending: false })
    query = statusColumn ? query.eq('status', 'published') : query.eq('is_active', true)
    if (limit) query = query.limit(limit)
    return query
  }

  let result = await makeQuery(true)
  if (type === 'information' && result.error && isMissingStatusColumn(result.error)) {
    informationStatusColumnAvailable = false
    result = await makeQuery(false)
  } else if (type === 'information' && !result.error) {
    informationStatusColumnAvailable = true
  }
  const { data, error } = result
  if (error) throw error
  return (data ?? []).map((item) => type === 'news' ? { ...item, summary: item.excerpt } : item)
}

export async function getNewsBySlug(slug) {
  const { data, error } = await tableFor('news')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw error
  return data ? { ...data, summary: data.excerpt } : null
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
  const makeQuery = (select) => tableFor(type).select(select).order('updated_at', { ascending: false })
  let result = await makeQuery(type === 'information' ? '*, status' : type === 'news' ? '*, category' : '*')
  if (type === 'information' && result.error && isMissingStatusColumn(result.error)) {
    informationStatusColumnAvailable = false
    result = await makeQuery('*')
  } else if (type === 'information' && !result.error) {
    informationStatusColumnAvailable = true
  } else if (type === 'news' && result.error && String(result.error.message ?? '').toLowerCase().includes('column news.category does not exist')) {
    newsCategoryColumnAvailable = false
    result = await makeQuery('*')
  } else if (type === 'news' && !result.error) {
    newsCategoryColumnAvailable = true
  }
  const { data, error } = result
  if (error) throw error
  return (data ?? []).map((item) => {
    if (type === 'news') return { ...item, summary: item.excerpt }
    if (type === 'information' && !informationStatusColumnAvailable) {
      return { ...item, status: item.is_active ? 'published' : 'draft' }
    }
    return item
  })
}

export async function saveAdminContent(type, values, userId) {
  const query = tableFor(type)
  const { id, ...fields } = values
  const allowedColumns = writableColumns[type]
  const normalizedFields = Object.fromEntries(allowedColumns
    .filter((key) => Object.hasOwn(fields, key))
    .map((key) => [key, ['image_url', 'location', 'date_action', 'category'].includes(key) && fields[key] === '' ? null : fields[key]]))
  if (type === 'news' && !newsCategoryColumnAvailable) delete normalizedFields.category
  const payload = type === 'news'
    ? { ...normalizedFields, excerpt: normalizedFields.summary }
    : type === 'information' && !informationStatusColumnAvailable
      ? { ...normalizedFields, is_active: normalizedFields.status === 'published' }
      : normalizedFields
  if (type === 'news') delete payload.summary
  if (type === 'information' && !informationStatusColumnAvailable) delete payload.status
  if (!id && type === 'news') payload.author_id = userId
  if (!id && type !== 'news') payload.created_by = userId
  const result = id
    ? await query.update(payload).eq('id', id).select().single()
    : await query.insert(payload).select().single()
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
