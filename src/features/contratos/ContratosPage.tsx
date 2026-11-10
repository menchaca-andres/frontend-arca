import { useCallback, useEffect, useState } from 'react'
import { Edit3, FileCode, FileText, History, Plus, RefreshCw } from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components'
import { ApiService } from '../../services/api'
import type { PlantillaItem } from '../../types'
import { useAuth } from '../auth/useAuth'
import { EditorPlantillaModal, HistorialVersionesModal } from './components'

export function ContratosPage() {
  const { usuario } = useAuth()
  const puedeGestionar = usuario?.rol === 'ADMIN' || usuario?.rol === 'RRHH'

  // Tab activo: 'plantillas' (HU-17) o 'contratos' (HU-18/19)
  const [tabActivo, setTabActivo] = useState<'plantillas' | 'contratos'>('plantillas')

  // Estado Plantillas (HU-17)
  const [plantillas, setPlantillas] = useState<PlantillaItem[]>([])
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaItem | null>(null)
  const [plantillaParaHistorial, setPlantillaParaHistorial] = useState<PlantillaItem | null>(null)

  const cargarPlantillas = useCallback(async () => {
    setCargandoPlantillas(true)
    try {
      const data = await ApiService.getPlantillas()
      setPlantillas(data)
    } catch {
      // Si el backend aún no tiene datos o está en desarrollo, mostrar plantilla por defecto
      setPlantillas([
        {
          id: 'demo-p-1',
          codigo: 'CTR-INDEF',
          nombre: 'Contrato de trabajo a plazo indefinido',
          tipo: 'INDEFINIDO',
          activo: true,
          versionActiva: {
            id: 'demo-v-1',
            version: 1,
            contenido:
              'CONTRATO INDIVIDUAL DE TRABAJO A PLAZO INDEFINIDO...\nFecha de ingreso: {{funcionario.fecha_ingreso}}\nRemuneración: {{asignacion.remuneracion}}\nDías de prueba: {{funcionario.dias_prueba}}',
            variables: [
              'funcionario.fecha_ingreso',
              'asignacion.remuneracion',
              'funcionario.dias_prueba',
            ],
            activa: true,
            creadoPor: 'sistema',
            createdAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
    } finally {
      setCargandoPlantillas(false)
    }
  }, [])

  useEffect(() => {
    if (tabActivo === 'plantillas') {
      void cargarPlantillas()
    }
  }, [tabActivo, cargarPlantillas])

  const handleCrearNueva = () => {
    setPlantillaSeleccionada(null)
    setIsEditorOpen(true)
  }

  const handleEditar = (p: PlantillaItem) => {
    setPlantillaSeleccionada(p)
    setIsEditorOpen(true)
  }

  const handleSuccessGuardado = (guardada: PlantillaItem) => {
    setPlantillas((prev) => {
      const index = prev.findIndex((item) => item.id === guardada.id)
      if (index >= 0) {
        const clon = [...prev]
        clon[index] = guardada
        return clon
      }
      return [guardada, ...prev]
    })
  }

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Módulo de Contratos (ms-contratos)</p>
          <h1 className="page-title-ds">Gestión y Archivo de Contratos</h1>
          <p className="page-subtitle-ds">
            Plantillas parametrizables versionadas (HU-17) y emisión de contratos formales.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tabActivo === 'plantillas' && (
            <>
              <Button
                variant="outline"
                leftIcon={<RefreshCw size={16} />}
                onClick={cargarPlantillas}
                disabled={cargandoPlantillas}
              >
                Actualizar
              </Button>
              {puedeGestionar && (
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleCrearNueva}>
                  Nueva Plantilla
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Tabs de navegación interna */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '1.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setTabActivo('plantillas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            border: 'none',
            borderBottom:
              tabActivo === 'plantillas' ? '2px solid #2563eb' : '2px solid transparent',
            color: tabActivo === 'plantillas' ? '#2563eb' : '#64748b',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
        >
          <FileCode size={18} />
          <span>Plantillas de Contrato (HU-17)</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActivo('contratos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            border: 'none',
            borderBottom: tabActivo === 'contratos' ? '2px solid #2563eb' : '2px solid transparent',
            color: tabActivo === 'contratos' ? '#2563eb' : '#64748b',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
        >
          <FileText size={18} />
          <span>Contratos Emitidos (HU-18/19)</span>
        </button>
      </div>

      {tabActivo === 'plantillas' ? (
        <Card>
          {cargandoPlantillas ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Cargando catálogo de plantillas...
            </div>
          ) : plantillas.length === 0 ? (
            <EmptyState
              title="Sin plantillas configuradas"
              description="No hay plantillas de contrato registradas en el sistema."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre de Plantilla</TableHead>
                  <TableHead>Tipo de Contrato</TableHead>
                  <TableHead>Versión Activa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plantillas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">
                      <strong>{p.codigo}</strong>
                    </TableCell>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.tipo} />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono" style={{ fontWeight: 600, color: '#2563eb' }}>
                        v{p.versionActiva?.version ?? 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.activo ? 'ACTIVO' : 'INACTIVO'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<History size={14} />}
                          onClick={() => setPlantillaParaHistorial(p)}
                          title="Ver historial de versiones"
                        >
                          Historial
                        </Button>
                        {puedeGestionar && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Edit3 size={14} />}
                            onClick={() => handleEditar(p)}
                            title="Editar y generar nueva versión"
                          >
                            Editar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      ) : (
        <Card title="Contratos Emitidos">
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            <FileText size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Módulo de Emisión y Archivo</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              La emisión y descarga de contratos en PDF con Gotenberg se implementa en las historias
              HU-18 y HU-19 del Sprint 3.
            </p>
          </div>
        </Card>
      )}

      {/* Modal Editor / Creador de Plantilla (CA-01, CA-02, CA-03, CA-07) */}
      <EditorPlantillaModal
        isOpen={isEditorOpen}
        plantillaParaEditar={plantillaSeleccionada}
        onClose={() => setIsEditorOpen(false)}
        onSuccess={handleSuccessGuardado}
      />

      {/* Modal Historial de Versiones (CA-05) */}
      <HistorialVersionesModal
        isOpen={Boolean(plantillaParaHistorial)}
        plantilla={plantillaParaHistorial}
        onClose={() => setPlantillaParaHistorial(null)}
      />
    </div>
  )
}
