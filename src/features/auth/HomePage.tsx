import { useNavigate } from 'react-router-dom'
import type { Rol } from '../../types'
import { useAuth } from './useAuth'

const MODULOS_POR_ROL: Record<Rol, string[]> = {
  ADMIN: ['Usuarios', 'Personal', 'Auditoría'],
  RRHH: ['Personal', 'Vacaciones', 'Contratos', 'Boletas'],
  DIRECCION: ['Dashboard', 'Personal', 'Boletas'],
  FUNCIONARIO: ['Mi ficha', 'Mis vacaciones', 'Mis boletas'],
}

export function HomePage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  if (!usuario) return null

  const cerrarSesion = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>ARCA</strong>
          <span>Gestión Humana</span>
        </div>
        <div className="topbar-user">
          <span className="badge">{usuario.rol}</span>
          <span className="muted">{usuario.email}</span>
          <button type="button" className="link-button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="home">
        <p className="eyebrow">Sesión iniciada</p>
        <h1>Bienvenido/a</h1>
        <p className="muted">
          Tu rol es <strong>{usuario.rol}</strong>. Los módulos se habilitarán a medida que se
          implementen las historias de usuario.
        </p>

        <section className="module-grid" aria-label="Módulos disponibles para tu rol">
          {MODULOS_POR_ROL[usuario.rol].map((modulo) => (
            <article key={modulo} className="module-card">
              <h2>{modulo}</h2>
              <p className="muted">Próximamente</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
