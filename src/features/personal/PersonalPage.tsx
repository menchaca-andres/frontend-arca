import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, Plus, RefreshCw, Search, UserX } from 'lucide-react'
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
import type { FichaFuncionario, FuncionarioResumen, PruebaPorVencerItem } from '../../types'
import { formatDate } from '../../utils/formatters'
import { useAuth } from '../auth/useAuth'
import {
  DarDeBajaModal,
  FichaFuncionarioModal,
  RatificarFuncionarioModal,
  RegistrarFuncionarioModal,
} from './components'

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

  // Lista de funcionarios
  const [funcionarios, setFuncionarios] = useState<FuncionarioResumen[]>([])
  const [cargandoLista, setCargandoLista] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('ACTIVOS')

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

  // Carga de funcionarios según filtro
  const cargarFuncionarios = useCallback(
    async (filtro = estadoFiltro) => {
      setCargandoLista(true)
      try {
        const estadoParam = filtro === 'ACTIVOS' ? undefined : filtro
        const data = await ApiService.getFuncionarios({ estado: estadoParam })
        setFuncionarios(data)
      } catch {
        // Fallback local si la BD aún no tiene funcionarios creados
        setFuncionarios([
          {
            id: '11111111-1111-4111-8111-111111111103',
            ci: '9000003',
            ciExpedido: 'LP',
            nombreCompleto: 'Daniela Mendoza Vargas',
            estado: 'EN_PRUEBA',
          },
        ])
      } finally {
        setCargandoLista(false)
      }
    },
    [estadoFiltro],
  )

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
    void cargarFuncionarios(estadoFiltro)
  }, [cargarFuncionarios, estadoFiltro])

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
    setFuncionarios((prev) => [
      {
        id: nuevaFicha.id,
        ci: nuevaFicha.ci,
        ciExpedido: nuevaFicha.ciExpedido,
        nombreCompleto: `${nuevaFicha.nombres} ${nuevaFicha.apellidos}`,
        estado: nuevaFicha.estado,
      },
      ...prev.filter((f) => f.id !== nuevaFicha.id),
    ])
    void cargarPruebasPorVencer()
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

  const handleRatificacionExitosa = (fichaActualizada: FichaFuncionario) => {
    setFuncionarios((prev) =>
      prev.map((f) =>
        f.id === fichaActualizada.id ? { ...f, estado: fichaActualizada.estado } : f,
      ),
    )
    if (fichaSeleccionada?.id === fichaActualizada.id) {
      setFichaSeleccionada(fichaActualizada)
    }
    void cargarPruebasPorVencer()
  }

  const handleBajaExitosa = (fichaActualizada: FichaFuncionario) => {
    setFuncionarios((prev) =>
      prev.map((f) =>
        f.id === fichaActualizada.id ? { ...f, estado: fichaActualizada.estado } : f,
      ),
    )
    if (fichaSeleccionada?.id === fichaActualizada.id) {
      setFichaSeleccionada(fichaActualizada)
    }
    void cargarPruebasPorVencer()
    void cargarFuncionarios(estadoFiltro)
  }

  const filtrados = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return funcionarios
    return funcionarios.filter(
      (f) => f.nombreCompleto.toLowerCase().includes(term) || f.ci.toLowerCase().includes(term),
    )
  }, [funcionarios, searchTerm])

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
                void cargarFuncionarios(estadoFiltro)
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
            {/* HU-12 CA-07: Selector de filtro por estado */}
            <div style={{ minWidth: '280px' }}>
              <Select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                options={FILTROS_ESTADO}
              />
            </div>
          </div>
        )}

        {cargandoLista ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Cargando padrón de funcionarios...
          </div>
        ) : filtrados.length === 0 ? (
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
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((f) => (
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
                          leftIcon={<CheckCircle2 size={14} />}
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
                          leftIcon={<UserX size={14} />}
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
      />

      {/* Modal de Ratificación de Funcionario (HU-11) */}
      <RatificarFuncionarioModal
        funcionario={funcionarioParaRatificar}
        isOpen={isRatificarOpen}
        onClose={() => {
          setIsRatificarOpen(false)
          setFuncionarioParaRatificar(null)
        }}
        onSuccess={handleRatificacionExitosa}
      />

      {/* Modal de Dar de Baja a Funcionario (HU-12) */}
      <DarDeBajaModal
        funcionario={funcionarioParaBaja}
        isOpen={isBajaOpen}
        onClose={() => {
          setIsBajaOpen(false)
          setFuncionarioParaBaja(null)
        }}
        onSuccess={handleBajaExitosa}
      />
    </div>
  )
}
