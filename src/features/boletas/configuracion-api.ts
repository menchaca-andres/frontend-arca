import { ApiService, ApiError } from '../../services/api'

export interface Concepto {
  id: string
  codigo: string
  nombre: string
  tipo: 'HABER' | 'DESCUENTO'
  formaCalculo: 'SISTEMA' | 'MONTO_FIJO' | 'PORCENTAJE'
  valor: number | null
  base: 'HABER_BASICO' | 'TOTAL_GANADO' | null
  automatico: boolean
  esSistema: boolean
  orden: number
  activo: boolean
}
export interface Novedad {
  id: string
  funcionarioId: string
  conceptoId: string
  concepto: Concepto
  monto: number
  anio: number
  mes: number
  descripcion: string | null
}
export const BASE_BOLETAS = '/api/v1/boletas'
export function getConceptos(inactivos = false) {
  return ApiService.get<Concepto[]>(`${BASE_BOLETAS}/conceptos?incluirInactivos=${inactivos}`)
}
export function errorConfiguracion(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message + (error.details ? `: ${JSON.stringify(error.details)}` : '')
  }
  return 'No se pudo conectar. Intente nuevamente.'
}
