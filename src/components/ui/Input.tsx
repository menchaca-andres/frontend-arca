import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  showPasswordToggle?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      className = '',
      type,
      showPasswordToggle = true,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password' && showPasswordToggle
    const actualType = isPassword ? (showPassword ? 'text' : 'password') : type

    const effectiveRightIcon =
      isPassword && !rightIcon ? (
        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      ) : (
        rightIcon
      )

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
            type={actualType}
            className={`input-ds ${leftIcon ? 'with-left-icon' : ''} ${
              effectiveRightIcon ? 'with-right-icon' : ''
            } ${className}`}
            aria-invalid={Boolean(error)}
            {...props}
          />
          {effectiveRightIcon && <span className="input-icon-right">{effectiveRightIcon}</span>}
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
