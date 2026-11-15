import { AlertTriangle } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components'
import type { BoletaPlanillaItem } from '../../../types'
import { formatCurrency } from '../../../utils/formatters'

interface DetalleBoletaModalProps {
  isOpen: boolean
  onClose: () => void
  boleta: BoletaPlanillaItem | null
}

export function DetalleBoletaModal({ isOpen, onClose, boleta }: DetalleBoletaModalProps) {
  if (!boleta) return null

  const { datosFuncionario, diasTrabajados, totalGanado, totalDescuentos, liquidoPagable, tieneAlerta, detalles = [] } = boleta

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Desglose de Boleta — ${datosFuncionario?.nombres ?? ''} ${datosFuncionario?.apellidos ?? ''} (CA-05)`}
      size="xl"
      footer={
        <div className="modal-actions-right">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Alerta de líquido negativo (CA-06) */}
        {tieneAlerta && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#b91c1c',
            }}
          >
            <AlertTriangle size={22} className="flex-shrink-0" />
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                Líquido Pagable Negativo ({formatCurrency(liquidoPagable)}) — Bloqueo de Emisión (CA-06)
              </strong>
              <span style={{ fontSize: '0.85rem' }}>
                Los descuentos aplicados superan el total ganado del funcionario. La boleta se encuentra en observación y el sistema impedirá su emisión definitiva hasta que RRHH ajuste las novedades del período.
              </span>
            </div>
          </div>
        )}

        {/* Ficha rápida del funcionario y prorrateo (CA-03) */}
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <span className="stat-label">Funcionario</span>
              <strong className="block text-slate-800">
                {datosFuncionario?.nombres} {datosFuncionario?.apellidos}
              </strong>
              <span className="text-xs text-slate-500">CI: {datosFuncionario?.documentoIdentidad}</span>
            </div>

            <div>
              <span className="stat-label">Cargo y Área</span>
              <strong className="block text-slate-800">{datosFuncionario?.cargo || 'Sin cargo'}</strong>
              <span className="text-xs text-slate-500">{datosFuncionario?.area || 'Sin área'}</span>
            </div>

            <div>
              <span className="stat-label">Sueldo Contratado</span>
              <strong className="block font-mono text-slate-800">
                {formatCurrency(datosFuncionario?.remuneracion ?? 0)}
              </strong>
              <span className="text-xs text-slate-500">Base mensual (30 días)</span>
            </div>

            <div>
              <span className="stat-label">Días Trabajados (CA-03)</span>
              <strong className="block font-mono text-teal">
                {diasTrabajados} / 30 días
              </strong>
              <span className="text-xs text-slate-500">
                {diasTrabajados === 30 ? 'Mes completo' : 'Prorrateado por fecha'}
              </span>
            </div>
          </div>
        </Card>

        {/* Detalle línea por línea (CA-04, CA-05) */}
        <Card title="Conceptos Computados Línea por Línea">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Base Imponible</TableHead>
                <TableHead>% / Factor</TableHead>
                <TableHead className="text-right">Monto (Bs.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalles.map((d) => (
                <TableRow key={d.id || `${d.conceptoId}-${d.orden}`}>
                  <TableCell className="font-mono text-slate-500 text-center font-bold">{d.orden}</TableCell>
                  <TableCell>
                    <strong className="font-mono">{d.conceptoCodigo}</strong>
                    <span className="block text-xs text-slate-500">{d.conceptoNombre}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.tipo === 'HABER' ? 'success' : 'danger'}>
                      {d.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-slate-600">
                    {d.baseMonto !== null && d.baseMonto !== undefined ? formatCurrency(d.baseMonto) : '—'}
                  </TableCell>
                  <TableCell className="font-mono text-slate-600">
                    {d.porcentaje !== null && d.porcentaje !== undefined ? `${d.porcentaje}%` : '—'}
                  </TableCell>
                  <TableCell className={`text-right font-mono font-bold ${d.tipo === 'HABER' ? 'text-teal' : 'text-danger'}`}>
                    {d.tipo === 'DESCUENTO' ? `- ${formatCurrency(d.monto)}` : formatCurrency(d.monto)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totales consolidados de la boleta */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '2rem',
              padding: '1rem',
              borderTop: '1px solid #e2e8f0',
              marginTop: '0.5rem',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
            }}
          >
            <div>
              <span className="stat-label">Total Ganado</span>
              <strong className="block font-mono text-teal text-base">
                {formatCurrency(totalGanado)}
              </strong>
            </div>
            <div>
              <span className="stat-label">Total Descuentos</span>
              <strong className="block font-mono text-danger text-base">
                - {formatCurrency(totalDescuentos)}
              </strong>
            </div>
            <div>
              <span className="stat-label">Líquido Pagable</span>
              <strong className={`block font-mono text-lg ${tieneAlerta ? 'text-danger font-black' : 'text-teal'}`}>
                {formatCurrency(liquidoPagable)}
              </strong>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  )
}
