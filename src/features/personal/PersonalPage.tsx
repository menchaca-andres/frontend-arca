import { useEffect, useMemo, useState } from 'react'
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
import { ApiService } from '../../services/api'
import type { Area, Cargo } from '../../types'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useAuth } from '../auth/useAuth'

export function PersonalPage() {
  const toast = useToast()
  const { usuario } = useAuth()
  const puedeGestionar = usuario?.rol === 'ADMIN' || usuario?.rol === 'RRHH'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [areas, setAreas] = useState<Area[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [areaId, setAreaId] = useState('')
  const [cargoId, setCargoId] = useState('')
  const [cargandoAreas, setCargandoAreas] = useState(false)
  const [cargandoCargos, setCargandoCargos] = useState(false)

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

  useEffect(() => {
    if (!isModalOpen || !puedeGestionar) return

    let cancelado = false
    ApiService.getAreas()
      .then((data) => {
        if (!cancelado) setAreas(data)
      })
      .catch((error) => {
        if (!cancelado) {
          toast.error(error instanceof Error ? error.message : 'No se pudieron cargar las áreas')
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoAreas(false)
      })

    return () => {
      cancelado = true
    }
  }, [isModalOpen, puedeGestionar, toast])

  useEffect(() => {
    if (!isModalOpen || !areaId) return

    let cancelado = false
    ApiService.getCargos({ areaId })
      .then((data) => {
        if (!cancelado) setCargos(data)
      })
      .catch((error) => {
        if (!cancelado) {
          setCargos([])
          toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los cargos')
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoCargos(false)
      })

    return () => {
      cancelado = true
    }
  }, [areaId, isModalOpen, toast])

  const opcionesArea = useMemo(
    () => areas.map((area) => ({ value: area.id, label: `${area.codigo} · ${area.nombre}` })),
    [areas],
  )

  const opcionesCargo = useMemo(
    () => cargos.map((cargo) => ({ value: cargo.id, label: cargo.nombre })),
    [cargos],
  )

  const cargoSeleccionado = useMemo(
    () => cargos.find((cargo) => cargo.id === cargoId),
    [cargoId, cargos],
  )

  const ayudaCargo = cargoSeleccionado
    ? `Banda salarial: ${formatCurrency(cargoSeleccionado.salarioMin)} — ${formatCurrency(cargoSeleccionado.salarioMax)}`
    : areaId && !cargandoCargos && cargos.length === 0
      ? 'No hay cargos activos en esta área.'
      : undefined

  const abrirModal = () => {
    setCargandoAreas(true)
    setIsModalOpen(true)
  }

  const cerrarModal = () => {
    setIsModalOpen(false)
    setAreaId('')
    setCargoId('')
    setCargos([])
    setCargandoAreas(false)
    setCargandoCargos(false)
  }

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
        {puedeGestionar && (
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={abrirModal}>
            Nuevo Funcionario
          </Button>
        )}
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
        onClose={cerrarModal}
        title="Registrar Nuevo Funcionario"
        footer={
          <div className="modal-actions-right">
            <Button variant="outline" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!areaId || !cargoId) {
                  toast.warning('Selecciona un área y un cargo', 'Datos incompletos')
                  return
                }
                const area = areas.find((item) => item.id === areaId)
                const cargo = cargos.find((item) => item.id === cargoId)
                toast.success(
                  `Funcionario registrado en ${area?.nombre ?? 'el área'} como ${cargo?.nombre ?? 'el cargo'} (Demo)`,
                  'Registro completado',
                )
                cerrarModal()
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
              options={opcionesArea}
              placeholder={cargandoAreas ? 'Cargando áreas...' : 'Seleccionar área...'}
              value={areaId}
              onChange={(event) => {
                const nextAreaId = event.target.value
                setAreaId(nextAreaId)
                setCargoId('')
                setCargos([])
                setCargandoCargos(Boolean(nextAreaId))
              }}
              disabled={cargandoAreas}
              required
            />
            <Select
              label="Cargo"
              options={opcionesCargo}
              placeholder={
                !areaId
                  ? 'Elige un área primero'
                  : cargandoCargos
                    ? 'Cargando cargos...'
                    : 'Seleccionar cargo...'
              }
              value={cargoId}
              onChange={(event) => setCargoId(event.target.value)}
              disabled={!areaId || cargandoCargos}
              helperText={ayudaCargo}
              required
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
