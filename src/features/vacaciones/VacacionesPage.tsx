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

export function VacacionesPage() {
  const toast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const solicitudes = [
    {
      id: '1',
      funcionario: 'Daniela Mendoza Vargas',
      fechaInicio: '2026-12-20',
      fechaFin: '2026-12-24',
      diasSolicitados: 5,
      estado: 'PENDIENTE',
      fechaSolicitud: '2026-11-01',
    },
    {
      id: '2',
      funcionario: 'Carlos Mamani Flores',
      fechaInicio: '2026-07-10',
      fechaFin: '2026-07-21',
      diasSolicitados: 10,
      estado: 'APROBADA',
      fechaSolicitud: '2026-06-25',
    },
  ]

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Módulo de Vacaciones (ms-vacaciones)</p>
          <h1 className="page-title-ds">Gestión y Solicitudes de Vacación</h1>
          <p className="page-subtitle-ds">
            Cálculo de saldos de 15 días hábiles por gestión, feriados y aprobaciones.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={() => setIsModalOpen(true)}
        >
          Nueva Solicitud
        </Button>
      </header>

      <div className="stats-grid-ds">
        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Saldo Disponible</span>
            <strong className="stat-value">15 días</strong>
            <span className="stat-footnote">Días hábiles acumulables</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Días Utilizados</span>
            <strong className="stat-value">0 días</strong>
            <span className="stat-footnote">Gestión 2026</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Solicitudes Pendientes</span>
            <strong className="stat-value">1</strong>
            <span className="stat-footnote">Por revisar por RRHH</span>
          </div>
        </Card>
      </div>

      <Card title="Historial de Solicitudes">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionario</TableHead>
              <TableHead>Fecha Solicitud</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead>Hasta</TableHead>
              <TableHead>Días Hábiles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitudes.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <strong>{s.funcionario}</strong>
                </TableCell>
                <TableCell>{formatDate(s.fechaSolicitud)}</TableCell>
                <TableCell>{formatDate(s.fechaInicio)}</TableCell>
                <TableCell>{formatDate(s.fechaFin)}</TableCell>
                <TableCell className="font-mono">{s.diasSolicitados} días</TableCell>
                <TableCell>
                  <StatusBadge status={s.estado} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info(`Solicitud #${s.id}`, 'Detalle')}
                  >
                    Revisar
                  </Button>
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
