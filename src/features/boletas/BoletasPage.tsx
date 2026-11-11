import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Calculator,
  Download,
  FileSpreadsheet,
  Plus,
  RefreshCw,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
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
import { ApiService } from '../../services/api'
import {
  FUNCIONARIOS_SEMILLA_PADRON,
  type ConceptoItem,
  type FuncionarioPadronItem,
  type NovedadItem,
} from '../../types'
import { formatCurrency } from '../../utils/formatters'
import { useAuth } from '../auth/useAuth'
import { ConceptoModal, NovedadModal } from './components'

export function BoletasPage() {
  const toast = useToast()
  const { usuario } = useAuth()
  const esFuncionario = usuario?.rol === 'FUNCIONARIO'
  const puedeGestionar = usuario?.rol === 'ADMIN' || usuario?.rol === 'RRHH'

  // Tab activo
  const [tabActivo, setTabActivo] = useState<'boletas' | 'conceptos' | 'novedades'>(
    esFuncionario ? 'boletas' : 'conceptos',
  )

  // Estado Modal Cálculo Planilla (HU-21 futuro)
  const [isCalculoModalOpen, setIsCalculoModalOpen] = useState(false)

  // Estado Conceptos (HU-20)
  const [conceptos, setConceptos] = useState<ConceptoItem[]>([])
  const [cargandoConceptos, setCargandoConceptos] = useState(false)
  const [isConceptoModalOpen, setIsConceptoModalOpen] = useState(false)
  const [conceptoParaEditar, setConceptoParaEditar] = useState<ConceptoItem | null>(null)

  // Estado Novedades (HU-20)
  const [novedades, setNovedades] = useState<NovedadItem[]>([])
  const [cargandoNovedades, setCargandoNovedades] = useState(false)
  const [isNovedadModalOpen, setIsNovedadModalOpen] = useState(false)
  const [filtroAnio, setFiltroAnio] = useState<number>(2026)
  const [filtroMes, setFiltroMes] = useState<number>(10)
  const [funcionarios, setFuncionarios] = useState<FuncionarioPadronItem[]>(FUNCIONARIOS_SEMILLA_PADRON)
  const [mapaFuncionarios, setMapaFuncionarios] = useState<Record<string, string>>(() => {
    const mapa: Record<string, string> = {}
    FUNCIONARIOS_SEMILLA_PADRON.forEach((f) => {
      mapa[f.id] = `${f.nombreCompleto} (CI: ${f.ci})`
    })
    return mapa
  })

  // Carga de Funcionarios para resolución de nombres
  useEffect(() => {
    if (puedeGestionar) {
      ApiService.getFuncionariosParaSelector()
        .then((items) => {
          if (items && items.length > 0) {
            setFuncionarios(items)
            const mapa: Record<string, string> = {}
            items.forEach((f: FuncionarioPadronItem) => {
              mapa[f.id] = `${f.nombreCompleto} (CI: ${f.ci})`
            })
            setMapaFuncionarios(mapa)
          }
        })
        .catch(() => {
          // Usa el fallback de funcionarios semilla ya inicializado
        })
    }
  }, [puedeGestionar])

  // Cargar Conceptos
  const cargarConceptos = useCallback(async () => {
    setCargandoConceptos(true)
    try {
      const data = await ApiService.getConceptos(true)
      setConceptos(data)
    } catch {
      // Fallback seguro de muestra con las semillas obligatorias de la HU-20
      setConceptos([
        {
          id: 'seed-c1',
          codigo: 'HABER_BASICO',
          nombre: 'Haber básico',
          tipo: 'HABER',
          formaCalculo: 'SISTEMA',
          valor: null,
          base: null,
          automatico: true,
          esSistema: true,
          orden: 1,
          activo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'seed-c2',
          codigo: 'APORTE_LABORAL',
          nombre: 'Aporte laboral AFP (12.71%)',
          tipo: 'DESCUENTO',
          formaCalculo: 'PORCENTAJE',
          valor: 12.71,
          base: 'TOTAL_GANADO',
          automatico: true,
          esSistema: false,
          orden: 100,
          activo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
    } finally {
      setCargandoConceptos(false)
    }
  }, [])

  // Cargar Novedades
  const cargarNovedades = useCallback(async () => {
    setCargandoNovedades(true)
    try {
      const data = await ApiService.getNovedades({ anio: filtroAnio, mes: filtroMes })
      setNovedades(data)
    } catch {
      setNovedades([])
    } finally {
      setCargandoNovedades(false)
    }
  }, [filtroAnio, filtroMes])

  useEffect(() => {
    if (puedeGestionar) {
      cargarConceptos()
    }
  }, [puedeGestionar, cargarConceptos])

  useEffect(() => {
    if (puedeGestionar && tabActivo === 'novedades') {
      cargarNovedades()
    }
  }, [puedeGestionar, tabActivo, cargarNovedades])

  // Handlers Conceptos
  const handleCrearConcepto = () => {
    setConceptoParaEditar(null)
    setIsConceptoModalOpen(true)
  }

  const handleEditarConcepto = (concepto: ConceptoItem) => {
    setConceptoParaEditar(concepto)
    setIsConceptoModalOpen(true)
  }

  const handleEliminarConcepto = async (concepto: ConceptoItem) => {
    if (concepto.esSistema) {
      toast.error('Los conceptos del sistema no se pueden eliminar ni desactivar', 'Restricción')
      return
    }

    const confirmar = window.confirm(
      `¿Deseas eliminar o desactivar el concepto ${concepto.codigo}? Si ya fue emitido en boletas, se desactivará automáticamente para preservar la inmutabilidad histórica.`,
    )
    if (!confirmar) return

    try {
      const res = await ApiService.deleteConcepto(concepto.id)
      if (res.desactivado) {
        toast.info(res.mensaje, 'Concepto Desactivado')
      } else {
        toast.success(res.mensaje, 'Concepto Eliminado')
      }
      cargarConceptos()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar el concepto'
      toast.error(msg, 'Error')
    }
  }

  // Handlers Novedades
  const handleEliminarNovedad = async (id: string) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar esta novedad del período?')
    if (!confirmar) return

    try {
      await ApiService.deleteNovedad(id)
      toast.success('Novedad eliminada exitosamente', 'Éxito')
      cargarNovedades()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la novedad'
      toast.error(msg, 'Error')
    }
  }

  // Boletas de demostración / consulta
  const boletas = [
    {
      id: '1',
      funcionarioId: '11111111-1111-4111-8111-111111111101',
      numero: 'BOL-2026-10-001',
      periodo: 'Octubre 2026',
      funcionario: 'Carlos Mamani Flores',
      haberBasico: 8500,
      totalDescuentos: 1080.35,
      liquidoPagable: 7419.65,
      fechaEmision: '2026-10-31',
      estado: 'EMITIDA',
    },
    {
      id: '2',
      funcionarioId: '11111111-1111-4111-8111-111111111103',
      numero: 'BOL-2026-10-002',
      periodo: 'Octubre 2026',
      funcionario: 'Daniela Mendoza Vargas',
      haberBasico: 7200,
      totalDescuentos: 915.12,
      liquidoPagable: 6284.88,
      fechaEmision: '2026-10-31',
      estado: 'EMITIDA',
    },
  ]

  const boletasVisibles = esFuncionario
    ? boletas.filter((b) => b.funcionarioId === usuario?.funcionarioId)
    : boletas
  const totalLiquido = boletasVisibles.reduce((total, b) => total + b.liquidoPagable, 0)
  const totalDescuentos = boletasVisibles.reduce((total, b) => total + b.totalDescuentos, 0)

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <h1 className="page-title-ds">
            {esFuncionario ? 'Mis Boletas de Pago' : 'Gestión de Planillas y Boletas'}
          </h1>
          <p className="page-subtitle-ds">
            {esFuncionario
              ? 'Consulta y descarga tus boletas inmutables emitidas.'
              : 'Configuración de conceptos de haberes y descuentos (HU-20), novedades y liquidación.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {puedeGestionar && tabActivo === 'conceptos' && (
            <>
              <Button
                variant="outline"
                leftIcon={<RefreshCw size={16} />}
                onClick={cargarConceptos}
                disabled={cargandoConceptos}
              >
                Actualizar
              </Button>
              <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleCrearConcepto}>
                Nuevo Concepto
              </Button>
            </>
          )}

          {puedeGestionar && tabActivo === 'novedades' && (
            <>
              <Button
                variant="outline"
                leftIcon={<RefreshCw size={16} />}
                onClick={cargarNovedades}
                disabled={cargandoNovedades}
              >
                Actualizar
              </Button>
              <Button
                variant="primary"
                leftIcon={<Plus size={18} />}
                onClick={() => setIsNovedadModalOpen(true)}
              >
                Registrar Novedad
              </Button>
            </>
          )}

          {puedeGestionar && tabActivo === 'boletas' && (
            <Button
              variant="primary"
              leftIcon={<Calculator size={18} />}
              onClick={() => setIsCalculoModalOpen(true)}
            >
              Calcular Planilla del Periodo
            </Button>
          )}
        </div>
      </header>

      {/* Tabs de Navegación estilo Apple */}
      {!esFuncionario && (
        <nav className="segmented-control-ds" aria-label="Secciones de Planilla">
          <button
            type="button"
            onClick={() => setTabActivo('conceptos')}
            className={`segmented-tab-ds ${tabActivo === 'conceptos' ? 'is-active' : ''}`}
          >
            Conceptos de Planilla
          </button>

          <button
            type="button"
            onClick={() => setTabActivo('novedades')}
            className={`segmented-tab-ds ${tabActivo === 'novedades' ? 'is-active' : ''}`}
          >
            Novedades del Período
          </button>

          <button
            type="button"
            onClick={() => setTabActivo('boletas')}
            className={`segmented-tab-ds ${tabActivo === 'boletas' ? 'is-active' : ''}`}
          >
            Boletas Emitidas
          </button>
        </nav>
      )}

      {/* TAB 1: CONCEPTOS DE PLANILLA (HU-20) */}
      {tabActivo === 'conceptos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="stats-grid-ds">
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Total Conceptos</span>
                <strong className="stat-value">{conceptos.length}</strong>
                <span className="stat-footnote">Parametrizados para cálculo</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Haberes Configurados</span>
                <strong className="stat-value text-teal">
                  {conceptos.filter((c) => c.tipo === 'HABER' && c.activo).length}
                </strong>
                <span className="stat-footnote">Ingresos computables</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Descuentos de Ley</span>
                <strong className="stat-value text-danger">
                  {conceptos.filter((c) => c.tipo === 'DESCUENTO' && c.activo).length}
                </strong>
                <span className="stat-footnote">Retenciones y aportes</span>
              </div>
            </Card>
          </div>

          <Card title="Catálogo de Conceptos de Haberes y Descuentos (HU-20)">
            {conceptos.length === 0 && !cargandoConceptos ? (
              <EmptyState
                icon={<AlertCircle size={40} className="text-slate-400" />}
                title="No hay conceptos registrados"
                description="Crea un nuevo concepto o aplica la semilla para iniciar la configuración."
                action={
                  <Button variant="primary" onClick={handleCrearConcepto}>
                    Crear Primer Concepto
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cálculo</TableHead>
                    <TableHead>Valor / Base</TableHead>
                    <TableHead>Automático</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conceptos.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-center font-bold text-slate-500">
                        {c.orden}
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        {c.codigo}
                        {c.esSistema && (
                          <Badge variant="neutral" className="ml-2 text-xs">
                            Sistema
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{c.nombre}</TableCell>
                      <TableCell>
                        <Badge variant={c.tipo === 'HABER' ? 'success' : 'danger'}>
                          {c.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.formaCalculo === 'MONTO_FIJO' && 'Monto Fijo'}
                        {c.formaCalculo === 'PORCENTAJE' && 'Porcentaje (%)'}
                        {c.formaCalculo === 'SISTEMA' && 'Especial Sistema'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {c.formaCalculo === 'PORCENTAJE' && (
                          <span>
                            <strong>{c.valor}%</strong> sobre {c.base ?? 'N/D'}
                          </span>
                        )}
                        {c.formaCalculo === 'MONTO_FIJO' && (
                          <span>{c.valor !== null ? formatCurrency(c.valor) : '—'}</span>
                        )}
                        {c.formaCalculo === 'SISTEMA' && <span className="text-slate-400">—</span>}
                      </TableCell>
                      <TableCell>
                        {c.automatico ? (
                          <Badge variant="brand">Todos</Badge>
                        ) : (
                          <Badge variant="neutral">Novedad</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.activo ? 'ACTIVO' : 'INACTIVO'} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditarConcepto(c)}
                          >
                            Editar
                          </Button>
                          {!c.esSistema && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-danger hover:bg-red-50"
                              onClick={() => handleEliminarConcepto(c)}
                            >
                              Eliminar
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
        </div>
      )}

      {/* TAB 2: NOVEDADES DEL PERÍODO (CA-05) */}
      {tabActivo === 'novedades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card title="Filtro de Período de Novedades">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '150px' }}>
                <Select
                  label="Año"
                  value={String(filtroAnio)}
                  onChange={(e) => setFiltroAnio(parseInt(e.target.value, 10))}
                  options={[
                    { value: '2026', label: '2026' },
                    { value: '2027', label: '2027' },
                  ]}
                />
              </div>
              <div style={{ width: '200px' }}>
                <Select
                  label="Mes del Período"
                  value={String(filtroMes)}
                  onChange={(e) => setFiltroMes(parseInt(e.target.value, 10))}
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
              <div style={{ alignSelf: 'flex-end', marginBottom: '0.25rem' }}>
                <Button
                  variant="outline"
                  leftIcon={<RefreshCw size={14} />}
                  onClick={cargarNovedades}
                  disabled={cargandoNovedades}
                >
                  Cargar Período
                </Button>
              </div>
            </div>
          </Card>

          <Card
            title={`Novedades Registradas — Período ${filtroMes}/${filtroAnio} (CA-05)`}
          >
            {novedades.length === 0 && !cargandoNovedades ? (
              <EmptyState
                icon={<FileSpreadsheet size={40} className="text-slate-400" />}
                title="Sin novedades para este período"
                description="Registra asignaciones puntuales de bonos o anticipos para funcionarios específicos."
                action={
                  <Button variant="primary" onClick={() => setIsNovedadModalOpen(true)}>
                    Registrar Primera Novedad
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionario</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto (Bs.)</TableHead>
                    <TableHead>Descripción / Glosa</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {novedades.map((nov) => (
                    <TableRow key={nov.id}>
                      <TableCell>
                        <strong>
                          {mapaFuncionarios[nov.funcionarioId] ?? nov.funcionarioId}
                        </strong>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold">
                          {nov.concepto?.codigo ?? '—'}
                        </span>{' '}
                        ({nov.concepto?.nombre ?? ''})
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={nov.concepto?.tipo === 'HABER' ? 'success' : 'danger'}
                        >
                          {nov.concepto?.tipo ?? 'HABER'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-teal">
                        {formatCurrency(nov.monto)}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {nov.descripcion ?? 'Sin descripción'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger hover:bg-red-50"
                          onClick={() => handleEliminarNovedad(nov.id)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: BOLETAS EMITIDAS */}
      {tabActivo === 'boletas' && (
        <>
          <div className="stats-grid-ds">
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">
                  {esFuncionario ? 'Mi Líquido Pagable' : 'Total Planilla Octubre'}
                </span>
                <strong className="stat-value">{formatCurrency(totalLiquido)}</strong>
                <span className="stat-footnote">Líquido pagable consolidado</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">
                  {esFuncionario ? 'Mis Descuentos' : 'Descuentos de Ley'}
                </span>
                <strong className="stat-value">{formatCurrency(totalDescuentos)}</strong>
                <span className="stat-footnote">Aportes a la seguridad social</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">{esFuncionario ? 'Mis Boletas' : 'Boletas Emitidas'}</span>
                <strong className="stat-value">{boletasVisibles.length} boletas</strong>
                <span className="stat-footnote">Inmutabilidad garantizada</span>
              </div>
            </Card>
          </div>

          <Card title={esFuncionario ? 'Mis Boletas Emitidas' : 'Boletas Emitidas en el Periodo'}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Boleta</TableHead>
                  <TableHead>Periodo</TableHead>
                  {!esFuncionario && <TableHead>Funcionario</TableHead>}
                  <TableHead>Haber Básico</TableHead>
                  <TableHead>Descuentos</TableHead>
                  <TableHead>Líquido Pagable (Bs)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Descarga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boletasVisibles.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono">{b.numero}</TableCell>
                    <TableCell>{b.periodo}</TableCell>
                    {!esFuncionario && (
                      <TableCell>
                        <strong>{b.funcionario}</strong>
                      </TableCell>
                    )}
                    <TableCell className="font-mono">{formatCurrency(b.haberBasico)}</TableCell>
                    <TableCell className="font-mono text-danger">
                      - {formatCurrency(b.totalDescuentos)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-teal">
                      {formatCurrency(b.liquidoPagable)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={b.estado} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Download size={14} />}
                        onClick={() =>
                          toast.success(`Descargando boleta inmutable ${b.numero}.pdf`, 'Descarga')
                        }
                      >
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Modal Crear / Editar Concepto */}
      <ConceptoModal
        isOpen={isConceptoModalOpen}
        onClose={() => setIsConceptoModalOpen(false)}
        onSaved={() => cargarConceptos()}
        conceptoParaEditar={conceptoParaEditar}
      />

      {/* Modal Registrar Novedad */}
      <NovedadModal
        isOpen={isNovedadModalOpen}
        onClose={() => setIsNovedadModalOpen(false)}
        onSaved={() => cargarNovedades()}
        conceptos={conceptos}
        anioDefecto={filtroAnio}
        mesDefecto={filtroMes}
        funcionariosDisponibles={funcionarios}
      />

      {/* Modal Liquidación y Cálculo */}
      <Modal
        isOpen={isCalculoModalOpen}
        onClose={() => setIsCalculoModalOpen(false)}
        title="Liquidación y Cálculo de Planilla (HU-21)"
        footer={
          <div className="modal-actions-right">
            <Button variant="outline" onClick={() => setIsCalculoModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsCalculoModalOpen(false)
                toast.success('Planilla procesada con fórmulas de ley boliviana', 'Cálculo exitoso')
              }}
            >
              Emitir Boletas Inmutables
            </Button>
          </div>
        }
      >
        <form className="modal-form-ds" onSubmit={(e) => e.preventDefault()}>
          <Select
            label="Periodo a Liquidar"
            options={[
              { value: '2026-11', label: 'Noviembre 2026 (En curso)' },
              { value: '2026-10', label: 'Octubre 2026 (Cerrado)' },
            ]}
            placeholder="Seleccionar mes/año..."
          />
        </form>
      </Modal>
    </div>
  )
}
