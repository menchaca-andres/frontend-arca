import { useEffect, useId, useRef } from 'react'
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [isOpen])

  // Intercept native cancel event (Esc / back gesture) to synchronize with parent state
  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    onClose()
  }

  // Fallback for light-dismiss on browsers without native closedby support
  const handleDialogClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current
    if (!dialog || event.target !== dialog) return

    const rect = dialog.getBoundingClientRect()
    const isInside =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width

    if (!isInside) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      className={`modal-dialog-ds modal-${size}`}
      aria-labelledby={title ? titleId : undefined}
      onCancel={handleCancel}
      onClick={handleDialogClick}
      {...({ closedby: 'any' } as Record<string, string>)}
    >
      <div className="modal-container-ds">
        <header className="modal-header-ds">
          <h2 id={titleId} className="modal-title-ds">{title}</h2>
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
    </dialog>
  )
}

