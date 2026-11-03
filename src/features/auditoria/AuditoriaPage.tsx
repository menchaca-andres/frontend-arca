import {
  Card,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components'
import { formatDateTime } from '../../utils/formatters'

export function AuditoriaPage() {
  const eventos = [
    {
      id: '1',
      accion: 'AUTH_LOGIN',
      usuario: 'admin@arca.bo',
      ip: '192.168.1.15',
      fecha: '2026-11-02T22:45:10Z',
      estado: 'SUCCESS',
      detalle: 'Inicio de sesión exitoso con rol ADMIN',
    },
    {
      id: '2',
      accion: 'PERSONAL_CREATE',
      usuario: 'rrhh@arca.bo',
      ip: '192.168.1.20',
      fecha: '2026-11-02T21:15:00Z',
      estado: 'SUCCESS',
      detalle: 'Registro de nuevo funcionario CI 9000003',
    },
    {
      id: '3',
      accion: 'AUTH_FAILED',
      usuario: 'desconocido@arca.bo',
      ip: '192.168.1.80',
      fecha: '2026-11-02T19:30:22Z',
      estado: 'FAILED',
      detalle: 'Credenciales inválidas (intento fallido 1 de 5)',
    },
  ]

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Auditoría del Sistema (Gateway · schema auditoria)</p>
          <h1 className="page-title-ds">Registro de Trazabilidad y Seguridad</h1>
          <p className="page-subtitle-ds">
            Eventos inmutables capturados por el API Gateway para auditoría de cumplimiento.
          </p>
        </div>
      </header>

      <Card title="Bitácora de Operaciones">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>IP Origen</TableHead>
              <TableHead>Detalle de Operación</TableHead>
              <TableHead>Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventos.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell className="font-mono text-xs">{formatDateTime(ev.fecha)}</TableCell>
                <TableCell className="font-mono font-bold">{ev.accion}</TableCell>
                <TableCell>{ev.usuario}</TableCell>
                <TableCell className="font-mono text-xs">{ev.ip}</TableCell>
                <TableCell>{ev.detalle}</TableCell>
                <TableCell>
                  <StatusBadge status={ev.estado === 'SUCCESS' ? 'RATIFICADO' : 'BAJA'} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
