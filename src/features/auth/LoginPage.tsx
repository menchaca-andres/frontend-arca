import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { ApiError } from '../../services/api'
import { useAuth } from './useAuth'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const { usuario, login, cargando } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (usuario) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      await login(email, password)
      const state = location.state as LocationState | null
      navigate(state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión')
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <header>
          <p className="eyebrow">ARCA Ltda.</p>
          <h1>Gestión Humana</h1>
          <p className="muted">Ingresa con tu correo y contraseña.</p>
        </header>

        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={cargando}
          />

          <label htmlFor="password">Contraseña</label>
          <div className="login-password-wrapper">
            <input
              id="password"
              type={mostrarPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={cargando}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setMostrarPassword((prev) => !prev)}
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              tabIndex={-1}
            >
              {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}
