import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ToastProvider } from './components/ui/Toast'
import { AuditoriaPage } from './features/auditoria'
import { AuthProvider } from './features/auth/AuthContext'
import { HomePage } from './features/auth/HomePage'
import { LoginPage } from './features/auth/LoginPage'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { BoletasPage } from './features/boletas'
import { ContratosPage } from './features/contratos'
import { CatalogosPage, PersonalPage } from './features/personal'
import { UsuariosPage } from './features/usuarios'
import { VacacionesPage } from './features/vacaciones'
import { useGlowPointer } from './utils/useGlowPointer'

function App() {
  useGlowPointer()

  return (
    <>
      {/* Animated Liquid Glass Mesh Canvas */}
      <div className="liquid-mesh-canvas" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
        <div className="mesh-blob mesh-blob-4" />
      </div>

      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Layout principal protegido para usuarios autenticados */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route
                  path="personal"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'RRHH', 'DIRECCION', 'FUNCIONARIO']}>
                      <PersonalPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="personal/catalogos"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'RRHH']}>
                      <CatalogosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="vacaciones"
                  element={
                    <ProtectedRoute allowedRoles={['RRHH', 'DIRECCION', 'FUNCIONARIO']}>
                      <VacacionesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="contratos"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'RRHH', 'DIRECCION']}>
                      <ContratosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="boletas"
                  element={
                    <ProtectedRoute allowedRoles={['RRHH', 'DIRECCION', 'FUNCIONARIO']}>
                      <BoletasPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="auditoria"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AuditoriaPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="usuarios"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <UsuariosPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  )
}

export default App
