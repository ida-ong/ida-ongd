import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

export default function AuthFormShell({ eyebrow, title, intro, children, footer }) {
  return <main className="auth-page"><div className="auth-card">
    <Link className="auth-logo" to="/" aria-label="Retour à l’accueil IDA"><img src={logo} alt="Logo IDA" /></Link>
    <span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="auth-intro">{intro}</p>
    {children}
    {footer && <div className="auth-footer">{footer}</div>}
  </div></main>
}