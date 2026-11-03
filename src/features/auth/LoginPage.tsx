import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
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
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={cargando}
          />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="login-hint">
          Usuarios de demo: <code>admin@arca.bo</code>, <code>rrhh@arca.bo</code>,{' '}
          <code>direccion@arca.bo</code> y <code>funcionario@arca.bo</code>.
        </p>
      </section>
    </main>
  )
}
