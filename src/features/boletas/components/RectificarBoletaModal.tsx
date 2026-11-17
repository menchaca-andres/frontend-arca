import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button, Modal, useToast } from '../../../components'
import { ApiService } from '../../../services/api'
import type { BoletaPlanillaItem } from '../../../types'
import { formatCurrency } from '../../../utils/formatters'

interface RectificarBoletaModalProps {
  isOpen: boolean
  onClose: () => void
  boleta: BoletaPlanillaItem | null
  onRectificada: (nuevaBoleta: BoletaPlanillaItem) => void
}

export function RectificarBoletaModal({
  isOpen,
  onClose,
  boleta,
  onRectificada,
}: RectificarBoletaModalProps) {
  const toast = useToast()
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (!boleta) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!motivo.trim() || motivo.trim().length < 5) {
      toast.error('El motivo de rectificación debe tener al menos 5 caracteres', 'Validación')
      return
    }

    setGuardando(true)
    try {
      const nueva = await ApiService.rectificarBoleta(boleta.id, { motivo: motivo.trim() })
      toast.success(
        `Boleta ${boleta.numero ?? ''} rectificada exitosamente. Se emitió la Versión ${nueva.version} (${nueva.numero ?? ''})`,
        'Rectificación Exitosa (HU-22)',
      )
      onRectificada(nueva)
      onClose()
      setMotivo('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al rectificar la boleta'
      toast.error(msg, 'Error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Rectificar Boleta — ${boleta.numero ?? 'S/N'} (CA-05)`}
      footer={
        <div className="modal-actions-right">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={guardando}>
            {guardando ? 'Rectificando y Emitiendo...' : `Emitir Versión ${boleta.version + 1}`}
          </Button>
        </div>
      }
    >
      <form className="modal-form-ds" onSubmit={handleSubmit}>
        <div
          style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: '#1e40af',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={20} className="flex-shrink-0" style={{ marginTop: '2px' }} />
          <div>
            <strong>Inmutabilidad Legal y Trazabilidad (CA-05, CA-06)</strong>
            <p style={{ marginTop: '3px' }}>
              La boleta actual <strong>{boleta.numero} (v{boleta.version})</strong> pasará de forma inmutable a estado{' '}
              <span className="badge badge-rectificada">RECTIFICADA</span>. El sistema recalculará los conceptos y
              novedades actuales del funcionario y emitirá automáticamente la <strong>Versión {boleta.version + 1}</strong> con
              nuevo correlativo formal, nuevo PDF y huella SHA-256.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }} className="text-slate-600">
          <div>
            <strong>Funcionario:</strong> {boleta.datosFuncionario?.nombres} {boleta.datosFuncionario?.apellidos} (CI:{' '}
            {boleta.datosFuncionario?.documentoIdentidad})
          </div>
          <div>
            <strong>Cargo:</strong> {boleta.datosFuncionario?.cargo}
          </div>
          <div>
            <strong>Líquido Original Vigente:</strong> {formatCurrency(boleta.liquidoPagable)}
          </div>
        </div>

        <div className="form-group-ds">
          <label htmlFor="motivo-rectificacion" className="form-label-ds">
            Motivo Obligatorio de Rectificación (CA-05) *
          </label>
          <textarea
            id="motivo-rectificacion"
            className="input-ds"
            rows={3}
            placeholder="Describe la justificación legal o salarial (ej. Corrección retroactiva de asignación de bono, ajuste de horas extra autorizadas por gerencia)..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            minLength={5}
            maxLength={300}
            style={{ width: '100%', resize: 'vertical' }}
          />
          <span className="text-xs text-slate-400" style={{ display: 'block', marginTop: '4px' }}>
            Mínimo 5 caracteres. Máximo 300 caracteres. Quedará registrado en la auditoría inmutable de la boleta.
          </span>
        </div>
      </form>
    </Modal>
  )
}
