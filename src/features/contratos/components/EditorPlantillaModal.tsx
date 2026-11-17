import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, Info } from 'lucide-react'
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
  const [modoVisualizacion, setModoVisualizacion] = useState<'dividido' | 'editor' | 'preview'>('dividido')

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
      setModoVisualizacion('dividido')
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
      size="xl"
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
      <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

        {/* Panel de Inserción de Campos Dinámicos (Human-Friendly) */}
        <div
          style={{
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '12px',
            padding: '14px 16px',
            backgroundColor: '#fafafc',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1d1d1f' }}>
                Campos Dinámicos del Contrato
              </span>
              <p style={{ fontSize: '0.76rem', color: '#86868b', margin: '2px 0 0' }}>
                Haz clic en cualquier campo para insertarlo automáticamente en la posición del cursor.
              </p>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#d97706', fontWeight: 500 }}>
              ★ Campos obligatorios de ley
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
                    gap: '5px',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    backgroundColor: esObligatoria ? 'rgba(255, 149, 0, 0.1)' : '#ffffff',
                    border: `1px solid ${esObligatoria ? 'rgba(255, 149, 0, 0.35)' : 'rgba(0, 0, 0, 0.1)'}`,
                    color: esObligatoria ? '#9c4400' : '#1d1d1f',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.15s ease',
                  }}
                  title={`Inserta ${v.tag} en el documento`}
                >
                  <span style={{ color: esObligatoria ? '#d97706' : '#0f766e', fontWeight: 700 }}>+</span>
                  <span>{v.label}</span>
                  {esObligatoria && <span style={{ color: '#d97706', fontWeight: 700 }}>★</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selector de modo de vista si la vista previa está activa */}
        {vistaPrevia && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-6px' }}>
            <div className="segmented-control-ds" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className={`segmented-tab-ds ${modoVisualizacion === 'dividido' ? 'is-active' : ''}`}
                onClick={() => setModoVisualizacion('dividido')}
              >
                Vista Dividida
              </button>
              <button
                type="button"
                className={`segmented-tab-ds ${modoVisualizacion === 'preview' ? 'is-active' : ''}`}
                onClick={() => setModoVisualizacion('preview')}
              >
                Solo Vista Previa
              </button>
              <button
                type="button"
                className={`segmented-tab-ds ${modoVisualizacion === 'editor' ? 'is-active' : ''}`}
                onClick={() => setModoVisualizacion('editor')}
              >
                Solo Editor
              </button>
            </div>
          </div>
        )}

        {/* Editor de Contenido y Vista Previa */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              vistaPrevia && modoVisualizacion === 'dividido'
                ? '1fr 1fr'
                : '1fr',
            gap: '1.25rem',
          }}
        >
          {(!vistaPrevia || modoVisualizacion !== 'preview') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label-ds" style={{ margin: 0 }}>
                  Contenido de la Cláusula / Texto del Contrato
                </label>
                <span style={{ fontSize: '0.75rem', color: '#86868b' }}>
                  {contenido.length} caracteres
                </span>
              </div>
              <textarea
                ref={textareaRef}
                rows={16}
                className="input-ds font-mono"
                style={{
                  width: '100%',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  minHeight: '360px',
                }}
                placeholder="Redacta las cláusulas del contrato insertando los campos dinámicos..."
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                required
              />
              {errores.contenido && <p className="form-error-ds">{errores.contenido}</p>}
            </div>
          )}

          {vistaPrevia && modoVisualizacion !== 'editor' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label-ds" style={{ margin: 0 }}>
                  Previsualización de Documento
                </label>
                <Badge variant="brand" size="sm">
                  Renderizado Handlebars
                </Badge>
              </div>
              <div
                style={{
                  border: '1px solid #d2d2d7',
                  borderRadius: '12px',
                  padding: '24px 28px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.05)',
                  minHeight: '360px',
                  maxHeight: '480px',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    fontSize: '0.92rem',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    color: '#1d1d1f',
                    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                  }}
                >
                  {vistaPrevia}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#86868b' }}>
          <Info size={14} className="shrink-0" />
          <span>
            {esEdicion
              ? 'Al guardar se archivará la versión actual y se creará una versión siguiente inmutable.'
              : 'Se creará la versión 1 activa. Los campos con ★ son obligatorios por el Kata laboral.'}
          </span>
        </div>
      </form>
    </Modal>
  )
}

