import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
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
  type BoletaPlanillaItem,
  type ConceptoItem,
  type DetallePlanillaResponse,
  type FuncionarioPadronItem,
  type NovedadItem,
  type PeriodoItem,
} from '../../types'
import { formatCurrency } from '../../utils/formatters'
import { useAuth } from '../auth/useAuth'
import {
  AbrirPeriodoModal,
  ConceptoModal,
  DetalleBoletaModal,
  NovedadModal,
} from './components'

const PERIODOS_SEMILLA: PeriodoItem[] = [
  {
    id: 'per-2026-10',
    anio: 2026,
    mes: 10,
    estado: 'BORRADOR',
    fechaCalculo: '2026-10-31T18:00:00Z',
    fechaEmision: null,
    emitidoPor: null,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-31T18:00:00Z',
    resumen: {
      totalGanado: 24700.0,
      totalDescuentos: 3139.37,
      totalLiquido: 21560.63,
      cantidadBoletas: 3,
      cantidadAlertas: 0,
    },
  },
  {
    id: 'per-2026-11',
    anio: 2026,
    mes: 11,
    estado: 'BORRADOR',
    fechaCalculo: null,
    fechaEmision: null,
    emitidoPor: null,
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
    resumen: {
      totalGanado: 0,
      totalDescuentos: 0,
      totalLiquido: 0,
      cantidadBoletas: 0,
      cantidadAlertas: 0,
    },
  },
]

export function BoletasPage() {
  const toast = useToast()
  const { usuario } = useAuth()
  const esFuncionario = usuario?.rol === 'FUNCIONARIO'
  const puedeGestionar = usuario?.rol === 'ADMIN' || usuario?.rol === 'RRHH'

  // Tab activo
  const [tabActivo, setTabActivo] = useState<'planilla' | 'conceptos' | 'novedades' | 'boletas'>(
    esFuncionario ? 'boletas' : 'planilla',
  )

  // Estado Periodos y Planilla (HU-21)
  const [periodos, setPeriodos] = useState<PeriodoItem[]>(PERIODOS_SEMILLA)
  const [periodoSeleccionadoId, setPeriodoSeleccionadoId] = useState<string>('per-2026-10')
  const [detallePlanilla, setDetallePlanilla] = useState<DetallePlanillaResponse | null>(null)
  const [cargandoPeriodos, setCargandoPeriodos] = useState(false)
  const [cargandoPlanilla, setCargandoPlanilla] = useState(false)
  const [calculandoPlanilla, setCalculandoPlanilla] = useState(false)
  const [isAbrirPeriodoOpen, setIsAbrirPeriodoOpen] = useState(false)
  const [boletaParaDetalle, setBoletaParaDetalle] = useState<BoletaPlanillaItem | null>(null)
  const [isDetalleBoletaOpen, setIsDetalleBoletaOpen] = useState(false)

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

  // Carga de Funcionarios para selector
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
          // Usa el fallback de funcionarios semilla
        })
    }
  }, [puedeGestionar])

  // Cargar Períodos (HU-21)
  const cargarPeriodos = useCallback(async () => {
    setCargandoPeriodos(true)
    try {
      const data = await ApiService.getPeriodos()
      if (data && data.length > 0) {
        setPeriodos(data)
        if (!periodoSeleccionadoId || !data.some((p) => p.id === periodoSeleccionadoId)) {
          setPeriodoSeleccionadoId(data[0].id)
        }
      }
    } catch {
      // Usa el fallback semilla
    } finally {
      setCargandoPeriodos(false)
    }
  }, [periodoSeleccionadoId])

  // Cargar Detalle de Planilla del período seleccionado (HU-21)
  const cargarPlanillaPeriodo = useCallback(async (id: string) => {
    if (!id) return
    setCargandoPlanilla(true)
    try {
      const data = await ApiService.getPeriodoDetalle(id)
      setDetallePlanilla(data)
    } catch {
      // Fallback de demostración
      setDetallePlanilla({
        periodo: {
          id,
          anio: 2026,
          mes: 10,
          estado: 'BORRADOR',
          fechaCalculo: '2026-10-31T18:00:00Z',
          fechaEmision: null,
          emitidoPor: null,
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-31T18:00:00Z',
        },
        resumen: {
          totalGanado: 24700.0,
          totalDescuentos: 3139.37,
          totalLiquido: 21560.63,
          cantidadBoletas: 3,
          cantidadAlertas: 0,
        },
        boletas: [
          {
            id: 'b-seed-1',
            periodoId: id,
            funcionarioId: '11111111-1111-4111-8111-111111111102',
            numero: null,
            version: 1,
            estado: 'BORRADOR',
            datosFuncionario: {
              nombres: 'Carlos',
              apellidos: 'Mamani Flores',
              documentoIdentidad: '9000002',
              cargo: 'Asistente Administrativo',
              area: 'Administración',
              remuneracion: 8500,
            },
            diasTrabajados: 30,
            totalGanado: 8500,
            totalDescuentos: 1080.35,
            liquidoPagable: 7419.65,
            tieneAlerta: false,
            detalles: [
              {
                id: 'd-1',
                conceptoId: 'c-1',
                conceptoCodigo: 'HABER_BASICO',
                conceptoNombre: 'Haber básico',
                tipo: 'HABER',
                baseMonto: 8500,
                porcentaje: null,
                monto: 8500,
                orden: 1,
              },
              {
                id: 'd-2',
                conceptoId: 'c-2',
                conceptoCodigo: 'APORTE_LABORAL',
                conceptoNombre: 'Aporte laboral AFP (12.71%)',
                tipo: 'DESCUENTO',
                baseMonto: 8500,
                porcentaje: 12.71,
                monto: 1080.35,
                orden: 100,
              },
            ],
          },
          {
            id: 'b-seed-2',
            periodoId: id,
            funcionarioId: '11111111-1111-4111-8111-111111111103',
            numero: null,
            version: 1,
            estado: 'BORRADOR',
            datosFuncionario: {
              nombres: 'Daniela',
              apellidos: 'Mendoza Vargas',
              documentoIdentidad: '9000003',
              cargo: 'Desarrollador',
              area: 'Sistemas',
              remuneracion: 7200,
            },
            diasTrabajados: 30,
            totalGanado: 7200,
            totalDescuentos: 915.12,
            liquidoPagable: 6284.88,
            tieneAlerta: false,
            detalles: [
              {
                id: 'd-3',
                conceptoId: 'c-1',
                conceptoCodigo: 'HABER_BASICO',
                conceptoNombre: 'Haber básico',
                tipo: 'HABER',
                baseMonto: 7200,
                porcentaje: null,
                monto: 7200,
                orden: 1,
              },
              {
                id: 'd-4',
                conceptoId: 'c-2',
                conceptoCodigo: 'APORTE_LABORAL',
                conceptoNombre: 'Aporte laboral AFP (12.71%)',
                tipo: 'DESCUENTO',
                baseMonto: 7200,
                porcentaje: 12.71,
                monto: 915.12,
                orden: 100,
              },
            ],
          },
          {
            id: 'b-seed-3',
            periodoId: id,
            funcionarioId: '11111111-1111-4111-8111-111111111104',
            numero: null,
            version: 1,
            estado: 'BORRADOR',
            datosFuncionario: {
              nombres: 'Rodrigo',
              apellidos: 'Quispe Choque',
              documentoIdentidad: '9000004',
              cargo: 'Supervisor de Operaciones',
              area: 'Operaciones',
              remuneracion: 9000,
            },
            diasTrabajados: 30,
            totalGanado: 9000,
            totalDescuentos: 1143.9,
            liquidoPagable: 7856.1,
            tieneAlerta: false,
            detalles: [
              {
                id: 'd-5',
                conceptoId: 'c-1',
                conceptoCodigo: 'HABER_BASICO',
                conceptoNombre: 'Haber básico',
                tipo: 'HABER',
                baseMonto: 9000,
                porcentaje: null,
                monto: 9000,
                orden: 1,
              },
              {
                id: 'd-6',
                conceptoId: 'c-2',
                conceptoCodigo: 'APORTE_LABORAL',
                conceptoNombre: 'Aporte laboral AFP (12.71%)',
                tipo: 'DESCUENTO',
                baseMonto: 9000,
                porcentaje: 12.71,
                monto: 1143.9,
                orden: 100,
              },
            ],
          },
        ],
      })
    } finally {
      setCargandoPlanilla(false)
    }
  }, [])

  // Cargar Conceptos (HU-20)
  const cargarConceptos = useCallback(async () => {
    setCargandoConceptos(true)
    try {
      const data = await ApiService.getConceptos(true)
      setConceptos(data)
    } catch {
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

  // Cargar Novedades (HU-20)
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

  // Efectos de carga inicial
  useEffect(() => {
    if (puedeGestionar) {
      cargarPeriodos()
    }
  }, [puedeGestionar, cargarPeriodos])

  useEffect(() => {
    if (puedeGestionar && periodoSeleccionadoId) {
      cargarPlanillaPeriodo(periodoSeleccionadoId)
    }
  }, [puedeGestionar, periodoSeleccionadoId, cargarPlanillaPeriodo])

  useEffect(() => {
    if (puedeGestionar && tabActivo === 'conceptos') {
      cargarConceptos()
    }
  }, [puedeGestionar, tabActivo, cargarConceptos])

  useEffect(() => {
    if (puedeGestionar && tabActivo === 'novedades') {
      cargarNovedades()
    }
  }, [puedeGestionar, tabActivo, cargarNovedades])

  // Handler: Calcular o recalcular planilla (HU-21 CA-07)
  const handleCalcularPlanilla = async () => {
    if (!periodoSeleccionadoId) return
    setCalculandoPlanilla(true)
    try {
      const resultado = await ApiService.calcularPlanilla(periodoSeleccionadoId)
      setDetallePlanilla(resultado)
      cargarPeriodos()
      toast.success(
        `Planilla calculada exitosamente (${resultado.resumen.cantidadBoletas} funcionarios procesados, ${resultado.resumen.cantidadAlertas} alertas)`,
        'Cálculo Exitoso (HU-21)',
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la planilla'
      toast.error(msg, 'Error de Cálculo')
    } finally {
      setCalculandoPlanilla(false)
    }
  }

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

  // Boletas emitidas para consulta de funcionario
  const boletasEmitidasMock = [
    {
      id: '1',
      funcionarioId: '11111111-1111-4111-8111-111111111101',
      numero: 'BOL-2026-10-001',
      periodo: 'Octubre 2026',
      funcionario: 'Lucía Vargas Rojas',
      haberBasico: 8500,
      totalDescuentos: 1080.35,
      liquidoPagable: 7419.65,
      fechaEmision: '2026-10-31',
      estado: 'EMITIDA',
    },
    {
      id: '2',
      funcionarioId: '11111111-1111-4111-8111-111111111102',
      numero: 'BOL-2026-10-002',
      periodo: 'Octubre 2026',
      funcionario: 'Carlos Mamani Flores',
      haberBasico: 8500,
      totalDescuentos: 1080.35,
      liquidoPagable: 7419.65,
      fechaEmision: '2026-10-31',
      estado: 'EMITIDA',
    },
  ]

  const boletasVisibles = esFuncionario
    ? boletasEmitidasMock.filter((b) => b.funcionarioId === usuario?.funcionarioId)
    : boletasEmitidasMock

  const periodoActual = periodos.find((p) => p.id === periodoSeleccionadoId) ?? periodos[0]
  const resumenActual = detallePlanilla?.resumen ?? periodoActual?.resumen ?? {
    totalGanado: 0,
    totalDescuentos: 0,
    totalLiquido: 0,
    cantidadBoletas: 0,
    cantidadAlertas: 0,
  }

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
              : 'Liquidación mensual de planillas (HU-21), novedades del período (HU-20) y conceptos salariales.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {puedeGestionar && tabActivo === 'planilla' && (
            <>
              <Button
                variant="outline"
                leftIcon={<RefreshCw size={16} />}
                onClick={() => {
                  cargarPeriodos()
                  cargarPlanillaPeriodo(periodoSeleccionadoId)
                }}
                disabled={cargandoPlanilla || calculandoPlanilla || cargandoPeriodos}
              >
                Actualizar
              </Button>
              <Button
                variant="outline"
                leftIcon={<Plus size={16} />}
                onClick={() => setIsAbrirPeriodoOpen(true)}
              >
                Abrir Período
              </Button>
              <Button
                variant="primary"
                leftIcon={<RefreshCw size={18} className={calculandoPlanilla ? 'animate-spin' : ''} />}
                onClick={handleCalcularPlanilla}
                disabled={calculandoPlanilla || periodoActual?.estado === 'EMITIDO'}
              >
                {calculandoPlanilla
                  ? 'Calculando Planilla...'
                  : detallePlanilla?.boletas?.length
                    ? 'Recalcular Planilla'
                    : 'Calcular Planilla'}
              </Button>
            </>
          )}

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
        </div>
      </header>

      {/* Segmented Control de Navegación estilo Apple */}
      {!esFuncionario && (
        <nav className="segmented-control-ds" aria-label="Secciones de Planilla">
          <button
            type="button"
            onClick={() => setTabActivo('planilla')}
            className={`segmented-tab-ds ${tabActivo === 'planilla' ? 'is-active' : ''}`}
          >
            Planilla del Período (HU-21)
          </button>

          <button
            type="button"
            onClick={() => setTabActivo('novedades')}
            className={`segmented-tab-ds ${tabActivo === 'novedades' ? 'is-active' : ''}`}
          >
            Novedades del Período (HU-20)
          </button>

          <button
            type="button"
            onClick={() => setTabActivo('conceptos')}
            className={`segmented-tab-ds ${tabActivo === 'conceptos' ? 'is-active' : ''}`}
          >
            Conceptos de Planilla
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

      {/* TAB 1: PLANILLA DEL PERÍODO (HU-21) */}
      {tabActivo === 'planilla' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Selector de Período y Estado */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '260px' }}>
                  <Select
                    label="Seleccionar Período de Planilla"
                    value={periodoSeleccionadoId}
                    onChange={(e) => setPeriodoSeleccionadoId(e.target.value)}
                    options={periodos.map((p) => ({
                      value: p.id,
                      label: `Período ${p.mes}/${p.anio} — (${p.estado})`,
                    }))}
                  />
                </div>
                <div style={{ marginTop: '1.25rem' }}>
                  <Badge variant={periodoActual?.estado === 'EMITIDO' ? 'success' : 'warning'}>
                    Estado: {periodoActual?.estado ?? 'BORRADOR'}
                  </Badge>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem' }} className="text-slate-500">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={15} />
                  {periodoActual ? `Mes ${periodoActual.mes} de ${periodoActual.anio}` : '—'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RefreshCw size={15} />
                  {periodoActual?.fechaCalculo
                    ? `Último cálculo: ${new Date(periodoActual.fechaCalculo).toLocaleDateString()}`
                    : 'Sin cálculo aún'}
                </span>
              </div>
            </div>
          </Card>

          {/* Tarjetas de Estadísticas / Totales (CA-08) */}
          <div className="stats-grid-ds">
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Total Ganado (Haberes)</span>
                <strong className="stat-value text-teal">{formatCurrency(resumenActual.totalGanado)}</strong>
                <span className="stat-footnote">Masa salarial computable</span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Total Descuentos de Ley</span>
                <strong className="stat-value text-danger">- {formatCurrency(resumenActual.totalDescuentos)}</strong>
                <span className="stat-footnote">AFP 12.71% y novedades</span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Líquido Consolidado</span>
                <strong className="stat-value">{formatCurrency(resumenActual.totalLiquido)}</strong>
                <span className="stat-footnote">Monto total a liquidar</span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Alertas Activas (CA-06)</span>
                <strong className={`stat-value ${resumenActual.cantidadAlertas > 0 ? 'text-danger' : 'text-slate-500'}`}>
                  {resumenActual.cantidadAlertas}
                </strong>
                <span className="stat-footnote">
                  {resumenActual.cantidadAlertas > 0 ? 'Bloquean emisión' : 'Planilla conforme'}
                </span>
              </div>
            </Card>
          </div>

          {/* Tabla de Planilla Calculada */}
          <Card title={`Planilla de Sueldos y Salarios — Período ${periodoActual?.mes}/${periodoActual?.anio} (CA-08)`}>
            {cargandoPlanilla ? (
              <div style={{ padding: '3rem', textAlign: 'center' }} className="text-slate-500">
                <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                Cargando datos de planilla...
              </div>
            ) : !detallePlanilla?.boletas || detallePlanilla.boletas.length === 0 ? (
              <EmptyState
                icon={<TrendingUp size={40} className="text-slate-400" />}
                title="Planilla no calculada para este período"
                description="Ejecuta el cálculo automático con base 30 y fórmulas de ley para todos los funcionarios activos."
                action={
                  <Button
                    variant="primary"
                    leftIcon={<RefreshCw size={16} />}
                    onClick={handleCalcularPlanilla}
                    disabled={calculandoPlanilla}
                  >
                    Calcular Planilla Ahora
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionario</TableHead>
                    <TableHead>Cargo y Área</TableHead>
                    <TableHead className="text-center">Días Trab. (CA-03)</TableHead>
                    <TableHead className="text-right">Total Ganado</TableHead>
                    <TableHead className="text-right">Descuentos</TableHead>
                    <TableHead className="text-right">Líquido Pagable</TableHead>
                    <TableHead className="text-center">Estado / Alerta</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detallePlanilla.boletas.map((b) => (
                    <TableRow key={b.id || b.funcionarioId}>
                      <TableCell>
                        <strong className="block">
                          {b.datosFuncionario?.nombres} {b.datosFuncionario?.apellidos}
                        </strong>
                        <span className="text-xs text-slate-500 font-mono">
                          CI: {b.datosFuncionario?.documentoIdentidad}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span>{b.datosFuncionario?.cargo || '—'}</span>
                        <span className="block text-xs text-slate-500">{b.datosFuncionario?.area || '—'}</span>
                      </TableCell>

                      <TableCell className="text-center font-mono font-bold">
                        <span className={b.diasTrabajados < 30 ? 'text-amber-600' : 'text-slate-700'}>
                          {b.diasTrabajados} / 30
                        </span>
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold text-teal">
                        {formatCurrency(b.totalGanado)}
                      </TableCell>

                      <TableCell className="text-right font-mono text-danger">
                        - {formatCurrency(b.totalDescuentos)}
                      </TableCell>

                      <TableCell
                        className={`text-right font-mono font-bold ${
                          b.tieneAlerta ? 'text-danger font-black' : 'text-slate-800'
                        }`}
                      >
                        {formatCurrency(b.liquidoPagable)}
                      </TableCell>

                      <TableCell className="text-center">
                        {b.tieneAlerta ? (
                          <Badge variant="danger">
                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '3px' }} />
                            Líquido Negativo
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            <CheckCircle size={12} style={{ display: 'inline', marginRight: '3px' }} />
                            Conforme
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => {
                            setBoletaParaDetalle(b)
                            setIsDetalleBoletaOpen(true)
                          }}
                        >
                          Ver Desglose
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

      {/* TAB 2: NOVEDADES DEL PERÍODO (HU-20) */}
      {tabActivo === 'novedades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '150px' }}>
                <Select
                  label="Año"
                  value={String(filtroAnio)}
                  onChange={(val) => setFiltroAnio(Number(val))}
                  options={[
                    { value: '2025', label: '2025' },
                    { value: '2026', label: '2026' },
                    { value: '2027', label: '2027' },
                  ]}
                />
              </div>
              <div style={{ width: '180px' }}>
                <Select
                  label="Mes del Período"
                  value={String(filtroMes)}
                  onChange={(val) => setFiltroMes(Number(val))}
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

          <Card title={`Novedades Registradas — Período ${filtroMes}/${filtroAnio} (HU-20)`}>
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
                        <strong>{mapaFuncionarios[nov.funcionarioId] ?? nov.funcionarioId}</strong>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold">{nov.concepto?.codigo ?? '—'}</span> (
                        {nov.concepto?.nombre ?? ''})
                      </TableCell>
                      <TableCell>
                        <Badge variant={nov.concepto?.tipo === 'HABER' ? 'success' : 'danger'}>
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

      {/* TAB 3: CONCEPTOS DE PLANILLA (HU-20) */}
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
                      <TableCell>
                        <strong className="font-mono">{c.codigo}</strong>
                        {c.esSistema && (
                          <Badge variant="neutral" className="ml-2 text-xs">
                            Sistema
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{c.nombre}</TableCell>
                      <TableCell>
                        <Badge variant={c.tipo === 'HABER' ? 'success' : 'danger'}>{c.tipo}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{c.formaCalculo}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.formaCalculo === 'PORCENTAJE'
                          ? `${c.valor}% de ${c.base}`
                          : c.formaCalculo === 'MONTO_FIJO'
                            ? formatCurrency(c.valor ?? 0)
                            : 'Fórmula de Ley'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.automatico ? 'info' : 'neutral'}>
                          {c.automatico ? 'Automático' : 'Novedad'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.activo ? 'ACTIVO' : 'INACTIVO'} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                          <Button variant="outline" size="sm" onClick={() => handleEditarConcepto(c)}>
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

      {/* TAB 4: BOLETAS EMITIDAS */}
      {tabActivo === 'boletas' && (
        <>
          <div className="stats-grid-ds">
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">
                  {esFuncionario ? 'Mi Líquido Pagable' : 'Total Planilla Octubre'}
                </span>
                <strong className="stat-value">
                  {formatCurrency(
                    boletasVisibles.reduce((acc, b) => acc + b.liquidoPagable, 0),
                  )}
                </strong>
                <span className="stat-footnote">Líquido pagable consolidado</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">
                  {esFuncionario ? 'Mis Descuentos' : 'Descuentos de Ley'}
                </span>
                <strong className="stat-value">
                  {formatCurrency(
                    boletasVisibles.reduce((acc, b) => acc + b.totalDescuentos, 0),
                  )}
                </strong>
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

      {/* Modal Abrir Período (CA-01) */}
      <AbrirPeriodoModal
        isOpen={isAbrirPeriodoOpen}
        onClose={() => setIsAbrirPeriodoOpen(false)}
        onCreado={(nuevo) => {
          setPeriodos((prev) => [nuevo, ...prev])
          setPeriodoSeleccionadoId(nuevo.id)
        }}
      />

      {/* Modal Desglose de Boleta Línea por Línea (CA-04, CA-05) */}
      <DetalleBoletaModal
        isOpen={isDetalleBoletaOpen}
        onClose={() => setIsDetalleBoletaOpen(false)}
        boleta={boletaParaDetalle}
      />

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
    </div>
  )
}
