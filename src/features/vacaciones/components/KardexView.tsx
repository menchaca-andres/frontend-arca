import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Clock, Filter, RefreshCw, XCircle } from 'lucide-react'
import {
  Badge,
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
  useToast,
} from '../../../components'
import { ApiService } from '../../../services/api'
import type { FuncionarioResumen, KardexVacaciones } from '../../../types'
import { formatDate } from '../../../utils/formatters'

interface KardexViewProps {
  funcionarioId: string
  esRRHH: boolean
  funcionarios: FuncionarioResumen[]
  onCambiarFuncionario?: (id: string) => void
}

export function KardexView({
  funcionarioId,
  esRRHH,
  funcionarios,
  onCambiarFuncionario,
}: KardexViewProps) {
  const toast = useToast()
  const [kardex, setKardex] = useState<KardexVacaciones | null>(null)
  const [cargando, setCargando] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroAnio, setFiltroAnio] = useState<string>('')

  const cargarKardex = useCallback(async () => {
    if (!funcionarioId) {
      setKardex(null)
      return
    }
    setCargando(true)
    try {
      const datos = await ApiService.getHistorialVacaciones(funcionarioId, {
        estado: filtroEstado || undefined,
        anio: filtroAnio ? Number(filtroAnio) : undefined,
      })
      setKardex(datos)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo cargar el kardex de vacaciones',
        'Error',
      )
      setKardex(null)
    } finally {
      setCargando(false)
    }
  }, [funcionarioId, filtroEstado, filtroAnio, toast])

  useEffect(() => {
    void cargarKardex()
  }, [cargarKardex])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Selector de funcionario (para RRHH / Dirección) */}
      {esRRHH && (
        <Card className="mb-2">
          <label className="form-label-ds" htmlFor="kardex-funcionario-select">
            Funcionario a Consultar
          </label>
          <select
            id="kardex-funcionario-select"
            className="input-ds"
            value={funcionarioId}
            onChange={(e) => onCambiarFuncionario?.(e.target.value)}
          >
            <option value="">Selecciona un funcionario…</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombreCompleto}
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* Barra de Filtros (CA-02) */}
      <Card
        title="Filtros del Historial"
        action={
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => void cargarKardex()}
            disabled={cargando || !funcionarioId}
          >
            Refrescar
          </Button>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <label className="form-label-ds" htmlFor="kardex-filtro-estado">
              <Filter size={14} style={{ display: 'inline', marginRight: 4 }} />
              Estado de Solicitud
            </label>
            <select
              id="kardex-filtro-estado"
              className="input-ds"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="APROBADA">Aprobadas</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="RECHAZADA">Rechazadas</option>
            </select>
          </div>

          <div>
            <label className="form-label-ds" htmlFor="kardex-filtro-anio">
              Filtrar por Año
            </label>
            <select
              id="kardex-filtro-anio"
              className="input-ds"
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(e.target.value)}
            >
              <option value="">Todos los años</option>
              <option value="2027">2027</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <div>
            {(filtroEstado || filtroAnio) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFiltroEstado('')
                  setFiltroAnio('')
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {!funcionarioId ? (
        <EmptyState
          title="Selecciona un funcionario"
          description="Elige a un empleado del listado para consultar su kardex completo por gestión."
        />
      ) : cargando && !kardex ? (
        <Card>
          <p className="text-muted">Cargando kardex de vacaciones…</p>
        </Card>
      ) : !kardex ? (
        <EmptyState
          title="Sin datos de kardex"
          description="No se pudo obtener información del funcionario seleccionado."
        />
      ) : (
        <>
          {/* Tarjetas KPI de Resumen Global (CA-01) */}
          <div className="stats-grid-ds">
            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Saldo Disponible Total</span>
                <strong className="stat-value">{kardex.diasDisponiblesTotal} días</strong>
                <span className="stat-footnote">Disponibles para solicitar</span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Días Ganados Total</span>
                <strong className="stat-value">{kardex.diasGanadosTotal} días</strong>
                <span className="stat-footnote">
                  {kardex.gestionesCumplidas} gestión(es) cumplida(s)
                </span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Días Utilizados</span>
                <strong className="stat-value">{kardex.diasUsadosTotal} días</strong>
                <span className="stat-footnote">En solicitudes aprobadas</span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Días Reservados</span>
                <strong className="stat-value">{kardex.diasReservadosTotal} días</strong>
                <span className="stat-footnote">En solicitudes pendientes</span>
              </div>
            </Card>
          </div>

          {/* Listado de Gestiones (CA-01) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 className="section-title-ds" style={{ margin: '0.5rem 0' }}>
              Kardex por Gestión Laboral — {kardex.funcionarioNombre}
            </h2>

            {kardex.gestiones.length === 0 ? (
              <EmptyState
                title="Sin gestiones para los filtros seleccionados"
                description="Intenta cambiar los filtros de año o estado."
              />
            ) : (
              kardex.gestiones.map((gestion) => (
                <Card
                  key={gestion.numero}
                  title={`Gestión ${gestion.numero}: ${formatDate(gestion.periodoInicio)} — ${formatDate(gestion.periodoFin)}`}
                  subtitle={
                    gestion.cumplida
                      ? `Gestión cumplida (+${gestion.diasGanados} días ganados de ley)`
                      : 'Período en curso / próxima gestión'
                  }
                  action={
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Badge variant={gestion.cumplida ? 'success' : 'neutral'}>
                        {gestion.cumplida ? 'Cumplida' : 'En Curso'}
                      </Badge>
                      <span className="form-helper-ds" style={{ fontWeight: 600 }}>
                        {gestion.diasDisponibles} días disponibles
                      </span>
                    </div>
                  }
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '1.5rem',
                      padding: '0.75rem',
                      background: 'var(--glass-bg-subtle)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '1rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-secondary)' }}>Ganados: </strong>
                      <span className="font-mono">{gestion.diasGanados} días</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-secondary)' }}>Utilizados: </strong>
                      <span className="font-mono">{gestion.diasUsados} días</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-secondary)' }}>Reservados: </strong>
                      <span className="font-mono">{gestion.diasReservados} días</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-secondary)' }}>Saldo en gestión: </strong>
                      <strong className="font-mono" style={{ color: 'var(--arca-teal-accent)' }}>
                        {gestion.diasDisponibles} días
                      </strong>
                    </div>
                  </div>

                  {/* Tabla de solicitudes de la gestión */}
                  {gestion.solicitudes.length === 0 ? (
                    <p className="form-helper-ds" style={{ margin: '0.5rem 0' }}>
                      No se registraron solicitudes en esta gestión con los filtros actuales.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha Solicitud</TableHead>
                          <TableHead>Desde</TableHead>
                          <TableHead>Hasta</TableHead>
                          <TableHead>Días Hábiles</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Resolución y Auditoría</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gestion.solicitudes.map((sol) => (
                          <TableRow key={sol.id}>
                            <TableCell>{formatDate(sol.createdAt.slice(0, 10))}</TableCell>
                            <TableCell>{formatDate(sol.fechaInicio)}</TableCell>
                            <TableCell>{formatDate(sol.fechaFin)}</TableCell>
                            <TableCell className="font-mono">{sol.diasHabiles} días</TableCell>
                            <TableCell>
                              <StatusBadge status={sol.estado} />
                            </TableCell>
                            <TableCell>
                              {sol.estado === 'APROBADA' ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle2 size={13} style={{ color: 'var(--arca-success)' }} />
                                    <span>
                                      Aprobada {sol.fechaResolucion ? formatDate(sol.fechaResolucion) : ''}
                                    </span>
                                  </div>
                                  {sol.resueltoPor && (
                                    <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                                      Resolutor: {sol.resueltoPor.slice(0, 8)}…
                                    </span>
                                  )}
                                </div>
                              ) : sol.estado === 'RECHAZADA' ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--arca-danger)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <XCircle size={13} />
                                    <span>
                                      Rechazada {sol.fechaResolucion ? formatDate(sol.fechaResolucion) : ''}
                                    </span>
                                  </div>
                                  {sol.motivoRechazo && (
                                    <div
                                      style={{
                                        marginTop: 2,
                                        fontSize: '0.75rem',
                                        color: 'var(--text-primary)',
                                      }}
                                    >
                                      <strong>Motivo:</strong> {sol.motivoRechazo}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: '0.8rem',
                                    color: 'var(--arca-warning)',
                                  }}
                                >
                                  <Clock size={13} />
                                  <span>En espera de RRHH</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
