import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  EmptyState,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '../../../components'
import { ApiService } from '../../../services/api'
import type { SolicitudPendiente } from '../../../types'
import { formatDate } from '../../../utils/formatters'

const MOTIVO_MIN = 5
const MOTIVO_MAX = 300

interface BandejaSolicitudesCardProps {
  /** Cambia cuando la página padre recarga datos, para refrescar la bandeja. */
  refreshToken: number
  /** Funcionario asociado a la cuenta actual (si existe): no puede resolver su propia solicitud. */
  funcionarioIdActual: string | null | undefined
  /** Se invoca tras aprobar o rechazar, para que la página refresque saldos e historial. */
  onResolved: () => void
}

export function BandejaSolicitudesCard({
  refreshToken,
  funcionarioIdActual,
  onResolved,
}: BandejaSolicitudesCardProps) {
  const toast = useToast()
  const [pendientes, setPendientes] = useState<SolicitudPendiente[] | null>(null)
  const [recarga, setRecarga] = useState(0)
  const [procesandoId, setProcesandoId] = useState<string | null>(null)
  const [aRechazar, setARechazar] = useState<SolicitudPendiente | null>(null)
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    let vigente = true
    void ApiService.getSolicitudesPendientes()
      .then((lista) => {
        if (vigente) setPendientes(lista)
      })
      .catch((error: unknown) => {
        if (vigente) {
          setPendientes([])
          toast.error(
            error instanceof Error ? error.message : 'No se pudo cargar la bandeja',
            'Error',
          )
        }
      })
    return () => {
      vigente = false
    }
  }, [refreshToken, recarga, toast])

  const terminar = useCallback(() => {
    setRecarga((valor) => valor + 1)
    onResolved()
  }, [onResolved])

  const aprobar = async (solicitud: SolicitudPendiente) => {
    setProcesandoId(solicitud.id)
    try {
      await ApiService.aprobarSolicitudVacacion(solicitud.id)
      toast.success(`Solicitud de ${solicitud.funcionarioNombre} aprobada`, 'Solicitud aprobada')
      terminar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo aprobar la solicitud', 'Error')
      // La solicitud pudo cambiar (baja, saldo, otra resolución): se actualiza la bandeja.
      setRecarga((valor) => valor + 1)
    } finally {
      setProcesandoId(null)
    }
  }

  const cerrarRechazo = () => {
    setARechazar(null)
    setMotivo('')
  }

  const motivoLimpio = motivo.trim()
  const motivoValido = motivoLimpio.length >= MOTIVO_MIN && motivoLimpio.length <= MOTIVO_MAX

  const confirmarRechazo = async () => {
    if (!aRechazar || !motivoValido) return
    setProcesandoId(aRechazar.id)
    try {
      await ApiService.rechazarSolicitudVacacion(aRechazar.id, motivoLimpio)
      toast.success(`Solicitud de ${aRechazar.funcionarioNombre} rechazada`, 'Solicitud rechazada')
      cerrarRechazo()
      terminar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo rechazar la solicitud', 'Error')
      setRecarga((valor) => valor + 1)
    } finally {
      setProcesandoId(null)
    }
  }

  return (
    <>
      <Card
        title="Bandeja de solicitudes pendientes"
        subtitle="Ordenadas de la más antigua a la más nueva"
        className="mb-4"
        action={
          <span className="form-helper-ds">
            {pendientes ? `${pendientes.length} pendiente(s)` : 'Cargando…'}
          </span>
        }
      >
        {pendientes === null ? (
          <p className="text-muted">Cargando bandeja…</p>
        ) : pendientes.length === 0 ? (
          <EmptyState
            title="Sin solicitudes pendientes"
            description="No hay solicitudes de vacaciones esperando resolución."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionario</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Días hábiles</TableHead>
                <TableHead>Saldo actual</TableHead>
                <TableHead>Solicitada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendientes.map((solicitud) => {
                const esPropia = Boolean(
                  funcionarioIdActual && funcionarioIdActual === solicitud.funcionarioId,
                )
                const ocupada = procesandoId === solicitud.id
                return (
                  <TableRow key={solicitud.id}>
                    <TableCell>
                      <strong>{solicitud.funcionarioNombre}</strong>
                    </TableCell>
                    <TableCell>
                      {formatDate(solicitud.fechaInicio)} – {formatDate(solicitud.fechaFin)}
                    </TableCell>
                    <TableCell className="font-mono">{solicitud.diasHabiles} días</TableCell>
                    <TableCell>
                      {solicitud.saldo ? (
                        <>
                          <strong>{solicitud.saldo.diasDisponibles} disp.</strong>
                          <div className="text-xs text-muted">
                            {solicitud.saldo.diasGanados} ganados · {solicitud.saldo.diasUsados} usados ·{' '}
                            {solicitud.saldo.diasReservados} reservados
                          </div>
                        </>
                      ) : (
                        <span className="text-muted">No disponible</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(solicitud.createdAt.slice(0, 10))}</TableCell>
                    <TableCell className="text-right">
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => void aprobar(solicitud)}
                          disabled={esPropia || procesandoId !== null}
                          isLoading={ocupada}
                          title={esPropia ? 'No puedes resolver tu propia solicitud' : undefined}
                        >
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-danger"
                          onClick={() => setARechazar(solicitud)}
                          disabled={esPropia || procesandoId !== null}
                          title={esPropia ? 'No puedes resolver tu propia solicitud' : undefined}
                        >
                          Rechazar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={aRechazar !== null}
        onClose={cerrarRechazo}
        title="Rechazar solicitud de vacaciones"
        size="sm"
        footer={
          <div className="modal-actions-right">
            <Button variant="outline" onClick={cerrarRechazo} disabled={procesandoId !== null}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => void confirmarRechazo()}
              disabled={!motivoValido || procesandoId !== null}
              isLoading={procesandoId !== null}
            >
              Rechazar solicitud
            </Button>
          </div>
        }
      >
        {aRechazar && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void confirmarRechazo()
            }}
          >
            <p className="form-helper-ds" style={{ marginBottom: '0.75rem' }}>
              {aRechazar.funcionarioNombre} · {formatDate(aRechazar.fechaInicio)} –{' '}
              {formatDate(aRechazar.fechaFin)} ({aRechazar.diasHabiles} días hábiles)
            </p>
            <div className="form-group-ds">
              <label className="form-label-ds" htmlFor="motivo-rechazo">
                Motivo del rechazo *
              </label>
              <textarea
                id="motivo-rechazo"
                className="input-ds"
                rows={4}
                maxLength={MOTIVO_MAX}
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                placeholder="Explica brevemente por qué se rechaza la solicitud"
                autoFocus
              />
              <span className="form-helper-ds">
                {motivoLimpio.length}/{MOTIVO_MAX} · mínimo {MOTIVO_MIN} caracteres. Los días reservados
                volverán al saldo del funcionario.
              </span>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}

