import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './site.css'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import logo from './assets/logo.png'

try {
  const theme = window.localStorage.getItem('ida-theme') === 'dark' ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
} catch {
  document.documentElement.dataset.theme = 'light'
}

const siteIcon = document.querySelector('#site-icon')
if (siteIcon) {
  siteIcon.href = logo
  siteIcon.type = 'image/png'
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Élément #root introuvable dans index.html.')
}

const root = createRoot(rootElement)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

function renderStartupError(title, message) {
  root.render(
    <main className="page-section" role="alert">
      <div className="container">
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
    </main>,
  )
}

if (!supabaseUrl || !supabaseKey) {
  const message =
    'Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans les variables d’environnement Vercel, puis redéployez.'
  console.error(`[IDA] Configuration Supabase manquante. ${message}`)
  renderStartupError('Configuration de l’application incomplète', message)
} else {
  import('./App.jsx')
    .then(({ default: App }) => {
      root.render(
        <StrictMode>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </StrictMode>,
      )
    })
    .catch((error) => {
      console.error('[IDA] Impossible de charger l’application.', error)
      renderStartupError(
        'Une erreur est survenue lors du chargement de l’application.',
        'Veuillez actualiser la page. Si le problème persiste, consultez la console développeur.',
      )
    })
}
