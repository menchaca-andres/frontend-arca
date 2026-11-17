import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop-ds" onClick={onClose} role="dialog" aria-modal="true">
      <div className={`modal-container-ds modal-${size}`} onClick={(e) => e.stopPropagation()}>
        <header className="modal-header-ds">
          <h2 className="modal-title-ds">{title}</h2>
          <button
            type="button"
            className="modal-close-btn-ds"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </header>

        <div className="modal-body-ds">{children}</div>

        {footer && <footer className="modal-footer-ds">{footer}</footer>}
      </div>
    </div>
  )
}
