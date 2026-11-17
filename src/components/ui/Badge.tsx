import type { ReactNode } from 'react'

export type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }: BadgeProps) {
  const classes = ['badge-ds', `badge-${variant}`, `badge-${size}`, className]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{children}</span>
}

/**
 * StatusBadge inteligente: mapea códigos de dominio de ARCA a colores y etiquetas en español.
 */
interface StatusBadgeProps {
  status: string | null | undefined
  size?: BadgeSize
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  // Roles de usuario
  ADMIN: { label: 'Admin', variant: 'brand' },
  RRHH: { label: 'RRHH', variant: 'brand' },
  DIRECCION: { label: 'Dirección', variant: 'info' },
  FUNCIONARIO: { label: 'Funcionario', variant: 'neutral' },

  // Estados de funcionario
  EN_PRUEBA: { label: 'En prueba', variant: 'warning' },
  RATIFICADO: { label: 'Ratificado', variant: 'success' },
  BAJA: { label: 'Baja', variant: 'danger' },

  // Estados de vacaciones
  PENDIENTE: { label: 'Pendiente', variant: 'warning' },
  APROBADA: { label: 'Aprobada', variant: 'success' },
  RECHAZADA: { label: 'Rechazada', variant: 'danger' },

  // Estados de boletas / contratos
  BORRADOR: { label: 'Borrador', variant: 'neutral' },
  EMITIDA: { label: 'Emitida', variant: 'success' },
  RECTIFICADA: { label: 'Rectificada', variant: 'warning' },
  PAGADA: { label: 'Pagada', variant: 'info' },
  ACTIVO: { label: 'Activo', variant: 'success' },
  INACTIVO: { label: 'Inactivo', variant: 'danger' },

  // Tipos de contrato
  INDEFINIDO: { label: 'Indefinido', variant: 'brand' },
  PLAZO_FIJO: { label: 'Plazo Fijo', variant: 'info' },
}

export function StatusBadge({ status, size = 'sm', className = '' }: StatusBadgeProps) {
  if (!status) return null

  const config = STATUS_CONFIG[status.toUpperCase()] ?? {
    label: status,
    variant: 'neutral' as BadgeVariant,
  }

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  )
}
