import { useEffect, useState } from 'react'
import { Archive, Bell, Edit3, FilePlus2, ImagePlus, Send, Trash2, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { formatJoinDate } from '../lib/date'
import { createSlug, deleteAdminContent, getAdminContent, saveAdminContent, supportsInformationArchive, supportsNewsCategories, supportsNewsImages, supportsNewsVideos } from '../lib/content'
import { uploadEditorialMedia } from '../lib/editorialMedia'
import ConfirmDialog from '../components/ConfirmDialog'

const configs = {
  news: {
    title: 'Gestion des actualités',
    eyebrow: 'Administration · Actualités',
    tableType: 'news',
    fields: [
      { name: 'title', label: 'Titre', required: true },
      { name: 'slug', label: 'Adresse courte (slug)', required: true, help: 'Générée à partir du titre; vous pouvez la personnaliser.' },
      { name: 'summary', label: 'Résumé', type: 'textarea', required: true },
      { name: 'category', label: 'Domaine d’intervention', type: 'select', options: [
        ['', 'Non précisé'],
        ['Protection de l’enfant', 'Protection de l’enfant'],
        ['Jeunes filles', 'Protection et autonomisation des jeunes filles'],
        ['Éducation', 'Éducation et soutien scolaire'],
        ['Formation professionnelle', 'Formation professionnelle'],
        ['Formation numérique', 'Formation et inclusion numériques'],
        ['Aide humanitaire', 'Aide humanitaire et sécurité alimentaire'],
        ['Accompagnement social', 'Accompagnement social et psychosocial'],
        ['Prévention des violences', 'Prévention des violences'],
        ['Entrepreneuriat', 'Entrepreneuriat et intégration professionnelle'],
        ['Développement communautaire', 'Développement communautaire, égalité et inclusion'],
      ] },
      { name: 'content', label: 'Contenu complet', type: 'textarea', required: true, rows: 8 },
      { name: 'image_url', label: 'Image de couverture', type: 'media', mediaKind: 'image', help: 'JPG, PNG, WebP ou GIF · 8 Mo maximum.' },
      { name: 'video_url', label: 'Vidéo (facultative)', type: 'media', mediaKind: 'video', help: 'MP4, WebM ou MOV · 50 Mo maximum.' },
      { name: 'status', label: 'Statut', type: 'select', required: true, options: [['draft', 'Brouillon'], ['published', 'Publié'], ['archived', 'Archivé']] },
    ],
    description: (item) => item.summary,
  },
  actions: {
    title: 'Gestion des actions',
    eyebrow: 'Administration · Actions publiques',
    tableType: 'actions',
    fields: [
      { name: 'title', label: 'Titre de l’action', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true, rows: 5, help: 'Précisez si cette publication décrit une action réalisée, un projet en cours ou un objectif à venir. Ne présentez pas un projet comme déjà réalisé.' },
      { name: 'objective', label: 'Domaine d’intervention associé', type: 'select', required: true, options: [
        ['Protection de l’enfant', 'Protection de l’enfant'],
        ['Jeunes filles', 'Protection et autonomisation des jeunes filles'],
        ['Éducation', 'Éducation et soutien scolaire'],
        ['Formation professionnelle', 'Formation professionnelle'],
        ['Formation numérique', 'Formation et inclusion numériques'],
        ['Aide humanitaire', 'Aide humanitaire et sécurité alimentaire'],
        ['Accompagnement social', 'Accompagnement social et psychosocial'],
        ['Prévention des violences', 'Prévention des violences'],
        ['Entrepreneuriat', 'Entrepreneuriat et intégration socio-professionnelle'],
        ['Développement communautaire', 'Développement communautaire, inclusion et développement durable'],
      ] },
      { name: 'location', label: 'Lieu', help: 'Facultatif' },
      { name: 'date_action', label: 'Date de l’action', type: 'date', help: 'Facultatif' },
      { name: 'image_url', label: 'Image de couverture', type: 'media', mediaKind: 'image', help: 'JPG, PNG, WebP ou GIF · 8 Mo maximum.' },
      { name: 'video_url', label: 'Vidéo (facultative)', type: 'media', mediaKind: 'video', help: 'MP4, WebM ou MOV · 50 Mo maximum.' },
      { name: 'status', label: 'Statut', type: 'select', required: true, options: [['draft', 'Brouillon'], ['published', 'Publié'], ['archived', 'Archivé']] },
    ],
    description: (item) => item.objective,
  },
  information: {
    title: 'Informations importantes',
    eyebrow: 'Administration · Annonces',
    tableType: 'information',
    fields: [
      { name: 'title', label: 'Titre', required: true },
      { name: 'content', label: 'Information', type: 'textarea', required: true, rows: 6 },
      { name: 'image_url', label: 'Image (facultative)', type: 'media', mediaKind: 'image', help: 'JPG, PNG, WebP ou GIF · 8 Mo maximum.' },
      { name: 'video_url', label: 'Vidéo (facultative)', type: 'media', mediaKind: 'video', help: 'MP4, WebM ou MOV · 50 Mo maximum.' },
      { name: 'priority', label: 'Priorité', type: 'select', required: true, options: [['normal', 'Normale'], ['important', 'Importante'], ['urgent', 'Urgente']] },
      { name: 'status', label: 'Statut', type: 'select', required: true, options: [['draft', 'Brouillon'], ['published', 'Publié'], ['archived', 'Archivé']] },
    ],
    description: (item) => item.content,
  },
}

const statusLabels = { draft: 'Brouillon', published: 'Publié', archived: 'Archivé' }
const priorityLabels = { normal: 'Normale', important: 'Importante', urgent: 'Urgente' }

function contentErrorMessage(error, type) {
  console.error('[IDA] Échec de gestion de contenu Supabase.', {
    type,
    code: error?.code ?? null,
    status: error?.status ?? null,
    message: error?.message ?? String(error),
  })

  const message = String(error?.message ?? '').toLowerCase()
  const missingColumn = message.match(/could not find the '([^']+)' column of '([^']+)' in the schema cache/i)
  if (missingColumn) {
    return `Le schéma Supabase de « ${missingColumn[2]} » ne contient pas encore la colonne « ${missingColumn[1]} ». Vérifiez les colonnes distantes, appliquez la migration Phase 7 correspondante puis actualisez le schéma PostgREST.`
  }

  const missingDatabaseColumn = message.match(/column\s+(?:public\.)?([a-z_]+)\.([a-z_]+)\s+does not exist/i)
  if (missingDatabaseColumn) {
    return `La colonne « ${missingDatabaseColumn[2]} » n’existe pas dans « ${missingDatabaseColumn[1]} ». Le formulaire a été refusé par le schéma réel Supabase; appliquez la migration correspondante puis rechargez le cache PostgREST.`
  }

  const missingTable = message.match(/could not find the table '([^']+)' in the schema cache/i)
  if (missingTable) {
    return `La table « ${missingTable[1]} » n’existe pas encore dans Supabase. Vérifiez d’abord la migration Phase 7, appliquez-la au bon projet puis actualisez le schéma PostgREST.`
  }

  const missingRelation = message.match(/relation ["'](?:public\.)?([a-z_]+)["'] does not exist/i)
  if (missingRelation) {
    return `La table « public.${missingRelation[1]} » n’existe pas dans la base connectée. Exécutez le script de réparation SQL puis actualisez le schéma PostgREST.`
  }

  if (error?.code === '42703' || error?.code === 'PGRST204') {
    const column = message.match(/column\s+(?:public\.)?([a-z_]+)\.([a-z_]+)\s+does not exist/i)?.[2]
      ?? message.match(/(?:column\s+)?['"]([a-z_]+)['"]\s+(?:column|in the schema cache)/i)?.[1]
    return column
      ? `Supabase ne reconnaît pas la colonne « ${column} » pour ce contenu. Appliquez la migration Phase 7 correspondante et rechargez le cache PostgREST.`
      : 'Le schéma de la base ne correspond pas encore à cette publication. Vérifiez les colonnes et policies Supabase, puis rechargez le cache PostgREST.'
  }

  if (error?.code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return 'Supabase a refusé l’opération par sécurité (RLS). Vérifiez que votre profil possède le rôle administrateur/fondateur et que la policy INSERT/UPDATE correspondante est appliquée.'
  }

  if (error?.code === '23505') {
    return 'Une publication utilise déjà cette adresse courte (slug). Modifiez le slug puis réessayez.'
  }

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Supabase est momentanément inaccessible. Vérifiez la connexion réseau puis réessayez.'
  }

  return error?.message || 'Le contenu n’a pas pu être enregistré. Vérifiez la configuration Supabase et vos permissions.'
}

function makeEmpty(config) {
  return Object.fromEntries(config.fields.map((field) => [field.name, field.defaultValue ?? (field.name === 'status' ? 'draft' : field.name === 'priority' ? 'normal' : '')]))
}

export default function AdminContentManager({ type }) {
  const config = configs[type]
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [values, setValues] = useState(() => makeEmpty(config))
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [canArchive, setCanArchive] = useState(type !== 'information')
  const [canCategorizeNews, setCanCategorizeNews] = useState(type !== 'news')
  const [canUseNewsImages, setCanUseNewsImages] = useState(type !== 'news')
  const [canUseNewsVideos, setCanUseNewsVideos] = useState(type !== 'news')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [uploading, setUploading] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'granted')
  const [pendingDelete, setPendingDelete] = useState(null)

  const backPath = '/admin'

  async function loadItems() {
    const records = await getAdminContent(type)
    setItems(records)
    if (type === 'information') setCanArchive(supportsInformationArchive())
    if (type === 'news') setCanCategorizeNews(supportsNewsCategories())
    if (type === 'news') setCanUseNewsImages(supportsNewsImages())
    if (type === 'news') setCanUseNewsVideos(supportsNewsVideos())
  }

  useEffect(() => {
    let active = true
    getAdminContent(type)
      .then((records) => {
        if (!active) return
        setItems(records)
        if (type === 'information') setCanArchive(supportsInformationArchive())
        if (type === 'news') setCanCategorizeNews(supportsNewsCategories())
        if (type === 'news') setCanUseNewsImages(supportsNewsImages())
        if (type === 'news') setCanUseNewsVideos(supportsNewsVideos())
      })
      .catch((error) => { if (active) setMessage({ type: 'error', text: contentErrorMessage(error, type) }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [type])

  function update(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setMessage({ type: '', text: '' })
  }

  function updateTitle(event) {
    const title = event.target.value
    setValues((current) => ({
      ...current,
      title,
      ...(type === 'news' && (!current.slug || current.slug === createSlug(current.title))
        ? { slug: createSlug(title) }
        : {}),
    }))
    setMessage({ type: '', text: '' })
  }

  async function uploadMedia(event, field) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(field.name)
    setMessage({ type: 'info', text: `Téléversement de ${field.mediaKind === 'image' ? 'l’image' : 'la vidéo'}…` })
    try {
      const url = await uploadEditorialMedia(file, type, field.mediaKind)
      setValues((current) => ({ ...current, [field.name]: url }))
      setMessage({ type: 'success', text: `${field.mediaKind === 'image' ? 'Image' : 'Vidéo'} téléversée. Enregistrez la publication pour l’associer au contenu.` })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Le média n’a pas pu être téléversé. Vérifiez la migration Storage et les droits administrateur.' })
    } finally {
      setUploading('')
      event.target.value = ''
    }
  }

  async function enableNotifications() {
    if (typeof Notification === 'undefined') {
      setMessage({ type: 'error', text: 'Les notifications du navigateur ne sont pas prises en charge par ce navigateur.' })
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationsEnabled(permission === 'granted')
    setMessage(permission === 'granted'
      ? { type: 'success', text: 'Notifications de publication activées sur cet appareil.' }
      : { type: 'info', text: 'Autorisez les notifications du site dans les réglages du navigateur pour les activer.' })
  }

  function startEdit(item) {
    setValues(Object.fromEntries(config.fields.map((field) => [field.name, item[field.name] ?? '']).concat([['id', item.id]])))
    setEditing(true)
    setMessage({ type: '', text: '' })
    document.querySelector('.admin-content-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function resetForm() {
    setValues(makeEmpty(config))
    setEditing(false)
    setMessage({ type: '', text: '' })
  }

  async function submit(event) {
    event.preventDefault()
    if (!user?.id || saving) return
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      await saveAdminContent(type, values, user.id)
      await loadItems()
      resetForm()
      const successText = editing ? 'Le contenu a été mis à jour.' : 'Le contenu a été enregistré.'
      setMessage({ type: 'success', text: successText })
      if (notificationsEnabled && typeof Notification !== 'undefined') new Notification('Publication IDA enregistrée', { body: successText })
    } catch (error) {
      setMessage({ type: 'error', text: contentErrorMessage(error, type) })
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(item, status) {
    try {
      const fields = Object.fromEntries(config.fields.filter((field) => field.name !== 'status').map((field) => [field.name, item[field.name] ?? '']))
      await saveAdminContent(type, { ...fields, id: item.id, status }, user?.id)
      await loadItems()
      setMessage({ type: 'success', text: `Statut changé : ${statusLabels[status]}.` })
    } catch (error) {
      setMessage({ type: 'error', text: contentErrorMessage(error, type) })
    }
  }

  async function removeItem(item) {
    try {
      await deleteAdminContent(type, item.id)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      if (values.id === item.id) resetForm()
      setMessage({ type: 'success', text: 'Le contenu a été supprimé.' })
    } catch (error) {
      setMessage({ type: 'error', text: contentErrorMessage(error, type) })
    } finally {
      setPendingDelete(null)
    }
  }

  if (!config) return <main className="page-section"><div className="container"><p>Type de gestion inconnu.</p></div></main>

  return <main className="page-section dashboard-page"><div className="container">
    <div className="dashboard-heading"><div><span className="eyebrow">{config.eyebrow}</span><h1>{config.title}</h1><p>Les visiteurs ne voient que les contenus publiés.</p></div><Link to={backPath} className="button button-outline">Retour à l’administration</Link></div>
    <div className="content-manager-toolbar"><p className={`form-notice notice-${message.type === 'error' ? 'error' : message.type === 'success' ? 'success' : 'info'}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text || 'Les médias téléversés sont associés à la publication après son enregistrement.'}</p><button className="button button-outline small-button" type="button" onClick={enableNotifications} disabled={notificationsEnabled}><Bell size={15} />{notificationsEnabled ? 'Notifications activées' : 'Activer les notifications'}</button></div>
    {type === 'information' && !canArchive && <p className="form-notice notice-info" role="status">Le schéma Supabase actuel utilise « is_active » sans colonne « status ». La publication et la dépublication restent compatibles ; l’archivage distinct sera disponible après application de la migration Phase 7.</p>}
    {type === 'news' && !canCategorizeNews && <p className="form-notice notice-info" role="status">La colonne `category` est absente du schéma Supabase actuel. Les actualités restent créables et modifiables sans catégorie ; appliquez la migration Phase 7 pour activer ce champ.</p>}
    {type === 'news' && !canUseNewsImages && <p className="form-notice notice-info" role="status">La colonne `image_url` est absente du schéma Supabase actuel. Les actualités restent créables et modifiables sans image ; appliquez la migration Phase 7 pour activer ce champ.</p>}
    {type === 'news' && !canUseNewsVideos && <p className="form-notice notice-info" role="status">La colonne video_url est absente du schéma. Appliquez la migration médias pour joindre des vidéos aux actualités.</p>}
    <div className="admin-layout content-manager-layout">
      <section className="admin-panel admin-content-form" id="content-form"><div className="panel-header"><div><span className="eyebrow">{editing ? 'Modification' : 'Nouvelle publication'}</span><h2>{editing ? 'Modifier le contenu' : 'Créer un contenu'}</h2></div><FilePlus2 size={22} /></div>
        <form className="phase5-form" onSubmit={submit}>
          {config.fields.filter((field) => !(type === 'news' && field.name === 'category' && !canCategorizeNews) && !(type === 'news' && field.name === 'image_url' && !canUseNewsImages) && !(type === 'news' && field.name === 'video_url' && !canUseNewsVideos)).map((field) => <label className="content-field" key={field.name}>{field.label}
            {field.type === 'media'
              ? <span className="media-upload-control"><input type="file" accept={field.mediaKind === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : 'video/mp4,video/webm,video/quicktime'} onChange={(event) => void uploadMedia(event, field)} disabled={Boolean(uploading)} /><span className="button button-outline small-button">{uploading === field.name ? 'Téléversement…' : field.mediaKind === 'image' ? <><ImagePlus size={15} /> Choisir une image</> : <><Video size={15} /> Choisir une vidéo</>}</span>{values[field.name] && <span className="media-upload-current">{field.mediaKind === 'image' ? <img src={values[field.name]} alt="Aperçu du média" /> : <video src={values[field.name]} controls preload="metadata" />}<button type="button" className="button button-outline small-button" onClick={(event) => { event.preventDefault(); setValues((current) => ({ ...current, [field.name]: '' })) }}>Retirer</button></span>}</span>
              : field.type === 'textarea'
              ? <textarea required={field.required} rows={field.rows || 4} name={field.name} value={values[field.name] ?? ''} onChange={update} />
              : field.type === 'select'
                ? <select required={field.required} name={field.name} value={values[field.name] ?? ''} onChange={update}>{field.options.filter(([value]) => field.name !== 'status' || type !== 'information' || canArchive || value !== 'archived').map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                : <input required={field.required} type={field.type || 'text'} name={field.name} value={values[field.name] ?? ''} onChange={field.name === 'title' ? updateTitle : update} />}
            {field.help && <small>{field.help}</small>}
          </label>)}
          <div className="panel-actions"><button className="button button-primary" type="submit" disabled={saving || loading || Boolean(uploading)}>{saving ? 'Enregistrement…' : editing ? 'Enregistrer les changements' : 'Enregistrer'}</button>{editing && <button className="button button-outline" type="button" onClick={resetForm}>Annuler</button>}</div>
        </form>
      </section>
      <section className="admin-panel"><div className="panel-header"><div><span className="eyebrow">Bibliothèque IDA</span><h2>Contenus existants</h2></div><Archive size={22} /></div>
        {loading ? <p className="content-state" role="status">Chargement des contenus…</p> : items.length === 0 ? <p className="muted-text">Aucun contenu pour le moment. Créez votre première publication.</p> : <div className="content-admin-list">{items.map((item) => <article className="content-admin-item" key={item.id}>
          <div className="content-admin-heading"><div><h3>{item.title}</h3><p>{config.description(item)}</p></div><span className={`status-pill ${item.status === 'published' ? 'status-ready' : 'status-assigned'}`}>{statusLabels[item.status]}</span></div>
          <div className="content-admin-meta"><time dateTime={item.updated_at}>Modifié le {formatJoinDate(item.updated_at)}</time>{type === 'information' && <span className={`priority-label priority-label-${item.priority}`}>Priorité : {priorityLabels[item.priority]}</span>}</div>
          <div className="content-admin-actions"><button className="button button-outline small-button" type="button" onClick={() => startEdit(item)}><Edit3 size={14} /> Modifier</button>
            {item.status !== 'published' && <button className="button button-primary small-button" type="button" onClick={() => changeStatus(item, 'published')}><Send size={14} /> Publier</button>}
            {item.status === 'published' && <button className="button button-outline small-button" type="button" onClick={() => changeStatus(item, 'draft')}>Remettre en brouillon</button>}
            {canArchive && item.status !== 'archived' && <button className="button button-outline small-button" type="button" onClick={() => changeStatus(item, 'archived')}><Archive size={14} /> Archiver</button>}
            <button className="button button-outline small-button content-delete" type="button" onClick={() => setPendingDelete(item)}><Trash2 size={14} /> Supprimer</button>
          </div>
        </article>)}</div>}
      </section>
    </div>
    <ConfirmDialog open={Boolean(pendingDelete)} title="Supprimer cette publication ?" message={pendingDelete ? `« ${pendingDelete.title} » sera supprimée définitivement. Cette action est irréversible.` : ''} confirmLabel="Supprimer" danger onCancel={() => setPendingDelete(null)} onConfirm={() => void removeItem(pendingDelete)} />
  </div></main>
}
