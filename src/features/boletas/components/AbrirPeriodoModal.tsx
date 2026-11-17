import { useState } from 'react'
import { Button, Modal, Select, useToast } from '../../../components'
import { ApiService } from '../../../services/api'
import type { PeriodoItem } from '../../../types'

interface AbrirPeriodoModalProps {
  isOpen: boolean
  onClose: () => void
  onCreado: (periodo: PeriodoItem) => void
}

export function AbrirPeriodoModal({ isOpen, onClose, onCreado }: AbrirPeriodoModalProps) {
  const toast = useToast()
  const fechaActual = new Date()
  const [anio, setAnio] = useState<number>(fechaActual.getFullYear())
  const [mes, setMes] = useState<number>(fechaActual.getMonth() + 1)
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const nuevo = await ApiService.abrirPeriodo({ anio, mes })
      toast.success(`Período ${mes}/${anio} abierto exitosamente en estado BORRADOR`, 'Período Abierto')
      onCreado(nuevo)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al abrir el período'
      toast.error(msg, 'Error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Abrir Nuevo Período de Planilla (CA-01)"
      footer={
        <div className="modal-actions-right">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={guardando}>
            {guardando ? 'Abriendo...' : 'Abrir Período'}
          </Button>
        </div>
      }
    >
      <form className="modal-form-ds" onSubmit={handleSubmit}>
        <p className="text-slate-600 text-sm mb-4">
          Abre un nuevo período mensual para habilitar el registro de novedades y el cálculo automático
          de planillas. El período nace en estado <strong>BORRADOR</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label="Año"
            value={String(anio)}
            onChange={(e) => setAnio(Number(e.target.value))}
            options={[
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
              { value: '2027', label: '2027' },
            ]}
          />

          <Select
            label="Mes de Liquidación"
            value={String(mes)}
            onChange={(e) => setMes(Number(e.target.value))}
            options={[
              { value: '1', label: '01 - Enero' },
              { value: '2', label: '02 - Febrero' },
              { value: '3', label: '03 - Marzo' },
              { value: '4', label: '04 - Abril' },
              { value: '5', label: '05 - Mayo' },
              { value: '6', label: '06 - Junio' },
              { value: '7', label: '07 - Julio' },
              { value: '8', label: '08 - Agosto' },
              { value: '9', label: '09 - Septiembre' },
              { value: '10', label: '10 - Octubre' },
              { value: '11', label: '11 - Noviembre' },
              { value: '12', label: '12 - Diciembre' },
            ]}
          />
        </div>
      </form>
    </Modal>
  )
}
