import { ArrowRight, CircleAlert, HandHeart, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDonations() {
  return <main className="page-section dashboard-page">
    <div className="container">
      <div className="dashboard-heading">
        <div><span className="eyebrow">Administration · Finances</span><h1>Gestion des dons</h1><p>Suivi des paiements et transparence.</p></div>
        <Link to="/admin" className="button button-outline">Retour à l’administration</Link>
      </div>
      <div className="donation-admin-notice">
        <CircleAlert size={24} />
        <div><h2>Le registre de dons n’est pas encore connecté</h2><p>Aucun montant, statut ou nombre de transactions n’est affiché : le projet ne comporte pas de fournisseur de paiement configuré et le schéma réel ainsi que les politiques RLS de la table de dons n’ont pas pu être vérifiés dans le projet Supabase lié.</p></div>
      </div>
      <div className="admin-layout">
        <section className="admin-panel"><div className="panel-header"><div><span className="eyebrow">Étape requise</span><h2>Vérifier le système de paiement</h2></div><ShieldCheck size={22} /></div><p className="muted-text">Choisir un fournisseur disponible en RDC, puis mettre en place une API serveur sécurisée, la vérification de webhook et le registre des transactions après inspection du schéma existant.</p></section>
        <section className="admin-panel"><div className="panel-header"><div><span className="eyebrow">Page publique</span><h2>Modalités de don</h2></div><HandHeart size={22} /></div><p className="muted-text">Les visiteurs peuvent sélectionner un objectif, un montant et une devise avant de contacter IDA. Aucun paiement n’est simulé.</p><Link className="button button-primary" to="/dons">Voir la page des dons <ArrowRight size={16} /></Link></section>
      </div>
    </div>
  </main>
}