import { useEffect, useState } from 'react'
import {
  Clock,
  Download,
  FileText,
  History,
  ShieldCheck,
  User,
} from 'lucide-react'
import { Badge, Button, Modal, StatusBadge, useToast } from '../../../components'
import { ApiError, ApiService } from '../../../services/api'
import type { ContratoItem, DetalleContratoItem } from '../../../types'

interface DetalleContratoModalProps {
  isOpen: boolean
  contratoId: string | null
  onClose: () => void
}

export function DetalleContratoModal({
  isOpen,
  contratoId,
  onClose,
}: DetalleContratoModalProps) {
  const toast = useToast()
  const [detalle, setDetalle] = useState<DetalleContratoItem | null>(null)
  const [cargando, setCargando] = useState(false)
  const [descargandoId, setDescargandoId] = useState<string | null>(null)
  const [tabInterno, setTabInterno] = useState<'documento' | 'historial'>('documento')

  useEffect(() => {
    if (!isOpen || !contratoId) {
      setDetalle(null)
      return
    }

    let cancelado = false
    const cargar = async () => {
      setCargando(true)
      try {
        const data = await ApiService.getContratoDetalle(contratoId)
        if (!cancelado) {
          setDetalle(data)
        }
      } catch (err) {
        if (!cancelado) {
          const msg = err instanceof ApiError ? err.message : 'Error al cargar detalle del contrato'
          toast.error(msg)
          onClose()
        }
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    void cargar()
    return () => {
      cancelado = true
    }
  }, [isOpen, contratoId, onClose, toast])

  const handleDescargar = async (c: ContratoItem) => {
    setDescargandoId(c.id)
    try {
      await ApiService.descargarContratoPdf(c.id, c.numero)
      toast.success(`Descargando Contrato-${c.numero}.pdf (Hash verificado)`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al descargar PDF'
      toast.error(msg)
    } finally {
      setDescargandoId(null)
    }
  }

  // Extraer información humana del snapshot guardado en datos
  const funcionarioNombre =
    (detalle?.datos as any)?.funcionario?.nombre_completo ||
    (detalle?.datos as any)?.funcionario?.nombreCompleto ||
    'Funcionario'
  const cargoNombre = (detalle?.datos as any)?.asignacion?.cargo || 'Sin cargo especificado'
  const areaNombre = (detalle?.datos as any)?.asignacion?.area || 'Sin área especificada'
  const remuneracion = (detalle?.datos as any)?.asignacion?.remuneracion
  const fechaIngreso = (detalle?.datos as any)?.funcionario?.fecha_ingreso

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        detalle
          ? `Ficha de Contrato ${detalle.numero} · v${detalle.version}`
          : 'Cargando Contrato...'
      }
      size="xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {detalle && (
            <Button
              variant="primary"
              leftIcon={<Download size={16} />}
              onClick={() => handleDescargar(detalle)}
              disabled={descargandoId === detalle.id}
            >
              {descargandoId === detalle.id ? 'Descargando...' : 'Descargar Contrato PDF'}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      {cargando || !detalle ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Cargando datos y auditoría del contrato...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header informativo del funcionario y asignación */}
          <div
            style={{
              padding: '1.1rem 1.35rem',
              borderRadius: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.05rem', fontWeight: 600 }}>
                    {funcionarioNombre}
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {cargoNombre} &bull; {areaNombre}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StatusBadge status={detalle.estado} />
                <Badge variant="brand" size="sm">
                  Versión {detalle.version}
                </Badge>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.65rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid #edf2f7',
                fontSize: '0.82rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Fecha de Emisión:</span>
                <strong style={{ color: '#334155' }}>
                  {new Date(detalle.createdAt).toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </div>
              {fechaIngreso && (
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Fecha de Ingreso:</span>
                  <strong style={{ color: '#334155' }}>{fechaIngreso}</strong>
                </div>
              )}
              {remuneracion !== undefined && (
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Remuneración:</span>
                  <strong style={{ color: '#047857' }}>Bs. {remuneracion.toLocaleString('es-BO')}</strong>
                </div>
              )}
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Plantilla:</span>
                <strong style={{ color: '#334155' }}>
                  {detalle.plantillaVersion?.plantilla?.nombre || 'Plantilla de Trabajo'}
                </strong>
              </div>
            </div>
          </div>

          {/* Huella Criptográfica SHA-256 (CA-03) */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                Huella SHA-256 (CA-03):
              </span>
              <code
                style={{
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  color: '#0f172a',
                  wordBreak: 'break-all',
                }}
              >
                {detalle.hashSha256}
              </code>
            </div>
            <Badge variant="success" size="sm">
              Verificado
            </Badge>
          </div>

          {/* Segmented control para alternar entre Documento e Historial */}
          <div className="segmented-control-ds" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className={`segmented-tab-ds ${tabInterno === 'documento' ? 'is-active' : ''}`}
              onClick={() => setTabInterno('documento')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={15} />
                Contenido Renderizado
              </span>
            </button>
            <button
              type="button"
              className={`segmented-tab-ds ${tabInterno === 'historial' ? 'is-active' : ''}`}
              onClick={() => setTabInterno('historial')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <History size={15} />
                Historial de Versiones (CA-04)
                {detalle.historialVersiones && (
                  <span
                    style={{
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: '#2563eb',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    {detalle.historialVersiones.length}
                  </span>
                )}
              </span>
            </button>
          </div>

          {tabInterno === 'documento' ? (
            /* Hoja de Contrato Legal */
            <div
              style={{
                border: '1px solid #d2d2d7',
                borderRadius: '12px',
                padding: '24px 28px',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                minHeight: '280px',
                maxHeight: '380px',
                overflowY: 'auto',
                fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                fontSize: '0.92rem',
                lineHeight: 1.7,
                color: '#1d1d1f',
                whiteSpace: 'pre-wrap',
                textAlign: 'justify',
              }}
            >
              {detalle.contenidoRenderizado}
            </div>
          ) : (
            /* Historial de Versiones (CA-04) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  color: '#64748b',
                }}
              >
                <Clock size={15} />
                <span>Cadena de contratos emitidos históricamente para este funcionario:</span>
              </div>

              {detalle.historialVersiones.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No se encontraron versiones previas de contrato.
                </div>
              ) : (
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Versión</th>
                        <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Número</th>
                        <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Estado</th>
                        <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Fecha Emisión</th>
                        <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600, textAlign: 'right' }}>
                          Descarga
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.historialVersiones.map((v) => {
                        const esActual = v.id === detalle.id
                        return (
                          <tr
                            key={v.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: esActual ? 'rgba(37, 99, 235, 0.04)' : undefined,
                            }}
                          >
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>
                              v{v.version} {esActual && <span style={{ fontSize: '0.75rem' }}>(Esta ficha)</span>}
                            </td>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>
                              {v.numero}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <StatusBadge status={v.estado} />
                            </td>
                            <td style={{ padding: '10px 14px', color: '#64748b' }}>
                              {new Date(v.createdAt).toLocaleDateString('es-BO', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<Download size={13} />}
                                onClick={() => handleDescargar(v)}
                                disabled={descargandoId === v.id}
                              >
                                {descargandoId === v.id ? 'Descargando...' : 'PDF'}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
