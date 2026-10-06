import { ArrowRight, MapPin, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionTitle from '../components/SectionTitle'
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '../lib/contact'

export default function Contact() {
  return <main className="page-section inner-page"><div className="container"><SectionTitle eyebrow="Échangeons" title="Contact">Pour en savoir plus sur la mission de l’ONGD IDA, ses actions, le bénévolat ou les modalités de soutien.</SectionTitle><div className="contact-location"><span className="card-icon"><MapPin size={22} /></span><div><span className="eyebrow">Zone d’intervention actuelle</span><h2>Lubumbashi, République démocratique du Congo</h2></div></div><div className="contact-whatsapp-card"><span className="contact-whatsapp-icon"><MessageCircle size={25} /></span><div><span className="eyebrow">Contact direct</span><h2>Écrivez-nous sur WhatsApp</h2><p>{WHATSAPP_NUMBER}</p></div><a className="button button-primary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Nous contacter <MessageCircle size={17} /></a></div><p className="contact-donation-link">Vous souhaitez soutenir notre mission ? <Link to="/dons">Consulter les modalités de don <ArrowRight size={15} /></Link></p></div></main>
}