import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, UsersRound } from 'lucide-react'

function matchesSearch(member, query) {
  return `${member.first_name ?? ''} ${member.last_name ?? ''}`.toLocaleLowerCase('fr').includes(query)
}

function TreeBranch({ member, childrenByParent, query }) {
  const children = childrenByParent.get(member.id) ?? []
  const visibleChildren = children.filter((child) => (
    matchesSearch(child, query) || hasMatchingDescendant(child, childrenByParent, query)
  ))
  const matched = matchesSearch(member, query)
  const hasChildren = visibleChildren.length > 0
  const [expanded, setExpanded] = useState(true)

  return (
    <li className="network-tree-branch">
      <div className={`network-tree-node${matched && query ? ' network-tree-match' : ''}`}>
        {hasChildren ? (
          <button type="button" className="network-tree-toggle" onClick={() => setExpanded((value) => !value)} aria-label={`${expanded ? 'Réduire' : 'Développer'} le réseau de ${member.first_name || 'ce membre'}`} aria-expanded={expanded}>
            {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
          </button>
        ) : <span className="network-tree-spacer" />}
        <span className="network-tree-person"><strong>{[member.first_name, member.last_name].filter(Boolean).join(' ') || 'Membre IDA'}</strong><small>{member.neighborhood_name || 'Quartier non renseigné'}</small></span>
        <span className="network-tree-level">Niveau {member.depth}</span>
      </div>
      {hasChildren && expanded && <ul>{visibleChildren.map((child) => <TreeBranch key={child.id} member={child} childrenByParent={childrenByParent} query={query} />)}</ul>}
    </li>
  )
}

function hasMatchingDescendant(member, childrenByParent, query) {
  return (childrenByParent.get(member.id) ?? []).some((child) => (
    matchesSearch(child, query) || hasMatchingDescendant(child, childrenByParent, query)
  ))
}

export default function NetworkTree({ members, loading, error, rootName, rootId }) {
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLocaleLowerCase('fr')
  const childrenByParent = useMemo(() => {
    const result = new Map()
    for (const member of members) {
      const key = member.referred_by || rootId
      const children = result.get(key) ?? []
      children.push(member)
      result.set(key, children)
    }
    return result
  }, [members, rootId])
  const directMembers = childrenByParent.get(rootId) ?? []
  const visibleDirectMembers = directMembers.filter((member) => (
    !normalizedSearch || matchesSearch(member, normalizedSearch) || hasMatchingDescendant(member, childrenByParent, normalizedSearch)
  ))

  return (
    <section className="dashboard-card network-tree-card">
      <div className="dashboard-card-title"><span className="card-icon"><UsersRound size={21} /></span><div><span className="eyebrow">Structure communautaire</span><h2>Arbre de mon réseau</h2></div></div>
      <label className="network-search"><span>Rechercher dans mon réseau</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Prénom ou nom" /></label>
      {loading ? <p className="network-tree-message" role="status">Chargement du réseau…</p>
        : error ? <p className="network-tree-message" role="alert">Le réseau n’est pas disponible. Vérifiez la migration Phase 3 et les autorisations Supabase.</p>
          : members.length === 0 ? <p className="network-tree-message">Votre réseau apparaîtra ici dès vos premières invitations confirmées.</p>
            : visibleDirectMembers.length === 0 ? <p className="network-tree-message">Aucun membre de votre réseau ne correspond à cette recherche.</p>
              : <div className="network-tree-scroll"><div className="network-tree-root"><UsersRound size={17} /> {rootName || 'Mon réseau'}</div><ul className="network-tree-list">{visibleDirectMembers.map((member) => <TreeBranch key={member.id} member={member} childrenByParent={childrenByParent} query={normalizedSearch} />)}</ul></div>}
    </section>
  )
}
