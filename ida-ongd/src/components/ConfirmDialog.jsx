import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', danger = false, busy = false, onConfirm, onCancel }) {
  const confirmButton = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    confirmButton.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, busy, onCancel])
  if (!open) return null
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel() }}>
    <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message">
      <span className={`confirm-dialog-icon${danger ? ' is-danger' : ''}`}><AlertTriangle size={22} /></span>
      <h2 id="confirm-dialog-title">{title}</h2>
      <p id="confirm-dialog-message">{message}</p>
      <div className="confirm-dialog-actions">
        <button className="button button-outline" type="button" onClick={onCancel} disabled={busy}>Annuler</button>
        <button ref={confirmButton} className={`button ${danger ? 'button-danger' : 'button-primary'}`} type="button" onClick={onConfirm} disabled={busy}>{busy ? 'En cours…' : confirmLabel}</button>
      </div>
    </section>
  </div>
}
