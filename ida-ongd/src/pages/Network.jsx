import { useEffect, useState } from 'react'
import { ArrowLeft, Network as NetworkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import NetworkOverview from '../components/NetworkOverview'
import NetworkTree from '../components/NetworkTree'
import { getMyNetworkMembers, getMyNetworkStats } from '../lib/community'

export default function Network() {
  const { user, profile } = useAuth()
  const [community, setCommunity] = useState({ stats: null, members: [], loading: true, error: false })
  const rootName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.email || 'Mon réseau'

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

  return (
    <main className="dashboard-page page-section">
      <div className="container">
        <Link className="network-back-link" to="/dashboard"><ArrowLeft size={17} /> Retour à mon espace</Link>
        <div className="dashboard-heading network-page-heading">
          <div><span className="eyebrow"><NetworkIcon size={15} /> Mon espace communautaire</span><h1>Mon réseau</h1><p>Suivez les personnes qui ont rejoint IDA grâce à votre mobilisation.</p></div>
        </div>
        <div className="network-page-grid">
          <NetworkOverview stats={community.stats} loading={community.loading} error={community.error} directMembers={community.members.filter((member) => member.depth === 1)} />
          <NetworkTree members={community.members} loading={community.loading} error={community.error} rootName={rootName} rootId={user?.id} />
        </div>
      </div>
    </main>
  )
}