import { useState } from 'react'
import { Calculator, Download } from 'lucide-react'
import {
  Button,
  Card,
  Modal,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '../../components'
import { formatCurrency } from '../../utils/formatters'

export function BoletasPage() {
  const toast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const boletas = [
    {
      id: '1',
      numero: 'BOL-2026-10-001',
      periodo: 'Octubre 2026',
      funcionario: 'Carlos Mamani Flores',
      haberBasico: 8500,
      totalDescuentos: 1080.35,
      liquidoPagable: 7419.65,
      fechaEmision: '2026-10-31',
      estado: 'EMITIDA',
    },
    {
      id: '2',
      numero: 'BOL-2026-10-002',
      periodo: 'Octubre 2026',
      funcionario: 'Daniela Mendoza Vargas',
      haberBasico: 7200,
      totalDescuentos: 915.12,
      liquidoPagable: 6284.88,
      fechaEmision: '2026-10-31',
      estado: 'EMITIDA',
    },
  ]

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Módulo de Boletas y Planillas (ms-boletas)</p>
          <h1 className="page-title-ds">Emisión de Boletas de Pago</h1>
          <p className="page-subtitle-ds">
            Liquidación mensual en Bolivianos (Bs), boletas inmutables y descarga en PDF.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Calculator size={18} />}
          onClick={() => setIsModalOpen(true)}
        >
          Calcular Planilla del Periodo
        </Button>
      </header>

      <div className="stats-grid-ds">
        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Planilla Octubre</span>
            <strong className="stat-value">{formatCurrency(13704.53)}</strong>
            <span className="stat-footnote">Líquido pagable consolidado</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Descuentos de Ley</span>
            <strong className="stat-value">{formatCurrency(1995.47)}</strong>
            <span className="stat-footnote">Aportes a la seguridad social</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Boletas Emitidas</span>
            <strong className="stat-value">2 boletas</strong>
            <span className="stat-footnote">Inmutabilidad garantizada</span>
          </div>
        </Card>
      </div>

      <Card title="Boletas Emitidas en el Periodo">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Boleta</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Funcionario</TableHead>
              <TableHead>Haber Básico</TableHead>
              <TableHead>Descuentos</TableHead>
              <TableHead>Líquido Pagable (Bs)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Descarga</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boletas.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono">{b.numero}</TableCell>
                <TableCell>{b.periodo}</TableCell>
                <TableCell>
                  <strong>{b.funcionario}</strong>
                </TableCell>
                <TableCell className="font-mono">{formatCurrency(b.haberBasico)}</TableCell>
                <TableCell className="font-mono text-danger">
                  - {formatCurrency(b.totalDescuentos)}
                </TableCell>
                <TableCell className="font-mono font-bold text-teal">
                  {formatCurrency(b.liquidoPagable)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={b.estado} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download size={14} />}
                    onClick={() =>
                      toast.success(`Descargando boleta inmutable ${b.numero}.pdf`, 'Descarga')
                    }
                  >
                    PDF
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
        title="Liquidación y Cálculo de Planilla"
        footer={
          <div className="modal-actions-right">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false)
                toast.success('Planilla procesada con fórmulas de ley boliviana', 'Cálculo exitoso')
              }}
            >
              Emitir Boletas Inmutables
            </Button>
          </div>
        }
      >
        <form className="modal-form-ds" onSubmit={(e) => e.preventDefault()}>
          <Select
            label="Periodo a Liquidar"
            options={[
              { value: '2026-11', label: 'Noviembre 2026 (En curso)' },
              { value: '2026-10', label: 'Octubre 2026 (Cerrado)' },
            ]}
            placeholder="Seleccionar mes/año..."
          />
        </form>
      </Modal>
    </div>
  )
}
