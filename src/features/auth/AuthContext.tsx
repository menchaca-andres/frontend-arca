import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiService, EVENTO_SESION_EXPIRADA } from '../../services/api'
import type { UsuarioSesion } from '../../types'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => ApiService.getUsuario())
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const alExpirar = () => setUsuario(null)
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setCargando(true)
    try {
      const respuesta = await ApiService.login(email, password)
      ApiService.saveSession(respuesta.token, respuesta.usuario)
      setUsuario(respuesta.usuario)
    } finally {
      setCargando(false)
    }
  }, [])

  const logout = useCallback(() => {
    ApiService.clearSession()
    setUsuario(null)
  }, [])

  const value = useMemo(
    () => ({ usuario, cargando, login, logout }),
    [usuario, cargando, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
