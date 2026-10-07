import { supabase } from './supabase'

const BUCKET = 'ida-editorial-media'
const LIMITS = { image: 8 * 1024 * 1024, video: 50 * 1024 * 1024 }
const EXTENSIONS = { image: ['jpg', 'jpeg', 'png', 'webp', 'gif'], video: ['mp4', 'webm', 'mov'] }

export async function uploadEditorialMedia(file, type, kind) {
  if (!file) return ''
  if (!['image', 'video'].includes(kind) || !EXTENSIONS[kind].some((ext) => file.name.toLowerCase().endsWith(`.${ext}`))) {
    throw new Error(kind === 'image' ? 'Choisissez une image JPG, PNG, WebP ou GIF.' : 'Choisissez une vidéo MP4, WebM ou MOV.')
  }
  if (file.size > LIMITS[kind]) {
    throw new Error(kind === 'image' ? 'L’image dépasse la limite de 8 Mo.' : 'La vidéo dépasse la limite de 50 Mo.')
  }
  const extension = file.name.split('.').pop().toLowerCase()
  const path = `${type}/${kind}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
    upsert: false,
  })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
