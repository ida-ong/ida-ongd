import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import WhatsAppContact from '../components/WhatsAppContact'
import heroImage from '../assets/hero.png'

export default function SiteLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  useEffect(() => {
    const pages = [
      [/^\/$/, 'ONGD IDA — protéger les enfants et autonomiser les jeunes filles', 'ONGD IDA — Initiative Dignité et Autonomisation : protection de l’enfant, éducation, autonomisation des jeunes filles et développement communautaire à Lubumbashi, Haut-Katanga, RDC.'],
      [/^\/a-propos/, 'À propos — ONGD IDA', 'Découvrez l’ONGD IDA, Initiative Dignité et Autonomisation, engagée pour les enfants, les jeunes filles et les communautés vulnérables en RDC.'],
      [/^\/objectifs/, 'Nos objectifs — ONGD IDA', 'Protection de l’enfant, éducation, formation, aide humanitaire, autonomisation des jeunes filles et développement communautaire.'],
      [/^\/actions/, 'Nos actions — ONGD IDA', 'Actions et initiatives de l’ONGD IDA pour protéger les enfants et accompagner les jeunes filles et les communautés vulnérables.'],
      [/^\/actualites/, 'Actualités — ONGD IDA', 'Actualités et informations de l’ONGD IDA à Lubumbashi, dans le Haut-Katanga et en République démocratique du Congo.'],
      [/^\/informations/, 'Informations importantes — ONGD IDA', 'Informations officielles de l’ONGD IDA, Initiative Dignité et Autonomisation.'],
      [/^\/dons/, 'Faire un don — ONGD IDA', 'Soutenez la mission de l’ONGD IDA : protection de l’enfant, éducation, autonomisation des jeunes filles et développement communautaire.'],
      [/^\/contact/, 'Contact — ONGD IDA', 'Contacter l’ONGD IDA à Lubumbashi, Haut-Katanga, République démocratique du Congo.'],
    ]
    const [, title, description] = pages.find(([path]) => path.test(pathname)) ?? [null, 'ONGD IDA — Initiative Dignité et Autonomisation', 'Protéger les enfants, autonomiser les jeunes filles et contribuer au développement des communautés vulnérables.']
    document.title = title
    let descriptionTag = document.querySelector('meta[name="description"]')
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta')
      descriptionTag.name = 'description'
      document.head.append(descriptionTag)
    }
    descriptionTag.content = description

    const meta = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('property', property)
        document.head.append(tag)
      }
      tag.content = content
    }
    meta('og:type', 'website')
    meta('og:title', title)
    meta('og:description', description)
    meta('og:url', new URL(pathname, window.location.origin).href)
    meta('og:image', new URL(heroImage, window.location.origin).href)
    meta('og:locale', 'fr_FR')
  }, [pathname])

  return <><Navbar /><Outlet /><Footer /><WhatsAppContact /></>
}