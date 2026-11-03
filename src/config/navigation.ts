import type { ElementType } from 'react'
import {
  Building2,
  CalendarRange,
  FileText,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { Rol } from '../types'

export interface NavItemConfig {
  id: string
  path: string
  icon: ElementType
  getLabel: (rol: Rol) => string
  allowedRoles: Rol[]
  description: string
}

export const NAVIGATION_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    path: '/',
    icon: LayoutDashboard,
    getLabel: () => 'Dashboard',
    allowedRoles: ['ADMIN', 'RRHH', 'DIRECCION', 'FUNCIONARIO'],
    description: 'Resumen general del sistema y accesos rápidos.',
  },
  {
    id: 'personal',
    path: '/personal',
    icon: Users,
    getLabel: (rol) => (rol === 'FUNCIONARIO' ? 'Mi Ficha' : 'Personal'),
    allowedRoles: ['ADMIN', 'RRHH', 'DIRECCION', 'FUNCIONARIO'],
    description: 'Padrón de funcionarios, áreas, cargos e historial laboral.',
  },
  {
    id: 'catalogos',
    path: '/personal/catalogos',
    icon: Building2,
    getLabel: () => 'Áreas y Cargos',
    allowedRoles: ['ADMIN', 'RRHH'],
    description: 'Catálogos maestros de áreas y cargos para clasificar al personal.',
  },
  {
    id: 'vacaciones',
    path: '/vacaciones',
    icon: CalendarRange,
    getLabel: (rol) => (rol === 'FUNCIONARIO' ? 'Mis Vacaciones' : 'Vacaciones'),
    allowedRoles: ['RRHH', 'DIRECCION', 'FUNCIONARIO'],
    description: 'Gestión de saldos, solicitudes y catálogo de feriados.',
  },
  {
    id: 'contratos',
    path: '/contratos',
    icon: FileText,
    getLabel: () => 'Contratos',
    allowedRoles: ['ADMIN', 'RRHH', 'DIRECCION'],
    description: 'Plantillas versionadas y generación de contratos en PDF.',
  },
  {
    id: 'boletas',
    path: '/boletas',
    icon: Receipt,
    getLabel: (rol) => (rol === 'FUNCIONARIO' ? 'Mis Boletas' : 'Boletas'),
    allowedRoles: ['RRHH', 'DIRECCION', 'FUNCIONARIO'],
    description: 'Cálculo de planilla mensual y boletas de pago inmutables.',
  },
  {
    id: 'auditoria',
    path: '/auditoria',
    icon: ShieldCheck,
    getLabel: () => 'Auditoría',
    allowedRoles: ['ADMIN'],
    description: 'Registro de operaciones y trazabilidad de seguridad.',
  },
]

/**
 * Devuelve los módulos del menú visibles según el rol del usuario (CA-05).
 */
export function getNavItemsForRole(rol: Rol): NavItemConfig[] {
  return NAVIGATION_ITEMS.filter((item) => item.allowedRoles.includes(rol))
}
