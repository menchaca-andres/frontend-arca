import { Briefcase, CheckCircle2, Mail, UserX } from 'lucide-react'
import { Button, Modal, StatusBadge } from '../../../components'
import type { FichaFuncionario } from '../../../types'
import { formatCurrency, formatDate } from '../../../utils/formatters'

interface FichaFuncionarioModalProps {
  ficha: FichaFuncionario | null
  isOpen: boolean
  onClose: () => void
  puedeGestionar?: boolean
  onRatificar?: (ficha: FichaFuncionario) => void
  onDarDeBaja?: (ficha: FichaFuncionario) => void
  onCambiarAsignacion?: (ficha: FichaFuncionario) => void
  onEditarContacto?: (ficha: FichaFuncionario) => void
}

const MOTIVO_LABEL: Record<string, string> = {
  INGRESO: 'Ingreso',
  ASCENSO: 'Ascenso',
  TRASLADO: 'Traslado',
  INCREMENTO: 'Incremento salarial',
  CORRECCION: 'Corrección',
}

const tituloSeccion = {
  margin: '0 0 0.5rem',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#475569',
  borderBottom: '1px solid #e2e8f0',
  paddingBottom: '0.25rem',
} as const

export function FichaFuncionarioModal({
  ficha,
  isOpen,
  onClose,
  puedeGestionar = false,
  onRatificar,
  onDarDeBaja,
  onCambiarAsignacion,
  onEditarContacto,
}: FichaFuncionarioModalProps) {
  if (!ficha) return null

  const asignacion = ficha.asignacionVigente

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>Ficha de Funcionario</span>
          <StatusBadge status={ficha.estado} />
        </div>
      }
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* HU-10: CA-05 No se modifica a un funcionario de baja */}
            {puedeGestionar && ficha.estado !== 'BAJA' && onCambiarAsignacion && asignacion && (
              <Button
                variant="outline"
                leftIcon={<Briefcase size={16} />}
                onClick={() => onCambiarAsignacion(ficha)}
              >
                Cambiar asignación
              </Button>
            )}
            {puedeGestionar && ficha.estado !== 'BAJA' && onEditarContacto && (
              <Button
                variant="outline"
                leftIcon={<Mail size={16} />}
                onClick={() => onEditarContacto(ficha)}
              >
                Editar contacto
              </Button>
            )}
            {puedeGestionar && ficha.estado === 'EN_PRUEBA' && onRatificar && (
              <Button
                variant="primary"
                leftIcon={<CheckCircle2 size={16} />}
                onClick={() => onRatificar(ficha)}
              >
                Ratificar Funcionario
              </Button>
            )}
            {puedeGestionar && ficha.estado !== 'BAJA' && onDarDeBaja && (
              <Button
                variant="danger"
                leftIcon={<UserX size={16} />}
                onClick={() => onDarDeBaja(ficha)}
              >
                Dar de Baja
              </Button>
            )}
          </div>
          <div className="modal-actions-right">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Encabezado con datos clave */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
            {ficha.nombres} {ficha.apellidos}
          </h3>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            CI:{' '}
            <strong className="font-mono">
              {ficha.ci} {ficha.ciExpedido}
            </strong>{' '}
            · Ingreso: {formatDate(ficha.fechaIngreso)}
          </p>
        </div>

        {/* Sección: Estado Especial (Ratificado o Baja) */}
        {ficha.estado === 'RATIFICADO' && ficha.fechaRatificacion && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#f0fdf4',
              borderRadius: '0.375rem',
              border: '1px solid #bbf7d0',
              color: '#166534',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={18} />
            <div>
              <strong>Funcionario Permanente:</strong> Ratificado formalmente el{' '}
              <strong>{formatDate(ficha.fechaRatificacion)}</strong>.
            </div>
          </div>
        )}

        {ficha.estado === 'BAJA' && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              borderRadius: '0.375rem',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.9rem',
            }}
          >
            <div>
              <strong>Funcionario dado de Baja:</strong> Efectiva el{' '}
              <strong>{formatDate(ficha.fechaBaja ?? '')}</strong>.
            </div>
            {ficha.motivoBaja && (
              <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                Motivo: <strong>{ficha.motivoBaja}</strong>
                {ficha.detalleBaja ? ` (${ficha.detalleBaja})` : ''}
              </div>
            )}
          </div>
        )}

        {/* Sección: Datos Personales */}
        <div>
          <h4
            style={{
              margin: '0 0 0.5rem',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#475569',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '0.25rem',
            }}
          >
            Datos Personales
          </h4>
          <div className="form-grid-2" style={{ gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Fecha de Nacimiento: </span>
              <strong>{formatDate(ficha.fechaNacimiento)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Sexo: </span>
              <strong>{ficha.sexo === 'M' ? 'Masculino' : 'Femenino'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Correo electrónico: </span>
              <strong>{ficha.correo || '—'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Teléfono: </span>
              <strong>{ficha.telefono || '—'}</strong>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#64748b' }}>Dirección: </span>
              <strong>{ficha.direccion || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Sección: Asignación Laboral Vigente */}
        <div>
          <h4
            style={{
              margin: '0 0 0.5rem',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#475569',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '0.25rem',
            }}
          >
            {ficha.estado === 'BAJA' ? 'Última Asignación Laboral' : 'Asignación Laboral Vigente'}
          </h4>
          {asignacion ? (
            <div className="form-grid-2" style={{ gap: '0.75rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Área: </span>
                <strong>{asignacion.areaNombre}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Cargo: </span>
                <strong>{asignacion.cargoNombre}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Remuneración (Haber Básico): </span>
                <strong className="font-mono">{formatCurrency(asignacion.remuneracion)}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Días de Prueba: </span>
                <strong>{ficha.diasPrueba} días</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Vigente desde: </span>
                <strong>{formatDate(asignacion.vigenteDesde)}</strong>
              </div>
              {asignacion.vigenteHasta && (
                <div>
                  <span style={{ color: '#64748b' }}>Vigente hasta: </span>
                  <strong style={{ color: '#dc2626' }}>
                    {formatDate(asignacion.vigenteHasta)}
                  </strong>
                </div>
              )}
              <div>
                <span style={{ color: '#64748b' }}>Motivo: </span>
                <strong>{asignacion.motivo}</strong>
              </div>
            </div>
          ) : (
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>Sin asignación registrada.</p>
          )}
        </div>

        {/* HU-09 CA-03: Historial de asignaciones como línea de tiempo */}
        <div>
          <h4 style={tituloSeccion}>Historial de Asignaciones</h4>
          {ficha.historialAsignaciones.length === 0 ? (
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>Sin historial registrado.</p>
          ) : (
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {ficha.historialAsignaciones.map((item, i) => {
                const vigente = item.vigenteHasta === null
                const ultimo = i === ficha.historialAsignaciones.length - 1
                return (
                  <li key={item.id} style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span
                        style={{
                          width: '0.75rem',
                          height: '0.75rem',
                          marginTop: '0.3rem',
                          borderRadius: '9999px',
                          backgroundColor: vigente ? '#16a34a' : '#94a3b8',
                          flexShrink: 0,
                        }}
                      />
                      {!ultimo && (
                        <span style={{ flex: 1, width: '2px', backgroundColor: '#e2e8f0' }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: ultimo ? 0 : '1rem', fontSize: '0.9rem' }}>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {formatDate(item.vigenteDesde)} —{' '}
                        {vigente ? 'actual' : formatDate(item.vigenteHasta)} ·{' '}
                        {MOTIVO_LABEL[item.motivo] ?? item.motivo}
                      </div>
                      <div>
                        <strong>{item.cargoNombre}</strong>{' '}
                        <span style={{ color: '#64748b' }}>({item.areaNombre})</span>
                      </div>
                      <div className="font-mono">{formatCurrency(item.remuneracion)}</div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </Modal>
  )
}
