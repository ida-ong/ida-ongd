import { useEffect, useState } from 'react'
import { Archive, Edit3, FilePlus2, Send, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { formatJoinDate } from '../lib/date'
import { createSlug, deleteAdminContent, getAdminContent, saveAdminContent, supportsInformationArchive, supportsNewsCategories, supportsNewsImages } from '../lib/content'

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
      { name: 'image_url', label: 'URL de l’image (facultative)', type: 'url', help: 'Aucun stockage d’image n’est configuré pour le moment.' },
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
      { name: 'image_url', label: 'URL de l’image (facultative)', type: 'url', help: 'Aucun stockage d’image n’est configuré pour le moment.' },
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
    return `Le schéma Supabase de « ${missingColumn[2]} » ne contient pas encore la colonne « ${missingColumn[1]} ». Appliquez la migration Phase 7 dans Supabase, puis actualisez le schéma PostgREST.`
  }

  const missingTable = message.match(/could not find the table '([^']+)' in the schema cache/i)
  if (missingTable) {
    return `La table « ${missingTable[1]} » n’existe pas encore dans Supabase. Appliquez la migration Phase 7 puis actualisez le schéma PostgREST.`
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
  const [message, setMessage] = useState({ type: '', text: '' })

  const backPath = '/admin'

  async function loadItems() {
    const records = await getAdminContent(type)
    setItems(records)
    if (type === 'information') setCanArchive(supportsInformationArchive())
    if (type === 'news') setCanCategorizeNews(supportsNewsCategories())
    if (type === 'news') setCanUseNewsImages(supportsNewsImages())
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
      setMessage({ type: 'success', text: editing ? 'Le contenu a été mis à jour.' : 'Le contenu a été enregistré.' })
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
    if (!window.confirm(`Supprimer définitivement « ${item.title} » ?`)) return
    try {
      await deleteAdminContent(type, item.id)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      if (values.id === item.id) resetForm()
      setMessage({ type: 'success', text: 'Le contenu a été supprimé.' })
    } catch (error) {
      setMessage({ type: 'error', text: contentErrorMessage(error, type) })
    }
  }

  if (!config) return <main className="page-section"><div className="container"><p>Type de gestion inconnu.</p></div></main>

  return <main className="page-section dashboard-page"><div className="container">
    <div className="dashboard-heading"><div><span className="eyebrow">{config.eyebrow}</span><h1>{config.title}</h1><p>Les visiteurs ne voient que les contenus publiés.</p></div><Link to={backPath} className="button button-outline">Retour à l’administration</Link></div>
    {message.text && <div className={`form-notice notice-${message.type === 'error' ? 'error' : message.type === 'success' ? 'success' : 'info'}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</div>}
    {type === 'information' && !canArchive && <p className="form-notice notice-info" role="status">Le schéma Supabase actuel utilise « is_active » sans colonne « status ». La publication et la dépublication restent compatibles ; l’archivage distinct sera disponible après application de la migration Phase 7.</p>}
    {type === 'news' && !canCategorizeNews && <p className="form-notice notice-info" role="status">La colonne de domaine éditorial n’existe pas encore dans Supabase. Les actualités restent modifiables ; appliquez la migration Phase 7 pour activer leur catégorisation.</p>}
    {type === 'news' && !canUseNewsImages && <p className="form-notice notice-info" role="status">La colonne d’image n’existe pas encore dans Supabase. Les actualités restent modifiables sans image ; appliquez la migration Phase 7 pour activer ce champ.</p>}
    <div className="admin-layout content-manager-layout">
      <section className="admin-panel admin-content-form" id="content-form"><div className="panel-header"><div><span className="eyebrow">{editing ? 'Modification' : 'Nouvelle publication'}</span><h2>{editing ? 'Modifier le contenu' : 'Créer un contenu'}</h2></div><FilePlus2 size={22} /></div>
        <form className="phase5-form" onSubmit={submit}>
          {config.fields.filter((field) => !(type === 'news' && field.name === 'category' && !canCategorizeNews) && !(type === 'news' && field.name === 'image_url' && !canUseNewsImages)).map((field) => <label className="content-field" key={field.name}>{field.label}
            {field.type === 'textarea'
              ? <textarea required={field.required} rows={field.rows || 4} name={field.name} value={values[field.name] ?? ''} onChange={update} />
              : field.type === 'select'
                ? <select required={field.required} name={field.name} value={values[field.name] ?? ''} onChange={update}>{field.options.filter(([value]) => field.name !== 'status' || type !== 'information' || canArchive || value !== 'archived').map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                : <input required={field.required} type={field.type || 'text'} name={field.name} value={values[field.name] ?? ''} onChange={field.name === 'title' ? updateTitle : update} />}
            {field.help && <small>{field.help}</small>}
          </label>)}
          <div className="panel-actions"><button className="button button-primary" type="submit" disabled={saving || loading}>{saving ? 'Enregistrement…' : editing ? 'Enregistrer les changements' : 'Enregistrer'}</button>{editing && <button className="button button-outline" type="button" onClick={resetForm}>Annuler</button>}</div>
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
            <button className="button button-outline small-button content-delete" type="button" onClick={() => removeItem(item)}><Trash2 size={14} /> Supprimer</button>
          </div>
        </article>)}</div>}
      </section>
    </div>
  </div></main>
}
