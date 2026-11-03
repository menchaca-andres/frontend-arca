import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext } from './toast-context'
import type { ToastItem, ToastType } from './toast-context'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    ({ type, message, title, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: ToastItem = { id, type, message, title, duration }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id)
        }, duration)
      }

      return id
    },
    [dismiss],
  )

  const success = useCallback(
    (message: string, title?: string) => show({ type: 'success', message, title }),
    [show],
  )

  const error = useCallback(
    (message: string, title?: string) => show({ type: 'error', message, title }),
    [show],
  )

  const warning = useCallback(
    (message: string, title?: string) => show({ type: 'warning', message, title }),
    [show],
  )

  const info = useCallback(
    (message: string, title?: string) => show({ type: 'info', message, title }),
    [show],
  )

  const value = useMemo(
    () => ({ show, success, error, warning, info, dismiss }),
    [show, success, error, warning, info, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container-ds" aria-live="polite">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 size={18} className="toast-icon-success" />,
    error: <AlertCircle size={18} className="toast-icon-error" />,
    warning: <AlertTriangle size={18} className="toast-icon-warning" />,
    info: <Info size={18} className="toast-icon-info" />,
  }

  return (
    <div className={`toast-card-ds toast-${toast.type}`} role="status">
      <div className="toast-icon-wrapper">{icons[toast.type]}</div>
      <div className="toast-content-ds">
        {toast.title && <strong className="toast-title-ds">{toast.title}</strong>}
        <p className="toast-message-ds">{toast.message}</p>
      </div>
      <button
        type="button"
        className="toast-close-btn-ds"
        onClick={onDismiss}
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
    </div>
  )
}
