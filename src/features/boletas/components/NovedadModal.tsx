import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Input,
  Modal,
  Select,
  useToast,
} from '../../../components'
import { ApiService } from '../../../services/api'
import {
  FUNCIONARIOS_SEMILLA_PADRON,
  type ConceptoItem,
  type FuncionarioPadronItem,
  type NovedadItem,
  type RegistrarNovedadInput,
} from '../../../types'

interface NovedadModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (novedad: NovedadItem) => void
  conceptos: ConceptoItem[]
  anioDefecto: number
  mesDefecto: number
  funcionariosDisponibles?: FuncionarioPadronItem[]
}

export function NovedadModal({
  isOpen,
  onClose,
  onSaved,
  conceptos,
  anioDefecto,
  mesDefecto,
  funcionariosDisponibles,
}: NovedadModalProps) {
  const toast = useToast()

  const [anio, setAnio] = useState(String(anioDefecto))
  const [mes, setMes] = useState(String(mesDefecto))
  const [funcionarioId, setFuncionarioId] = useState('')
  const [conceptoId, setConceptoId] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const [funcionarios, setFuncionarios] = useState<FuncionarioPadronItem[]>(
    funcionariosDisponibles && funcionariosDisponibles.length > 0
      ? funcionariosDisponibles
      : FUNCIONARIOS_SEMILLA_PADRON,
  )
  const [cargandoFuncionarios, setCargandoFuncionarios] = useState(false)
  const [guardando, setGuardando] = useState(false)

  // Solo se pueden registrar novedades sobre conceptos no automáticos ni de sistema
  const conceptosElegibles = useMemo(
    () => conceptos.filter((c) => c.activo && !c.automatico && !c.esSistema),
    [conceptos],
  )

  useEffect(() => {
    if (!isOpen) return

    setAnio(String(anioDefecto))
    setMes(String(mesDefecto))
    setFuncionarioId('')
    setConceptoId(conceptosElegibles[0]?.id ?? '')
    setMonto('')
    setDescripcion('')

    // Si ya recibimos funcionarios desde el componente padre, usarlos directamente
    if (funcionariosDisponibles && funcionariosDisponibles.length > 0) {
      setFuncionarios(funcionariosDisponibles)
      return
    }

    setCargandoFuncionarios(true)
    ApiService.getFuncionariosParaSelector()
      .then((data) => {
        if (data && data.length > 0) {
          setFuncionarios(data)
        } else {
          setFuncionarios(FUNCIONARIOS_SEMILLA_PADRON)
        }
      })
      .catch((err: unknown) => {
        console.warn('ms-personal no disponible, usando funcionarios por defecto:', err)
        setFuncionarios(FUNCIONARIOS_SEMILLA_PADRON)
      })
      .finally(() => setCargandoFuncionarios(false))
  }, [isOpen, anioDefecto, mesDefecto, conceptosElegibles, funcionariosDisponibles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!funcionarioId) {
      toast.error('Debe seleccionar un funcionario', 'Validación')
      return
    }

    if (!conceptoId) {
      toast.error('Debe seleccionar un concepto', 'Validación')
      return
    }

    const numMonto = parseFloat(monto)
    if (isNaN(numMonto) || numMonto <= 0) {
      toast.error('El monto de la novedad debe ser mayor a 0', 'Validación')
      return
    }

    const numAnio = parseInt(anio, 10)
    const numMes = parseInt(mes, 10)

    setGuardando(true)
    try {
      const payload: RegistrarNovedadInput = {
        anio: numAnio,
        mes: numMes,
        funcionarioId,
        conceptoId,
        monto: numMonto,
        descripcion: descripcion.trim() || null,
      }

      const guardada = await ApiService.createNovedad(payload)
      toast.success('Novedad registrada exitosamente para el período', 'Éxito')
      onSaved(guardada)
      onClose()
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al registrar la novedad'
      toast.error(mensaje, 'Error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Novedad del Período"
      footer={
        <div className="modal-actions-right">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Registrar Novedad'}
          </Button>
        </div>
      }
    >
      <form className="modal-form-ds" onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Año *"
            type="number"
            min="2020"
            max="2100"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            required
          />
          <Select
            label="Mes del Período *"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
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

        <Select
          label="Funcionario Destinatario *"
          value={funcionarioId}
          disabled={cargandoFuncionarios}
          onChange={(e) => setFuncionarioId(e.target.value)}
          options={[
            {
              value: '',
              label: cargandoFuncionarios
                ? 'Cargando funcionarios...'
                : 'Seleccionar funcionario...',
            },
            ...funcionarios.map((f) => ({
              value: f.id,
              label: `${f.nombreCompleto} — CI: ${f.ci}${f.cargoNombre ? ` (${f.cargoNombre})` : ''}`,
            })),
          ]}
          required
        />

        <Select
          label="Concepto a Aplicar *"
          value={conceptoId}
          onChange={(e) => setConceptoId(e.target.value)}
          options={[
            { value: '', label: 'Seleccionar concepto no automático...' },
            ...conceptosElegibles.map((c) => ({
              value: c.id,
              label: `[${c.tipo}] ${c.codigo} - ${c.nombre}`,
            })),
          ]}
          helperText="Solo se listan conceptos activos que no sean de asignación automática."
          required
        />

        <Input
          label="Monto en Bolivianos (Bs. > 0) *"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Ej: 500.00"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />

        <Input
          label="Descripción / Glosa (Opcional)"
          placeholder="Ej: Bono extraordinario por cumplimiento de objetivos"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </form>
    </Modal>
  )
}
