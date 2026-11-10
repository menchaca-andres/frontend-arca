import type {
  ApiErrorPayload,
  Area,
  AreaInput,
  CambiarEstadoInput,
  CambiarRolInput,
  Cargo,
  CargoInput,
  CrearUsuarioInput,
  CrearUsuarioResponse,
  DarDeBajaInput,
  FichaFuncionario,
  FuncionarioResumen,
  LoginResponse,
  PruebaPorVencerItem,
  RatificarFuncionarioInput,
  RegistrarFuncionarioInput,
  Rol,
  SaldoVacaciones,
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

  static async getFuncionarios(params?: { estado?: string }): Promise<FuncionarioResumen[]> {
    const query = new URLSearchParams()
    if (params?.estado) query.set('estado', params.estado)
    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    return this.get<FuncionarioResumen[]>(`/api/v1/personal/funcionarios${suffix}`)
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

  static async registrarFuncionario(input: RegistrarFuncionarioInput): Promise<FichaFuncionario> {
    return this.post<FichaFuncionario>('/api/v1/personal/funcionarios', input)
  }

  static async ratificarFuncionario(
    id: string,
    input: RatificarFuncionarioInput = {},
  ): Promise<FichaFuncionario> {
    return this.post<FichaFuncionario>(`/api/v1/personal/funcionarios/${id}/ratificacion`, input)
  }

  static async darDeBajaFuncionario(id: string, input: DarDeBajaInput): Promise<FichaFuncionario> {
    return this.post<FichaFuncionario>(`/api/v1/personal/funcionarios/${id}/baja`, input)
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
