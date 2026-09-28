import { useEffect, useState } from 'react'
import { Archive, Edit3, FilePlus2, Send, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { formatJoinDate } from '../lib/date'
import { createSlug, deleteAdminContent, getAdminContent, saveAdminContent } from '../lib/content'

const configs = {
  news: {
    title: 'Gestion des actualités',
    eyebrow: 'Administration · Actualités',
    tableType: 'news',
    fields: [
      { name: 'title', label: 'Titre', required: true },
      { name: 'slug', label: 'Adresse courte (slug)', required: true, help: 'Générée à partir du titre; vous pouvez la personnaliser.' },
      { name: 'summary', label: 'Résumé', type: 'textarea', required: true },
      { name: 'content', label: 'Contenu complet', type: 'textarea', required: true, rows: 8 },
      { name: 'image_url', label: 'URL de l’image (facultative)', type: 'url', help: 'Aucun stockage d’image n’est configuré pour le moment.' },
      { name: 'author', label: 'Auteur', required: true, defaultValue: 'Équipe IDA' },
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
      { name: 'description', label: 'Description', type: 'textarea', required: true, rows: 5 },
      { name: 'objective', label: 'Objectif', type: 'textarea', required: true, rows: 3 },
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
  const [message, setMessage] = useState({ type: '', text: '' })

  const backPath = '/admin'

  async function loadItems() {
    const records = await getAdminContent(type)
    setItems(records)
  }

  useEffect(() => {
    let active = true
    getAdminContent(type)
      .then((records) => { if (active) setItems(records) })
      .catch((error) => { if (active) setMessage({ type: 'error', text: error.message || 'Les contenus sont indisponibles.' }) })
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
      setMessage({ type: 'error', text: error.message || 'Enregistrement impossible. Vérifiez la migration Phase 7 et vos permissions.' })
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
      setMessage({ type: 'error', text: error.message || 'Le statut n’a pas pu être modifié.' })
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
      setMessage({ type: 'error', text: error.message || 'La suppression a échoué.' })
    }
  }

  if (!config) return <main className="page-section"><div className="container"><p>Type de gestion inconnu.</p></div></main>

  return <main className="page-section dashboard-page"><div className="container">
    <div className="dashboard-heading"><div><span className="eyebrow">{config.eyebrow}</span><h1>{config.title}</h1><p>Les visiteurs ne voient que les contenus publiés.</p></div><Link to={backPath} className="button button-outline">Retour à l’administration</Link></div>
    {message.text && <div className={`form-notice notice-${message.type === 'error' ? 'error' : message.type === 'success' ? 'success' : 'info'}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</div>}
    <div className="admin-layout content-manager-layout">
      <section className="admin-panel admin-content-form" id="content-form"><div className="panel-header"><div><span className="eyebrow">{editing ? 'Modification' : 'Nouvelle publication'}</span><h2>{editing ? 'Modifier le contenu' : 'Créer un contenu'}</h2></div><FilePlus2 size={22} /></div>
        <form className="phase5-form" onSubmit={submit}>
          {config.fields.map((field) => <label className="content-field" key={field.name}>{field.label}
            {field.type === 'textarea'
              ? <textarea required={field.required} rows={field.rows || 4} name={field.name} value={values[field.name] ?? ''} onChange={update} />
              : field.type === 'select'
                ? <select required={field.required} name={field.name} value={values[field.name] ?? ''} onChange={update}>{field.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                : <input required={field.required} type={field.type || 'text'} name={field.name} value={values[field.name] ?? ''} onChange={field.name === 'title' ? updateTitle : update} />}
            {field.help && <small>{field.help}</small>}
          </label>)}
          <div className="panel-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : editing ? 'Enregistrer les changements' : 'Enregistrer'}</button>{editing && <button className="button button-outline" type="button" onClick={resetForm}>Annuler</button>}</div>
        </form>
      </section>
      <section className="admin-panel"><div className="panel-header"><div><span className="eyebrow">Bibliothèque IDA</span><h2>Contenus existants</h2></div><Archive size={22} /></div>
        {loading ? <p className="content-state" role="status">Chargement des contenus…</p> : items.length === 0 ? <p className="muted-text">Aucun contenu pour le moment. Créez votre première publication.</p> : <div className="content-admin-list">{items.map((item) => <article className="content-admin-item" key={item.id}>
          <div className="content-admin-heading"><div><h3>{item.title}</h3><p>{config.description(item)}</p></div><span className={`status-pill ${item.status === 'published' ? 'status-ready' : 'status-assigned'}`}>{statusLabels[item.status]}</span></div>
          <div className="content-admin-meta"><time dateTime={item.updated_at}>Modifié le {formatJoinDate(item.updated_at)}</time>{type === 'information' && <span className={`priority-label priority-label-${item.priority}`}>Priorité : {priorityLabels[item.priority]}</span>}</div>
          <div className="content-admin-actions"><button className="button button-outline small-button" type="button" onClick={() => startEdit(item)}><Edit3 size={14} /> Modifier</button>
            {item.status !== 'published' && <button className="button button-primary small-button" type="button" onClick={() => changeStatus(item, 'published')}><Send size={14} /> Publier</button>}
            {item.status === 'published' && <button className="button button-outline small-button" type="button" onClick={() => changeStatus(item, 'draft')}>Remettre en brouillon</button>}
            {item.status !== 'archived' && <button className="button button-outline small-button" type="button" onClick={() => changeStatus(item, 'archived')}><Archive size={14} /> Archiver</button>}
            <button className="button button-outline small-button content-delete" type="button" onClick={() => removeItem(item)}><Trash2 size={14} /> Supprimer</button>
          </div>
        </article>)}</div>}
      </section>
    </div>
  </div></main>
}
