import { useState } from 'react'
import { HeartHandshake, Menu, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../lib/supabase'
import { getDefaultRouteForRole } from '../lib/roles'
import ThemeToggle from './ThemeToggle'
import logo from '../assets/logo.png'

const links = [['Accueil', '/'], ['À propos', '/a-propos'], ['Nos objectifs', '/objectifs'], ['Nos actions', '/actions'], ['Actualités', '/actualites'], ['Faire un don', '/dons'], ['Contact', '/contact']]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, role, registrationPending } = useAuth()
  const navigate = useNavigate()
  const userHome = user ? getDefaultRouteForRole(role) : '/connexion'
  const isAdminOrFounder = ['admin', 'founder'].includes(role)
  async function signOut() {
    await supabase.auth.signOut()
    setOpen(false)
    navigate('/')
  }
  return <header className="site-header">
    <nav className="navbar container" aria-label="Navigation principale">
      <Link className="brand" to="/" onClick={() => setOpen(false)} aria-label="IDA, accueil">
        <img src={logo} alt="Logo IDA" />
        <span><strong>IDA</strong><small>Initiative Dignité et Autonomisation</small></span>
      </Link>
      <button className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>{open ? <X size={23} /> : <Menu size={23} />}</button>
      <div className={`nav-panel${open ? ' nav-panel-open' : ''}`}>
        <div className="nav-links">{links.map(([label, to]) => <NavLink className={to === '/dons' ? 'nav-donate' : undefined} key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>)}</div>
        <div className="nav-actions">{user ? <><Link className="nav-login" to={userHome} onClick={() => setOpen(false)}>Mon espace</Link><Link className="nav-login" to="/dashboard/reseau" onClick={() => setOpen(false)}>Mon réseau</Link>{role === 'leader' && <Link className="nav-login" to="/leader/rapports" onClick={() => setOpen(false)}>Mes rapports</Link>}{isAdminOrFounder && <details className="nav-admin-links"><summary>Administration</summary><div><Link to="/admin" onClick={() => setOpen(false)}>Tableau de bord</Link><Link to="/admin/membres" onClick={() => setOpen(false)}>Membres</Link><Link to="/admin/eligibles" onClick={() => setOpen(false)}>Leaders éligibles</Link><Link to="/admin/missions" onClick={() => setOpen(false)}>Missions</Link><Link to="/admin/rapports" onClick={() => setOpen(false)}>Rapports</Link><Link to="/admin/dons" onClick={() => setOpen(false)}>Gestion des dons</Link><Link to="/admin/actualites" onClick={() => setOpen(false)}>Actualités</Link><Link to="/admin/actions" onClick={() => setOpen(false)}>Actions</Link><Link to="/admin/informations" onClick={() => setOpen(false)}>Informations</Link>{role === 'founder' && <Link to="/founder/administrateurs" onClick={() => setOpen(false)}>Gestion des administrateurs</Link>}</div></details>}<button className="nav-login nav-logout" type="button" onClick={signOut}>Déconnexion</button></> : <Link className="nav-login" to="/connexion" onClick={() => setOpen(false)}>Connexion</Link>}
          <ThemeToggle />
          {!user && !registrationPending && <Link className="button button-outline nav-join" to="/inscription" onClick={() => setOpen(false)}><HeartHandshake size={17} /> Devenir membre</Link>}
        </div>
      </div>
    </nav>
  </header>
}