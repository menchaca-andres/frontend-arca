import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  if (!usuario) return null

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout-container-ds">
      <Sidebar
        rol={usuario.rol}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="layout-main-wrapper">
        <Topbar
          usuario={usuario}
          onLogout={handleLogout}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />

        <main className="layout-content-area" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
