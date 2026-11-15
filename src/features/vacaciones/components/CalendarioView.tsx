import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Flag, RefreshCw } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '../../../components'
import { ApiService } from '../../../services/api'
import type { CalendarioVacaciones, SolicitudKardexItem } from '../../../types'
import { formatDate } from '../../../utils/formatters'

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function mesActualIso(): string {
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  return `${anio}-${mes}`
}

export function CalendarioView() {
  const toast = useToast()
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(mesActualIso())
  const [datos, setDatos] = useState<CalendarioVacaciones | null>(null)
  const [cargando, setCargando] = useState(false)

  const cargarCalendario = useCallback(async (mesAUsar: string) => {
    setCargando(true)
    try {
      const res = await ApiService.getCalendarioVacaciones(mesAUsar)
      setDatos(res)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo cargar el calendario mensual',
        'Error',
      )
      setDatos(null)
    } finally {
      setCargando(false)
    }
  }, [toast])

  useEffect(() => {
    void cargarCalendario(mesSeleccionado)
  }, [cargarCalendario, mesSeleccionado])

  const cambiarMes = (delta: number) => {
    const [anioStr, mesStr] = mesSeleccionado.split('-')
    const anio = Number(anioStr)
    const mes = Number(mesStr) - 1
    const nuevaFecha = new Date(Date.UTC(anio, mes + delta, 1))
    const nuevoAnio = nuevaFecha.getUTCFullYear()
    const nuevoMes = String(nuevaFecha.getUTCMonth() + 1).padStart(2, '0')
    setMesSeleccionado(`${nuevoAnio}-${nuevoMes}`)
  }

  const [anioActual, mesActualNum] = useMemo(() => {
    const [a, m] = mesSeleccionado.split('-')
    return [Number(a), Number(m)]
  }, [mesSeleccionado])

  const nombreMes = MESES[mesActualNum - 1] ?? 'Mes'

  // Construcción de la cuadrícula mensual (Lunes a Domingo)
  const diasCuadricula = useMemo(() => {
    const primerDiaDelMes = new Date(Date.UTC(anioActual, mesActualNum - 1, 1))
    // getUTCDay() devuelve 0 para domingo, 1 para lunes... convertimos a lunes=0, domingo=6
    const diaSemanaInicio = (primerDiaDelMes.getUTCDay() + 6) % 7
    const totalDiasEnMes = new Date(Date.UTC(anioActual, mesActualNum, 0)).getUTCDate()

    const celdas: Array<{
      dia: number | null
      fechaIso: string | null
      feriado?: string
      solicitudes: SolicitudKardexItem[]
    }> = []

    // Celdas vacías previas al día 1
    for (let i = 0; i < diaSemanaInicio; i += 1) {
      celdas.push({ dia: null, fechaIso: null, solicitudes: [] })
    }

    // Celdas de los días del mes
    for (let dia = 1; dia <= totalDiasEnMes; dia += 1) {
      const diaStr = String(dia).padStart(2, '0')
      const mesStr = String(mesActualNum).padStart(2, '0')
      const fechaIso = `${anioActual}-${mesStr}-${diaStr}`

      const feriadoMatch = datos?.feriados.find((f) => f.fecha === fechaIso)
      const solicitudesActivas = (datos?.solicitudes ?? []).filter(
        (s) => s.fechaInicio <= fechaIso && s.fechaFin >= fechaIso,
      )

      celdas.push({
        dia,
        fechaIso,
        feriado: feriadoMatch?.descripcion,
        solicitudes: solicitudesActivas,
      })
    }

    return celdas
  }, [anioActual, mesActualNum, datos])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Cabecera y Navegación de Mes estilo Apple */}
      <Card>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarIcon size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 className="page-title-ds" style={{ fontSize: '1.25rem', margin: 0 }}>
                {nombreMes} {anioActual}
              </h2>
              <p className="form-helper-ds" style={{ margin: 0 }}>
                Calendario corporativo de vacaciones aprobadas (HU-16 CA-04)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ChevronLeft size={16} />}
              onClick={() => cambiarMes(-1)}
              disabled={cargando}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMesSeleccionado(mesActualIso())}
              disabled={cargando || mesSeleccionado === mesActualIso()}
            >
              Mes Actual
            </Button>
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ChevronRight size={16} />}
              onClick={() => cambiarMes(1)}
              disabled={cargando}
            >
              Siguiente
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => void cargarCalendario(mesSeleccionado)}
              disabled={cargando}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Resumen de métricas del mes */}
        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)',
            fontSize: '0.875rem',
          }}
        >
          <div>
            <strong style={{ color: 'var(--text-muted)' }}>Vacaciones Aprobadas: </strong>
            <span className="font-mono">{datos?.totalAprobadas ?? 0}</span>
          </div>
          <div>
            <strong style={{ color: 'var(--text-muted)' }}>Feriados Nacionales: </strong>
            <span className="font-mono">{datos?.feriados.length ?? 0}</span>
          </div>
        </div>
      </Card>

      {/* Cuadrícula del Calendario */}
      <Card>
        {cargando && !datos ? (
          <p className="text-muted">Cargando eventos del mes…</p>
        ) : (
          <div>
            {/* Cabecera de días de la semana */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              {DIAS_SEMANA.map((dia) => (
                <div key={dia} style={{ padding: '4px 0' }}>
                  {dia}
                </div>
              ))}
            </div>

            {/* Celdas del calendario */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
              }}
            >
              {diasCuadricula.map((celda, idx) => {
                if (!celda.dia) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      style={{
                        minHeight: 80,
                        background: 'transparent',
                        borderRadius: 6,
                        opacity: 0.2,
                      }}
                    />
                  )
                }

                const esFeriado = Boolean(celda.feriado)
                const tieneVacaciones = celda.solicitudes.length > 0

                return (
                  <div
                    key={`dia-${celda.dia}`}
                    style={{
                      minHeight: 90,
                      padding: '6px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: esFeriado
                        ? 'rgba(239, 68, 68, 0.05)'
                        : tieneVacaciones
                          ? 'rgba(37, 99, 235, 0.04)'
                          : 'var(--bg-card, #ffffff)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      transition: 'background 150ms ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: esFeriado ? 'var(--danger)' : 'var(--text)',
                        }}
                      >
                        {celda.dia}
                      </span>
                      {esFeriado && (
                        <span title={celda.feriado} style={{ display: 'inline-flex' }}>
                          <Flag size={12} style={{ color: 'var(--danger)' }} />
                        </span>
                      )}
                    </div>

                    {esFeriado && (
                      <div
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--danger)',
                          lineHeight: 1.1,
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={celda.feriado}
                      >
                        {celda.feriado}
                      </div>
                    )}

                    {celda.solicitudes.map((sol) => (
                      <div
                        key={sol.id}
                        style={{
                          padding: '2px 5px',
                          borderRadius: 4,
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          background: 'var(--primary, #2563eb)',
                          color: '#ffffff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'default',
                        }}
                        title={`${sol.funcionarioNombre}: ${formatDate(sol.fechaInicio)} al ${formatDate(sol.fechaFin)} (${sol.diasHabiles} días)`}
                      >
                        {sol.funcionarioNombre.split(' ')[0]} ({sol.diasHabiles}d)
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Tabla detallada de vacaciones aprobadas en el mes */}
      <Card
        title={`Detalle de Vacaciones Aprobadas — ${nombreMes} ${anioActual}`}
        action={
          <span className="form-helper-ds">
            {datos?.solicitudes.length ?? 0} solicitudes aprobadas
          </span>
        }
      >
        {!datos || datos.solicitudes.length === 0 ? (
          <EmptyState
            title="Sin vacaciones aprobadas en este mes"
            description="Ningún funcionario tiene vacaciones vigentes o aprobadas durante este período mensual."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionario</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>Días Hábiles</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Aprobado Por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datos.solicitudes.map((sol) => (
                <TableRow key={sol.id}>
                  <TableCell>
                    <strong>{sol.funcionarioNombre}</strong>
                  </TableCell>
                  <TableCell>{formatDate(sol.fechaInicio)}</TableCell>
                  <TableCell>{formatDate(sol.fechaFin)}</TableCell>
                  <TableCell className="font-mono">{sol.diasHabiles} días</TableCell>
                  <TableCell>
                    <Badge variant="success">APROBADA</Badge>
                  </TableCell>
                  <TableCell>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {sol.fechaResolucion ? formatDate(sol.fechaResolucion) : '—'}
                      {sol.resueltoPor && (
                        <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                          ID: {sol.resueltoPor.slice(0, 8)}…
                        </div>
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
  )
}
