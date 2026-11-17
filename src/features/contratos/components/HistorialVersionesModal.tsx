import { useEffect, useState } from 'react'
import { Clock, History } from 'lucide-react'
import { Badge, Button, Modal, useToast } from '../../../components'
import { ApiService } from '../../../services/api'
import type { PlantillaItem, PlantillaVersionItem } from '../../../types'
import { formatDate } from '../../../utils/formatters'

interface HistorialVersionesModalProps {
  plantilla: PlantillaItem | null
  isOpen: boolean
  onClose: () => void
}

export function HistorialVersionesModal({
  plantilla,
  isOpen,
  onClose,
}: HistorialVersionesModalProps) {
  const toast = useToast()
  const [versiones, setVersiones] = useState<PlantillaVersionItem[]>([])
  const [cargando, setCargando] = useState(false)
  const [versionExpandida, setVersionExpandida] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !plantilla) return

    let cancelado = false
    setCargando(true)
    ApiService.getPlantillaVersiones(plantilla.id)
      .then((data) => {
        if (!cancelado) {
          setVersiones(data)
          if (data.length > 0) setVersionExpandida(data[0].id)
        }
      })
      .catch((err) => {
        if (!cancelado) {
          toast.error(
            err instanceof Error ? err.message : 'No se pudo cargar el historial de versiones',
            'Historial',
          )
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [isOpen, plantilla, toast])

  if (!plantilla) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} className="text-brand" />
          <span>Historial de Versiones — {plantilla.codigo}</span>
        </div>
      }
      size="lg"
      footer={
        <div className="modal-actions-right">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {plantilla.nombre} · Cada edición genera una nueva versión inmutable según el modelo
          arquitectónico.
        </p>

        {cargando ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Cargando historial de versiones...
          </div>
        ) : versiones.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No se encontraron versiones registradas.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {versiones.map((v) => {
              const estaExpandida = versionExpandida === v.id
              return (
                <div
                  key={v.id}
                  style={{
                    border: `1px solid ${v.activa ? 'var(--arca-info)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: v.activa ? 'var(--glass-bg-subtle)' : 'var(--glass-bg)',
                  }}
                >
                  <div
                    onClick={() => setVersionExpandida(estaExpandida ? null : v.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Versión {v.version}</strong>
                      {v.activa ? (
                        <Badge variant="brand" size="sm">
                          Activa Actual
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Archivada
                        </Badge>
                      )}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {formatDate(v.createdAt)}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      {estaExpandida ? 'Ocultar Texto' : 'Ver Contenido'}
                    </Button>
                  </div>

                  {estaExpandida && (
                    <div
                      style={{
                        padding: '1rem',
                        borderTop: '1px solid var(--glass-border)',
                        backgroundColor: 'var(--glass-bg-subtle)',
                      }}
                    >
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Variables detectadas ({v.variables?.length ?? 0}):
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                          {v.variables?.map((varName) => (
                            <code
                              key={varName}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.1rem 0.35rem',
                                backgroundColor: 'var(--glass-bg)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-primary)',
                                borderRadius: '0.25rem',
                              }}
                            >
                              {varName}
                            </code>
                          ))}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '0.75rem',
                          backgroundColor: 'var(--glass-bg)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '0.375rem',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '220px',
                          overflowY: 'auto',
                          lineHeight: 1.4,
                        }}
                      >
                        {v.contenido}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
