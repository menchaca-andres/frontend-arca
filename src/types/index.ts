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

export interface Area {
  id: string
  codigo: string
  nombre: string
  activo: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Cargo {
  id: string
  areaId: string
  area?: Area
  nombre: string
  salarioMin: number
  salarioMax: number
  activo: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AreaInput {
  codigo: string
  nombre: string
}

export interface CargoInput {
  areaId: string
  nombre: string
  salarioMin: number
  salarioMax: number
}
