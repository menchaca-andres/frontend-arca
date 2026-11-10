import { useEffect, useState } from 'react'
import {
  Button,
  Input,
  Modal,
  Select,
  useToast,
} from '../../../components'
import { ApiService } from '../../../services/api'
import type {
  ActualizarConceptoInput,
  BaseCalculo,
  ConceptoItem,
  CrearConceptoInput,
  FormaCalculo,
  TipoConcepto,
} from '../../../types'

interface ConceptoModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (concepto: ConceptoItem) => void
  conceptoParaEditar?: ConceptoItem | null
}

export function ConceptoModal({
  isOpen,
  onClose,
  onSaved,
  conceptoParaEditar,
}: ConceptoModalProps) {
  const toast = useToast()
  const esEdicion = Boolean(conceptoParaEditar)

  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoConcepto>('HABER')
  const [formaCalculo, setFormaCalculo] = useState<FormaCalculo>('MONTO_FIJO')
  const [valor, setValor] = useState<string>('')
  const [base, setBase] = useState<BaseCalculo | ''>('')
  const [automatico, setAutomatico] = useState(false)
  const [orden, setOrden] = useState('10')
  const [activo, setActivo] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (conceptoParaEditar) {
      setCodigo(conceptoParaEditar.codigo)
      setNombre(conceptoParaEditar.nombre)
      setTipo(conceptoParaEditar.tipo)
      setFormaCalculo(conceptoParaEditar.formaCalculo)
      setValor(conceptoParaEditar.valor !== null ? String(conceptoParaEditar.valor) : '')
      setBase(conceptoParaEditar.base ?? '')
      setAutomatico(conceptoParaEditar.automatico)
      setOrden(String(conceptoParaEditar.orden))
      setActivo(conceptoParaEditar.activo)
    } else {
      setCodigo('')
      setNombre('')
      setTipo('HABER')
      setFormaCalculo('MONTO_FIJO')
      setValor('')
      setBase('')
      setAutomatico(false)
      setOrden('10')
      setActivo(true)
    }
  }, [conceptoParaEditar, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      toast.error('El nombre del concepto es obligatorio', 'Validación')
      return
    }

    if (!esEdicion && !codigo.trim()) {
      toast.error('El código del concepto es obligatorio', 'Validación')
      return
    }

    const numOrden = parseInt(orden, 10)
    if (isNaN(numOrden) || numOrden < 1) {
      toast.error('El orden debe ser un número entero mayor o igual a 1', 'Validación')
      return
    }

    let numValor: number | null = null
    let baseCalculo: BaseCalculo | null = null

    if (formaCalculo === 'PORCENTAJE') {
      const v = parseFloat(valor)
      if (isNaN(v) || v < 0 || v > 100) {
        toast.error('El porcentaje debe ser un valor numérico entre 0 y 100', 'Validación')
        return
      }
      if (!base) {
        toast.error('Para forma de cálculo PORCENTAJE debe seleccionar la base', 'Validación')
        return
      }
      numValor = v
      baseCalculo = base as BaseCalculo
    } else if (formaCalculo === 'MONTO_FIJO') {
      const v = parseFloat(valor)
      if (isNaN(v) || v <= 0) {
        toast.error('Para MONTO_FIJO el valor debe ser un monto mayor a 0', 'Validación')
        return
      }
      numValor = v
      baseCalculo = null
    } else {
      numValor = null
      baseCalculo = null
    }

    setGuardando(true)
    try {
      if (esEdicion && conceptoParaEditar) {
        const payload: ActualizarConceptoInput = {
          nombre: nombre.trim(),
          formaCalculo,
          valor: numValor,
          base: baseCalculo,
          automatico,
          orden: numOrden,
          activo,
        }
        const actualizado = await ApiService.updateConcepto(conceptoParaEditar.id, payload)
        toast.success(`Concepto ${actualizado.codigo} actualizado correctamente`, 'Éxito')
        onSaved(actualizado)
      } else {
        const payload: CrearConceptoInput = {
          codigo: codigo.trim().toUpperCase(),
          nombre: nombre.trim(),
          tipo,
          formaCalculo,
          valor: numValor,
          base: baseCalculo,
          automatico,
          orden: numOrden,
        }
        const creado = await ApiService.createConcepto(payload)
        toast.success(`Concepto ${creado.codigo} creado exitosamente`, 'Éxito')
        onSaved(creado)
      }
      onClose()
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al guardar el concepto'
      toast.error(mensaje, 'Error')
    } finally {
      setGuardando(false)
    }
  }

  const esSistema = conceptoParaEditar?.esSistema ?? false

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? `Editar Concepto: ${conceptoParaEditar?.codigo}` : 'Nuevo Concepto de Planilla'}
      footer={
        <div className="modal-actions-right">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Actualizar Concepto' : 'Crear Concepto'}
          </Button>
        </div>
      }
    >
      <form className="modal-form-ds" onSubmit={handleSubmit}>
        {!esEdicion ? (
          <Input
            label="Código Único del Concepto *"
            placeholder="Ej: BONO_PRODUCCION, ANTICIPO"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            helperText="Solo mayúsculas, números y guión bajo. No podrá modificarse luego."
            required
          />
        ) : (
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Código</label>
            <p className="font-mono font-bold text-slate-700">{conceptoParaEditar?.codigo}</p>
          </div>
        )}

        <Input
          label="Nombre Descriptivo *"
          placeholder="Ej: Bono por Cumplimiento de Metas"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {!esEdicion ? (
            <Select
              label="Tipo de Concepto *"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoConcepto)}
              options={[
                { value: 'HABER', label: 'Haber (Ingreso al Trabajador)' },
                { value: 'DESCUENTO', label: 'Descuento (Retención / Deducción)' },
              ]}
            />
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Tipo</label>
              <p className="font-semibold text-slate-700">{conceptoParaEditar?.tipo}</p>
            </div>
          )}

          <Select
            label="Forma de Cálculo *"
            value={formaCalculo}
            disabled={esSistema}
            onChange={(e) => {
              const nuevaForma = e.target.value as FormaCalculo
              setFormaCalculo(nuevaForma)
              if (nuevaForma === 'SISTEMA') {
                setValor('')
                setBase('')
              } else if (nuevaForma === 'MONTO_FIJO') {
                setBase('')
              }
            }}
            options={[
              { value: 'MONTO_FIJO', label: 'Monto Fijo (Bs.)' },
              { value: 'PORCENTAJE', label: 'Porcentaje (%) sobre Base' },
              ...(esSistema ? [{ value: 'SISTEMA', label: 'Sistema (Cálculo Especial)' }] : []),
            ]}
          />
        </div>

        {formaCalculo === 'PORCENTAJE' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Porcentaje (% entre 0 y 100) *"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Ej: 12.71"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
            <Select
              label="Base de Cálculo *"
              value={base}
              onChange={(e) => setBase(e.target.value as BaseCalculo)}
              options={[
                { value: '', label: 'Seleccionar base...' },
                { value: 'TOTAL_GANADO', label: 'Total Ganado' },
                { value: 'HABER_BASICO', label: 'Haber Básico' },
              ]}
              required
            />
          </div>
        )}

        {formaCalculo === 'MONTO_FIJO' && (
          <Input
            label="Monto Fijo (Bs. > 0) *"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Ej: 250.00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
          <Input
            label="Orden en la Boleta *"
            type="number"
            min="1"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            helperText="Define la posición en el desglose"
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={automatico}
                disabled={esSistema}
                onChange={(e) => setAutomatico(e.target.checked)}
              />
              <strong>Automático para todos</strong>
            </label>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Si no es automático, se asigna mediante registro de novedades.
            </span>
          </div>
        </div>

        {esEdicion && !esSistema && (
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
              />
              <span>Concepto Activo para nuevas planillas</span>
            </label>
          </div>
        )}
      </form>
    </Modal>
  )
}

