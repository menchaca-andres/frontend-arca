import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components'
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
          <p className="muted">Ingresa con tu correo y contraseña institucional.</p>
        </header>

        <form onSubmit={onSubmit} noValidate>
          <Input
            id="email"
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={cargando}
            placeholder="usuario@arcaltda.com"
          />

          <Input
            id="password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={cargando}
            placeholder="••••••••"
          />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={cargando} size="lg">
            {cargando ? 'Ingresando…' : 'Ingresar al Sistema'}
          </Button>
        </form>
      </section>
    </main>
  )
}
