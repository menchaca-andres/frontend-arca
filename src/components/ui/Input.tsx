import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, id, className = '', ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="form-group-ds">
        {label && (
          <label htmlFor={inputId} className="form-label-ds">
            {label}
          </label>
        )}
        <div className={`input-wrapper-ds ${error ? 'has-error' : ''}`}>
          {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={`input-ds ${leftIcon ? 'with-left-icon' : ''} ${
              rightIcon ? 'with-right-icon' : ''
            } ${className}`}
            aria-invalid={Boolean(error)}
            {...props}
          />
          {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
        </div>
        {error && (
          <p className="form-error-ds" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && <p className="form-helper-ds">{helperText}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
