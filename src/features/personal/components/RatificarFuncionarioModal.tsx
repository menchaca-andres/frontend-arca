import { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Button, Input, Modal, useToast } from '../../../components'
import { ApiService } from '../../../services/api'
import type { FichaFuncionario } from '../../../types'
import { formatDate } from '../../../utils/formatters'

interface RatificarFuncionarioModalProps {
  funcionario: FichaFuncionario | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (fichaActualizada: FichaFuncionario) => void
}

function calcularFinPrueba(fechaIngreso: string, diasPrueba: number): string {
  const [y, m, d] = fechaIngreso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + diasPrueba)
  return date.toISOString().split('T')[0]
}

export function RatificarFuncionarioModal({
  funcionario,
  isOpen,
  onClose,
  onSuccess,
}: RatificarFuncionarioModalProps) {
  const toast = useToast()
  const [fechaRatificacion, setFechaRatificacion] = useState(
    () => new Date().toISOString().split('T')[0],
  )
  const [guardando, setGuardando] = useState(false)

  if (!funcionario) return null

  const finPrueba = calcularFinPrueba(funcionario.fechaIngreso, funcionario.diasPrueba)
  const pruebaConcluida = fechaRatificacion >= finPrueba

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // CA-02: Solo se puede ratificar cuando ya pasaron sus días de prueba
    if (!pruebaConcluida) {
      toast.error(
        `No se puede ratificar antes de que concluya el periodo de prueba (${funcionario.diasPrueba} días, fecha fin: ${formatDate(finPrueba)})`,
        'Periodo no concluido',
      )
      return
    }

    setGuardando(true)
    try {
      const fichaActualizada = await ApiService.ratificarFuncionario(funcionario.id, {
        fechaRatificacion,
      })
      toast.success(
        `El funcionario ${funcionario.nombres} ${funcionario.apellidos} ha sido ratificado con éxito.`,
        'Funcionario Ratificado',
      )
      onSuccess(fichaActualizada)
      onClose()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo ratificar al funcionario',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} color="#16a34a" />
          <span>Ratificar Funcionario</span>
        </div>
      }
      size="md"
      footer={
        <div className="modal-actions-right">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={guardando || !pruebaConcluida}>
            {guardando ? 'Ratificando...' : 'Confirmar Ratificación'}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div
          style={{
            padding: '0.85rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            {funcionario.nombres} {funcionario.apellidos}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            CI:{' '}
            <strong className="font-mono">
              {funcionario.ci} {funcionario.ciExpedido}
            </strong>{' '}
            · Ingreso: {formatDate(funcionario.fechaIngreso)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            Periodo de prueba: <strong>{funcionario.diasPrueba} días</strong> (Conclusión:{' '}
            <strong className="font-mono">{formatDate(finPrueba)}</strong>)
          </div>
        </div>

        {!pruebaConcluida && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '0.375rem',
              color: '#92400e',
              fontSize: '0.875rem',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong>Periodo de prueba en curso:</strong> Según el criterio CA-02, solo se puede
              ratificar cuando ya concluyeron los {funcionario.diasPrueba} días de prueba (a partir
              del {formatDate(finPrueba)}).
            </div>
          </div>
        )}

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.25rem',
            }}
          >
            Fecha de Ratificación <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <Input
            type="date"
            value={fechaRatificacion}
            onChange={(e) => setFechaRatificacion(e.target.value)}
            required
          />
          <span
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              marginTop: '0.25rem',
              display: 'block',
            }}
          >
            Fecha a partir de la cual el funcionario pasa a estado RATIFICADO con acceso pleno a
            beneficios.
          </span>
        </div>
      </form>
    </Modal>
  )
}
