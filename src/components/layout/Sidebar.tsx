import { NavLink } from 'react-router-dom'
import { Briefcase, X } from 'lucide-react'
import { getNavItemsForRole } from '../../config/navigation'
import type { Rol } from '../../types'

export interface SidebarProps {
  rol: Rol
  isOpenMobile: boolean
  onCloseMobile: () => void
}

export function Sidebar({ rol, isOpenMobile, onCloseMobile }: SidebarProps) {
  const navItems = getNavItemsForRole(rol)

  return (
    <>
      {/* Backdrop para dispositivos móviles */}
      {isOpenMobile && (
        <div className="sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside className={`sidebar-ds ${isOpenMobile ? 'is-mobile-open' : ''}`}>
        <header className="sidebar-header-ds">
          <div className="brand-logo-ds">
            <div className="brand-icon-ds">
              <Briefcase size={22} />
            </div>
            <div className="brand-text-ds">
              <strong>ARCA</strong>
              <span>Gestión Humana</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-mobile-btn"
            onClick={onCloseMobile}
            aria-label="Cerrar navegación"
          >
            <X size={20} />
          </button>
        </header>

        <div className="sidebar-role-indicator">
          <span className="role-label-text">Acceso como:</span>
          <span className="role-pill-text">{rol}</span>
        </div>

        <nav className="sidebar-nav-ds" aria-label="Navegación principal">
          <ul className="nav-list-ds">
            {navItems.map((item) => {
              const Icon = item.icon
              const label = item.getLabel(rol)

              return (
                <li key={item.id} className="nav-item-ds">
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `nav-link-ds ${isActive ? 'is-active' : ''}`}
                    onClick={onCloseMobile}
                  >
                    <Icon size={19} className="nav-link-icon" />
                    <span className="nav-link-text">{label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <footer className="sidebar-footer-ds">
          <div className="system-version-pill">
            <span>ARCA v1.0 · Sprint 1</span>
          </div>
        </footer>
      </aside>
    </>
  )
}
