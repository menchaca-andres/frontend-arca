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

export interface UsuarioItem {
  id: string
  email: string
  rol: Rol
  funcionarioId: string | null
  activo: boolean
  ultimoAcceso: string | null
  createdAt: string
  updatedAt: string
}

export interface CrearUsuarioInput {
  email: string
  rol: Rol
  funcionarioId?: string | null
}

export interface CrearUsuarioResponse {
  usuario: UsuarioItem
  passwordTemporal: string
}

export interface CambiarRolInput {
  rol: Rol
  funcionarioId?: string | null
}

export interface CambiarEstadoInput {
  activo: boolean
}

export type CIExpedido = 'LP' | 'CB' | 'SC' | 'OR' | 'PT' | 'CH' | 'TJ' | 'BE' | 'PD'

export type EstadoFuncionario = 'EN_PRUEBA' | 'RATIFICADO' | 'BAJA'

export type MotivoBaja = 'RENUNCIA' | 'DESPIDO' | 'FIN_CONTRATO' | 'NO_RATIFICADO' | 'OTRO'

export interface RegistrarFuncionarioInput {
  ci: string
  ciExpedido: CIExpedido
  nombres: string
  apellidos: string
  fechaNacimiento: string
  sexo: 'M' | 'F'
  correo?: string | null
  telefono?: string | null
  direccion?: string | null
  cargoId: string
  remuneracion: number
  fechaIngreso: string
  diasPrueba?: number
}

export interface RatificarFuncionarioInput {
  fechaRatificacion?: string
}

export interface DarDeBajaInput {
  fechaBaja: string
  motivoBaja: MotivoBaja
  detalleBaja?: string | null
}

export interface FichaFuncionario {
  id: string
  ci: string
  ciExpedido: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  sexo: string
  correo: string | null
  telefono: string | null
  direccion: string | null
  fechaIngreso: string
  diasPrueba: number
  estado: EstadoFuncionario
  fechaRatificacion: string | null
  fechaBaja: string | null
  motivoBaja?: MotivoBaja | null
  detalleBaja?: string | null
  asignacionVigente: {
    id: string
    cargoId: string
    cargoNombre: string
    areaId: string
    areaNombre: string
    remuneracion: number
    vigenteDesde: string
    vigenteHasta: string | null
    motivo: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface FuncionarioResumen {
  id: string
  ci: string
  ciExpedido: string
  nombreCompleto: string
  estado: EstadoFuncionario
  fechaIngreso?: string
  diasPrueba?: number
}

export interface PruebaPorVencerItem extends FuncionarioResumen {
  fechaIngreso: string
  diasPrueba: number
  fechaFinPrueba: string
  diasRestantes: number
  listoParaRatificar: boolean
}
