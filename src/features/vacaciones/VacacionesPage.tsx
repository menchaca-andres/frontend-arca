import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
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
import type { FuncionarioResumen, SaldoVacaciones, SolicitudVacacion } from '../../types'
import { formatDate } from '../../utils/formatters'
import { useAuth } from '../auth/useAuth'

function fechaEnLaPaz(diasDesdeHoy = 0): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const valor = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? ''
  const fecha = new Date(
    Date.UTC(
      Number(valor('year')),
      Number(valor('month')) - 1,
      Number(valor('day')) + diasDesdeHoy,
    ),
  )
  return fecha.toISOString().slice(0, 10)
}

function progresoHaciaGestion(saldo: SaldoVacaciones): number {
  const siguiente = new Date(`${saldo.fechaProximaGestion}T00:00:00Z`)
  const anterior = new Date(siguiente)
  anterior.setUTCFullYear(anterior.getUTCFullYear() - 1)
  if (anterior.getUTCMonth() !== siguiente.getUTCMonth()) {
    anterior.setUTCDate(0)
  }
  const hoy = Date.parse(`${fechaEnLaPaz()}T00:00:00Z`)
  const total = siguiente.getTime() - anterior.getTime()
  return Math.max(0, Math.min(100, Math.round(((hoy - anterior.getTime()) / total) * 100)))
}

export function VacacionesPage() {
  const toast = useToast()
  const { usuario } = useAuth()
  const esFuncionario = usuario?.rol === 'FUNCIONARIO'
  const esRRHH = usuario?.rol === 'RRHH'
  const puedeVerTodos =
    usuario?.rol === 'RRHH' || usuario?.rol === 'ADMIN' || usuario?.rol === 'DIRECCION'
  const puedeSolicitar = esFuncionario || esRRHH
  const [funcionarios, setFuncionarios] = useState<FuncionarioResumen[]>([])
  const [funcionarioId, setFuncionarioId] = useState(usuario?.funcionarioId ?? '')
  const [saldo, setSaldo] = useState<SaldoVacaciones | null>(null)
  const [solicitudes, setSolicitudes] = useState<SolicitudVacacion[] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [diasEstimados, setDiasEstimados] = useState<number | null>(null)
  const [cargandoDias, setCargandoDias] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!puedeVerTodos) return
    void ApiService.getFuncionariosParaSelector()
      .then(setFuncionarios)
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : 'No se pudieron cargar los funcionarios',
          'Error',
        )
      })
  }, [puedeVerTodos, toast])

  const cargarDatos = useCallback(async () => {
    return Promise.all([
      ApiService.getSolicitudesVacaciones(),
      funcionarioId ? ApiService.getSaldoVacaciones(funcionarioId) : Promise.resolve(null),
    ])
  }, [funcionarioId])

  const actualizarDatos = async () => {
    setSolicitudes(null)
    try {
      const [lista, saldoFuncionario] = await cargarDatos()
      setSolicitudes(lista)
      setSaldo(saldoFuncionario)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudieron cargar las vacaciones',
        'Error',
      )
      setSolicitudes([])
      setSaldo(null)
    }
  }

  useEffect(() => {
    let vigente = true
    void cargarDatos()
      .then(([lista, saldoFuncionario]) => {
        if (vigente) {
          setSolicitudes(lista)
          setSaldo(saldoFuncionario)
        }
      })
      .catch((error: unknown) => {
        if (vigente) {
          toast.error(
            error instanceof Error ? error.message : 'No se pudieron cargar las vacaciones',
            'Error',
          )
          setSolicitudes([])
          setSaldo(null)
        }
      })
    return () => {
      vigente = false
    }
  }, [cargarDatos, toast])

  useEffect(() => {
    if (!fechaInicio || !fechaFin || fechaFin < fechaInicio) return
    let vigente = true
    void ApiService.contarDiasVacaciones(fechaInicio, fechaFin)
      .then((dias) => {
        if (vigente) setDiasEstimados(dias)
      })
      .catch((error: unknown) => {
        if (vigente) {
          setDiasEstimados(null)
          toast.error(
            error instanceof Error ? error.message : 'No se pudo calcular el rango',
            'Error',
          )
        }
      })
      .finally(() => {
        if (vigente) setCargandoDias(false)
      })
    return () => {
      vigente = false
    }
  }, [fechaInicio, fechaFin, toast])

  const funcionarioSeleccionado = useMemo(
    () => funcionarios.find((funcionario) => funcionario.id === funcionarioId),
    [funcionarioId, funcionarios],
  )

  const solicitudesVisibles = useMemo(
    () =>
      funcionarioId
        ? (solicitudes ?? []).filter((solicitud) => solicitud.funcionarioId === funcionarioId)
        : (solicitudes ?? []),
    [funcionarioId, solicitudes],
  )

  const abrirSolicitud = () => {
    setFechaInicio('')
    setFechaFin('')
    setDiasEstimados(null)
    setCargandoDias(false)
    setIsModalOpen(true)
  }

  const actualizarFechaInicio = (valor: string) => {
    setFechaInicio(valor)
    setDiasEstimados(null)
    setCargandoDias(Boolean(valor && fechaFin && fechaFin >= valor))
  }

  const actualizarFechaFin = (valor: string) => {
    setFechaFin(valor)
    setDiasEstimados(null)
    setCargandoDias(Boolean(fechaInicio && valor && valor >= fechaInicio))
  }

  const enviarSolicitud = async () => {
    if (!fechaInicio || !fechaFin || (esRRHH && !funcionarioId)) {
      toast.error('Completa el funcionario y el rango de fechas', 'Datos incompletos')
      return
    }
    setEnviando(true)
    try {
      await ApiService.solicitarVacaciones({
        ...(esRRHH ? { funcionarioId } : {}),
        fechaInicio,
        fechaFin,
      })
      toast.success('Solicitud enviada a Recursos Humanos', 'Solicitud registrada')
      setIsModalOpen(false)
      await actualizarDatos()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo registrar la solicitud',
        'Error',
      )
    } finally {
      setEnviando(false)
    }
  }

  const nombreFuncionario =
    saldo?.funcionario ?? funcionarioSeleccionado?.nombreCompleto ?? 'Funcionario'
  const porcentaje = saldo ? progresoHaciaGestion(saldo) : 0

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <h1 className="page-title-ds">
            {esFuncionario ? 'Mis Vacaciones' : 'Gestión y Solicitudes de Vacación'}
          </h1>
          <p className="page-subtitle-ds">
            {esFuncionario
              ? 'Consulta tu elegibilidad, saldo y estado de tus solicitudes.'
              : 'Saldo calculado por gestión, días hábiles, feriados y solicitudes.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => void actualizarDatos()}
          >
            Actualizar
          </Button>
          {puedeSolicitar && (
            <Button
              variant="primary"
              leftIcon={<Plus size={18} />}
              onClick={abrirSolicitud}
              disabled={esRRHH && !funcionarioId}
            >
              Nueva Solicitud
            </Button>
          )}
        </div>
      </header>

      {puedeVerTodos && (
        <Card className="mb-4">
          <label className="form-label-ds" htmlFor="vacaciones-funcionario">
            Funcionario
          </label>
          <select
            id="vacaciones-funcionario"
            className="input-ds"
            value={funcionarioId}
            onChange={(event) => {
              setSolicitudes(null)
              setFuncionarioId(event.target.value)
            }}
          >
            <option value="">Selecciona un funcionario</option>
            {funcionarios.map((funcionario) => (
              <option key={funcionario.id} value={funcionario.id}>
                {funcionario.nombreCompleto}
              </option>
            ))}
          </select>
        </Card>
      )}

      {saldo && (
        <>
          <div className="stats-grid-ds">
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Saldo Disponible</span>
                <strong className="stat-value">{saldo.diasDisponibles} días</strong>
                <span className="stat-footnote">
                  {saldo.elegible ? 'Disponible para solicitud' : saldo.motivo}
                </span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Días Utilizados</span>
                <strong className="stat-value">{saldo.diasUsados} días</strong>
                <span className="stat-footnote">Solicitudes aprobadas</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Días Reservados</span>
                <strong className="stat-value">{saldo.diasReservados} días</strong>
                <span className="stat-footnote">Solicitudes pendientes</span>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Días Ganados</span>
                <strong className="stat-value">{saldo.diasGanados} días</strong>
                <span className="stat-footnote">{saldo.gestiones} gestiones cumplidas</span>
              </div>
            </Card>
          </div>
          <Card
            title={`Próxima gestión de ${nombreFuncionario}`}
            subtitle={`Fecha de aniversario: ${formatDate(saldo.fechaProximaGestion)}`}
            className="mb-4"
          >
            <div
              role="progressbar"
              aria-label="Progreso hacia la próxima gestión"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={porcentaje}
              style={{
                height: 10,
                overflow: 'hidden',
                borderRadius: 8,
                background: 'var(--border, #e5e7eb)',
              }}
            >
              <div
                style={{
                  width: `${porcentaje}%`,
                  height: '100%',
                  borderRadius: 8,
                  background: 'var(--primary, #2563eb)',
                  transition: 'width 200ms ease',
                }}
              />
            </div>
            <p className="form-helper-ds">{porcentaje}% del periodo cumplido</p>
          </Card>
        </>
      )}

      <Card
        title={esFuncionario ? 'Mis Solicitudes' : 'Historial de Solicitudes'}
        action={
          <span className="form-helper-ds">
            {saldo
              ? `${solicitudesVisibles.length} solicitudes de ${nombreFuncionario}`
              : `${solicitudes?.length ?? 0} solicitudes`}
          </span>
        }
      >
        {solicitudes === null ? (
          <p className="text-muted">Cargando solicitudes…</p>
        ) : solicitudesVisibles.length === 0 ? (
          <EmptyState
            title="Sin solicitudes"
            description="Todavía no hay solicitudes de vacaciones para mostrar."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {!esFuncionario && <TableHead>Funcionario</TableHead>}
                <TableHead>Fecha Solicitud</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>Días Hábiles</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitudesVisibles.map((solicitud) => (
                <TableRow key={solicitud.id}>
                  {!esFuncionario && (
                    <TableCell>
                      <strong>{solicitud.funcionarioNombre}</strong>
                    </TableCell>
                  )}
                  <TableCell>{formatDate(solicitud.createdAt.slice(0, 10))}</TableCell>
                  <TableCell>{formatDate(solicitud.fechaInicio)}</TableCell>
                  <TableCell>{formatDate(solicitud.fechaFin)}</TableCell>
                  <TableCell className="font-mono">{solicitud.diasHabiles} días</TableCell>
                  <TableCell>
                    <StatusBadge status={solicitud.estado} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Solicitar Periodo de Vacación"
        footer={
          <div className="modal-actions-right">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => void enviarSolicitud()}
              disabled={enviando || cargandoDias || diasEstimados === null || diasEstimados < 1}
            >
              {enviando ? 'Enviando…' : 'Enviar Solicitud'}
            </Button>
          </div>
        }
      >
        <form className="modal-form-ds" onSubmit={(event) => event.preventDefault()}>
          {esRRHH && (
            <div className="form-group-ds">
              <label className="form-label-ds" htmlFor="solicitud-funcionario">
                Funcionario
              </label>
              <select
                id="solicitud-funcionario"
                className="input-ds"
                value={funcionarioId}
                onChange={(event) => setFuncionarioId(event.target.value)}
                required
              >
                <option value="">Selecciona un funcionario</option>
                {funcionarios.map((funcionario) => (
                  <option key={funcionario.id} value={funcionario.id}>
                    {funcionario.nombreCompleto}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Input
            label="Fecha de Inicio"
            type="date"
            value={fechaInicio}
            min={fechaEnLaPaz(1)}
            onChange={(event) => actualizarFechaInicio(event.target.value)}
            required
          />
          <Input
            label="Fecha de Conclusión"
            type="date"
            value={fechaFin}
            min={fechaInicio || fechaEnLaPaz(1)}
            onChange={(event) => actualizarFechaFin(event.target.value)}
            required
          />
          <p className="form-helper-ds">
            {cargandoDias
              ? 'Calculando días hábiles…'
              : diasEstimados === null
                ? 'Elige un rango para calcular los días hábiles antes de enviar.'
                : `${diasEstimados} días hábiles descontados (excluye fines de semana y feriados).`}
          </p>
          {saldo && funcionarioId === saldo.funcionarioId && (
            <p className="form-helper-ds">Saldo disponible: {saldo.diasDisponibles} días.</p>
          )}
        </form>
      </Modal>
    </div>
  )
}
