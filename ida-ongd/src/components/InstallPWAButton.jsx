import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export default function InstallPWAButton() {
  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => {
    function captureInstallPrompt(event) {
      event.preventDefault()
      setInstallPrompt(event)
    }
    function clearInstallPrompt() {
      setInstallPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', captureInstallPrompt)
    window.addEventListener('appinstalled', clearInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
      window.removeEventListener('appinstalled', clearInstallPrompt)
    }
  }, [])

  async function installApp() {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  if (!installPrompt) return null
  return <button className="nav-login nav-install" type="button" onClick={installApp}>
    <Download size={16} aria-hidden="true" /> Installer l’application
  </button>
}
