import type { ApiErrorPayload, LoginResponse, UsuarioSesion } from '../types'

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
