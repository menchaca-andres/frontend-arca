import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, FileCode2, Info, Sparkles } from 'lucide-react'
import { Badge, Button, Input, Modal, Select, useToast } from '../../../components'
import { ApiError, ApiService } from '../../../services/api'
import type { PlantillaItem, TipoContrato } from '../../../types'

interface VariableItem {
  key: string
  label: string
  tag: string
  categoria: 'obligatoria' | 'funcionario' | 'asignacion' | 'empresa'
}

const VARIABLES_CATALOGO: VariableItem[] = [
  // Obligatorias Kata
  {
    key: 'funcionario.fecha_ingreso',
    label: 'Fecha de Ingreso',
    tag: '{{funcionario.fecha_ingreso}}',
    categoria: 'obligatoria',
  },
  {
    key: 'asignacion.remuneracion',
    label: 'Remuneración (Sueldo)',
    tag: '{{asignacion.remuneracion}}',
    categoria: 'obligatoria',
  },
  {
    key: 'funcionario.dias_prueba',
    label: 'Días de Prueba',
    tag: '{{funcionario.dias_prueba}}',
    categoria: 'obligatoria',
  },

  // Funcionario
  {
    key: 'funcionario.nombre_completo',
    label: 'Nombre Completo',
    tag: '{{funcionario.nombre_completo}}',
    categoria: 'funcionario',
  },
  {
    key: 'funcionario.ci',
    label: 'Cédula de Identidad',
    tag: '{{funcionario.ci}}',
    categoria: 'funcionario',
  },

  // Asignación
  {
    key: 'asignacion.cargo',
    label: 'Cargo',
    tag: '{{asignacion.cargo}}',
    categoria: 'asignacion',
  },
  {
    key: 'asignacion.area',
    label: 'Área',
    tag: '{{asignacion.area}}',
    categoria: 'asignacion',
  },
  {
    key: 'asignacion.remuneracion_literal',
    label: 'Sueldo en Literal',
    tag: '{{asignacion.remuneracion_literal}}',
    categoria: 'asignacion',
  },

  // Empresa & Fecha
  {
    key: 'empresa.razon_social',
    label: 'Razón Social Empresa',
    tag: '{{empresa.razon_social}}',
    categoria: 'empresa',
  },
  {
    key: 'fecha_emision',
    label: 'Fecha de Emisión',
    tag: '{{fecha_emision}}',
    categoria: 'empresa',
  },
]

const OPCIONES_TIPO: Array<{ value: TipoContrato; label: string }> = [
  { value: 'INDEFINIDO', label: 'Plazo Indefinido' },
  { value: 'PLAZO_FIJO', label: 'Plazo Fijo' },
]

interface EditorPlantillaModalProps {
  isOpen: boolean
  plantillaParaEditar: PlantillaItem | null
  onClose: () => void
  onSuccess: (plantilla: PlantillaItem) => void
}

export function EditorPlantillaModal({
  isOpen,
  plantillaParaEditar,
  onClose,
  onSuccess,
}: EditorPlantillaModalProps) {
  const toast = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const esEdicion = Boolean(plantillaParaEditar)

  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoContrato>('INDEFINIDO')
  const [contenido, setContenido] = useState('')

  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [cargandoPreview, setCargandoPreview] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})

  // Cargar datos si es edición
  useEffect(() => {
    if (!isOpen) return

    if (plantillaParaEditar) {
      setCodigo(plantillaParaEditar.codigo)
      setNombre(plantillaParaEditar.nombre)
      setTipo(plantillaParaEditar.tipo)
      setContenido(plantillaParaEditar.versionActiva?.contenido ?? '')
    } else {
      setCodigo('')
      setNombre('')
      setTipo('INDEFINIDO')
      setContenido('')
    }
    setVistaPrevia(null)
    setErrores({})
  }, [isOpen, plantillaParaEditar])

  // Inserción de variable en el cursor (CA-03)
  const insertarVariable = (tag: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setContenido((prev) => `${prev} ${tag}`)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const antes = contenido.substring(0, start)
    const despues = contenido.substring(end)

    const nuevoContenido = `${antes}${tag}${despues}`
    setContenido(nuevoContenido)

    // Restaurar cursor después del tag insertado
    setTimeout(() => {
      textarea.focus()
      const nuevoPos = start + tag.length
      textarea.setSelectionRange(nuevoPos, nuevoPos)
    }, 0)
  }

  // Generar vista previa con Handlebars en backend (CA-07)
  const handleGenerarPreview = async () => {
    if (!contenido.trim()) {
      toast.warning('Escribe contenido en la plantilla primero', 'Contenido vacío')
      return
    }

    setCargandoPreview(true)
    try {
      const res = await ApiService.previewPlantilla(contenido)
      setVistaPrevia(res.contenidoRenderizado)
      toast.info('Vista previa generada con datos de muestra', 'Handlebars')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al compilar la vista previa',
        'Validación de plantilla',
      )
    } finally {
      setCargandoPreview(false)
    }
  }

  const validarFormulario = (): boolean => {
    const errs: Record<string, string> = {}

    if (!codigo.trim()) errs.codigo = 'El código es obligatorio'
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!contenido.trim() || contenido.trim().length < 20) {
      errs.contenido = 'El contenido debe tener al menos 20 caracteres'
    }

    // Verificar las 3 obligatorias del Kata en el frontend
    const obligatorias = [
      'funcionario.fecha_ingreso',
      'asignacion.remuneracion',
      'funcionario.dias_prueba',
    ]
    const faltantes = obligatorias.filter((ob) => !contenido.includes(ob))
    if (faltantes.length > 0) {
      errs.contenido = `Faltan las variables obligatorias: ${faltantes.map((f) => `{{${f}}}`).join(', ')}`
    }

    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  const handleGuardar = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!validarFormulario()) return

    setGuardando(true)
    try {
      let resultado: PlantillaItem
      if (esEdicion && plantillaParaEditar) {
        resultado = await ApiService.actualizarPlantilla(plantillaParaEditar.id, {
          nombre: nombre.trim(),
          tipo,
          contenido: contenido.trim(),
        })
        toast.success(
          `Nueva versión ${resultado.versionActiva?.version ?? ''} creada exitosamente`,
          'Plantilla actualizada',
        )
      } else {
        resultado = await ApiService.crearPlantilla({
          codigo: codigo.trim().toUpperCase(),
          nombre: nombre.trim(),
          tipo,
          contenido: contenido.trim(),
        })
        toast.success(`Plantilla ${resultado.codigo} creada con versión 1`, 'Plantilla creada')
      }

      onSuccess(resultado)
      onClose()
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message, 'Error al guardar plantilla')
      } else {
        toast.error('Ocurrió un error inesperado al procesar la plantilla', 'Error')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? `Editar Plantilla — ${plantillaParaEditar?.codigo}` : 'Nueva Plantilla de Contrato'}
      size="lg"
      footer={
        <div className="modal-actions-right">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Eye size={16} />}
            onClick={handleGenerarPreview}
            disabled={cargandoPreview || guardando}
          >
            {cargandoPreview ? 'Generando...' : 'Vista Previa'}
          </Button>
          <Button variant="primary" onClick={() => handleGuardar()} disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar Nueva Versión' : 'Crear Plantilla'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Metadatos de la plantilla */}
        <div className="form-grid-2">
          <Input
            label="Código de Plantilla"
            placeholder="Ej. CTR-INDEF"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            disabled={esEdicion}
            error={errores.codigo}
            helperText={esEdicion ? 'El código es inmutable' : 'Identificador único (mayúsculas)'}
            required
          />
          <Select
            label="Tipo de Contrato"
            options={OPCIONES_TIPO}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoContrato)}
            required
          />
        </div>

        <Input
          label="Nombre Descriptivo"
          placeholder="Ej. Contrato Individual de Trabajo a Plazo Indefinido"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
          required
        />

        {/* Panel de Inserción de Variables (CA-03) */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#f8fafc',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
              <FileCode2 size={16} className="text-brand" />
              <span>Variables Disponibles (Clic para insertar en el cursor):</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              <Sparkles size={12} style={{ display: 'inline', marginRight: '3px' }} />
              3 variables obligatorias marcadas con ★
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {VARIABLES_CATALOGO.map((v) => {
              const esObligatoria = v.categoria === 'obligatoria'
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertarVariable(v.tag)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    backgroundColor: esObligatoria ? '#fef3c7' : '#ffffff',
                    border: `1px solid ${esObligatoria ? '#f59e0b' : '#cbd5e1'}`,
                    color: esObligatoria ? '#92400e' : '#334155',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                  }}
                  title={`Insertar ${v.tag} en el documento`}
                >
                  {esObligatoria && <span style={{ color: '#d97706', fontWeight: 700 }}>★</span>}
                  {v.tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Editor de Contenido y Vista Previa lado a lado */}
        <div style={{ display: 'grid', gridTemplateColumns: vistaPrevia ? '1fr 1fr' : '1fr', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <label className="form-label-ds" style={{ margin: 0 }}>
                Contenido de la Cláusula / Texto
              </label>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {contenido.length} caracteres
              </span>
            </div>
            <textarea
              ref={textareaRef}
              rows={12}
              className="input-ds font-mono"
              style={{
                width: '100%',
                fontSize: '0.85rem',
                lineHeight: 1.4,
                resize: 'vertical',
                minHeight: '220px',
              }}
              placeholder="Redacta el contrato usando las variables {{...}}..."
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              required
            />
            {errores.contenido && <p className="form-error-ds">{errores.contenido}</p>}
          </div>

          {vistaPrevia && (
            <div
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#ffffff',
                maxHeight: '340px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Eye size={14} className="text-brand" />
                  <span>Vista Previa Renderizada (Datos Muestra)</span>
                </div>
                <Badge variant="brand" size="sm">
                  Handlebars
                </Badge>
              </div>
              <div
                style={{
                  fontSize: '0.82rem',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  color: '#1e293b',
                  fontFamily: 'serif',
                }}
              >
                {vistaPrevia}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
          <Info size={14} className="shrink-0" />
          <span>
            {esEdicion
              ? 'Al guardar se archivará la versión actual y se creará una versión siguiente inmutable.'
              : 'Se creará la versión 1 activa. Las 3 variables con ★ son obligatorias por el Kata.'}
          </span>
        </div>
      </form>
    </Modal>
  )
}

