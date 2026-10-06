import { Link } from 'react-router-dom'
import { MapPin, MessageCircle } from 'lucide-react'
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '../lib/contact'
import logo from '../assets/logo.png'

const footerLinks = [['Accueil', '/'], ['À propos', '/a-propos'], ['Nos objectifs', '/objectifs'], ['Nos actions', '/actions'], ['Actualités', '/actualites'], ['Informations', '/informations'], ['Faire un don', '/dons'], ['Contact', '/contact'], ['Devenir membre', '/inscription'], ['Connexion', '/connexion']]

export default function Footer() {
  return <footer className="site-footer">
    <div className="container footer-main">
      <div className="footer-brand"><img src={logo} alt="Logo IDA" /><div><strong>IDA — Initiative Dignité et Autonomisation</strong><p>Protéger les enfants, autonomiser les jeunes filles et contribuer au développement des communautés vulnérables.</p></div></div>
      <div className="footer-location"><MapPin size={18} /><span>Lubumbashi, République démocratique du Congo</span></div>
      <a className="footer-whatsapp" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /><span>WhatsApp : {WHATSAPP_NUMBER}</span></a>
      <nav className="footer-links" aria-label="Liens de pied de page">{footerLinks.map(([label, to]) => <Link key={to + label} to={to}>{label}</Link>)}</nav>
    </div>
    <div className="footer-bottom"><div className="container"><span>© {new Date().getFullYear()} IDA. Tous droits réservés.</span><span>Agir ensemble pour les communautés.</span></div></div>
  </footer>
}