import { AlertTriangle, Download, ExternalLink, ShieldCheck } from 'lucide-react'
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
  onVerVersionVigente?: (id: string) => void
  onDescargarPdf?: (boleta: BoletaPlanillaItem) => void
}

export function DetalleBoletaModal({
  isOpen,
  onClose,
  boleta,
  onVerVersionVigente,
  onDescargarPdf,
}: DetalleBoletaModalProps) {
  if (!boleta) return null

  const {
    datosFuncionario,
    diasTrabajados,
    totalGanado,
    totalDescuentos,
    liquidoPagable,
    tieneAlerta,
    detalles = [],
    numero,
    version = 1,
    estado,
    hashSha256,
    motivoRectificacion,
    versionVigente,
    historialVersiones,
  } = boleta

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Boleta ${numero ? `${numero} (v${version})` : 'Borrador'} — ${datosFuncionario?.nombres ?? ''} ${datosFuncionario?.apellidos ?? ''}`}
      size="xl"
      footer={
        <div className="modal-actions-right" style={{ display: 'flex', gap: '0.5rem' }}>
          {estado === 'EMITIDA' && onDescargarPdf && (
            <Button
              variant="outline"
              leftIcon={<Download size={14} />}
              onClick={() => onDescargarPdf(boleta)}
            >
              Descargar PDF
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Banner de Enlace a Versión Vigente (HU-23 CA-03) */}
        {estado === 'RECTIFICADA' && versionVigente && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              color: '#1e40af',
              fontSize: '0.875rem',
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                Boleta Rectificada — Reemplazada por Versión {versionVigente.version} (CA-03)
              </strong>
              <span>
                Esta boleta es un comprobante histórico. La versión formal vigente es la{' '}
                <strong>{versionVigente.numero ?? `v${versionVigente.version}`}</strong> con líquido pagable de {formatCurrency(versionVigente.liquidoPagable)}.
              </span>
            </div>
            {onVerVersionVigente && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink size={13} />}
                onClick={() => onVerVersionVigente(versionVigente.id)}
              >
                Ver Vigente
              </Button>
            )}
          </div>
        )}

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

        {/* Trazabilidad de Rectificación (HU-22 CA-05) */}
        {version > 1 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '8px',
              color: '#9f1239',
              fontSize: '0.875rem',
            }}
          >
            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
              Boleta Rectificatoria — Versión {version} (CA-05)
            </strong>
            <span>
              Esta boleta sustituye formalmente a la versión anterior. Motivo registrado:{' '}
              <em>"{motivoRectificacion ?? 'Rectificación formal autorizada'}"</em>.
            </span>
          </div>
        )}

        {/* Ficha rápida del funcionario y correlativo (CA-03) */}
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
              <span className="stat-label">Correlativo Oficial</span>
              <strong className="block font-mono text-slate-800">{numero ?? 'Sin emitir'}</strong>
              <span className="text-xs text-slate-500">
                Estado: <Badge variant={estado === 'EMITIDA' ? 'success' : estado === 'RECTIFICADA' ? 'neutral' : 'warning'}>{estado}</Badge>
              </span>
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

          {/* Huella Criptográfica SHA-256 (CA-03, CA-04) */}
          {hashSha256 && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <ShieldCheck size={20} className="text-teal flex-shrink-0" />
              <div style={{ overflow: 'hidden' }}>
                <span className="stat-label" style={{ marginBottom: 0 }}>
                  Huella Criptográfica Inmutable (SHA-256)
                </span>
                <span className="font-mono text-xs text-slate-700 block truncate" title={hashSha256}>
                  {hashSha256}
                </span>
              </div>
            </div>
          )}
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

        {/* Historial de Versiones (HU-23 CA-03) */}
        {historialVersiones && historialVersiones.length > 1 && (
          <Card title="Historial de Versiones de la Boleta (CA-03)">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Versión</TableHead>
                  <TableHead>N° Boleta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Motivo de Rectificación</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialVersiones.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-bold">v{h.version}</TableCell>
                    <TableCell className="font-mono font-bold text-slate-800">{h.numero ?? 'S/N'}</TableCell>
                    <TableCell>
                      <Badge variant={h.estado === 'EMITIDA' ? 'success' : h.estado === 'RECTIFICADA' ? 'neutral' : 'warning'}>
                        {h.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {h.motivoRectificacion ?? (h.version === 1 ? 'Emisión inicial' : '—')}
                    </TableCell>
                    <TableCell className="text-right">
                      {h.id !== boleta.id && onVerVersionVigente ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVerVersionVigente(h.id)}
                        >
                          Ver Boleta
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Viendo actual</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </Modal>
  )
}
