import { createContext } from 'react'
import type { UsuarioSesion } from '../../types'

export interface AuthContextValue {
  usuario: UsuarioSesion | null
  cargando: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
