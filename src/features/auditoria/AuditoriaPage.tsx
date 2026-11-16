import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  Copy,
  Eye,
  Filter,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '../../components'
import { ApiService } from '../../services/api'
import type { EventoAuditoriaItem, FiltrosAuditoria } from '../../types'
import { formatDateTime } from '../../utils/formatters'

const SERVICIOS = [
  { value: '', label: 'Todos los servicios' },
  { value: 'auth', label: 'Auth (ms-auth)' },
  { value: 'personal', label: 'Personal (ms-personal)' },
  { value: 'vacaciones', label: 'Vacaciones (ms-vacaciones)' },
  { value: 'contratos', label: 'Contratos (ms-contratos)' },
  { value: 'boletas', label: 'Boletas (ms-boletas)' },
  { value: 'gateway', label: 'Gateway' },
]

const METODOS = [
  { value: '', label: 'Todos los métodos' },
  { value: 'GET', label: 'GET (Descargas PDF)' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
]

const RESULTADOS = [
  { value: '', label: 'Todos los resultados' },
  { value: 'EXITO', label: 'Éxito (HTTP 2xx-3xx)' },
  { value: 'ERROR', label: 'Error (HTTP 4xx-5xx)' },
]

export function AuditoriaPage() {
  const toast = useToast()

  const [eventos, setEventos] = useState<EventoAuditoriaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(15)
  const [cargando, setCargando] = useState(true)

  // Filtros
  const [servicioFiltro, setServicioFiltro] = useState('')
  const [metodoFiltro, setMetodoFiltro] = useState('')
  const [resultadoFiltro, setResultadoFiltro] = useState<'' | 'EXITO' | 'ERROR'>('')
  const [usuarioIdFiltro, setUsuarioIdFiltro] = useState('')
  const [desdeFiltro, setDesdeFiltro] = useState('')
  const [hastaFiltro, setHastaFiltro] = useState('')

  // Modal de detalle
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoAuditoriaItem | null>(null)
  const [copiadoId, setCopiadoId] = useState<string | null>(null)

  const cargarEventos = useCallback(
    async (nuevaPagina = page) => {
      setCargando(true)
      try {
        const filtros: FiltrosAuditoria = {
          page: nuevaPagina,
          pageSize,
        }
        if (servicioFiltro) filtros.servicio = servicioFiltro
        if (metodoFiltro) filtros.metodo = metodoFiltro
        if (resultadoFiltro) filtros.resultado = resultadoFiltro
        if (usuarioIdFiltro.trim()) filtros.usuarioId = usuarioIdFiltro.trim()
        if (desdeFiltro) filtros.desde = desdeFiltro
        if (hastaFiltro) filtros.hasta = hastaFiltro

        const res = await ApiService.getEventosAuditoria(filtros)
        setEventos(res.data)
        setTotal(res.total)
        setPage(res.page)
      } catch (error) {
        toast.show({
          title: 'Error al consultar auditoría',
          message: error instanceof Error ? error.message : 'No se pudo obtener el historial',
          type: 'error',
        })
      } finally {
        setCargando(false)
      }
    },
    [
      page,
      pageSize,
      servicioFiltro,
      metodoFiltro,
      resultadoFiltro,
      usuarioIdFiltro,
      desdeFiltro,
      hastaFiltro,
      toast,
    ],
  )

  useEffect(() => {
    cargarEventos(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    cargarEventos(1)
  }

  const handleLimpiarFiltros = () => {
    setServicioFiltro('')
    setMetodoFiltro('')
    setResultadoFiltro('')
    setUsuarioIdFiltro('')
    setDesdeFiltro('')
    setHastaFiltro('')
    setPage(1)
    setTimeout(() => {
      ApiService.getEventosAuditoria({ page: 1, pageSize })
        .then((res) => {
          setEventos(res.data)
          setTotal(res.total)
          setPage(res.page)
        })
        .catch(() => {})
    }, 0)
  }

  const handleCopiar = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto)
    setCopiadoId(texto)
    toast.show({
      title: 'Copiado',
      message: `${label} copiado al portapapeles`,
      type: 'success',
    })
    setTimeout(() => setCopiadoId(null), 2000)
  }

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize))

  const renderBadgeMetodo = (metodo: string) => {
    const m = metodo.toUpperCase()
    let variant: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral'
    if (m === 'POST') variant = 'success'
    else if (m === 'PUT' || m === 'PATCH') variant = 'warning'
    else if (m === 'DELETE') variant = 'danger'
    else if (m === 'GET') variant = 'info'

    return (
      <Badge variant={variant} className="font-mono text-xs font-bold">
        {m}
      </Badge>
    )
  }

  const renderBadgeStatus = (status: number) => {
    let variant: 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'neutral' = 'success'
    if (status >= 500) variant = 'danger'
    else if (status >= 400) variant = 'warning'
    else if (status >= 300) variant = 'info'

    return (
      <Badge variant={variant} className="font-mono text-xs">
        {status}
      </Badge>
    )
  }

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Seguridad & Trazabilidad (CA-01, CA-02, CA-06)</p>
          <h1 className="page-title-ds">Registro de Auditoría de Operaciones</h1>
          <p className="page-subtitle-ds">
            Historial inmutable de peticiones mutables y descargas oficiales capturadas por el Gateway.
          </p>
        </div>
        <div className="page-header-actions-ds">
          <Button
            variant="outline"
            onClick={() => cargarEventos(page)}
            disabled={cargando}
            leftIcon={<RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />}
          >
            Actualizar
          </Button>
        </div>
      </header>

      {/* Tarjeta de Filtros de Auditoría */}
      <Card title="Filtros de Búsqueda">
        <form onSubmit={handleFiltrar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Microservicio</label>
              <Select
                value={servicioFiltro}
                onChange={(e) => setServicioFiltro(e.target.value)}
                options={SERVICIOS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Método HTTP</label>
              <Select
                value={metodoFiltro}
                onChange={(e) => setMetodoFiltro(e.target.value)}
                options={METODOS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Resultado</label>
              <Select
                value={resultadoFiltro}
                onChange={(e) => setResultadoFiltro(e.target.value as any)}
                options={RESULTADOS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">ID de Usuario (UUID)</label>
              <Input
                placeholder="Ej: 550e8400-e29b-..."
                value={usuarioIdFiltro}
                onChange={(e) => setUsuarioIdFiltro(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Desde Fecha</label>
              <Input
                type="date"
                value={desdeFiltro}
                onChange={(e) => setDesdeFiltro(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Hasta Fecha</label>
              <Input
                type="date"
                value={hastaFiltro}
                onChange={(e) => setHastaFiltro(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleLimpiarFiltros}
              disabled={cargando}
              leftIcon={<RotateCcw size={15} />}
            >
              Limpiar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={cargando}
              leftIcon={<Filter size={15} />}
            >
              Aplicar Filtros
            </Button>
          </div>
        </form>
      </Card>

      {/* Tabla de Eventos */}
      <Card
        title={`Eventos Registrados (${total})`}
        subtitle="Registro ordenado cronológicamente de forma descendente"
      >
        {cargando && eventos.length === 0 ? (
          <div className="py-12 flex justify-center items-center text-slate-400 gap-3">
            <RefreshCw size={20} className="animate-spin text-cyan-400" />
            <span>Consultando eventos de auditoría...</span>
          </div>
        ) : eventos.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={48} />}
            title="Sin eventos de auditoría"
            description="No se encontraron eventos coincidentes con los criterios de filtro aplicados."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Usuario / Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {formatDateTime(ev.fecha)}
                    </TableCell>
                    <TableCell>{renderBadgeMetodo(ev.metodo)}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-300 text-xs uppercase tracking-wider">
                        {ev.servicio}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-xs truncate" title={ev.ruta}>
                      {ev.ruta}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-400">
                      {ev.recursoId ? (
                        <span className="truncate max-w-[120px] inline-block" title={ev.recursoId}>
                          {ev.recursoId}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {ev.usuarioId ? (
                        <div>
                          <span
                            className="font-mono text-slate-400 cursor-pointer hover:text-cyan-400"
                            title={ev.usuarioId}
                            onClick={() => handleCopiar(ev.usuarioId!, 'ID Usuario')}
                          >
                            {ev.usuarioId.slice(0, 8)}...
                          </span>
                          {ev.rol && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {ev.rol}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Anónimo / Público</span>
                      )}
                    </TableCell>
                    <TableCell>{renderBadgeStatus(ev.statusCode)}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-400 whitespace-nowrap">
                      {ev.ip || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEventoSeleccionado(ev)}
                        leftIcon={<Eye size={14} />}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-4 text-xs text-slate-400">
              <div>
                Página <span className="font-semibold text-slate-200">{page}</span> de{' '}
                <span className="font-semibold text-slate-200">{totalPaginas}</span> ({total}{' '}
                registros)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || cargando}
                  onClick={() => cargarEventos(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPaginas || cargando}
                  onClick={() => cargarEventos(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Modal Detalle de Evento */}
      {eventoSeleccionado && (
        <Modal
          isOpen={true}
          onClose={() => setEventoSeleccionado(null)}
          title="Detalle del Evento de Auditoría"
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div>
                <p className="text-xs text-slate-400">ID del Evento</p>
                <p className="font-mono font-bold text-slate-200">#{eventoSeleccionado.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Fecha y Hora</p>
                <p className="font-mono text-slate-200">
                  {formatDateTime(eventoSeleccionado.fecha)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Método HTTP</p>
                <div>{renderBadgeMetodo(eventoSeleccionado.metodo)}</div>
              </div>
              <div>
                <p className="text-xs text-slate-400">Código de Respuesta</p>
                <div>{renderBadgeStatus(eventoSeleccionado.statusCode)}</div>
              </div>
              <div>
                <p className="text-xs text-slate-400">Servicio Destino</p>
                <p className="font-semibold text-slate-200 uppercase">
                  {eventoSeleccionado.servicio}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Dirección IP</p>
                <p className="font-mono text-slate-200">{eventoSeleccionado.ip || 'No registrada'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-400 mb-1">Ruta Solicitada</p>
                <p className="font-mono text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200 break-all">
                  {eventoSeleccionado.ruta}
                </p>
              </div>

              {eventoSeleccionado.recursoId && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Recurso Afectado (ID)</p>
                  <p className="font-mono text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
                    {eventoSeleccionado.recursoId}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-400">Request ID (Trazabilidad Distribuida)</p>
                  <button
                    type="button"
                    onClick={() => handleCopiar(eventoSeleccionado.requestId, 'Request ID')}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    {copiadoId === eventoSeleccionado.requestId ? (
                      <Check size={12} className="text-emerald-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                    Copiar
                  </button>
                </div>
                <p className="font-mono text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-cyan-300 break-all">
                  {eventoSeleccionado.requestId}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-400">Usuario ID / Rol</p>
                  {eventoSeleccionado.usuarioId && (
                    <button
                      type="button"
                      onClick={() => handleCopiar(eventoSeleccionado.usuarioId!, 'Usuario ID')}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiadoId === eventoSeleccionado.usuarioId ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                      Copiar
                    </button>
                  )}
                </div>
                <p className="font-mono text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
                  {eventoSeleccionado.usuarioId
                    ? `${eventoSeleccionado.usuarioId} (${eventoSeleccionado.rol || 'Sin rol'})`
                    : 'Petición anónima / pública'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button variant="outline" onClick={() => setEventoSeleccionado(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
