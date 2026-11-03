import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, id, className = '', ...props }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="form-group-ds">
        {label && (
          <label htmlFor={selectId} className="form-label-ds">
            {label}
          </label>
        )}
        <div className={`select-wrapper-ds ${error ? 'has-error' : ''}`}>
          <select
            id={selectId}
            ref={ref}
            className={`select-ds ${className}`}
            aria-invalid={Boolean(error)}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
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

Select.displayName = 'Select'
