import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  Calendar,
  FileCheck,
} from 'lucide-react'
import {
  Card,
  StatusBadge,
} from '../../components'
import { getNavItemsForRole } from '../../config/navigation'
import { DashboardEjecutivo } from '../dashboard'
import { useAuth } from './useAuth'

export function HomePage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  if (!usuario) return null

  const esFuncionario = usuario.rol === 'FUNCIONARIO'
  const navItems = getNavItemsForRole(usuario.rol).filter((item) => item.id !== 'dashboard')

  return (
    <div className="dashboard-page space-y-8">
      {/* Bienvenida y Datos de Sesión */}
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Panel de Control</p>
          <h1 className="page-title-ds">Bienvenido/a, {usuario.email}</h1>
          <p className="page-subtitle-ds">
            Sesión activa con rol <StatusBadge status={usuario.rol} />. Los módulos visibles en tu
            menú lateral se adaptan automáticamente a tus permisos.
          </p>
        </div>
      </header>

      {/* HU-25: Tablero Ejecutivo para DIRECCION, RRHH y ADMIN */}
      {!esFuncionario ? (
        <DashboardEjecutivo />
      ) : (
        /* Métricas de autoservicio para el Funcionario */
        <section className="stats-grid-ds" aria-label="Métricas clave">
          <Card className="stat-card">
            <div className="stat-icon-wrapper warning">
              <Calendar size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Mi Saldo de Vacaciones</span>
              <strong className="stat-value">15 días</strong>
              <span className="stat-footnote">Días hábiles disponibles</span>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-icon-wrapper success">
              <FileCheck size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Mis Boletas de Pago</span>
              <strong className="stat-value">Emitidas</strong>
              <span className="stat-footnote">Historial y descargas oficiales</span>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-icon-wrapper brand">
              <FileCheck size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Mi Contrato</span>
              <strong className="stat-value">Vigente</strong>
              <span className="stat-footnote">PDF formal con hash SHA-256</span>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-icon-wrapper info">
              <Bell size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Portal Funcionario</span>
              <strong className="stat-value">Activo</strong>
              <span className="stat-footnote">Autoservicio de Recursos Humanos</span>
            </div>
          </Card>
        </section>
      )}

      {/* Módulos disponibles según el rol */}
      <section className="section-block-ds">
        <div className="section-header-ds">
          <div>
            <h2 className="section-title-ds">Módulos habilitados para tu rol</h2>
            <p className="section-subtitle-ds">
              Selecciona un módulo para explorar las funciones asignadas a{' '}
              <strong>{usuario.rol}</strong>.
            </p>
          </div>
        </div>

        <div className="modules-grid-ds">
          {navItems.map((item) => {
            const Icon = item.icon
            const label = item.getLabel(usuario.rol)

            return (
              <div
                key={item.id}
                className="module-card-ds"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(item.path)}
              >
                <div className="module-card-header">
                  <div className="module-card-icon">
                    <Icon size={24} />
                  </div>
                  <ArrowRight size={18} className="module-card-arrow" />
                </div>
                <h3 className="module-card-title">{label}</h3>
                <p className="module-card-desc">{item.description}</p>
                <div className="module-card-footer">
                  <span className="module-action-link">Acceder al módulo &rarr;</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
