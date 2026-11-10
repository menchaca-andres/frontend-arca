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
  asignacionVigente: AsignacionFuncionario | null
  historialAsignaciones: AsignacionFuncionario[]
  createdAt: string
  updatedAt: string
}

export type MotivoAsignacion = 'INGRESO' | 'ASCENSO' | 'TRASLADO' | 'INCREMENTO' | 'CORRECCION'

export interface AsignacionFuncionario {
  id: string
  cargoId: string
  cargoNombre: string
  areaId: string
  areaNombre: string
  remuneracion: number
  vigenteDesde: string
  vigenteHasta: string | null
  motivo: MotivoAsignacion
}

export interface CambiarAsignacionInput {
  cargoId?: string
  remuneracion?: number
  vigenteDesde: string
  motivo: Exclude<MotivoAsignacion, 'INGRESO'>
}

export interface ActualizarContactoInput {
  correo?: string | null
  telefono?: string | null
  direccion?: string | null
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

export interface FuncionarioPadronItem extends FuncionarioResumen {
  fechaIngreso: string
  diasPrueba: number
  areaId: string | null
  areaNombre: string | null
  cargoId: string | null
  cargoNombre: string | null
}

export type FiltroEstadoPadron = EstadoFuncionario | 'TODOS'

export interface FiltrosPadron {
  q?: string
  areaId?: string
  cargoId?: string
  estado?: FiltroEstadoPadron
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
}

export interface SaldoVacaciones {
  funcionarioId: string
  funcionario: string
  elegible: boolean
  motivo: string | null
  gestiones: number
  diasGanados: number
  diasUsados: number
  diasReservados: number
  diasDisponibles: number
  fechaProximaGestion: string
}

export interface SolicitudVacacion {
  id: string
  funcionarioId: string
  funcionarioNombre: string
  fechaInicio: string
  fechaFin: string
  diasHabiles: number
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
  registradoPor: string
  createdAt: string
}

export interface PruebaPorVencerItem extends FuncionarioResumen {
  fechaIngreso: string
  diasPrueba: number
  fechaFinPrueba: string
  diasRestantes: number
  listoParaRatificar: boolean
}
