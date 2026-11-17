import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  FileText,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { Badge, Button, Modal, Select, StatusBadge, useToast } from '../../../components'
import { ApiError, ApiService } from '../../../services/api'
import type {
  ContratoItem,
  FuncionarioPadronItem,
  PlantillaItem,
  VistaPreviaContrato,
} from '../../../types'

interface GenerarContratoModalProps {
  isOpen: boolean
  plantillasDisponibles: PlantillaItem[]
  onClose: () => void
  onSuccess: (contrato: ContratoItem) => void
}

export function GenerarContratoModal({
  isOpen,
  plantillasDisponibles,
  onClose,
  onSuccess,
}: GenerarContratoModalProps) {
  const toast = useToast()

  // Lista de funcionarios
  const [funcionarios, setFuncionarios] = useState<FuncionarioPadronItem[]>([])
  const [cargandoFuncionarios, setCargandoFuncionarios] = useState(false)

  // Selección
  const [funcionarioId, setFuncionarioId] = useState('')
  const [plantillaId, setPlantillaId] = useState('')
  const [plantillasLocales, setPlantillasLocales] = useState<PlantillaItem[]>(plantillasDisponibles)

  // Vista Previa (CA-02)
  const [vistaPrevia, setVistaPrevia] = useState<VistaPreviaContrato | null>(null)
  const [cargandoPreview, setCargandoPreview] = useState(false)
  const [errorPreview, setErrorPreview] = useState<string | null>(null)

  // Generación y resultado
  const [generando, setGenerando] = useState(false)
  const [contratoEmitido, setContratoEmitido] = useState<ContratoItem | null>(null)
  const [descargandoPdf, setDescargandoPdf] = useState(false)

  // Cargar lista de funcionarios y plantillas al abrir
  useEffect(() => {
    if (!isOpen) {
      setFuncionarioId('')
      setPlantillaId('')
      setVistaPrevia(null)
      setErrorPreview(null)
      setContratoEmitido(null)
      return
    }

    const cargar = async () => {
      setCargandoFuncionarios(true)
      try {
        const data = await ApiService.getFuncionariosParaSelector()
        setFuncionarios(data)
        if (data.length > 0) {
          // Pre-seleccionar el primero que no esté de baja si existe
          const habilitado = data.find((f) => f.estado !== 'BAJA') ?? data[0]
          setFuncionarioId(habilitado.id)
        }
      } catch (err) {
        console.error('Error al cargar funcionarios para contrato', err)
      } finally {
        setCargandoFuncionarios(false)
      }

      // Asegurar plantillas disponibles
      let lista = plantillasDisponibles
      if (lista.length === 0) {
        try {
          lista = await ApiService.getPlantillas()
        } catch {
          // ignorar
        }
      }
      setPlantillasLocales(lista)
      const activa = lista.find((p) => p.activo)
      if (activa) {
        setPlantillaId(activa.id)
      }
    }

    void cargar()
  }, [isOpen, plantillasDisponibles])

  // Funcionario seleccionado actual
  const funcionarioSeleccionado = funcionarios.find((f) => f.id === funcionarioId)
  const esFuncionarioBaja = funcionarioSeleccionado?.estado === 'BAJA'

  // Cargar vista previa en vivo cuando cambian funcionarioId o plantillaId
  useEffect(() => {
    if (!isOpen || !funcionarioId) {
      setVistaPrevia(null)
      setErrorPreview(null)
      return
    }

    if (esFuncionarioBaja) {
      setVistaPrevia(null)
      setErrorPreview('El funcionario se encuentra en estado BAJA. No se puede generar un contrato (CA-03).')
      return
    }

    let cancelado = false

    const obtenerPreview = async () => {
      setCargandoPreview(true)
      setErrorPreview(null)
      try {
        const preview = await ApiService.previewContrato({
          funcionarioId,
          plantillaId: plantillaId || undefined,
        })
        if (!cancelado) {
          setVistaPrevia(preview)
          if (!plantillaId && preview.plantilla?.id) {
            setPlantillaId(preview.plantilla.id)
          }
        }
      } catch (err) {
        if (!cancelado) {
          const mensaje = err instanceof ApiError ? err.message : 'Error al obtener la vista previa'
          setErrorPreview(mensaje)
          setVistaPrevia(null)
        }
      } finally {
        if (!cancelado) setCargandoPreview(false)
      }
    }

    void obtenerPreview()

    return () => {
      cancelado = true
    }
  }, [isOpen, funcionarioId, plantillaId, esFuncionarioBaja])

  // Opciones de selector
  const opcionesFuncionarios = funcionarios.map((f) => ({
    value: f.id,
    label: `${f.nombreCompleto} (CI: ${f.ci}) - ${f.cargoNombre || 'Sin cargo'} [${f.estado}]`,
  }))

  const opcionesPlantillas = plantillasLocales
    .filter((p) => p.activo)
    .map((p) => ({
      value: p.id,
      label: `${p.nombre} (v${p.versionActiva?.version ?? 1} · ${p.tipo})`,
    }))

  // Generar contrato formal (CA-01 a CA-08)
  const handleGenerar = async () => {
    if (!funcionarioId) {
      toast.error('Debe seleccionar un funcionario')
      return
    }
    if (esFuncionarioBaja) {
      toast.error('No se puede generar contrato para un funcionario en estado BAJA (CA-03)')
      return
    }

    setGenerando(true)
    try {
      const generado = await ApiService.generarContrato({
        funcionarioId,
        plantillaId: plantillaId || undefined,
      })

      setContratoEmitido(generado)
      onSuccess(generado)
      toast.success(
        `Contrato ${generado.numero} (v${generado.version}) emitido exitosamente con hash SHA-256`,
        'Contrato emitido',
      )
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message, 'Error al generar contrato')
      } else {
        toast.error('Ocurrió un error inesperado al emitir el contrato')
      }
    } finally {
      setGenerando(false)
    }
  }

  // Descarga del PDF con Gotenberg (CA-05)
  const handleDescargarPdf = async () => {
    if (!contratoEmitido) return
    setDescargandoPdf(true)
    try {
      await ApiService.descargarContratoPdf(contratoEmitido.id, contratoEmitido.numero)
      toast.success(`Descargando Contrato-${contratoEmitido.numero}.pdf`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al descargar PDF'
      toast.error(msg)
    } finally {
      setDescargandoPdf(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contratoEmitido ? 'Contrato Emitido Exitosamente' : 'Generar Contrato de Funcionario'}
      size="xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {contratoEmitido ? (
            <>
              <Button
                variant="primary"
                leftIcon={<Download size={16} />}
                onClick={handleDescargarPdf}
                disabled={descargandoPdf}
              >
                {descargandoPdf ? 'Descargando...' : 'Descargar Contrato PDF'}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose} disabled={generando}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                leftIcon={<FileCheck size={16} />}
                onClick={handleGenerar}
                disabled={generando || cargandoPreview || !vistaPrevia || esFuncionarioBaja}
              >
                {generando ? 'Compilando y Firmando...' : 'Confirmar y Emitir Contrato'}
              </Button>
            </>
          )}
        </div>
      }
    >
      {contratoEmitido ? (
        // Vista de éxito con metadatos de auditoría
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <CheckCircle2 size={32} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ margin: '0 0 0.25rem', color: '#065f46', fontSize: '1.1rem' }}>
                Contrato {contratoEmitido.numero} emitido formalmente
              </h3>
              <p style={{ margin: 0, color: '#047857', fontSize: '0.88rem' }}>
                El documento fue compilado mediante Gotenberg, firmado digitalmente con hash SHA-256 e
                incorporado al archivo inmutable de ARCA.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.85rem',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--glass-bg-subtle)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                Número Correlativo (CA-07)
              </span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {contratoEmitido.numero}
              </strong>
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--glass-bg-subtle)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                Versión Vigente (CA-06)
              </span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--arca-info)' }}>
                Versión {contratoEmitido.version} (VIGENTE)
              </strong>
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--glass-bg-subtle)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                Estado Operativo
              </span>
              <StatusBadge status={contratoEmitido.estado} />
            </div>
          </div>

          {/* Huella Criptográfica SHA-256 */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--glass-bg-subtle)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.35rem',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={16} style={{ color: 'var(--arca-info)' }} />
              <span>Huella Criptográfica SHA-256 del PDF (CA-04)</span>
            </div>
            <code
              style={{
                display: 'block',
                wordBreak: 'break-all',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--glass-bg)',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--glass-border)',
              }}
            >
              {contratoEmitido.hashSha256}
            </code>
          </div>

          {/* Vista del texto final renderizado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Contenido Persistido Inmutable:
            </span>
            <div
              style={{
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                padding: '16px 20px',
                backgroundColor: 'var(--glass-bg)',
                maxHeight: '260px',
                overflowY: 'auto',
                fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {contratoEmitido.contenidoRenderizado}
            </div>
          </div>
        </div>
      ) : (
        // Formulario de Selección y Vista Previa en Vivo (CA-01, CA-02, CA-03)
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-grid-2">
            <div>
              <Select
                label="Funcionario Destinatario (CA-01)"
                options={opcionesFuncionarios}
                value={funcionarioId}
                onChange={(e) => setFuncionarioId(e.target.value)}
                disabled={cargandoFuncionarios || generando}
                helperText="Los datos laborales se obtienen automáticamente de ms-personal"
                required
              />
              {funcionarioSeleccionado && (
                <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Estado actual:</span>
                  <StatusBadge status={funcionarioSeleccionado.estado} />
                </div>
              )}
            </div>

            <div>
              <Select
                label="Plantilla de Contrato Activa"
                options={opcionesPlantillas}
                value={plantillaId}
                onChange={(e) => setPlantillaId(e.target.value)}
                disabled={generando}
                helperText="Plantilla formal aprobada con variables dinámicas"
                required
              />
            </div>
          </div>

          {/* Alerta de bloqueo si el funcionario está de baja (CA-03) */}
          {esFuncionarioBaja && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#b91c1c',
                fontSize: '0.88rem',
              }}
            >
              <AlertCircle size={20} className="shrink-0" />
              <span>
                <strong>Acción Bloqueada (CA-03):</strong> El funcionario seleccionado se encuentra en estado{' '}
                <strong>BAJA</strong>. No es posible generar contratos para personal inactivo.
              </span>
            </div>
          )}

          {/* Error en previsualización */}
          {errorPreview && !esFuncionarioBaja && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#b91c1c',
                fontSize: '0.88rem',
              }}
            >
              <AlertCircle size={20} className="shrink-0" />
              <span>{errorPreview}</span>
            </div>
          )}

          {/* Contenedor de Vista Previa en Vivo (CA-02) */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={16} style={{ color: 'var(--arca-info)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Previsualización en Vivo del Contrato (CA-02)
                </span>
                {cargandoPreview && (
                  <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
                )}
              </div>

              {vistaPrevia && (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <Badge variant="brand" size="sm">
                    {vistaPrevia.plantilla.nombre} (v{vistaPrevia.plantilla.version})
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {vistaPrevia.plantilla.tipo}
                  </Badge>
                </div>
              )}
            </div>

            {/* Hoja de Contrato Legal estilo Apple */}
            <div
              style={{
                border: '1px solid var(--glass-border)',
                borderRadius: '14px',
                padding: '28px 32px',
                backgroundColor: 'var(--glass-bg)',
                boxShadow: 'var(--glass-shadow)',
                minHeight: '340px',
                maxHeight: '440px',
                overflowY: 'auto',
                position: 'relative',
              }}
            >
              {cargandoPreview ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '280px',
                    color: 'var(--text-secondary)',
                    gap: '0.75rem',
                  }}
                >
                  <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--arca-info)' }} />
                  <span style={{ fontSize: '0.9rem' }}>
                    Compilando plantilla con datos de ms-personal...
                  </span>
                </div>
              ) : vistaPrevia ? (
                <div
                  style={{
                    fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                    fontSize: '0.95rem',
                    lineHeight: 1.7,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    textAlign: 'justify',
                  }}
                >
                  {vistaPrevia.contenidoRenderizado}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '280px',
                    color: '#94a3b8',
                    gap: '0.5rem',
                  }}
                >
                  <FileText size={32} style={{ opacity: 0.4 }} />
                  <span style={{ fontSize: '0.9rem' }}>
                    Seleccione un funcionario habilitado para cargar la previsualización en vivo.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
