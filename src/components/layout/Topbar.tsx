import { LogOut, Menu, User } from 'lucide-react'
import { StatusBadge } from '../ui/Badge'
import { ThemeToggle } from '../ui/ThemeToggle'
import type { UsuarioSesion } from '../../types'

export interface TopbarProps {
  usuario: UsuarioSesion
  onLogout: () => void
  onToggleMobileSidebar: () => void
}

export function Topbar({ usuario, onLogout, onToggleMobileSidebar }: TopbarProps) {
  return (
    <header className="topbar-ds">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Abrir menú de navegación"
        >
          <Menu size={22} />
        </button>
        <div className="topbar-breadcrumb">
          <span className="topbar-system-name">ARCA Ltda.</span>
          <span className="topbar-divider">/</span>
          <span className="topbar-section-name">Gestión Humana</span>
        </div>
      </div>

      <div className="topbar-right">
        <ThemeToggle />

        <div className="topbar-user-badge">
          <div className="topbar-avatar" aria-hidden="true">
            <User size={16} />
          </div>
          <div className="topbar-user-info">
            <span className="topbar-email">{usuario.email}</span>
            <StatusBadge status={usuario.rol} size="sm" />
          </div>
        </div>

        <button
          type="button"
          className="topbar-logout-btn"
          onClick={onLogout}
          title="Cerrar sesión actual"
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} />
          <span className="logout-text">Salir</span>
        </button>
      </div>
    </header>
  )
}
