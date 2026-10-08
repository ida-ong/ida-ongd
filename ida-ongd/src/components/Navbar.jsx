import { useEffect, useState } from 'react'
import { ChevronDown, HeartHandshake, Menu, UserRound, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../lib/supabase'
import { getDefaultRouteForRole } from '../lib/roles'
import ThemeToggle from './ThemeToggle'
import InstallPWAButton from './InstallPWAButton'
import logo from '../assets/logo.png'

const links = [['Accueil', '/'], ['À propos', '/a-propos'], ['Nos objectifs', '/objectifs'], ['Nos actions', '/actions'], ['Actualités', '/actualites'], ['Faire un don', '/dons'], ['Contact', '/contact']]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, role, registrationPending } = useAuth()
  const navigate = useNavigate()
  const userHome = user ? getDefaultRouteForRole(role) : '/connexion'
  const isAdminOrFounder = ['admin', 'founder'].includes(role)

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  async function signOut(event) {
    event.currentTarget.closest('details')?.removeAttribute('open')
    await supabase.auth.signOut()
    setOpen(false)
    navigate('/')
  }

  function closeNavigation(event) {
    setOpen(false)
    event.currentTarget.closest('details')?.removeAttribute('open')
  }

  return <header className={`site-header${open ? ' menu-open' : ''}`}>
    <nav className="navbar container" aria-label="Navigation principale">
      <Link className="brand" to="/" onClick={() => setOpen(false)} aria-label="IDA, accueil">
        <img src={logo} alt="Logo IDA" />
        <span><strong>IDA</strong><small>Initiative Dignité et Autonomisation</small></span>
      </Link>
      <ThemeToggle className="theme-toggle-mobile" />
      <button className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-controls="primary-navigation" aria-expanded={open} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>{open ? <X size={23} /> : <Menu size={23} />}</button>
      <div id="primary-navigation" className={`nav-panel${open ? ' nav-panel-open' : ''}`}>
        <div className="nav-panel-title">Navigation</div>
        <ThemeToggle className="theme-toggle-menu" />
        <div className="nav-links" aria-label="Pages du site">{links.map(([label, to]) => <NavLink className={to === '/dons' ? 'nav-donate' : undefined} key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>)}</div>
        <div className="nav-actions">
          {user && <details className="nav-account">
            <summary><span className="nav-account-avatar"><UserRound size={16} /></span><span>Mon espace</span><ChevronDown className="nav-account-chevron" size={15} /></summary>
            <div>
              <Link to={userHome} onClick={closeNavigation}>Tableau de bord</Link>
              <Link to="/dashboard/reseau" onClick={closeNavigation}>Mon réseau</Link>
              {role === 'leader' && <Link to="/leader/rapports" onClick={closeNavigation}>Mes rapports</Link>}
              {isAdminOrFounder && <>
                <span className="nav-account-heading">Administration</span>
                <Link to="/admin" onClick={closeNavigation}>Vue générale</Link>
                <Link to="/admin/membres" onClick={closeNavigation}>Membres</Link>
                <Link to="/admin/eligibles" onClick={closeNavigation}>Leaders éligibles</Link>
                <Link to="/admin/missions" onClick={closeNavigation}>Missions</Link>
                <Link to="/admin/rapports" onClick={closeNavigation}>Rapports</Link>
                <Link to="/admin/dons" onClick={closeNavigation}>Gestion des dons</Link>
                <Link to="/admin/actualites" onClick={closeNavigation}>Actualités</Link>
                <Link to="/admin/actions" onClick={closeNavigation}>Actions publiques</Link>
                <Link to="/admin/informations" onClick={closeNavigation}>Informations</Link>
                {role === 'founder' && <Link to="/founder/administrateurs" onClick={closeNavigation}>Gestion des administrateurs</Link>}
              </>}
              <button className="nav-account-logout" type="button" onClick={signOut}>Déconnexion</button>
            </div>
          </details>}
          <div className="nav-utilities">
            {!user && <Link className="nav-login" to="/connexion" onClick={() => setOpen(false)}>Connexion</Link>}
            <InstallPWAButton />
            {!user && !registrationPending && <Link className="button button-outline nav-join" to="/inscription" onClick={() => setOpen(false)}><HeartHandshake size={17} /> Devenir membre</Link>}
          </div>
        </div>
      </div>
      {open && <button className="nav-backdrop" type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} />}
    </nav>
  </header>
}