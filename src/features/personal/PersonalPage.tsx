import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'
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
import { ApiService } from '../../services/api'
import type {
  Area,
  Cargo,
  FichaFuncionario,
  FiltroEstadoPadron,
  FuncionarioPadronItem,
  FuncionarioResumen,
  Paginated,
  PruebaPorVencerItem,
} from '../../types'
import { formatDate } from '../../utils/formatters'
import { useAuth } from '../auth/useAuth'
import {
  CambiarAsignacionModal,
  DarDeBajaModal,
  EditarContactoModal,
  FichaFuncionarioModal,
  RatificarFuncionarioModal,
  RegistrarFuncionarioModal,
} from './components'

const PAGE_SIZE = 20
const PAGINA_VACIA: Paginated<FuncionarioPadronItem> = {
  data: [],
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
}

const FILTROS_ESTADO = [
  { value: 'ACTIVOS', label: 'Personal Activo (En prueba y ratificados)' },
  { value: 'EN_PRUEBA', label: 'Solo en periodo de prueba' },
  { value: 'RATIFICADO', label: 'Solo personal ratificado' },
  { value: 'BAJA', label: 'Personal dado de baja (Histórico)' },
  { value: 'TODOS', label: 'Todos los registros' },
]

export function PersonalPage() {
  const toast = useToast()
  const { usuario } = useAuth()
  const puedeGestionar = usuario?.rol === 'ADMIN' || usuario?.rol === 'RRHH'
  const esFuncionario = usuario?.rol === 'FUNCIONARIO'

  // Modales
  const [isRegistrarOpen, setIsRegistrarOpen] = useState(false)
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  const [fichaSeleccionada, setFichaSeleccionada] = useState<FichaFuncionario | null>(null)
  const [cargandoFicha, setCargandoFicha] = useState(false)

  // Modales HU-11 y HU-12
  const [isRatificarOpen, setIsRatificarOpen] = useState(false)
  const [funcionarioParaRatificar, setFuncionarioParaRatificar] = useState<FichaFuncionario | null>(
    null,
  )
  const [isBajaOpen, setIsBajaOpen] = useState(false)
  const [funcionarioParaBaja, setFuncionarioParaBaja] = useState<FichaFuncionario | null>(null)

  // Modales HU-10
  const [funcionarioParaCambio, setFuncionarioParaCambio] = useState<FichaFuncionario | null>(null)
  const [funcionarioParaContacto, setFuncionarioParaContacto] = useState<FichaFuncionario | null>(
    null,
  )

  // HU-09: Padrón paginado con búsqueda y filtros en el servidor (CA-01, CA-02)
  const [pagina, setPagina] = useState<Paginated<FuncionarioPadronItem>>(PAGINA_VACIA)
  const [page, setPage] = useState(1)
  const [cargandoLista, setCargandoLista] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('ACTIVOS')
  const [areaFiltro, setAreaFiltro] = useState('')
  const [cargoFiltro, setCargoFiltro] = useState('')
  const [areas, setAreas] = useState<Area[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])

  // HU-11 CA-04: Aviso con funcionarios cuyo periodo de prueba termina en los próximos 7 días
  const [pruebasPorVencer, setPruebasPorVencer] = useState<PruebaPorVencerItem[]>([])

  const verFicha = useCallback(
    async (id: string) => {
      setCargandoFicha(true)
      try {
        const ficha = await ApiService.getFuncionarioFicha(id)
        setFichaSeleccionada(ficha)
        setIsFichaOpen(true)
        return ficha
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'No se pudo obtener la ficha del funcionario',
          'Error',
        )
        return null
      } finally {
        setCargandoFicha(false)
      }
    },
    [toast],
  )

  const cargarFuncionarios = useCallback(async () => {
    if (esFuncionario) return
    setCargandoLista(true)
    try {
      const data = await ApiService.getFuncionarios({
        q: busqueda || undefined,
        areaId: areaFiltro || undefined,
        cargoId: cargoFiltro || undefined,
        estado: estadoFiltro === 'ACTIVOS' ? undefined : (estadoFiltro as FiltroEstadoPadron),
        page,
        pageSize: PAGE_SIZE,
      })
      setPagina(data)
    } catch (err) {
      setPagina(PAGINA_VACIA)
      toast.error(err instanceof Error ? err.message : 'No se pudo cargar el padrón', 'Error')
    } finally {
      setCargandoLista(false)
    }
  }, [esFuncionario, busqueda, areaFiltro, cargoFiltro, estadoFiltro, page, toast])

  // La búsqueda se envía al servidor cuando se deja de escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusqueda(searchTerm.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (esFuncionario) return
    ApiService.getAreas()
      .then(setAreas)
      .catch(() => setAreas([]))
  }, [esFuncionario])

  useEffect(() => {
    if (esFuncionario) return
    ApiService.getCargos(areaFiltro ? { areaId: areaFiltro } : {})
      .then(setCargos)
      .catch(() => setCargos([]))
  }, [esFuncionario, areaFiltro])

  // Cargar avisos de periodo de prueba por vencer (HU-11 CA-04)
  const cargarPruebasPorVencer = useCallback(async () => {
    if (!puedeGestionar) return
    try {
      const items = await ApiService.getPruebaPorVencer()
      setPruebasPorVencer(items)
    } catch {
      setPruebasPorVencer([])
    }
  }, [puedeGestionar])

  useEffect(() => {
    void cargarFuncionarios()
  }, [cargarFuncionarios])

  useEffect(() => {
    void cargarPruebasPorVencer()
  }, [cargarPruebasPorVencer])

  // Si el usuario logueado es FUNCIONARIO, cargar directamente su ficha
  useEffect(() => {
    if (esFuncionario && usuario?.funcionarioId) {
      void verFicha(usuario.funcionarioId)
    }
  }, [esFuncionario, usuario?.funcionarioId, verFicha])

  const handleAltaExitosa = (nuevaFicha: FichaFuncionario) => {
    setFichaSeleccionada(nuevaFicha)
    setIsFichaOpen(true)
    void cargarFuncionarios()
    void cargarPruebasPorVencer()
  }

  // Tras ratificar, dar de baja o cambiar datos se refresca la ficha abierta y el padrón
  const handleFichaActualizada = (fichaActualizada: FichaFuncionario) => {
    if (fichaSeleccionada?.id === fichaActualizada.id) {
      setFichaSeleccionada(fichaActualizada)
    }
    void cargarFuncionarios()
    void cargarPruebasPorVencer()
  }

  const volverAFicha = (ficha: FichaFuncionario) => {
    setFichaSeleccionada(ficha)
    setIsFichaOpen(true)
  }

  // Abrir modal de ratificación (HU-11)
  const iniciarRatificacion = async (funcionario: FuncionarioResumen | FichaFuncionario) => {
    let ficha: FichaFuncionario | null =
      'asignacionVigente' in funcionario ? (funcionario as FichaFuncionario) : null
    if (!ficha) {
      ficha = await verFicha(funcionario.id)
    }
    if (ficha) {
      setFuncionarioParaRatificar(ficha)
      setIsRatificarOpen(true)
    }
  }

  // Abrir modal de baja (HU-12)
  const iniciarBaja = async (funcionario: FuncionarioResumen | FichaFuncionario) => {
    let ficha: FichaFuncionario | null =
      'asignacionVigente' in funcionario ? (funcionario as FichaFuncionario) : null
    if (!ficha) {
      ficha = await verFicha(funcionario.id)
    }
    if (ficha) {
      setFuncionarioParaBaja(ficha)
      setIsBajaOpen(true)
    }
  }

  const cambiarFiltro = (aplicar: () => void) => {
    aplicar()
    setPage(1)
  }

  const funcionarios = pagina.data
  const totalPaginas = Math.max(1, Math.ceil(pagina.total / pagina.pageSize))
  const desde = pagina.total === 0 ? 0 : (pagina.page - 1) * pagina.pageSize + 1
  const hasta = Math.min(pagina.page * pagina.pageSize, pagina.total)

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Módulo de Personal (ms-personal)</p>
          <h1 className="page-title-ds">{esFuncionario ? 'Mi Ficha' : 'Padrón de Funcionarios'}</h1>
          <p className="page-subtitle-ds">
            {esFuncionario
              ? 'Consulta tus datos personales y tu asignación laboral vigente.'
              : 'Gestión de altas, ratificaciones, bajas y legajo laboral de ARCA Ltda.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!esFuncionario && (
            <Button
              variant="outline"
              leftIcon={<RefreshCw size={16} />}
              onClick={() => {
                void cargarFuncionarios()
                void cargarPruebasPorVencer()
              }}
              disabled={cargandoLista}
            >
              Actualizar
            </Button>
          )}
          {puedeGestionar && (
            <Button
              variant="primary"
              leftIcon={<Plus size={18} />}
              onClick={() => setIsRegistrarOpen(true)}
            >
              Nuevo Funcionario
            </Button>
          )}
        </div>
      </header>

      {/* HU-11 CA-04: Aviso con los funcionarios cuyo periodo de prueba termina en los próximos 7 días */}
      {!esFuncionario && puedeGestionar && pruebasPorVencer.length > 0 && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '0.5rem',
            color: '#92400e',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            <Clock size={18} />
            <span>Aviso de Periodo de Prueba (HU-11: CA-04)</span>
          </div>
          <p style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.85rem' }}>
            Se identificaron {pruebasPorVencer.length} funcionario(s) cuyo periodo de prueba
            concluye en los próximos 7 días (o listos para ser ratificados):
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pruebasPorVencer.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #fde68a',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <strong style={{ color: '#0f172a' }}>{item.nombreCompleto}</strong>{' '}
                  <span style={{ color: '#64748b' }}>
                    ({item.ci} {item.ciExpedido})
                  </span>{' '}
                  · Ingreso: {formatDate(item.fechaIngreso)} ({item.diasPrueba} días)
                  <span
                    style={{
                      marginLeft: '0.75rem',
                      fontWeight: 600,
                      color: item.listoParaRatificar ? '#16a34a' : '#d97706',
                    }}
                  >
                    {item.listoParaRatificar
                      ? '✓ Concluido (Listo para ratificar)'
                      : `Concluye el ${formatDate(item.fechaFinPrueba)} (en ${item.diasRestantes} días)`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="ghost" size="sm" onClick={() => verFicha(item.id)}>
                    Ver Ficha
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle2 size={14} />}
                    onClick={() => iniciarRatificacion(item)}
                    disabled={!item.listoParaRatificar}
                  >
                    Ratificar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card>
        {!esFuncionario && (
          <div
            className="table-controls-ds"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'space-between',
            }}
          >
            <div className="search-filter-box" style={{ flex: '1', minWidth: '240px' }}>
              <Input
                placeholder="Buscar por nombre, apellido o CI..."
                leftIcon={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* HU-09 CA-02: Filtros por área y cargo */}
            <div style={{ minWidth: '180px' }}>
              <Select
                value={areaFiltro}
                onChange={(e) =>
                  cambiarFiltro(() => {
                    setAreaFiltro(e.target.value)
                    setCargoFiltro('')
                  })
                }
                options={[
                  { value: '', label: 'Todas las áreas' },
                  ...areas.map((a) => ({ value: a.id, label: a.nombre })),
                ]}
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <Select
                value={cargoFiltro}
                onChange={(e) => cambiarFiltro(() => setCargoFiltro(e.target.value))}
                options={[
                  { value: '', label: 'Todos los cargos' },
                  ...cargos.map((c) => ({ value: c.id, label: c.nombre })),
                ]}
              />
            </div>
            {/* HU-12 CA-07: Selector de filtro por estado */}
            <div style={{ minWidth: '280px' }}>
              <Select
                value={estadoFiltro}
                onChange={(e) => cambiarFiltro(() => setEstadoFiltro(e.target.value))}
                options={FILTROS_ESTADO}
              />
            </div>
          </div>
        )}

        {cargandoLista ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Cargando padrón de funcionarios...
          </div>
        ) : funcionarios.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron funcionarios registrados con ese criterio."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CI</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funcionarios.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono">
                    {f.ci}{' '}
                    {f.ciExpedido ? (
                      <span className="text-xs text-muted">({f.ciExpedido})</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <strong>{f.nombreCompleto}</strong>
                  </TableCell>
                  <TableCell>{f.areaNombre ?? '—'}</TableCell>
                  <TableCell>{f.cargoNombre ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={f.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => verFicha(f.id)}
                        disabled={cargandoFicha}
                      >
                        Ver Ficha
                      </Button>

                      {/* HU-11: Botón Ratificar si está en prueba */}
                      {puedeGestionar && f.estado === 'EN_PRUEBA' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => iniciarRatificacion(f)}
                        >
                          Ratificar
                        </Button>
                      )}

                      {/* HU-12: Botón Dar de Baja si no está de baja */}
                      {puedeGestionar && f.estado !== 'BAJA' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          style={{ color: '#dc2626' }}
                          onClick={() => iniciarBaja(f)}
                        >
                          Baja
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* HU-09 CA-01: Paginación de 20 en 20 */}
        {!esFuncionario && pagina.total > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              color: '#64748b',
            }}
          >
            <span>
              Mostrando {desde}–{hasta} de {pagina.total} funcionarios
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ChevronLeft size={14} />}
                onClick={() => setPage((p) => p - 1)}
                disabled={cargandoLista || pagina.page <= 1}
              >
                Anterior
              </Button>
              <span>
                Página {pagina.page} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight size={14} />}
                onClick={() => setPage((p) => p + 1)}
                disabled={cargandoLista || pagina.page >= totalPaginas}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Registro de Funcionario (HU-08) */}
      <RegistrarFuncionarioModal
        isOpen={isRegistrarOpen}
        onClose={() => setIsRegistrarOpen(false)}
        onSuccess={handleAltaExitosa}
      />

      {/* Modal de Ficha del Funcionario (HU-09) */}
      <FichaFuncionarioModal
        ficha={fichaSeleccionada}
        isOpen={isFichaOpen}
        puedeGestionar={puedeGestionar}
        onClose={() => {
          setIsFichaOpen(false)
          setFichaSeleccionada(null)
        }}
        onRatificar={(ficha) => {
          setIsFichaOpen(false)
          iniciarRatificacion(ficha)
        }}
        onDarDeBaja={(ficha) => {
          setIsFichaOpen(false)
          iniciarBaja(ficha)
        }}
        onCambiarAsignacion={(ficha) => {
          setIsFichaOpen(false)
          setFuncionarioParaCambio(ficha)
        }}
        onEditarContacto={(ficha) => {
          setIsFichaOpen(false)
          setFuncionarioParaContacto(ficha)
        }}
      />

      {/* Modales de HU-10; la key reinicia el formulario para cada funcionario */}
      <CambiarAsignacionModal
        key={`cambio-${funcionarioParaCambio?.id ?? ''}`}
        funcionario={funcionarioParaCambio}
        isOpen={funcionarioParaCambio !== null}
        onClose={() => setFuncionarioParaCambio(null)}
        onSuccess={(ficha) => {
          handleFichaActualizada(ficha)
          volverAFicha(ficha)
        }}
      />
      <EditarContactoModal
        key={`contacto-${funcionarioParaContacto?.id ?? ''}`}
        funcionario={funcionarioParaContacto}
        isOpen={funcionarioParaContacto !== null}
        onClose={() => setFuncionarioParaContacto(null)}
        onSuccess={(ficha) => {
          handleFichaActualizada(ficha)
          volverAFicha(ficha)
        }}
      />

      {/* Modal de Ratificación de Funcionario (HU-11) */}
      <RatificarFuncionarioModal
        funcionario={funcionarioParaRatificar}
        isOpen={isRatificarOpen}
        onClose={() => {
          setIsRatificarOpen(false)
          setFuncionarioParaRatificar(null)
        }}
        onSuccess={handleFichaActualizada}
      />

      {/* Modal de Dar de Baja a Funcionario (HU-12) */}
      <DarDeBajaModal
        funcionario={funcionarioParaBaja}
        isOpen={isBajaOpen}
        onClose={() => {
          setIsBajaOpen(false)
          setFuncionarioParaBaja(null)
        }}
        onSuccess={handleFichaActualizada}
      />
    </div>
  )
}
