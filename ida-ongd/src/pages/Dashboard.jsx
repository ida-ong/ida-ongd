import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, ExternalLink, HeartHandshake, Share2, ShieldCheck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import NetworkMemberCard from '../components/NetworkMemberCard'
import NetworkOverview from '../components/NetworkOverview'
import { getMyNetworkMembers, getMyNetworkStats } from '../lib/community'

export default function Dashboard() {
  const { user, profile, profileError } = useAuth()
  const [community, setCommunity] = useState({ stats: null, members: [], loading: true, error: false })
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  useEffect(() => {
    let active = true
    async function loadCommunity() {
      const [statsResult, membersResult] = await Promise.allSettled([getMyNetworkStats(), getMyNetworkMembers()])
      if (!active) return
      setCommunity({
        stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
        members: membersResult.status === 'fulfilled' ? membersResult.value : [],
        loading: false,
        error: statsResult.status === 'rejected' || membersResult.status === 'rejected',
      })
    }
    void loadCommunity()
    return () => { active = false }
  }, [])

  const affiliateCode = profile?.affiliate_code
  const affiliateLink = useMemo(() => affiliateCode
    ? `${window.location.origin}/rejoindre/${encodeURIComponent(affiliateCode)}`
    : '', [affiliateCode])
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.email || 'Membre IDA'
  const role = String(profile?.role || 'member').replaceAll('_', ' ')
  const directMembers = community.members.filter((member) => member.depth === 1)

  async function copyLink() {
    if (!affiliateLink || !navigator.clipboard?.writeText) {
      setCopyError(true)
      return
    }
    try {
      await navigator.clipboard.writeText(affiliateLink)
      setCopyError(false)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopyError(true)
    }
  }

  const whatsappLink = affiliateLink
    ? `https://wa.me/?text=${encodeURIComponent(`Je participe aux actions communautaires de l’ONGD IDA — Initiative Dignité Autonomisation à Lubumbashi. Découvre l’initiative et rejoins-nous : ${affiliateLink}`)}`
    : undefined

  return <main className="dashboard-page page-section"><div className="container">
    <div className="dashboard-heading"><div><span className="eyebrow">Espace membre</span><h1>Bienvenue, {profile?.first_name || 'membre'}</h1><p>Retrouvez ici votre profil et votre engagement communautaire.</p></div><span className="role-pill"><ShieldCheck size={16} /> {role}</span></div>
    {profileError && <div className="form-notice notice-error" role="status">Votre session est active, mais les informations du profil ne sont pas disponibles pour le moment.</div>}
    {user && !profile && !profileError && <div className="form-notice notice-error" role="status">Connexion réussie, mais aucun profil IDA n’est associé à ce compte. Contactez l’administration pour vérifier votre profil.</div>}
    <div className="dashboard-grid">
      <section className="dashboard-card profile-card">
        <div className="profile-heading">{profile?.avatar_url ? <img className="profile-avatar" src={profile.avatar_url} alt="" /> : <div className="profile-avatar profile-avatar-placeholder" aria-hidden="true">{fullName.slice(0, 1).toUpperCase()}</div>}<div><span className="eyebrow">Mon profil</span><h2>{fullName}</h2><span className="role-pill role-pill-soft">{role}</span></div></div>
        <dl className="profile-details">
          <div><dt>Numéro de membre</dt><dd>{profile?.member_number || 'En cours de création par IDA'}</dd></div>
          <div><dt>Quartier</dt><dd>{community.stats?.neighborhood_name || 'Non renseigné'}</dd></div>
          <div><dt>Téléphone</dt><dd>{profile?.phone || '—'}</dd></div>
          <div><dt>WhatsApp</dt><dd>{profile?.whatsapp || '—'}</dd></div>
          <div><dt>Email</dt><dd>{user?.email || '—'}</dd></div>
        </dl>
      </section>

      <NetworkOverview stats={community.stats} loading={community.loading} error={community.error} />

      <section className="dashboard-card referral-card"><div className="dashboard-card-title"><span className="card-icon"><HeartHandshake size={21} /></span><div><span className="eyebrow">Mobilisation communautaire</span><h2>Mon lien d’affiliation</h2></div></div>
        {profile?.referred_by && <p className="form-notice notice-info">Vous avez rejoint IDA grâce à une invitation communautaire.</p>}
        {affiliateCode ? <><div className="affiliate-code"><span>Votre code</span><strong>{affiliateCode}</strong></div><p className="affiliate-url">{affiliateLink}</p><div className="referral-actions"><button type="button" className="button button-primary" onClick={copyLink} disabled={!navigator.clipboard?.writeText}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Lien copié !' : 'Copier le lien'}</button><a className="button button-outline" href={whatsappLink} target="_blank" rel="noreferrer"><Share2 size={17} /> Partager sur WhatsApp <ExternalLink size={14} /></a></div>{copyError && <p className="field-error" role="alert">La copie automatique n’est pas disponible. Sélectionnez et copiez le lien affiché.</p>}</> : <p className="network-footnote">Votre code d’affiliation sera affiché ici dès qu’il aura été généré par Supabase.</p>}
      </section>

      <section className="dashboard-card direct-members-card">
        <div className="dashboard-card-title"><span className="card-icon"><UsersRound size={21} /></span><div><span className="eyebrow">Invitations personnelles</span><h2>Mes membres directs</h2></div></div>
        {community.error && <p className="network-tree-message" role="status">Les données détaillées du réseau nécessitent l’application de la migration Phase 3 dans Supabase.</p>}
        {!community.error && !community.loading && directMembers.length === 0 && <p className="network-footnote">Aucune inscription directe n’est encore rattachée à votre compte.</p>}
        <div className="network-direct-list">{directMembers.map((member) => <NetworkMemberCard key={member.id} member={member} />)}</div>
        <Link className="button button-outline network-tree-link" to="/dashboard/reseau">Voir l’arbre complet de mon réseau <ExternalLink size={15} /></Link>
      </section>
    </div>
    <div className="dashboard-help"><HeartHandshake size={20} /><p>Merci de contribuer à la dignité et à l’autonomisation des communautés de Lubumbashi.</p><Link to="/actions">Découvrir nos actions →</Link></div>
  </div></main>
}