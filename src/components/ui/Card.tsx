import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  footer?: ReactNode
}

export function Card({
  title,
  subtitle,
  action,
  footer,
  children,
  className = '',
  ...props
}: CardProps) {
  const hasHeader = Boolean(title || subtitle || action)

  return (
    <div className={`card-ds ${className}`} {...props}>
      {hasHeader && (
        <header className="card-header-ds">
          <div className="card-title-group-ds">
            {title && <h3 className="card-title-ds">{title}</h3>}
            {subtitle && <p className="card-subtitle-ds">{subtitle}</p>}
          </div>
          {action && <div className="card-action-ds">{action}</div>}
        </header>
      )}
      <div className="card-body-ds">{children}</div>
      {footer && <footer className="card-footer-ds">{footer}</footer>}
    </div>
  )
}
