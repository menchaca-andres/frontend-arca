import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Input, Modal, Select, useToast } from '../../../components'
import { ApiError, ApiService } from '../../../services/api'
import type {
  Area,
  Cargo,
  CIExpedido,
  FichaFuncionario,
  RegistrarFuncionarioInput,
} from '../../../types'
import { formatCurrency } from '../../../utils/formatters'

const OPCIONES_EXPEDIDO: Array<{ value: CIExpedido; label: string }> = [
  { value: 'LP', label: 'LP — La Paz' },
  { value: 'CB', label: 'CB — Cochabamba' },
  { value: 'SC', label: 'SC — Santa Cruz' },
  { value: 'OR', label: 'OR — Oruro' },
  { value: 'PT', label: 'PT — Potosí' },
  { value: 'CH', label: 'CH — Chuquisaca' },
  { value: 'TJ', label: 'TJ — Tarija' },
  { value: 'BE', label: 'BE — Beni' },
  { value: 'PD', label: 'PD — Pando' },
]

const OPCIONES_SEXO = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
]

interface RegistrarFuncionarioModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (ficha: FichaFuncionario) => void
}

export function RegistrarFuncionarioModal({
  isOpen,
  onClose,
  onSuccess,
}: RegistrarFuncionarioModalProps) {
  const toast = useToast()

  // Catálogos
  const [areas, setAreas] = useState<Area[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [cargandoAreas, setCargandoAreas] = useState(false)
  const [cargandoCargos, setCargandoCargos] = useState(false)

  // Form State
  const [ci, setCi] = useState('')
  const [ciExpedido, setCiExpedido] = useState<CIExpedido>('LP')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [sexo, setSexo] = useState<'M' | 'F'>('M')

  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')

  const [areaId, setAreaId] = useState('')
  const [cargoId, setCargoId] = useState('')
  const [remuneracion, setRemuneracion] = useState('')
  const [fechaIngreso, setFechaIngreso] = useState(() => new Date().toISOString().slice(0, 10))
  const [diasPrueba, setDiasPrueba] = useState('90')

  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})

  // Cargar áreas al abrir
  useEffect(() => {
    if (!isOpen) return

    let cancelado = false
    void (async () => {
      setCargandoAreas(true)
      try {
        const data = await ApiService.getAreas()
        if (!cancelado) setAreas(data.filter((a) => a.activo))
      } catch (err) {
        if (!cancelado) {
          toast.error(err instanceof Error ? err.message : 'No se pudieron cargar las áreas')
        }
      } finally {
        if (!cancelado) setCargandoAreas(false)
      }
    })()

    return () => {
      cancelado = true
    }
  }, [isOpen, toast])

  // Cargar cargos según el área seleccionada
  useEffect(() => {
    if (!isOpen || !areaId) return

    let cancelado = false
    void (async () => {
      setCargandoCargos(true)
      try {
        const data = await ApiService.getCargos({ areaId })
        if (!cancelado) setCargos(data.filter((c) => c.activo))
      } catch (err) {
        if (!cancelado) {
          setCargos([])
          toast.error(err instanceof Error ? err.message : 'No se pudieron cargar los cargos')
        }
      } finally {
        if (!cancelado) setCargandoCargos(false)
      }
    })()

    return () => {
      cancelado = true
    }
  }, [areaId, isOpen, toast])

  const cargoSeleccionado = useMemo(() => cargos.find((c) => c.id === cargoId), [cargoId, cargos])

  const ayudaCargo = cargoSeleccionado
    ? `Banda salarial: ${formatCurrency(cargoSeleccionado.salarioMin)} a ${formatCurrency(cargoSeleccionado.salarioMax)}`
    : areaId && !cargandoCargos && cargos.length === 0
      ? 'No hay cargos activos en esta área'
      : undefined

  const validarFormulario = (): boolean => {
    const errs: Record<string, string> = {}

    if (!ci.trim()) errs.ci = 'El CI es obligatorio'
    if (!nombres.trim()) errs.nombres = 'El nombre es obligatorio'
    if (!apellidos.trim()) errs.apellidos = 'Los apellidos son obligatorios'
    if (!fechaNacimiento) errs.fechaNacimiento = 'Fecha de nacimiento requerida'

    if (fechaNacimiento && fechaIngreso) {
      const [nacY, nacM, nacD] = fechaNacimiento.split('-').map(Number)
      const [ingY, ingM, ingD] = fechaIngreso.split('-').map(Number)
      let anios = ingY - nacY
      if (ingM < nacM || (ingM === nacM && ingD < nacD)) anios--
      if (anios < 18) {
        errs.fechaNacimiento = 'El funcionario debe tener al menos 18 años a la fecha de ingreso'
      }
    }

    if (!areaId) errs.areaId = 'Seleccione un área'
    if (!cargoId) errs.cargoId = 'Seleccione un cargo'

    const sueldo = parseFloat(remuneracion)
    if (Number.isNaN(sueldo) || sueldo <= 0) {
      errs.remuneracion = 'La remuneración debe ser mayor a 0'
    } else if (cargoSeleccionado) {
      if (sueldo < cargoSeleccionado.salarioMin || sueldo > cargoSeleccionado.salarioMax) {
        errs.remuneracion = `Debe estar entre ${formatCurrency(cargoSeleccionado.salarioMin)} y ${formatCurrency(cargoSeleccionado.salarioMax)}`
      }
    }

    if (!fechaIngreso) errs.fechaIngreso = 'Fecha de ingreso requerida'

    const dias = parseInt(diasPrueba, 10)
    if (Number.isNaN(dias) || dias < 1 || dias > 90) {
      errs.diasPrueba = 'Los días de prueba deben ser entre 1 y 90'
    }

    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!validarFormulario()) return

    setEnviando(true)
    try {
      const payload: RegistrarFuncionarioInput = {
        ci: ci.trim(),
        ciExpedido,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        fechaNacimiento,
        sexo,
        correo: correo.trim() || null,
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
        cargoId,
        remuneracion: parseFloat(remuneracion),
        fechaIngreso,
        diasPrueba: parseInt(diasPrueba, 10) || 90,
      }

      const ficha = await ApiService.registrarFuncionario(payload)
      toast.success(
        `Funcionario ${ficha.nombres} ${ficha.apellidos} registrado exitosamente`,
        'Alta exitosa',
      )
      onSuccess(ficha)
      handleClose()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'CONFLICT') {
          setErrores((prev) => ({ ...prev, ci: err.message }))
          toast.error(err.message, 'CI Duplicado')
        } else {
          toast.error(err.message, 'Error al registrar')
        }
      } else {
        toast.error('Ocurrió un error inesperado al registrar el funcionario', 'Error')
      }
    } finally {
      setEnviando(false)
    }
  }

  const handleClose = () => {
    setCi('')
    setCiExpedido('LP')
    setNombres('')
    setApellidos('')
    setFechaNacimiento('')
    setSexo('M')
    setCorreo('')
    setTelefono('')
    setDireccion('')
    setAreaId('')
    setCargoId('')
    setRemuneracion('')
    setFechaIngreso(new Date().toISOString().slice(0, 10))
    setDiasPrueba('90')
    setErrores({})
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Nuevo Funcionario (Alta)"
      size="lg"
      footer={
        <div className="modal-actions-right">
          <Button variant="outline" onClick={handleClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => handleSubmit()} disabled={enviando}>
            {enviando ? 'Guardando...' : 'Dar de Alta'}
          </Button>
        </div>
      }
    >
      <form className="modal-form-ds" onSubmit={handleSubmit}>
        {/* Sección: Datos Personales */}
        <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1rem' }}>
          <legend
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#1e293b',
              marginBottom: '0.75rem',
            }}
          >
            1. Datos Personales (CA-01)
          </legend>
          <div className="form-grid-2">
            <Input
              label="Nombres"
              placeholder="Ej. Carlos"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              error={errores.nombres}
              required
            />
            <Input
              label="Apellidos"
              placeholder="Ej. Mamani Flores"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              error={errores.apellidos}
              required
            />
          </div>

          <div className="form-grid-2" style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '0.5rem' }}>
              <Input
                label="Cédula de Identidad (CI)"
                placeholder="Ej. 4839201"
                value={ci}
                onChange={(e) => setCi(e.target.value)}
                error={errores.ci}
                required
              />
              <Select
                label="Expedido"
                options={OPCIONES_EXPEDIDO}
                value={ciExpedido}
                onChange={(e) => setCiExpedido(e.target.value as CIExpedido)}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '0.5rem' }}>
              <Input
                label="Fecha de Nacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                error={errores.fechaNacimiento}
                helperText="Mínimo 18 años a la fecha de ingreso"
                required
              />
              <Select
                label="Sexo"
                options={OPCIONES_SEXO}
                value={sexo}
                onChange={(e) => setSexo(e.target.value as 'M' | 'F')}
                required
              />
            </div>
          </div>
        </fieldset>

        {/* Sección: Información de Contacto */}
        <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1rem' }}>
          <legend
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#1e293b',
              marginBottom: '0.75rem',
            }}
          >
            2. Información de Contacto (Opcional)
          </legend>
          <div className="form-grid-2">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="ejemplo@arca.bo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            <Input
              label="Teléfono / Celular"
              placeholder="Ej. 70012345"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <Input
              label="Dirección de domicilio"
              placeholder="Ej. Av. 6 de Agosto #123, Edif. Arce Piso 4"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>
        </fieldset>

        {/* Sección: Datos Laborales y Asignación */}
        <fieldset style={{ border: 'none', padding: 0, margin: '0 0 0.5rem' }}>
          <legend
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#1e293b',
              marginBottom: '0.75rem',
            }}
          >
            3. Datos Laborales y Asignación Inicial
          </legend>
          <div className="form-grid-2">
            <Select
              label="Área"
              options={areas.map((a) => ({ value: a.id, label: `${a.codigo} · ${a.nombre}` }))}
              placeholder={cargandoAreas ? 'Cargando áreas...' : 'Seleccionar área...'}
              value={areaId}
              onChange={(e) => {
                setAreaId(e.target.value)
                setCargoId('')
                setCargos([])
              }}
              error={errores.areaId}
              disabled={cargandoAreas}
              required
            />
            <Select
              label="Cargo"
              options={cargos.map((c) => ({ value: c.id, label: c.nombre }))}
              placeholder={
                !areaId
                  ? 'Seleccione primero un área'
                  : cargandoCargos
                    ? 'Cargando cargos...'
                    : 'Seleccionar cargo...'
              }
              value={cargoId}
              onChange={(e) => {
                const nextCargoId = e.target.value
                setCargoId(nextCargoId)
                const c = cargos.find((item) => item.id === nextCargoId)
                if (c && (!remuneracion || parseFloat(remuneracion) < c.salarioMin)) {
                  setRemuneracion(c.salarioMin.toString())
                }
              }}
              error={errores.cargoId}
              helperText={ayudaCargo}
              disabled={!areaId || cargandoCargos}
              required
            />
          </div>

          <div className="form-grid-2" style={{ marginTop: '0.75rem' }}>
            <Input
              label="Remuneración (Haber Básico en Bs)"
              type="number"
              step="0.01"
              placeholder="Ej. 8500"
              value={remuneracion}
              onChange={(e) => setRemuneracion(e.target.value)}
              error={errores.remuneracion}
              helperText={
                cargoSeleccionado
                  ? `Min: ${formatCurrency(cargoSeleccionado.salarioMin)} — Max: ${formatCurrency(cargoSeleccionado.salarioMax)}`
                  : 'Sujeto a la banda salarial del cargo'
              }
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
              <Input
                label="Fecha de Ingreso"
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                error={errores.fechaIngreso}
                required
              />
              <Input
                label="Días Prueba"
                type="number"
                min="1"
                max="90"
                value={diasPrueba}
                onChange={(e) => setDiasPrueba(e.target.value)}
                error={errores.diasPrueba}
                helperText="Por defecto: 90 días"
                required
              />
            </div>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
