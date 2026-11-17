import { useCallback, useEffect, useState } from 'react'
import { Download, Eye, FileCheck, Plus, RefreshCw, ShieldCheck, X } from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '../../components'
import { ApiError, ApiService } from '../../services/api'
import type { ContratoItem, EstadoContrato, FuncionarioPadronItem, PlantillaItem } from '../../types'
import { useAuth } from '../auth/useAuth'
import {
  DetalleContratoModal,
  EditorPlantillaModal,
  GenerarContratoModal,
  HistorialVersionesModal,
} from './components'

export function ContratosPage() {
  const { usuario } = useAuth()
  const toast = useToast()
  const puedeGestionar = usuario?.rol === 'ADMIN' || usuario?.rol === 'RRHH'
  const esFuncionario = usuario?.rol === 'FUNCIONARIO'

  // Tab activo: 'plantillas' (HU-17) o 'contratos' (HU-18/19). Funcionarios van directo a contratos.
  const [tabActivo, setTabActivo] = useState<'plantillas' | 'contratos'>(
    esFuncionario ? 'contratos' : 'plantillas',
  )

  // Estado Plantillas (HU-17)
  const [plantillas, setPlantillas] = useState<PlantillaItem[]>([])
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaItem | null>(null)
  const [plantillaParaHistorial, setPlantillaParaHistorial] = useState<PlantillaItem | null>(null)

  // Estado Contratos Emitidos (HU-18 / HU-19)
  const [isGenerarOpen, setIsGenerarOpen] = useState(false)
  const [contratosEmitidos, setContratosEmitidos] = useState<ContratoItem[]>([])
  const [cargandoContratos, setCargandoContratos] = useState(false)
  const [descargandoId, setDescargandoId] = useState<string | null>(null)
  const [contratoParaDetalleId, setContratoParaDetalleId] = useState<string | null>(null)

  // Filtros HU-19 CA-01
  const [filtroFuncionarioId, setFiltroFuncionarioId] = useState('')
  const [filtroPlantillaId, setFiltroPlantillaId] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [funcionariosFiltro, setFuncionariosFiltro] = useState<FuncionarioPadronItem[]>([])

  const cargarContratos = useCallback(async () => {
    setCargandoContratos(true)
    try {
      const data = await ApiService.getContratos({
        funcionarioId: filtroFuncionarioId || undefined,
        plantillaId: filtroPlantillaId || undefined,
        estado: filtroEstado !== 'TODOS' ? (filtroEstado as EstadoContrato) : undefined,
        desde: filtroDesde || undefined,
        hasta: filtroHasta || undefined,
      })
      setContratosEmitidos(data)
    } catch (err) {
      console.error('Error al cargar contratos emitidos', err)
    } finally {
      setCargandoContratos(false)
    }
  }, [filtroFuncionarioId, filtroPlantillaId, filtroEstado, filtroDesde, filtroHasta])

  // Cargar funcionarios para selector de filtros de RRHH
  useEffect(() => {
    if (puedeGestionar) {
      void ApiService.getFuncionariosParaSelector()
        .then((data) => setFuncionariosFiltro(data))
        .catch(() => {})
    }
  }, [puedeGestionar])

  const handleLimpiarFiltros = () => {
    setFiltroFuncionarioId('')
    setFiltroPlantillaId('')
    setFiltroEstado('TODOS')
    setFiltroDesde('')
    setFiltroHasta('')
  }

  const hayFiltrosActivos =
    Boolean(filtroFuncionarioId) ||
    Boolean(filtroPlantillaId) ||
    filtroEstado !== 'TODOS' ||
    Boolean(filtroDesde) ||
    Boolean(filtroHasta)

  const opcionesFuncionariosFiltro = [
    { value: '', label: 'Todos los funcionarios' },
    ...funcionariosFiltro.map((f) => ({
      value: f.id,
      label: `${f.nombreCompleto} (CI: ${f.ci})`,
    })),
  ]

  const opcionesPlantillasFiltro = [
    { value: '', label: 'Todas las plantillas' },
    ...plantillas.map((p) => ({
      value: p.id,
      label: p.nombre,
    })),
  ]

  const opcionesEstadoFiltro = [
    { value: 'TODOS', label: 'Todos los estados' },
    { value: 'VIGENTE', label: 'VIGENTE' },
    { value: 'REEMPLAZADO', label: 'REEMPLAZADO' },
  ]

  const handleContratoEmitido = (nuevo: ContratoItem) => {
    setContratosEmitidos((prev) => {
      // Si ya existía un contrato anterior del mismo funcionario, se marca como REEMPLAZADO
      const actualizados = prev.map((c) =>
        c.funcionarioId === nuevo.funcionarioId && c.id !== nuevo.id
          ? { ...c, estado: 'REEMPLAZADO' as const }
          : c,
      )
      return [nuevo, ...actualizados]
    })
    setTabActivo('contratos')
    void cargarContratos()
  }

  const handleDescargarContrato = async (c: ContratoItem) => {
    setDescargandoId(c.id)
    try {
      await ApiService.descargarContratoPdf(c.id, c.numero)
      toast.success(`Descargando Contrato-${c.numero}.pdf`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error al descargar PDF'
      toast.error(msg)
    } finally {
      setDescargandoId(null)
    }
  }

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

  // Cargar catálogo de plantillas siempre para tenerlas disponibles en el modal
  useEffect(() => {
    void cargarPlantillas()
  }, [cargarPlantillas])

  // Cargar contratos de base de datos cuando se activa la pestaña de contratos
  useEffect(() => {
    if (tabActivo === 'contratos') {
      void cargarContratos()
    }
  }, [tabActivo, cargarContratos])

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
          <h1 className="page-title-ds">
            {esFuncionario ? 'Mis Contratos Laborales' : 'Gestión y Archivo de Contratos'}
          </h1>
          <p className="page-subtitle-ds">
            {esFuncionario
              ? 'Consulte y descargue sus contratos laborales emitidos por ARCA con verificación de integridad (HU-19).'
              : 'Plantillas parametrizables versionadas (HU-17), emisión (HU-18) y consulta de contratos (HU-19).'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tabActivo === 'plantillas' ? (
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
                <>
                  <Button
                    variant="secondary"
                    leftIcon={<FileCheck size={16} />}
                    onClick={() => setIsGenerarOpen(true)}
                  >
                    Generar Contrato
                  </Button>
                  <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleCrearNueva}>
                    Nueva Plantilla
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                leftIcon={<RefreshCw size={16} />}
                onClick={cargarContratos}
                disabled={cargandoContratos}
              >
                Actualizar
              </Button>
              {puedeGestionar && (
                <Button
                  variant="primary"
                  leftIcon={<FileCheck size={16} />}
                  onClick={() => setIsGenerarOpen(true)}
                >
                  Generar Contrato
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Tabs de navegación interna estilo Apple (solo para administradores / RRHH) */}
      {!esFuncionario && (
        <nav className="segmented-control-ds" aria-label="Secciones de Contratos">
          <button
            type="button"
            onClick={() => setTabActivo('plantillas')}
            className={`segmented-tab-ds ${tabActivo === 'plantillas' ? 'is-active' : ''}`}
          >
            Plantillas de Contrato
          </button>

          <button
            type="button"
            onClick={() => setTabActivo('contratos')}
            className={`segmented-tab-ds ${tabActivo === 'contratos' ? 'is-active' : ''}`}
          >
            Contratos Emitidos
          </button>
        </nav>
      )}

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
                          onClick={() => setPlantillaParaHistorial(p)}
                          title="Ver historial de versiones"
                        >
                          Historial
                        </Button>
                        {puedeGestionar && (
                          <Button
                            variant="secondary"
                            size="sm"
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
        <Card title={esFuncionario ? 'Mis Contratos Emitidos' : 'Contratos Emitidos (HU-18 / HU-19)'}>
          {/* Barra de Filtros para RRHH (CA-01) */}
          {puedeGestionar && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                alignItems: 'end',
              }}
            >
              <Select
                label="Funcionario"
                options={opcionesFuncionariosFiltro}
                value={filtroFuncionarioId}
                onChange={(e) => setFiltroFuncionarioId(e.target.value)}
              />

              <Select
                label="Plantilla"
                options={opcionesPlantillasFiltro}
                value={filtroPlantillaId}
                onChange={(e) => setFiltroPlantillaId(e.target.value)}
              />

              <Select
                label="Estado"
                options={opcionesEstadoFiltro}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              />

              <Input
                label="Fecha Desde"
                type="date"
                value={filtroDesde}
                onChange={(e) => setFiltroDesde(e.target.value)}
              />

              <Input
                label="Fecha Hasta"
                type="date"
                value={filtroHasta}
                onChange={(e) => setFiltroHasta(e.target.value)}
              />

              <div style={{ display: 'flex', alignItems: 'center', height: '38px' }}>
                {hayFiltrosActivos && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<X size={14} />}
                    onClick={handleLimpiarFiltros}
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          )}

          {cargandoContratos ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              Cargando contratos emitidos...
            </div>
          ) : contratosEmitidos.length === 0 ? (
            <div style={{ padding: '2rem 1rem' }}>
              <EmptyState
                title={
                  hayFiltrosActivos
                    ? 'Sin resultados para los filtros seleccionados'
                    : esFuncionario
                    ? 'Aún no tiene contratos laborales emitidos'
                    : 'Sin contratos emitidos en el sistema'
                }
                description={
                  hayFiltrosActivos
                    ? 'Intente ajustar o limpiar los filtros de búsqueda.'
                    : esFuncionario
                    ? 'Sus contratos laborales formalizados por Recursos Humanos aparecerán listados aquí.'
                    : 'Seleccione un funcionario y una plantilla activa para emitir un contrato formal con datos en vivo de ms-personal (HU-18).'
                }
                action={
                  hayFiltrosActivos ? (
                    <Button variant="outline" size="sm" onClick={handleLimpiarFiltros}>
                      Limpiar Filtros
                    </Button>
                  ) : puedeGestionar ? (
                    <Button
                      variant="primary"
                      leftIcon={<FileCheck size={16} />}
                      onClick={() => setIsGenerarOpen(true)}
                    >
                      Generar Contrato
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número Correlativo</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Huella Criptográfica SHA-256</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratosEmitidos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">
                      <strong style={{ color: '#1e293b' }}>{c.numero}</strong>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono" style={{ fontWeight: 600, color: '#2563eb' }}>
                        v{c.version}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.estado} />
                    </TableCell>
                    <TableCell>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#f1f5f9',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '0.78rem',
                          color: '#334155',
                        }}
                        title={c.hashSha256}
                      >
                        <ShieldCheck size={14} style={{ color: '#0284c7' }} />
                        <span>{c.hashSha256.substring(0, 16)}...</span>
                      </div>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {new Date(c.createdAt).toLocaleDateString('es-BO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => setContratoParaDetalleId(c.id)}
                          title="Ver ficha completa e historial de versiones (CA-04)"
                        >
                          Detalle
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Download size={14} />}
                          onClick={() => handleDescargarContrato(c)}
                          disabled={descargandoId === c.id}
                          title="Descargar PDF verificado con SHA-256 (CA-03)"
                        >
                          {descargandoId === c.id ? 'Descargando...' : 'Descargar PDF'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Modal Detalle de Contrato e Historial de Versiones (HU-19: CA-03, CA-04) */}
      <DetalleContratoModal
        isOpen={Boolean(contratoParaDetalleId)}
        contratoId={contratoParaDetalleId}
        onClose={() => setContratoParaDetalleId(null)}
      />

      {/* Modal Asistente de Generación de Contrato (HU-18: CA-01 a CA-08) */}
      <GenerarContratoModal
        isOpen={isGenerarOpen}
        plantillasDisponibles={plantillas}
        onClose={() => setIsGenerarOpen(false)}
        onSuccess={handleContratoEmitido}
      />

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
