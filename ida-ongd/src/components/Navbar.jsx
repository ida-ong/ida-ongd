import { useState } from 'react'
import { HeartHandshake, Menu, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../lib/supabase'
import { getDefaultRouteForRole } from '../lib/roles'
import ThemeToggle from './ThemeToggle'
import logo from '../assets/logo.png'

const links = [['Accueil', '/'], ['À propos', '/a-propos'], ['Nos actions', '/actions'], ['Actualités', '/actualites'], ['Contact', '/contact']]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const userHome = user ? getDefaultRouteForRole(role) : '/connexion'
  async function signOut() {
    await supabase.auth.signOut()
    setOpen(false)
    navigate('/')
  }
  return <header className="site-header">
    <nav className="navbar container" aria-label="Navigation principale">
      <Link className="brand" to="/" onClick={() => setOpen(false)} aria-label="IDA, accueil">
        <img src={logo} alt="Logo IDA" />
        <span><strong>IDA</strong><small>Initiative Dignité Autonomiser</small></span>
      </Link>
      <button className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>{open ? <X size={23} /> : <Menu size={23} />}</button>
      <div className={`nav-panel${open ? ' nav-panel-open' : ''}`}>
        <div className="nav-links">{links.map(([label, to]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>)}</div>
        <div className="nav-actions">{user ? <><Link className="nav-login" to={userHome} onClick={() => setOpen(false)}>Mon espace</Link><button className="nav-login nav-logout" type="button" onClick={signOut}>Déconnexion</button></> : <Link className="nav-login" to="/connexion" onClick={() => setOpen(false)}>Connexion</Link>}
          <ThemeToggle />
          <Link className="button button-primary nav-join" to="/inscription" onClick={() => setOpen(false)}><HeartHandshake size={17} /> Devenir membre</Link>
        </div>
      </div>
    </nav>
  </header>
}