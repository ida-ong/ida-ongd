import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './site.css'
import App from './App.jsx'
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
