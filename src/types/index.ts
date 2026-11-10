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

export type TipoContrato = 'INDEFINIDO' | 'PLAZO_FIJO'

export interface PlantillaVersionItem {
  id: string
  version: number
  contenido: string
  variables: string[]
  activa: boolean
  creadoPor: string
  createdAt: string
}

export interface PlantillaItem {
  id: string
  codigo: string
  nombre: string
  tipo: TipoContrato
  activo: boolean
  versionActiva: PlantillaVersionItem | null
  createdAt: string
  updatedAt: string
}

export interface CrearPlantillaInput {
  codigo: string
  nombre: string
  tipo: TipoContrato
  contenido: string
}

export interface ActualizarPlantillaInput {
  nombre?: string
  tipo?: TipoContrato
  contenido: string
}

export interface PreviewPlantillaResponse {
  contenidoRenderizado: string
  variables: string[]
}


export type TipoConcepto = 'HABER' | 'DESCUENTO';
export type FormaCalculo = 'MONTO_FIJO' | 'PORCENTAJE' | 'SISTEMA';
export type BaseCalculo = 'HABER_BASICO' | 'TOTAL_GANADO';

export interface ConceptoItem {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoConcepto;
  formaCalculo: FormaCalculo;
  valor: number | null;
  base: BaseCalculo | null;
  automatico: boolean;
  esSistema: boolean;
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrearConceptoInput {
  codigo: string;
  nombre: string;
  tipo: TipoConcepto;
  formaCalculo: FormaCalculo;
  valor?: number | null;
  base?: BaseCalculo | null;
  automatico: boolean;
  orden: number;
}

export interface ActualizarConceptoInput {
  nombre?: string;
  formaCalculo?: FormaCalculo;
  valor?: number | null;
  base?: BaseCalculo | null;
  automatico?: boolean;
  orden?: number;
  activo?: boolean;
}

export interface NovedadItem {
  id: string;
  anio: number;
  mes: number;
  funcionarioId: string;
  conceptoId: string;
  concepto: ConceptoItem;
  monto: number;
  descripcion: string | null;
  registradoPor: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrarNovedadInput {
  anio: number;
  mes: number;
  funcionarioId: string;
  conceptoId: string;
  monto: number;
  descripcion?: string | null;
}

export const FUNCIONARIOS_SEMILLA_PADRON: FuncionarioPadronItem[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    ci: '9000001',
    ciExpedido: 'CB',
    nombreCompleto: 'Lucía Vargas Rojas',
    estado: 'EN_PRUEBA',
    fechaIngreso: '2026-09-01',
    diasPrueba: 90,
    areaId: 'area-1',
    areaNombre: 'Operaciones',
    cargoId: 'cargo-1',
    cargoNombre: 'Operador',
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    ci: '9000002',
    ciExpedido: 'LP',
    nombreCompleto: 'Carlos Mamani Flores',
    estado: 'RATIFICADO',
    fechaIngreso: '2026-08-01',
    diasPrueba: 90,
    areaId: 'area-2',
    areaNombre: 'Administración',
    cargoId: 'cargo-2',
    cargoNombre: 'Asistente Administrativo',
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    ci: '9000003',
    ciExpedido: 'SC',
    nombreCompleto: 'Daniela Mendoza Vargas',
    estado: 'RATIFICADO',
    fechaIngreso: '2026-07-15',
    diasPrueba: 90,
    areaId: 'area-3',
    areaNombre: 'Sistemas',
    cargoId: 'cargo-3',
    cargoNombre: 'Desarrollador',
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    ci: '9000004',
    ciExpedido: 'LP',
    nombreCompleto: 'Rodrigo Quispe Choque',
    estado: 'RATIFICADO',
    fechaIngreso: '2026-06-01',
    diasPrueba: 90,
    areaId: 'area-1',
    areaNombre: 'Operaciones',
    cargoId: 'cargo-1',
    cargoNombre: 'Supervisor de Operaciones',
  },
];
