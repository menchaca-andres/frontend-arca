import { useState } from 'react'
import { Download, Plus } from 'lucide-react'
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
import { formatCurrency, formatDate } from '../../utils/formatters'

export function ContratosPage() {
  const toast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const contratos = [
    {
      id: '1',
      codigo: 'CTR-2026-001',
      funcionario: 'Carlos Mamani Flores',
      tipo: 'Plazo Indefinido',
      salario: 8500,
      fechaFirma: '2024-03-01',
      estado: 'ACTIVO',
    },
    {
      id: '2',
      codigo: 'CTR-2026-002',
      funcionario: 'Daniela Mendoza Vargas',
      tipo: 'Plazo Fijo (Periodo Prueba)',
      salario: 7200,
      fechaFirma: '2026-08-15',
      estado: 'ACTIVO',
    },
  ]

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Módulo de Contratos (ms-contratos)</p>
          <h1 className="page-title-ds">Generación y Archivo de Contratos</h1>
          <p className="page-subtitle-ds">
            Plantillas versionadas, integración con Gotenberg y almacenamiento en base de datos
            (bytea).
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={() => setIsModalOpen(true)}
        >
          Generar Contrato
        </Button>
      </header>

      <Card title="Contratos Registrados">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Funcionario</TableHead>
              <TableHead>Tipo de Contrato</TableHead>
              <TableHead>Remuneración</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Documento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contratos.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono">{c.codigo}</TableCell>
                <TableCell>
                  <strong>{c.funcionario}</strong>
                </TableCell>
                <TableCell>{c.tipo}</TableCell>
                <TableCell className="font-mono">{formatCurrency(c.salario)}</TableCell>
                <TableCell>{formatDate(c.fechaFirma)}</TableCell>
                <TableCell>
                  <StatusBadge status={c.estado} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download size={14} />}
                    onClick={() =>
                      toast.info(`Descargando ${c.codigo}.pdf generado por Gotenberg`, 'PDF')
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
        title="Generar Nuevo Contrato PDF"
        footer={
          <div className="modal-actions-right">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false)
                toast.success('Contrato emitido y guardado con hash SHA-256', 'Contrato listo')
              }}
            >
              Generar con Gotenberg
            </Button>
          </div>
        }
      >
        <form className="modal-form-ds" onSubmit={(e) => e.preventDefault()}>
          <Select
            label="Seleccionar Funcionario"
            options={[
              { value: '1', label: 'Carlos Mamani Flores (CI 4839201)' },
              { value: '2', label: 'Daniela Mendoza Vargas (CI 9000003)' },
            ]}
            placeholder="Elegir funcionario..."
          />
          <Select
            label="Plantilla de Contrato"
            options={[
              { value: 'indefinido', label: 'Contrato a Plazo Indefinido (v1.2)' },
              { value: 'plazofijo', label: 'Contrato a Plazo Fijo / Prueba (v1.0)' },
            ]}
            placeholder="Seleccionar plantilla..."
          />
        </form>
      </Modal>
    </div>
  )
}
