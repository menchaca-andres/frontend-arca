import { createContext } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  title?: string
  duration?: number
}

export interface ToastContextValue {
  show: (options: Omit<ToastItem, 'id'>) => string
  success: (message: string, title?: string) => string
  error: (message: string, title?: string) => string
  warning: (message: string, title?: string) => string
  info: (message: string, title?: string) => string
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
