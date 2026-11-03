export type Rol = 'ADMIN' | 'RRHH' | 'DIRECCION' | 'FUNCIONARIO'

export interface UsuarioSesion {
  id: string
  email: string
  rol: Rol
  funcionarioId: string | null
}

export interface LoginResponse {
  token: string
  usuario: UsuarioSesion
}

export interface ApiErrorPayload {
  code: string
  message: string
  details?: unknown
}
