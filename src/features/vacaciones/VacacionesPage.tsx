import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Button,
  Card,
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
import { formatDate } from '../../utils/formatters'
import { useAuth } from '../auth/useAuth'

export function VacacionesPage() {
  const toast = useToast()
  const { usuario } = useAuth()
  const esFuncionario = usuario?.rol === 'FUNCIONARIO'
  const puedeGestionar = usuario?.rol === 'RRHH'
  const puedeSolicitar = usuario?.rol === 'FUNCIONARIO' || usuario?.rol === 'RRHH'
  const [isModalOpen, setIsModalOpen] = useState(false)

  const solicitudes = [
    {
      id: '1',
      funcionarioId: '11111111-1111-4111-8111-111111111103',
      funcionario: 'Daniela Mendoza Vargas',
      fechaInicio: '2026-12-20',
      fechaFin: '2026-12-24',
      diasSolicitados: 5,
      estado: 'PENDIENTE',
      fechaSolicitud: '2026-11-01',
    },
    {
      id: '2',
      funcionarioId: '11111111-1111-4111-8111-111111111101',
      funcionario: 'Carlos Mamani Flores',
      fechaInicio: '2026-07-10',
      fechaFin: '2026-07-21',
      diasSolicitados: 10,
      estado: 'APROBADA',
      fechaSolicitud: '2026-06-25',
    },
  ]

  const solicitudesVisibles = esFuncionario
    ? solicitudes.filter((s) => s.funcionarioId === usuario?.funcionarioId)
    : solicitudes
  const diasUsados = solicitudesVisibles
    .filter((s) => s.estado === 'APROBADA')
    .reduce((total, s) => total + s.diasSolicitados, 0)
  const diasReservados = solicitudesVisibles
    .filter((s) => s.estado === 'PENDIENTE')
    .reduce((total, s) => total + s.diasSolicitados, 0)
  const solicitudesPendientes = solicitudesVisibles.filter((s) => s.estado === 'PENDIENTE').length
  const saldoDisponible = Math.max(15 - diasUsados - diasReservados, 0)

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Módulo de Vacaciones (ms-vacaciones)</p>
          <h1 className="page-title-ds">
            {esFuncionario ? 'Mis Vacaciones' : 'Gestión y Solicitudes de Vacación'}
          </h1>
          <p className="page-subtitle-ds">
            {esFuncionario
              ? 'Consulta tu saldo y el estado de tus solicitudes.'
              : 'Cálculo de saldos de 15 días hábiles por gestión, feriados y aprobaciones.'}
          </p>
        </div>
        {puedeSolicitar && (
          <Button
            variant="primary"
            leftIcon={<Plus size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            Nueva Solicitud
          </Button>
        )}
      </header>

      <div className="stats-grid-ds">
        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">
              {esFuncionario ? 'Mi Saldo Disponible' : 'Saldo Disponible'}
            </span>
            <strong className="stat-value">
              {esFuncionario ? `${saldoDisponible} días` : '15 días'}
            </strong>
            <span className="stat-footnote">Días hábiles acumulables</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">
              {esFuncionario ? 'Mis Días Utilizados' : 'Días Utilizados'}
            </span>
            <strong className="stat-value">
              {esFuncionario ? `${diasUsados} días` : '0 días'}
            </strong>
            <span className="stat-footnote">Gestión 2026</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">
              {esFuncionario ? 'Mis Solicitudes Pendientes' : 'Solicitudes Pendientes'}
            </span>
            <strong className="stat-value">{esFuncionario ? solicitudesPendientes : 1}</strong>
            <span className="stat-footnote">
              {esFuncionario ? 'Esperando revisión de RRHH' : 'Por revisar por RRHH'}
            </span>
          </div>
        </Card>
      </div>

      <Card title={esFuncionario ? 'Mis Solicitudes' : 'Historial de Solicitudes'}>
        <Table>
          <TableHeader>
            <TableRow>
              {!esFuncionario && <TableHead>Funcionario</TableHead>}
              <TableHead>Fecha Solicitud</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead>Hasta</TableHead>
              <TableHead>Días Hábiles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitudesVisibles.map((s) => (
              <TableRow key={s.id}>
                {!esFuncionario && (
                  <TableCell>
                    <strong>{s.funcionario}</strong>
                  </TableCell>
                )}
                <TableCell>{formatDate(s.fechaSolicitud)}</TableCell>
                <TableCell>{formatDate(s.fechaInicio)}</TableCell>
                <TableCell>{formatDate(s.fechaFin)}</TableCell>
                <TableCell className="font-mono">{s.diasSolicitados} días</TableCell>
                <TableCell>
                  <StatusBadge status={s.estado} />
                </TableCell>
                <TableCell className="text-right">
                  {puedeGestionar ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.info(`Solicitud #${s.id}`, 'Detalle')}
                    >
                      Revisar
                    </Button>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
              onClick={() => {
                setIsModalOpen(false)
                toast.success('Solicitud enviada a Recursos Humanos', 'Solicitud registrada')
              }}
            >
              Enviar Solicitud
            </Button>
          </div>
        }
      >
        <form className="modal-form-ds" onSubmit={(e) => e.preventDefault()}>
          <Input label="Fecha de Inicio" type="date" required />
          <Input label="Fecha de Conclusión" type="date" required />
          <Input
            label="Motivo / Observaciones"
            placeholder="Vacaciones de fin de año..."
            helperText="Solo se descuentan días hábiles (excluye fines de semana y feriados)."
          />
        </form>
      </Modal>
    </div>
  )
}
