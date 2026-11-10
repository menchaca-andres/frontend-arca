import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Copy, Plus, RefreshCw, ShieldAlert, UserCheck, UserX } from 'lucide-react'
import {
  Badge,
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
import { useAuth } from '../auth/useAuth'
import { ApiService } from '../../services/api'
import type { CrearUsuarioInput, FuncionarioResumen, Rol, UsuarioItem } from '../../types'
import { formatDate } from '../../utils/formatters'

const ROLES: Rol[] = ['ADMIN', 'RRHH', 'DIRECCION', 'FUNCIONARIO']

export function UsuariosPage() {
  const toast = useToast()
  const { usuario: currentUser } = useAuth()

  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [rolFiltro, setRolFiltro] = useState<string>('')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('')

  // Modales
  const [modalAlta, setModalAlta] = useState(false)
  const [modalRol, setModalRol] = useState<UsuarioItem | null>(null)
  const [modalCredencial, setModalCredencial] = useState<{
    email: string
    passwordTemporal: string
  } | null>(null)

  // Formulario de alta
  const [formAlta, setFormAlta] = useState<CrearUsuarioInput>({
    email: '',
    rol: 'FUNCIONARIO',
    funcionarioId: '',
  })
  const [guardando, setGuardando] = useState(false)

  // Formulario cambio de rol
  const [nuevoRol, setNuevoRol] = useState<Rol>('FUNCIONARIO')
  const [nuevoFuncionarioId, setNuevoFuncionarioId] = useState('')
  const [guardandoRol, setGuardandoRol] = useState(false)

  // Lista de funcionarios para vincular cuenta
  const [funcionarios, setFuncionarios] = useState<FuncionarioResumen[]>([])
  const [cargandoFuncionarios, setCargandoFuncionarios] = useState(false)

  // Estado de copiado al portapapeles
  const [copiado, setCopiado] = useState(false)

  const cargarFuncionarios = useCallback(async () => {
    try {
      setCargandoFuncionarios(true)
      const data = await ApiService.getFuncionariosParaSelector()
      setFuncionarios(data)
    } catch {
      // Ignorar error si aún no hay funcionarios o endpoint en desarrollo
      setFuncionarios([])
    } finally {
      setCargandoFuncionarios(false)
    }
  }, [])

  useEffect(() => {
    if (modalAlta || Boolean(modalRol)) {
      void cargarFuncionarios()
    }
  }, [modalAlta, modalRol, cargarFuncionarios])

  const opcionesFuncionarios = useMemo(
    () =>
      funcionarios.map((f) => ({
        value: f.id,
        label: `${f.nombreCompleto} — CI: ${f.ci}${f.ciExpedido ? ` ${f.ciExpedido}` : ''}`,
      })),
    [funcionarios],
  )

  const cargarUsuarios = useCallback(async () => {
    try {
      setCargando(true)
      const data = await ApiService.getUsuarios({
        rol: (rolFiltro as Rol) || undefined,
        activo: estadoFiltro === '' ? undefined : estadoFiltro === 'true',
      })
      setUsuarios(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar usuarios')
    } finally {
      setCargando(false)
    }
  }, [rolFiltro, estadoFiltro, toast])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  // CA-02 & CA-05: Alta de usuario con generación de contraseña temporal
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formAlta.email.trim()) {
      toast.error('El correo electrónico es obligatorio')
      return
    }
    if (formAlta.rol === 'FUNCIONARIO' && !formAlta.funcionarioId?.trim()) {
      toast.error('El ID del funcionario es obligatorio para el rol FUNCIONARIO')
      return
    }

    try {
      setGuardando(true)
      const res = await ApiService.createUsuario({
        email: formAlta.email.trim(),
        rol: formAlta.rol,
        funcionarioId: formAlta.rol === 'FUNCIONARIO' ? formAlta.funcionarioId?.trim() : null,
      })

      toast.success('Usuario creado exitosamente')
      setModalAlta(false)
      setFormAlta({ email: '', rol: 'FUNCIONARIO', funcionarioId: '' })

      // Mostrar modal con la contraseña temporal generada
      setModalCredencial({
        email: res.usuario.email,
        passwordTemporal: res.passwordTemporal,
      })

      await cargarUsuarios()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear usuario')
    } finally {
      setGuardando(false)
    }
  }

  // Cambio de rol
  const handleCambiarRol = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalRol) return

    if (nuevoRol === 'FUNCIONARIO' && !nuevoFuncionarioId.trim()) {
      toast.error('El ID del funcionario es obligatorio para el rol FUNCIONARIO')
      return
    }

    try {
      setGuardandoRol(true)
      await ApiService.updateUsuarioRol(modalRol.id, {
        rol: nuevoRol,
        funcionarioId: nuevoRol === 'FUNCIONARIO' ? nuevoFuncionarioId.trim() : null,
      })
      toast.success('Rol actualizado exitosamente')
      setModalRol(null)
      await cargarUsuarios()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar rol')
    } finally {
      setGuardandoRol(false)
    }
  }

  // CA-07: Activar / Desactivar (un ADMIN no puede desactivarse a sí mismo)
  const handleToggleEstado = async (u: UsuarioItem) => {
    if (u.activo && currentUser?.id === u.id) {
      toast.error('Un administrador no puede desactivarse a sí mismo')
      return
    }

    const accion = u.activo ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Confirma que desea ${accion} al usuario ${u.email}?`)) {
      return
    }

    try {
      await ApiService.updateUsuarioEstado(u.id, { activo: !u.activo })
      toast.success(`Usuario ${u.activo ? 'desactivado' : 'activado'} correctamente`)
      await cargarUsuarios()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar estado')
    }
  }

  const copiarPassword = () => {
    if (!modalCredencial?.passwordTemporal) return
    navigator.clipboard.writeText(modalCredencial.passwordTemporal)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
    toast.success('Contraseña copiada al portapapeles')
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-neutral-500">
            Administración de cuentas, asignación de roles y vinculación con funcionarios (HU-06).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarUsuarios}
            disabled={cargando}
            aria-label="Recargar lista"
          >
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={() => setModalAlta(true)} className="flex items-center gap-2">
            <Plus size={16} />
            <span>Nuevo Usuario</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Select
            label="Filtrar por Rol"
            value={rolFiltro}
            onChange={(e) => setRolFiltro(e.target.value)}
            options={[
              { value: '', label: 'Todos los roles' },
              ...ROLES.map((r) => ({ value: r, label: r })),
            ]}
          />
          <Select
            label="Filtrar por Estado"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'true', label: 'Solo Activos' },
              { value: 'false', label: 'Solo Inactivos' },
            ]}
          />
        </div>
      </Card>

      {/* Tabla de Usuarios */}
      <Card>
        {cargando ? (
          <div className="p-8 text-center text-sm text-neutral-500">Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <EmptyState
            title="No se encontraron usuarios"
            description="No hay cuentas registradas con los filtros seleccionados."
            action={
              <Button onClick={() => setModalAlta(true)} size="sm">
                Crear Usuario
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Correo Electrónico</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Funcionario Vinculado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => {
                const esPropioAdmin = currentUser?.id === u.id
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-neutral-900">
                      <div className="flex items-center gap-2">
                        <span>{u.email}</span>
                        {esPropioAdmin && (
                          <Badge variant="info" size="sm">
                            Tu cuenta
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={u.rol} />
                    </TableCell>
                    <TableCell>
                      {u.funcionarioId ? (
                        <span className="font-mono text-xs text-neutral-600">
                          {u.funcionarioId}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Sin vincular</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.activo ? 'success' : 'danger'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-neutral-500 text-xs">
                      {u.ultimoAcceso ? formatDate(u.ultimoAcceso) : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setModalRol(u)
                            setNuevoRol(u.rol)
                            setNuevoFuncionarioId(u.funcionarioId ?? '')
                          }}
                        >
                          Rol
                        </Button>
                        <Button
                          variant={u.activo ? 'danger' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleEstado(u)}
                          disabled={u.activo && esPropioAdmin}
                          title={
                            u.activo && esPropioAdmin
                              ? 'Un administrador no puede desactivarse a sí mismo'
                              : u.activo
                                ? 'Desactivar cuenta'
                                : 'Activar cuenta'
                          }
                        >
                          {u.activo ? <UserX size={14} /> : <UserCheck size={14} />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal Alta de Usuario */}
      <Modal
        isOpen={modalAlta}
        onClose={() => setModalAlta(false)}
        title="Crear Nueva Cuenta de Usuario"
      >
        <form onSubmit={handleCrearUsuario} className="space-y-4">
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="usuario@arca.com.bo"
            value={formAlta.email}
            onChange={(e) => setFormAlta((prev) => ({ ...prev, email: e.target.value }))}
            required
          />

          <Select
            label="Rol del Sistema"
            value={formAlta.rol}
            onChange={(e) =>
              setFormAlta((prev) => ({ ...prev, rol: e.target.value as Rol }))
            }
            options={ROLES.map((r) => ({ value: r, label: r }))}
          />

          {formAlta.rol === 'FUNCIONARIO' && (
            <div className="space-y-1">
              <Select
                label="Funcionario a Vincular"
                placeholder={
                  cargandoFuncionarios
                    ? 'Cargando funcionarios...'
                    : opcionesFuncionarios.length === 0
                      ? 'No hay funcionarios disponibles'
                      : 'Seleccionar funcionario...'
                }
                value={formAlta.funcionarioId ?? ''}
                onChange={(e) =>
                  setFormAlta((prev) => ({ ...prev, funcionarioId: e.target.value }))
                }
                options={opcionesFuncionarios}
                disabled={cargandoFuncionarios}
                required
              />
              <p className="text-xs text-neutral-500">
                Selecciona al funcionario registrado en Personal (no dado de baja).
              </p>
            </div>
          )}

          <div className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
            <span className="font-semibold text-neutral-800">Nota de seguridad: </span>
            Se generará automáticamente una contraseña temporal robusta que se mostrará en pantalla una sola vez.
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalAlta(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Cambio de Rol */}
      <Modal
        isOpen={Boolean(modalRol)}
        onClose={() => setModalRol(null)}
        title={`Cambiar Rol de ${modalRol?.email}`}
      >
        <form onSubmit={handleCambiarRol} className="space-y-4">
          <Select
            label="Nuevo Rol"
            value={nuevoRol}
            onChange={(e) => setNuevoRol(e.target.value as Rol)}
            options={ROLES.map((r) => ({ value: r, label: r }))}
          />

          {nuevoRol === 'FUNCIONARIO' && (
            <div className="space-y-1">
              <Select
                label="Funcionario a Vincular"
                placeholder={
                  cargandoFuncionarios
                    ? 'Cargando funcionarios...'
                    : opcionesFuncionarios.length === 0
                      ? 'No hay funcionarios disponibles'
                      : 'Seleccionar funcionario...'
                }
                value={nuevoFuncionarioId}
                onChange={(e) => setNuevoFuncionarioId(e.target.value)}
                options={opcionesFuncionarios}
                disabled={cargandoFuncionarios}
                required
              />
              <p className="text-xs text-neutral-500">
                Selecciona al funcionario registrado en Personal (no dado de baja).
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalRol(null)}
              disabled={guardandoRol}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardandoRol}>
              {guardandoRol ? 'Guardando...' : 'Actualizar Rol'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Contraseña Temporal (CA-05: se muestra una sola vez) */}
      <Modal
        isOpen={Boolean(modalCredencial)}
        onClose={() => setModalCredencial(null)}
        title="Credencial Temporal Generada"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md bg-amber-50 p-4 border border-amber-200 text-amber-900">
            <ShieldAlert className="mt-0.5 text-amber-600 shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold">¡Importante!</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Esta contraseña temporal se muestra una sola vez y no volverá a ser accesible. Copiala y entregásela al funcionario de forma segura.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Usuario Creado
            </label>
            <div className="font-mono text-sm bg-neutral-100 p-2 rounded border border-neutral-200">
              {modalCredencial?.email}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Contraseña Temporal
            </label>
            <div className="flex items-center gap-2">
              <div className="font-mono text-base font-bold bg-neutral-900 text-emerald-400 p-2.5 rounded border border-neutral-700 flex-1 select-all">
                {modalCredencial?.passwordTemporal}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={copiarPassword}
                className="shrink-0"
              >
                {copiado ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setModalCredencial(null)}>
              Entendido y Copiado
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
