import { MessageCircle } from 'lucide-react'
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '../lib/contact'

export default function WhatsAppContact() {
  return (
    <a
      className="whatsapp-float"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Contacter IDA sur WhatsApp au ${WHATSAPP_NUMBER}`}
    >
      <MessageCircle size={22} aria-hidden="true" />
      <span>Nous contacter sur WhatsApp</span>
    </a>
  )
}