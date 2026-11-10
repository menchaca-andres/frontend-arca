import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  Calendar,
  DollarSign,
  FileCheck,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
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
import { getNavItemsForRole } from '../../config/navigation'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useAuth } from './useAuth'

export function HomePage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')

  if (!usuario) return null

  const esFuncionario = usuario.rol === 'FUNCIONARIO'
  const navItems = getNavItemsForRole(usuario.rol).filter((item) => item.id !== 'dashboard')

  // Datos simulados de demostración que reflejan la semilla de desarrollo
  const demoFuncionarios = [
    {
      id: '1',
      nombres: 'Carlos',
      apellidos: 'Mamani Flores',
      ci: '4839201',
      cargo: 'Analista de Sistemas',
      area: 'Tecnología',
      haberBasico: 8500,
      fechaIngreso: '2024-03-01',
      estado: 'RATIFICADO',
    },
    {
      id: '2',
      nombres: 'Daniela',
      apellidos: 'Mendoza Vargas',
      ci: '9000003',
      cargo: 'Especialista de RRHH',
      area: 'Recursos Humanos',
      haberBasico: 7200,
      fechaIngreso: '2026-08-15',
      estado: 'EN_PRUEBA',
    },
    {
      id: '3',
      nombres: 'Jorge',
      apellidos: 'Gutiérrez Rojas',
      ci: '6129840',
      cargo: 'Contador General',
      area: 'Finanzas',
      haberBasico: 9800,
      fechaIngreso: '2023-01-10',
      estado: 'RATIFICADO',
    },
    {
      id: '4',
      nombres: 'Andrea',
      apellidos: 'Salazar Cortez',
      ci: '5304921',
      cargo: 'Asistente Administrativo',
      area: 'Administración',
      haberBasico: 4200,
      fechaIngreso: '2025-05-20',
      estado: 'BAJA',
    },
  ]

  const filteredData = demoFuncionarios.filter(
    (f) =>
      f.nombres.toLowerCase().includes(filterQuery.toLowerCase()) ||
      f.apellidos.toLowerCase().includes(filterQuery.toLowerCase()) ||
      f.cargo.toLowerCase().includes(filterQuery.toLowerCase()),
  )

  return (
    <div className="dashboard-page">
      {/* Bienvenida y KPIs */}
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Panel de Control</p>
          <h1 className="page-title-ds">Bienvenido/a, {usuario.email}</h1>
          <p className="page-subtitle-ds">
            Sesión activa con rol <StatusBadge status={usuario.rol} />. Los módulos visibles en tu
            menú lateral se adaptan automáticamente a tus permisos.
          </p>
        </div>
      </header>

      {/* Grid de métricas clave */}
      <section className="stats-grid-ds" aria-label="Métricas clave">
        {esFuncionario ? (
          <>
            <Card className="stat-card">
              <div className="stat-icon-wrapper warning">
                <Calendar size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Mi Saldo de Vacaciones</span>
                <strong className="stat-value">15 días</strong>
                <span className="stat-footnote">Días hábiles disponibles</span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-icon-wrapper success">
                <FileCheck size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Mis Boletas</span>
                <strong className="stat-value">1 emitida</strong>
                <span className="stat-footnote">Octubre 2026</span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-icon-wrapper brand">
                <FileCheck size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Mi Contrato</span>
                <strong className="stat-value">Vigente</strong>
                <span className="stat-footnote">PDF disponible</span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-icon-wrapper info">
                <Bell size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Mis Solicitudes</span>
                <strong className="stat-value">1 pendiente</strong>
                <span className="stat-footnote">Esperando revisión</span>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className="stat-card">
              <div className="stat-icon-wrapper brand">
                <Users size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Funcionarios Registrados</span>
                <strong className="stat-value">5</strong>
                <span className="stat-footnote">3 áreas operativas</span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-icon-wrapper info">
                <DollarSign size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Presupuesto Mensual</span>
                <strong className="stat-value">{formatCurrency(38500)}</strong>
                <span className="stat-footnote">Moneda nacional (Bs)</span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-icon-wrapper warning">
                <Calendar size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Gestión Vacaciones</span>
                <strong className="stat-value">15 días</strong>
                <span className="stat-footnote">Por año completado</span>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-icon-wrapper success">
                <FileCheck size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Contratos y Boletas</span>
                <strong className="stat-value">PDF Inmutable</strong>
                <span className="stat-footnote">Integración con Gotenberg</span>
              </div>
            </Card>
          </>
        )}
      </section>

      {/* Módulos disponibles según el rol */}
      <section className="section-block-ds">
        <div className="section-header-ds">
          <div>
            <h2 className="section-title-ds">Módulos habilitados para tu rol</h2>
            <p className="section-subtitle-ds">
              Selecciona un módulo para explorar las funciones asignadas a{' '}
              <strong>{usuario.rol}</strong>.
            </p>
          </div>
        </div>

        <div className="modules-grid-ds">
          {navItems.map((item) => {
            const Icon = item.icon
            const label = item.getLabel(usuario.rol)

            return (
              <div
                key={item.id}
                className="module-card-ds"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(item.path)}
              >
                <div className="module-card-header">
                  <div className="module-card-icon">
                    <Icon size={24} />
                  </div>
                  <ArrowRight size={18} className="module-card-arrow" />
                </div>
                <h3 className="module-card-title">{label}</h3>
                <p className="module-card-desc">{item.description}</p>
                <div className="module-card-footer">
                  <span className="module-action-link">Acceder al módulo &rarr;</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Muestra interactiva del Design System (CA-02, CA-06, CA-07) */}
      {!esFuncionario && (
        <section className="section-block-ds">
          <Card
            title="Componentes del Design System ARCA (CA-02)"
            subtitle="Verificación de diseño consistente, formatos de moneda en Bs, fechas dd/mm/aaaa y componentes reutilizables."
            action={
              <div className="action-buttons-group">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Bell size={16} />}
                  onClick={() =>
                    toast.success('¡Notificación Toast funcionando correctamente!', 'Éxito')
                  }
                >
                  Probar Toast
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Abrir Modal
                </Button>
              </div>
            }
          >
            {/* Barra de filtros de la tabla */}
            <div className="table-controls-ds">
              <div className="search-filter-box">
                <Input
                  placeholder="Buscar por nombre o cargo..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>
              <div className="filter-actions-ds">
                <Button
                  variant={showEmptyState ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowEmptyState((prev) => !prev)}
                >
                  {showEmptyState ? 'Ver Tabla con Datos' : 'Ver Estado Vacío'}
                </Button>
              </div>
            </div>

            {/* Tabla o Estado Vacío */}
            {showEmptyState ? (
              <EmptyState
                title="No se encontraron registros"
                description="Actualmente no hay funcionarios que coincidan con los criterios de búsqueda seleccionados."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setShowEmptyState(false)}>
                    Restablecer vista
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionario</TableHead>
                    <TableHead>CI</TableHead>
                    <TableHead>Cargo / Área</TableHead>
                    <TableHead>Haber Básico (Bs)</TableHead>
                    <TableHead>Fecha Ingreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted">
                        No hay coincidencias para &quot;{filterQuery}&quot;
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <strong>
                            {f.nombres} {f.apellidos}
                          </strong>
                        </TableCell>
                        <TableCell>{f.ci}</TableCell>
                        <TableCell>
                          <div>{f.cargo}</div>
                          <span className="text-xs text-muted">{f.area}</span>
                        </TableCell>
                        <TableCell className="font-mono">{formatCurrency(f.haberBasico)}</TableCell>
                        <TableCell>{formatDate(f.fechaIngreso)}</TableCell>
                        <TableCell>
                          <StatusBadge status={f.estado} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toast.info(
                                `Ficha seleccionada: ${f.nombres} ${f.apellidos}`,
                                'Detalle',
                              )
                            }
                          >
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </section>
      )}

      {/* Modal de Demostración */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Formulario Modal - Design System"
        size="md"
        footer={
          <div className="modal-actions-right">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false)
                toast.success('Formulario guardado exitosamente', 'Operación completada')
              }}
            >
              Guardar Cambios
            </Button>
          </div>
        }
      >
        <form className="modal-form-ds" onSubmit={(e) => e.preventDefault()}>
          <Input label="Nombre del Funcionario" placeholder="Ej. Juan Pérez" required />
          <Input
            label="Salario Mensual (Bs)"
            placeholder="Ej. 7500.00"
            helperText="Formato monetario en Bolivianos (CA-07)"
          />
          <Input
            label="Fecha de Ingreso"
            type="date"
            helperText="Se visualizará como dd/mm/aaaa en los reportes"
          />
          <div className="modal-notice-box">
            <Sparkles size={18} className="text-teal" />
            <p className="text-xs">
              Este modal valida el <strong>CA-02</strong> (Design System) y permite cerrar con tecla{' '}
              <kbd>ESC</kbd> o click fuera del recuadro.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  )
}
