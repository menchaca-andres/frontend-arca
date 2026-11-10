import { useState } from 'react'
import { AlertTriangle, UserX } from 'lucide-react'
import { Button, Input, Modal, Select, useToast } from '../../../components'
import { ApiService } from '../../../services/api'
import type { FichaFuncionario, MotivoBaja } from '../../../types'
import { formatDate } from '../../../utils/formatters'

interface DarDeBajaModalProps {
  funcionario: FichaFuncionario | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (fichaActualizada: FichaFuncionario) => void
}

const MOTIVOS_BAJA: Array<{ value: MotivoBaja; label: string }> = [
  { value: 'RENUNCIA', label: 'Renuncia voluntaria' },
  { value: 'DESPIDO', label: 'Despido' },
  { value: 'FIN_CONTRATO', label: 'Conclusión de contrato' },
  { value: 'NO_RATIFICADO', label: 'No ratificado (periodo de prueba)' },
  { value: 'OTRO', label: 'Otro motivo (especificar)' },
]

export function DarDeBajaModal({ funcionario, isOpen, onClose, onSuccess }: DarDeBajaModalProps) {
  const toast = useToast()

  const [fechaBaja, setFechaBaja] = useState(() => new Date().toISOString().split('T')[0])
  const [motivoBaja, setMotivoBaja] = useState<MotivoBaja>('RENUNCIA')
  const [detalleBaja, setDetalleBaja] = useState('')
  const [ciConfirmacion, setCiConfirmacion] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (!funcionario) return null

  // CA-06: Confirmación escribiendo el CI del funcionario
  const ciCoincide = ciConfirmacion.trim() === funcionario.ci.trim()

  // CA-04: La fecha de baja no puede ser anterior a la fecha de ingreso
  const fechaValida = fechaBaja >= funcionario.fechaIngreso

  // CA-01: Si motivo es OTRO, detalle es obligatorio
  const detalleValido = motivoBaja !== 'OTRO' || detalleBaja.trim().length > 0

  const puedeConfirmar = ciCoincide && fechaValida && detalleValido && !guardando

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ciCoincide) {
      toast.error('El CI ingresado no coincide con el del funcionario', 'Confirmación requerida')
      return
    }

    if (!fechaValida) {
      toast.error(
        `La fecha de baja (${formatDate(fechaBaja)}) no puede ser anterior a la fecha de ingreso (${formatDate(funcionario.fechaIngreso)})`,
        'Fecha inválida',
      )
      return
    }

    if (!detalleValido) {
      toast.error(
        'Debe especificar el detalle cuando el motivo de baja es OTRO',
        'Detalle requerido',
      )
      return
    }

    setGuardando(true)
    try {
      const fichaActualizada = await ApiService.darDeBajaFuncionario(funcionario.id, {
        fechaBaja,
        motivoBaja,
        detalleBaja: detalleBaja.trim() || null,
      })
      toast.success(
        `El funcionario ${funcionario.nombres} ${funcionario.apellidos} ha sido dado de baja correctamente.`,
        'Funcionario de Baja',
      )
      onSuccess(fichaActualizada)
      onClose()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo procesar la baja del funcionario',
        'Error',
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
          <UserX size={20} />
          <span>Dar de Baja a Funcionario</span>
        </div>
      }
      size="md"
      footer={
        <div className="modal-actions-right">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={!puedeConfirmar}>
            {guardando ? 'Procesando...' : 'Confirmar Baja'}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {/* Banner de advertencia */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '0.375rem',
            color: '#991b1b',
            fontSize: '0.875rem',
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <strong>Baja lógica institucional:</strong> El funcionario pasará a estado{' '}
            <strong>BAJA</strong> y su asignación laboral vigente se cerrará al{' '}
            {formatDate(fechaBaja)}. Si posee cuenta de usuario en el sistema, se desactivará
            automáticamente.
          </div>
        </div>

        {/* Resumen del funcionario */}
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.375rem',
            border: '1px solid #e2e8f0',
            fontSize: '0.875rem',
          }}
        >
          <div>
            <strong>Funcionario:</strong> {funcionario.nombres} {funcionario.apellidos}
          </div>
          <div style={{ color: '#64748b' }}>
            CI:{' '}
            <strong className="font-mono">
              {funcionario.ci} {funcionario.ciExpedido}
            </strong>{' '}
            · Ingreso: {formatDate(funcionario.fechaIngreso)}
          </div>
        </div>

        {/* Fecha de baja */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.25rem',
            }}
          >
            Fecha de Baja <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <Input
            type="date"
            value={fechaBaja}
            min={funcionario.fechaIngreso}
            onChange={(e) => setFechaBaja(e.target.value)}
            required
          />
          {!fechaValida && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#dc2626',
                marginTop: '0.25rem',
                display: 'block',
              }}
            >
              La fecha no puede ser anterior al ingreso ({formatDate(funcionario.fechaIngreso)}).
            </span>
          )}
        </div>

        {/* Motivo de baja */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.25rem',
            }}
          >
            Motivo de Baja <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <Select
            value={motivoBaja}
            onChange={(e) => setMotivoBaja(e.target.value as MotivoBaja)}
            options={MOTIVOS_BAJA}
          />
        </div>

        {/* Detalle si es OTRO o comentario */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.25rem',
            }}
          >
            Detalle del Motivo{' '}
            {motivoBaja === 'OTRO' && <span style={{ color: '#dc2626' }}>*</span>}
          </label>
          <Input
            placeholder={
              motivoBaja === 'OTRO'
                ? 'Especifique el motivo de la baja...'
                : 'Observaciones adicionales (opcional)...'
            }
            value={detalleBaja}
            onChange={(e) => setDetalleBaja(e.target.value)}
            required={motivoBaja === 'OTRO'}
            maxLength={300}
          />
        </div>

        {/* CA-06: Confirmación por CI */}
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.85rem',
            backgroundColor: '#fff7ed',
            border: '1px solid #ffedd5',
            borderRadius: '0.375rem',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#9a3412',
              marginBottom: '0.25rem',
            }}
          >
            Confirmación de Seguridad (CA-06)
          </label>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#7c2d12' }}>
            Para confirmar la baja definitiva, escribe exactamente el número de CI del funcionario:{' '}
            <strong className="font-mono">{funcionario.ci}</strong>
          </p>
          <Input
            placeholder={`Escribe ${funcionario.ci} para confirmar`}
            value={ciConfirmacion}
            onChange={(e) => setCiConfirmacion(e.target.value)}
            autoComplete="off"
          />
        </div>
      </form>
    </Modal>
  )
}
