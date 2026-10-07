import { useEffect, useState } from 'react'
import { ArrowRight, CircleAlert, HandHeart, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AdminDonations() {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadDonations() {
      const { data, error: queryError } = await supabase
        .from('donations')
        .select('id, amount, currency, status, donor_name, payment_method, created_at')
        .order('created_at', { ascending: false })
        .limit(100)
      if (!active) return
      if (queryError) {
        console.error('[IDA] Lecture du registre des dons impossible.', queryError)
        setError(queryError.message || 'Le registre des dons n’est pas accessible.')
      } else {
        setDonations(data ?? [])
      }
      setLoading(false)
    }
    void loadDonations()
    return () => { active = false }
  }, [])

  return <main className="page-section dashboard-page">
    <div className="container">
      <div className="dashboard-heading">
        <div><span className="eyebrow">Administration · Finances</span><h1>Gestion des dons</h1><p>Suivi des paiements et transparence.</p></div>
        <Link to="/admin" className="button button-outline">Retour à l’administration</Link>
      </div>
      <div className="donation-admin-notice">
        <CircleAlert size={24} />
        <div><h2>Registre des enregistrements de dons</h2><p>Les lignes ci-dessous proviennent de la table Supabase. Leur présence ou leur statut ne constitue pas une preuve de paiement : aucun prestataire, webhook ou vérification serveur n’est configuré dans cette application.</p></div>
      </div>
      <div className="admin-layout">
        <section className="admin-panel full-width"><div className="panel-header"><div><span className="eyebrow">Registre Supabase</span><h2>{loading ? 'Chargement…' : `${donations.length} enregistrement(s) récent(s)`}</h2></div><HandHeart size={22} /></div>
          {error && <p className="form-notice notice-error" role="alert">Lecture du registre impossible : {error}. Vérifiez que la migration est appliquée et que votre profil admin/fondateur a le droit de lecture.</p>}
          {!loading && !error && donations.length === 0 && <p className="muted-text">Aucun enregistrement de don à afficher.</p>}
          {!loading && !error && donations.length > 0 && <div className="table-wrapper"><table className="data-table"><thead><tr><th>Date</th><th>Donateur</th><th>Montant indicatif</th><th>Méthode</th><th>Statut enregistré</th></tr></thead><tbody>{donations.map((donation) => <tr key={donation.id}><td>{donation.created_at ? new Date(donation.created_at).toLocaleString('fr-FR') : '—'}</td><td>{donation.donor_name || 'Anonyme / non renseigné'}</td><td>{donation.amount ?? '—'} {donation.currency || ''}</td><td>{donation.payment_method || '—'}</td><td>{donation.status || '—'}</td></tr>)}</tbody></table></div>}
        </section>
        <section className="admin-panel"><div className="panel-header"><div><span className="eyebrow">Étape requise</span><h2>Vérifier le système de paiement</h2></div><ShieldCheck size={22} /></div><p className="muted-text">Choisir un fournisseur disponible en RDC, puis mettre en place une API serveur sécurisée, la vérification de webhook et l’idempotence avant d’enregistrer ou de confirmer un paiement.</p></section>
        <section className="admin-panel"><div className="panel-header"><div><span className="eyebrow">Page publique</span><h2>Modalités de don</h2></div><HandHeart size={22} /></div><p className="muted-text">Les visiteurs peuvent sélectionner un objectif, un montant et une devise avant de contacter IDA. Aucun paiement n’est simulé.</p><Link className="button button-primary" to="/dons">Voir la page des dons <ArrowRight size={16} /></Link></section>
      </div>
    </div>
  </main>
}