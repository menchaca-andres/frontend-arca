import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading
  const classes = [
    'btn-ds',
    `btn-${variant}`,
    `btn-${size}`,
    isLoading ? 'btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={isDisabled} {...props}>
      {isLoading ? (
        <span className="spinner" aria-hidden="true" />
      ) : (
        leftIcon && <span className="btn-icon">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="btn-icon">{rightIcon}</span>}
    </button>
  )
}
