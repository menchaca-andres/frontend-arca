import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
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
import { formatCurrency } from '../../utils/formatters'

type Tab = 'areas' | 'cargos'

interface AreaForm {
  codigo: string
  nombre: string
  activo: boolean
}

interface CargoForm {
  areaId: string
  nombre: string
  salarioMin: string
  salarioMax: string
  activo: boolean
}

const AREA_VACIA: AreaForm = { codigo: '', nombre: '', activo: true }
const CARGO_VACIO: CargoForm = {
  areaId: '',
  nombre: '',
  salarioMin: '',
  salarioMax: '',
  activo: true,
}

export function CatalogosPage() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('areas')
  const [incluirInactivos, setIncluirInactivos] = useState(false)
  const [areaFiltro, setAreaFiltro] = useState('')
  const [areas, setAreas] = useState<Area[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState<Tab | null>(null)
  const [areaEditando, setAreaEditando] = useState<Area | null>(null)
  const [cargoEditando, setCargoEditando] = useState<Cargo | null>(null)
  const [formArea, setFormArea] = useState<AreaForm>(AREA_VACIA)
  const [formCargo, setFormCargo] = useState<CargoForm>(CARGO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    try {
      const [areasData, cargosData] = await Promise.all([
        ApiService.getAreas(true),
        ApiService.getCargos({
          includeInactive: incluirInactivos,
          areaId: areaFiltro || undefined,
        }),
      ])
      setAreas(areasData)
      setCargos(cargosData)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los catálogos')
    } finally {
      setCargando(false)
    }
  }, [areaFiltro, incluirInactivos, toast])

  useEffect(() => {
    void recargar()
  }, [recargar])

  const areasVisibles = useMemo(
    () => (incluirInactivos ? areas : areas.filter((area) => area.activo)),
    [areas, incluirInactivos],
  )

  const areasActivas = useMemo(() => areas.filter((area) => area.activo), [areas])

  const opcionesArea = useMemo(
    () =>
      (incluirInactivos ? areas : areasActivas).map((area) => ({
        value: area.id,
        label: `${area.codigo} · ${area.nombre}`,
      })),
    [areas, areasActivas, incluirInactivos],
  )

  const opcionesAreaActiva = useMemo(
    () =>
      areasActivas.map((area) => ({ value: area.id, label: `${area.codigo} · ${area.nombre}` })),
    [areasActivas],
  )

  const abrirArea = (area?: Area) => {
    setAreaEditando(area ?? null)
    setFormArea(
      area ? { codigo: area.codigo, nombre: area.nombre, activo: area.activo } : { ...AREA_VACIA },
    )
    setModal('areas')
  }

  const abrirCargo = (cargo?: Cargo) => {
    setCargoEditando(cargo ?? null)
    setFormCargo(
      cargo
        ? {
            areaId: cargo.areaId,
            nombre: cargo.nombre,
            salarioMin: String(cargo.salarioMin),
            salarioMax: String(cargo.salarioMax),
            activo: cargo.activo,
          }
        : {
            ...CARGO_VACIO,
            areaId: areasActivas[0]?.id ?? '',
          },
    )
    setModal('cargos')
  }

  const cerrarModal = (force = false) => {
    if (guardando && !force) return
    setModal(null)
    setAreaEditando(null)
    setCargoEditando(null)
  }

  const guardarArea = async () => {
    const codigo = formArea.codigo.trim()
    const nombre = formArea.nombre.trim()
    if (!codigo || !nombre) {
      toast.warning('Completa el código y el nombre del área', 'Datos incompletos')
      return
    }

    setGuardando(true)
    try {
      if (areaEditando) {
        await ApiService.updateArea(areaEditando.id, {
          codigo,
          nombre,
          activo: formArea.activo,
        })
        toast.success('Área actualizada', 'Catálogo de áreas')
      } else {
        await ApiService.createArea({ codigo, nombre })
        toast.success('Área creada', 'Catálogo de áreas')
      }
      cerrarModal(true)
      await recargar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el área')
    } finally {
      setGuardando(false)
    }
  }

  const guardarCargo = async () => {
    const nombre = formCargo.nombre.trim()
    const salarioMin = Number(formCargo.salarioMin)
    const salarioMax = Number(formCargo.salarioMax)

    if (!formCargo.areaId || !nombre || !formCargo.salarioMin || !formCargo.salarioMax) {
      toast.warning('Completa el área, el nombre y la banda salarial', 'Datos incompletos')
      return
    }
    if (!Number.isFinite(salarioMin) || !Number.isFinite(salarioMax) || salarioMin > salarioMax) {
      toast.warning('El salario mínimo no puede superar al máximo', 'Banda salarial inválida')
      return
    }

    setGuardando(true)
    try {
      if (cargoEditando) {
        await ApiService.updateCargo(cargoEditando.id, {
          nombre,
          salarioMin,
          salarioMax,
          activo: formCargo.activo,
        })
        toast.success('Cargo actualizado', 'Catálogo de cargos')
      } else {
        await ApiService.createCargo({
          areaId: formCargo.areaId,
          nombre,
          salarioMin,
          salarioMax,
        })
        toast.success('Cargo creado', 'Catálogo de cargos')
      }
      cerrarModal(true)
      await recargar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el cargo')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstadoArea = async (area: Area) => {
    setCambiandoEstado(area.id)
    try {
      await ApiService.updateArea(area.id, { activo: !area.activo })
      toast.success(area.activo ? 'Área desactivada' : 'Área activada', 'Catálogo de áreas')
      await recargar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado del área')
    } finally {
      setCambiandoEstado(null)
    }
  }

  const cambiarEstadoCargo = async (cargo: Cargo) => {
    setCambiandoEstado(cargo.id)
    try {
      await ApiService.updateCargo(cargo.id, { activo: !cargo.activo })
      toast.success(cargo.activo ? 'Cargo desactivado' : 'Cargo activado', 'Catálogo de cargos')
      await recargar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado del cargo')
    } finally {
      setCambiandoEstado(null)
    }
  }

  const nombreArea = (cargo: Cargo) =>
    cargo.area?.nombre ?? areas.find((area) => area.id === cargo.areaId)?.nombre ?? '—'

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Módulo de Personal (ms-personal)</p>
          <h1 className="page-title-ds">Áreas y Cargos</h1>
          <p className="page-subtitle-ds">
            Catálogos maestros para clasificar funcionarios y asignaciones laborales.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={() => (tab === 'areas' ? abrirArea() : abrirCargo())}
        >
          {tab === 'areas' ? 'Nueva Área' : 'Nuevo Cargo'}
        </Button>
      </header>

      <Card>
        <div className="table-controls-ds">
          <div className="search-filter-box" style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant={tab === 'areas' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTab('areas')}
            >
              Áreas
            </Button>
            <Button
              variant={tab === 'cargos' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTab('cargos')}
            >
              Cargos
            </Button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {tab === 'cargos' && (
              <Select
                options={opcionesArea}
                placeholder="Todas las áreas"
                value={areaFiltro}
                onChange={(event) => setAreaFiltro(event.target.value)}
                aria-label="Filtrar cargos por área"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw size={16} />}
              isLoading={cargando}
              onClick={() => {
                setCargando(true)
                void recargar()
              }}
            >
              Actualizar
            </Button>
            <Button
              variant={incluirInactivos ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setIncluirInactivos((valor) => !valor)}
            >
              {incluirInactivos ? 'Ocultar inactivos' : 'Mostrar inactivos'}
            </Button>
          </div>
        </div>

        {cargando ? (
          <EmptyState title="Cargando catálogos..." description="Consultando áreas y cargos." />
        ) : tab === 'areas' ? (
          areasVisibles.length === 0 ? (
            <EmptyState
              title="Sin áreas registradas"
              description="Crea la primera área para empezar a organizar el personal."
              action={
                <Button variant="primary" onClick={() => abrirArea()}>
                  Nueva Área
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areasVisibles.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-mono">{area.codigo}</TableCell>
                    <TableCell>
                      <strong>{area.nombre}</strong>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={area.activo ? 'ACTIVO' : 'INACTIVO'} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" size="sm" onClick={() => abrirArea(area)}>
                          Editar
                        </Button>
                        <Button
                          variant={area.activo ? 'danger' : 'secondary'}
                          size="sm"
                          isLoading={cambiandoEstado === area.id}
                          onClick={() => void cambiarEstadoArea(area)}
                        >
                          {area.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : cargos.length === 0 ? (
          <EmptyState
            title="Sin cargos registrados"
            description="Crea un cargo dentro de un área activa."
            action={
              <Button variant="primary" onClick={() => abrirCargo()}>
                Nuevo Cargo
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Área</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Banda salarial</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargos.map((cargo) => (
                <TableRow key={cargo.id}>
                  <TableCell>
                    <div>{nombreArea(cargo)}</div>
                    <span className="text-xs text-muted">{cargo.area?.codigo ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    <strong>{cargo.nombre}</strong>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(cargo.salarioMin)} — {formatCurrency(cargo.salarioMax)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={cargo.activo ? 'ACTIVO' : 'INACTIVO'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <Button variant="ghost" size="sm" onClick={() => abrirCargo(cargo)}>
                        Editar
                      </Button>
                      <Button
                        variant={cargo.activo ? 'danger' : 'secondary'}
                        size="sm"
                        isLoading={cambiandoEstado === cargo.id}
                        onClick={() => void cambiarEstadoCargo(cargo)}
                      >
                        {cargo.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={modal === 'areas'}
        onClose={cerrarModal}
        title={areaEditando ? 'Editar Área' : 'Nueva Área'}
        footer={
          <div className="modal-actions-right">
            <Button variant="outline" onClick={() => cerrarModal()} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="primary" isLoading={guardando} onClick={() => void guardarArea()}>
              {areaEditando ? 'Guardar Cambios' : 'Crear Área'}
            </Button>
          </div>
        }
      >
        <form
          className="modal-form-ds"
          onSubmit={(event) => {
            event.preventDefault()
            void guardarArea()
          }}
        >
          <Input
            label="Código"
            placeholder="Ej. ADM"
            value={formArea.codigo}
            onChange={(event) => setFormArea((form) => ({ ...form, codigo: event.target.value }))}
            helperText="Se normaliza a mayúsculas. Máximo 20 caracteres."
            required
          />
          <Input
            label="Nombre"
            placeholder="Ej. Administración"
            value={formArea.nombre}
            onChange={(event) => setFormArea((form) => ({ ...form, nombre: event.target.value }))}
            required
          />
          {areaEditando && (
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={formArea.activo}
                onChange={(event) =>
                  setFormArea((form) => ({ ...form, activo: event.target.checked }))
                }
              />
              Área activa
            </label>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={modal === 'cargos'}
        onClose={cerrarModal}
        title={cargoEditando ? 'Editar Cargo' : 'Nuevo Cargo'}
        footer={
          <div className="modal-actions-right">
            <Button variant="outline" onClick={() => cerrarModal()} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="primary" isLoading={guardando} onClick={() => void guardarCargo()}>
              {cargoEditando ? 'Guardar Cambios' : 'Crear Cargo'}
            </Button>
          </div>
        }
      >
        <form
          className="modal-form-ds"
          onSubmit={(event) => {
            event.preventDefault()
            void guardarCargo()
          }}
        >
          <Select
            label="Área"
            options={
              cargoEditando && !areasActivas.some((area) => area.id === cargoEditando.areaId)
                ? [
                    ...opcionesAreaActiva,
                    {
                      value: cargoEditando.areaId,
                      label: nombreArea(cargoEditando),
                    },
                  ]
                : opcionesAreaActiva
            }
            placeholder="Seleccionar área..."
            value={formCargo.areaId}
            onChange={(event) => setFormCargo((form) => ({ ...form, areaId: event.target.value }))}
            disabled={Boolean(cargoEditando)}
            helperText={cargoEditando ? 'El área de un cargo no se puede cambiar.' : undefined}
            required
          />
          <Input
            label="Nombre del cargo"
            placeholder="Ej. Analista de Sistemas"
            value={formCargo.nombre}
            onChange={(event) => setFormCargo((form) => ({ ...form, nombre: event.target.value }))}
            required
          />
          <div className="form-grid-2">
            <Input
              label="Salario mínimo (Bs)"
              type="number"
              min="0"
              step="0.01"
              value={formCargo.salarioMin}
              onChange={(event) =>
                setFormCargo((form) => ({ ...form, salarioMin: event.target.value }))
              }
              required
            />
            <Input
              label="Salario máximo (Bs)"
              type="number"
              min="0"
              step="0.01"
              value={formCargo.salarioMax}
              onChange={(event) =>
                setFormCargo((form) => ({ ...form, salarioMax: event.target.value }))
              }
              required
            />
          </div>
          {cargoEditando && (
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={formCargo.activo}
                onChange={(event) =>
                  setFormCargo((form) => ({ ...form, activo: event.target.checked }))
                }
              />
              Cargo activo
            </label>
          )}
        </form>
      </Modal>
    </div>
  )
}
