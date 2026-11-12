import type {
  ActualizarContactoInput,
  ActualizarPlantillaInput,
  ActualizarConceptoInput,
  ApiErrorPayload,
  Area,
  AreaInput,
  CambiarAsignacionInput,
  CambiarEstadoInput,
  CambiarRolInput,
  Cargo,
  CargoInput,
  ConceptoItem,
  CrearConceptoInput,
  CrearPlantillaInput,
  CrearUsuarioInput,
  CrearUsuarioResponse,
  DarDeBajaInput,
  FichaFuncionario,
  FiltrosPadron,
  FuncionarioPadronItem,
  LoginResponse,
  NovedadItem,
  Paginated,
  PlantillaItem,
  PlantillaVersionItem,
  PreviewPlantillaResponse,
  PruebaPorVencerItem,
  RatificarFuncionarioInput,
  RegistrarFuncionarioInput,
  RegistrarNovedadInput,
  Rol,
  SaldoVacaciones,
  SolicitudPendiente,
  SolicitudVacacion,
  UsuarioItem,
  UsuarioSesion,
} from '../types'

const GATEWAY_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')
const TOKEN_KEY = 'arca.token'
const USUARIO_KEY = 'arca.usuario'

export const EVENTO_SESION_EXPIRADA = 'arca:sesion-expirada'

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details: unknown

  constructor(message: string, code: string, status: number, details: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export class ApiService {
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }

  static getUsuario(): UsuarioSesion | null {
    const raw = localStorage.getItem(USUARIO_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw) as UsuarioSesion
    } catch {
      return null
    }
  }

  static saveSession(token: string, usuario: UsuarioSesion): void {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario))
  }

  static clearSession(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USUARIO_KEY)
  }

  static async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  static async me(): Promise<{
    id: string
    rol: UsuarioSesion['rol']
    funcionarioId: string | null
  }> {
    return this.request('/api/auth/me')
  }

  static async getAreas(includeInactive = false): Promise<Area[]> {
    const suffix = includeInactive ? '?incluirInactivos=true' : ''
    return this.get<Area[]>(`/api/v1/personal/areas${suffix}`)
  }

  static async createArea(input: AreaInput): Promise<Area> {
    return this.post<Area>('/api/v1/personal/areas', input)
  }

  static async updateArea(
    id: string,
    input: Partial<AreaInput> & { activo?: boolean },
  ): Promise<Area> {
    return this.patch<Area>(`/api/v1/personal/areas/${id}`, input)
  }

  static async getCargos(
    params: { includeInactive?: boolean; areaId?: string } = {},
  ): Promise<Cargo[]> {
    const query = new URLSearchParams()
    if (params.includeInactive) query.set('incluirInactivos', 'true')
    if (params.areaId) query.set('areaId', params.areaId)
    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    return this.get<Cargo[]>(`/api/v1/personal/cargos${suffix}`)
  }

  static async createCargo(input: CargoInput): Promise<Cargo> {
    return this.post<Cargo>('/api/v1/personal/cargos', input)
  }

  static async updateCargo(
    id: string,
    input: Partial<Omit<CargoInput, 'areaId'>> & { activo?: boolean },
  ): Promise<Cargo> {
    return this.patch<Cargo>(`/api/v1/personal/cargos/${id}`, input)
  }

  static async getUsuarios(params: { rol?: Rol; activo?: boolean } = {}): Promise<UsuarioItem[]> {
    const query = new URLSearchParams()
    if (params.rol) query.set('rol', params.rol)
    if (params.activo !== undefined) query.set('activo', String(params.activo))
    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    return this.get<UsuarioItem[]>(`/api/usuarios${suffix}`)
  }

  static async createUsuario(input: CrearUsuarioInput): Promise<CrearUsuarioResponse> {
    return this.post<CrearUsuarioResponse>('/api/usuarios', input)
  }

  static async updateUsuarioRol(id: string, input: CambiarRolInput): Promise<UsuarioItem> {
    return this.patch<UsuarioItem>(`/api/usuarios/${id}/rol`, input)
  }

  static async updateUsuarioEstado(id: string, input: CambiarEstadoInput): Promise<UsuarioItem> {
    return this.patch<UsuarioItem>(`/api/usuarios/${id}/estado`, input)
  }

  static async getFuncionarios(
    filtros: FiltrosPadron = {},
  ): Promise<Paginated<FuncionarioPadronItem>> {
    const query = new URLSearchParams()
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== '') query.set(clave, String(valor))
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    return this.get<Paginated<FuncionarioPadronItem>>(`/api/v1/personal/funcionarios${suffix}`)
  }

  // Selectores: los primeros 100 activos del padrón
  static async getFuncionariosParaSelector(): Promise<FuncionarioPadronItem[]> {
    const pagina = await this.getFuncionarios({ pageSize: 100 })
    return pagina.data
  }

  static async getPruebaPorVencer(): Promise<PruebaPorVencerItem[]> {
    return this.get<PruebaPorVencerItem[]>('/api/v1/personal/funcionarios/prueba-por-vencer')
  }

  static async getFuncionarioFicha(id: string): Promise<FichaFuncionario> {
    return this.get<FichaFuncionario>(`/api/v1/personal/funcionarios/${id}`)
  }

  static async getSaldoVacaciones(funcionarioId: string): Promise<SaldoVacaciones> {
    return this.get<SaldoVacaciones>(`/api/v1/vacaciones/saldo/${funcionarioId}`)
  }

  static async getSolicitudesVacaciones(): Promise<SolicitudVacacion[]> {
    return this.get<SolicitudVacacion[]>('/api/v1/vacaciones/solicitudes')
  }

  static async contarDiasVacaciones(desde: string, hasta: string): Promise<number> {
    const query = new URLSearchParams({ desde, hasta })
    const response = await this.get<{ diasHabiles: number }>(
      `/api/v1/vacaciones/dias-habiles?${query.toString()}`,
    )
    return response.diasHabiles
  }

  static async solicitarVacaciones(input: {
    funcionarioId?: string
    fechaInicio: string
    fechaFin: string
  }): Promise<SolicitudVacacion> {
    return this.post<SolicitudVacacion>('/api/v1/vacaciones/solicitudes', input)
  }

  static async getSolicitudesPendientes(): Promise<SolicitudPendiente[]> {
    return this.get<SolicitudPendiente[]>('/api/v1/vacaciones/solicitudes/pendientes')
  }

  static async aprobarSolicitudVacacion(id: string): Promise<SolicitudVacacion> {
    return this.post<SolicitudVacacion>(`/api/v1/vacaciones/solicitudes/${id}/aprobar`, {})
  }

  static async rechazarSolicitudVacacion(id: string, motivo: string): Promise<SolicitudVacacion> {
    return this.post<SolicitudVacacion>(`/api/v1/vacaciones/solicitudes/${id}/rechazar`, { motivo })
  }

  static async registrarFuncionario(input: RegistrarFuncionarioInput): Promise<FichaFuncionario> {
    return this.post<FichaFuncionario>('/api/v1/personal/funcionarios', input)
  }

  static async ratificarFuncionario(
    id: string,
    input: RatificarFuncionarioInput = {},
  ): Promise<FichaFuncionario> {
    return this.post<FichaFuncionario>(`/api/v1/personal/funcionarios/${id}/ratificacion`, input)
  }

  static async cambiarAsignacion(
    id: string,
    input: CambiarAsignacionInput,
  ): Promise<FichaFuncionario> {
    return this.post<FichaFuncionario>(`/api/v1/personal/funcionarios/${id}/asignaciones`, input)
  }

  static async actualizarContacto(
    id: string,
    input: ActualizarContactoInput,
  ): Promise<FichaFuncionario> {
    return this.patch<FichaFuncionario>(`/api/v1/personal/funcionarios/${id}/contacto`, input)
  }

  static async darDeBajaFuncionario(id: string, input: DarDeBajaInput): Promise<FichaFuncionario> {
    return this.post<FichaFuncionario>(`/api/v1/personal/funcionarios/${id}/baja`, input)
  }

  // Plantillas de Contrato (HU-17)
  static async getPlantillas(): Promise<PlantillaItem[]> {
    return this.get<PlantillaItem[]>('/api/plantillas')
  }

  static async getPlantilla(id: string): Promise<PlantillaItem> {
    return this.get<PlantillaItem>(`/api/plantillas/${id}`)
  }

  static async getPlantillaVersiones(id: string): Promise<PlantillaVersionItem[]> {
    return this.get<PlantillaVersionItem[]>(`/api/plantillas/${id}/versiones`)
  }

  static async crearPlantilla(input: CrearPlantillaInput): Promise<PlantillaItem> {
    return this.post<PlantillaItem>('/api/plantillas', input)
  }

  static async actualizarPlantilla(
    id: string,
    input: ActualizarPlantillaInput,
  ): Promise<PlantillaItem> {
    return this.put<PlantillaItem>(`/api/plantillas/${id}`, input)
  }

  static async previewPlantilla(
    contenido: string,
    datos?: Record<string, unknown>,
  ): Promise<PreviewPlantillaResponse> {
    return this.post<PreviewPlantillaResponse>('/api/plantillas/preview', { contenido, datos })
  }

  static async getConceptos(includeInactive = true): Promise<ConceptoItem[]> {
    const suffix = includeInactive ? '' : '?activo=true'
    return this.get<ConceptoItem[]>(`/api/conceptos${suffix}`)
  }

  static async getConceptoById(id: string): Promise<ConceptoItem> {
    return this.get<ConceptoItem>(`/api/conceptos/${id}`)
  }

  static async createConcepto(input: CrearConceptoInput): Promise<ConceptoItem> {
    return this.post<ConceptoItem>('/api/conceptos', input)
  }

  static async updateConcepto(id: string, input: ActualizarConceptoInput): Promise<ConceptoItem> {
    return this.put<ConceptoItem>(`/api/conceptos/${id}`, input)
  }

  static async deleteConcepto(
    id: string,
  ): Promise<{ eliminado: boolean; desactivado: boolean; mensaje: string }> {
    return this.delete<{ eliminado: boolean; desactivado: boolean; mensaje: string }>(
      `/api/conceptos/${id}`,
    )
  }

  static async getNovedades(params?: {
    anio?: number
    mes?: number
    funcionarioId?: string
  }): Promise<NovedadItem[]> {
    const searchParams = new URLSearchParams()
    if (params?.anio) searchParams.set('anio', String(params.anio))
    if (params?.mes) searchParams.set('mes', String(params.mes))
    if (params?.funcionarioId) searchParams.set('funcionarioId', params.funcionarioId)
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return this.get<NovedadItem[]>(`/api/novedades${queryString}`)
  }

  static async createNovedad(input: RegistrarNovedadInput): Promise<NovedadItem> {
    return this.post<NovedadItem>('/api/novedades', input)
  }

  static async deleteNovedad(id: string): Promise<void> {
    return this.delete<void>(`/api/novedades/${id}`)
  }

  static async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  static async post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  static async put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  static async patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  static async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }

  private static async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')

    if (init.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const token = this.getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const response = await fetch(`${GATEWAY_ORIGIN}${path}`, { ...init, headers })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null
      const message = payload?.message ?? 'No se pudo completar la operación'
      const code = payload?.code ?? 'INTERNAL_ERROR'

      if (response.status === 401 && path !== '/api/auth/login') {
        this.clearSession()
        window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
      }

      throw new ApiError(message, code, response.status, payload?.details ?? null)
    }

    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }
}
