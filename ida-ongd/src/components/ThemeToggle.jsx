import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'ida-theme'

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Keep the theme usable when browser storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent('ida-theme-change', { detail: theme }))
  }, [theme])

  useEffect(() => {
    function syncTheme(event) {
      if (event.detail === 'dark' || event.detail === 'light') setTheme(event.detail)
    }
    window.addEventListener('ida-theme-change', syncTheme)
    return () => window.removeEventListener('ida-theme-change', syncTheme)
  }, [])

  const isDark = theme === 'dark'

  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      type="button"
      onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
      aria-label={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
    </button>
  )
}