import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`empty-state-ds ${className}`}>
      <div className="empty-state-icon-ds">
        {icon ?? <Inbox size={42} className="text-muted" />}
      </div>
      <h3 className="empty-state-title-ds">{title}</h3>
      {description && <p className="empty-state-desc-ds">{description}</p>}
      {action && <div className="empty-state-action-ds">{action}</div>}
    </div>
  )
}
