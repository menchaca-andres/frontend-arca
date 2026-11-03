import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  Input,
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

export function PersonalPage() {
  const toast = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const funcionarios = [
    {
      id: '1',
      ci: '4839201',
      nombres: 'Carlos',
      apellidos: 'Mamani Flores',
      area: 'Tecnología',
      cargo: 'Analista de Sistemas',
      fechaIngreso: '2024-03-01',
      haberBasico: 8500,
      estado: 'RATIFICADO',
    },
    {
      id: '2',
      ci: '9000003',
      nombres: 'Daniela',
      apellidos: 'Mendoza Vargas',
      area: 'Recursos Humanos',
      cargo: 'Especialista de RRHH',
      fechaIngreso: '2026-08-15',
      haberBasico: 7200,
      estado: 'EN_PRUEBA',
    },
    {
      id: '3',
      ci: '6129840',
      nombres: 'Jorge',
      apellidos: 'Gutiérrez Rojas',
      area: 'Finanzas',
      cargo: 'Contador General',
      fechaIngreso: '2023-01-10',
      haberBasico: 9800,
      estado: 'RATIFICADO',
    },
  ]

  const filtrados = funcionarios.filter(
    (f) =>
      f.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.ci.includes(searchTerm),
  )

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Módulo de Personal (ms-personal)</p>
          <h1 className="page-title-ds">Padrón de Funcionarios</h1>
          <p className="page-subtitle-ds">
            Gestión de fichas, asignaciones laborales, áreas y cargos de ARCA Ltda.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={() => setIsModalOpen(true)}
        >
          Nuevo Funcionario
        </Button>
      </header>

      <Card>
        <div className="table-controls-ds">
          <div className="search-filter-box">
            <Input
              placeholder="Buscar por nombre, apellido o CI..."
              leftIcon={<Search size={18} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filtrados.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="No se encontraron funcionarios registrados con ese criterio."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CI</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Área / Cargo</TableHead>
                <TableHead>Fecha Ingreso</TableHead>
                <TableHead>Haber Básico</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono">{f.ci}</TableCell>
                  <TableCell>
                    <strong>
                      {f.nombres} {f.apellidos}
                    </strong>
                  </TableCell>
                  <TableCell>
                    <div>{f.cargo}</div>
                    <span className="text-xs text-muted">{f.area}</span>
                  </TableCell>
                  <TableCell>{formatDate(f.fechaIngreso)}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(f.haberBasico)}</TableCell>
                  <TableCell>
                    <StatusBadge status={f.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.info(`Ficha de ${f.nombres} ${f.apellidos}`, 'Detalle')}
                    >
                      Ver Ficha
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Funcionario"
        footer={
          <div className="modal-actions-right">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false)
                toast.success('Funcionario registrado exitosamente (Demo)', 'Registro completado')
              }}
            >
              Guardar Funcionario
            </Button>
          </div>
        }
      >
        <form className="modal-form-ds" onSubmit={(e) => e.preventDefault()}>
          <div className="form-grid-2">
            <Input label="Nombres" placeholder="Ej. Ana María" required />
            <Input label="Apellidos" placeholder="Ej. Fernández Castro" required />
          </div>
          <div className="form-grid-2">
            <Input label="Documento (CI)" placeholder="Ej. 6543210" required />
            <Input label="Fecha de Nacimiento" type="date" />
          </div>
          <div className="form-grid-2">
            <Select
              label="Área"
              options={[
                { value: 'tec', label: 'Tecnología' },
                { value: 'rrhh', label: 'Recursos Humanos' },
                { value: 'fin', label: 'Finanzas' },
              ]}
              placeholder="Seleccionar área..."
            />
            <Select
              label="Cargo"
              options={[
                { value: 'dev', label: 'Desarrollador de Software' },
                { value: 'analista', label: 'Analista de Negocio' },
                { value: 'contador', label: 'Contador General' },
              ]}
              placeholder="Seleccionar cargo..."
            />
          </div>
          <div className="form-grid-2">
            <Input
              label="Haber Básico (Bs)"
              placeholder="Ej. 6500"
              helperText="Moneda oficial: Bolivianos (Bs)"
            />
            <Input label="Fecha de Ingreso" type="date" />
          </div>
        </form>
      </Modal>
    </div>
  )
}
