import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Briefcase } from 'lucide-react'
import { Button, Input, Modal, Select, useToast } from '../../../components'
import { ApiService } from '../../../services/api'
import type { Area, Cargo, CambiarAsignacionInput, FichaFuncionario } from '../../../types'
import { formatCurrency, formatDate } from '../../../utils/formatters'

interface CambiarAsignacionModalProps {
  funcionario: FichaFuncionario | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (fichaActualizada: FichaFuncionario) => void
}

type MotivoCambio = CambiarAsignacionInput['motivo']

const MOTIVOS: Array<{ value: MotivoCambio; label: string }> = [
  { value: 'ASCENSO', label: 'Ascenso' },
  { value: 'TRASLADO', label: 'Traslado' },
  { value: 'INCREMENTO', label: 'Incremento salarial' },
  { value: 'CORRECCION', label: 'Corrección' },
]

function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().split('T')[0]
}

// HU-10: Cambio de área, cargo o remuneración con vista previa "antes → después" (CA-08)
export function CambiarAsignacionModal({
  funcionario,
  isOpen,
  onClose,
  onSuccess,
}: CambiarAsignacionModalProps) {
  const toast = useToast()
  const actual = funcionario?.asignacionVigente ?? null

  const [areas, setAreas] = useState<Area[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [areaId, setAreaId] = useState(actual?.areaId ?? '')
  const [cargoId, setCargoId] = useState(actual?.cargoId ?? '')
  const [remuneracion, setRemuneracion] = useState(actual ? String(actual.remuneracion) : '')
  const [vigenteDesde, setVigenteDesde] = useState('')
  const [motivo, setMotivo] = useState<MotivoCambio>('ASCENSO')
  const [enVistaPrevia, setEnVistaPrevia] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    ApiService.getAreas()
      .then(setAreas)
      .catch(() => toast.error('No se pudieron cargar las áreas', 'Error'))
  }, [isOpen, toast])

  useEffect(() => {
    if (!isOpen || !areaId) return
    ApiService.getCargos({ areaId })
      .then(setCargos)
      .catch(() => toast.error('No se pudieron cargar los cargos', 'Error'))
  }, [areaId, isOpen, toast])

  const cargoSeleccionado = useMemo(() => cargos.find((c) => c.id === cargoId), [cargoId, cargos])
  const areaSeleccionada = useMemo(() => areas.find((a) => a.id === areaId), [areaId, areas])

  if (!funcionario || !actual) return null

  const fechaMinima = sumarDias(actual.vigenteDesde, 1)
  const monto = Number(remuneracion)
  const cambiaCargo = cargoId !== actual.cargoId
  const cambiaRemuneracion = monto !== actual.remuneracion

  // Validaciones en vivo de CA-03 y CA-04; el backend vuelve a validarlas
  const errores: string[] = []
  if (!cambiaCargo && !cambiaRemuneracion) errores.push('Cambie el cargo o la remuneración.')
  if (!cargoId) errores.push('Seleccione un cargo.')
  if (!(monto > 0)) errores.push('Ingrese una remuneración mayor a 0.')
  if (
    cargoSeleccionado &&
    monto > 0 &&
    (monto < cargoSeleccionado.salarioMin || monto > cargoSeleccionado.salarioMax)
  ) {
    errores.push(
      `La remuneración debe estar entre ${formatCurrency(cargoSeleccionado.salarioMin)} y ${formatCurrency(cargoSeleccionado.salarioMax)}.`,
    )
  }
  if (!vigenteDesde) errores.push('Indique desde qué fecha rige el cambio.')
  else if (vigenteDesde < fechaMinima) {
    errores.push(`La nueva vigencia debe ser posterior al ${formatDate(actual.vigenteDesde)}.`)
  }

  const cambiarArea = (nuevaArea: string) => {
    setAreaId(nuevaArea)
    setCargoId(nuevaArea === actual.areaId ? actual.cargoId : '')
    setCargos([])
  }

  const irAVistaPrevia = (e: FormEvent) => {
    e.preventDefault()
    if (errores.length === 0) setEnVistaPrevia(true)
  }

  const confirmar = async () => {
    setGuardando(true)
    try {
      const ficha = await ApiService.cambiarAsignacion(funcionario.id, {
        ...(cambiaCargo ? { cargoId } : {}),
        ...(cambiaRemuneracion ? { remuneracion: monto } : {}),
        vigenteDesde,
        motivo,
      })
      toast.success(
        `La nueva asignación de ${funcionario.nombres} ${funcionario.apellidos} rige desde el ${formatDate(vigenteDesde)}.`,
        'Asignación actualizada',
      )
      onSuccess(ficha)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo registrar el cambio', 'Error')
      setEnVistaPrevia(false)
    } finally {
      setGuardando(false)
    }
  }

  const filas = [
    {
      campo: 'Área',
      antes: actual.areaNombre,
      despues: areaSeleccionada?.nombre ?? actual.areaNombre,
      cambia: areaId !== actual.areaId,
    },
    {
      campo: 'Cargo',
      antes: actual.cargoNombre,
      despues: cargoSeleccionado?.nombre ?? actual.cargoNombre,
      cambia: cambiaCargo,
    },
    {
      campo: 'Remuneración',
      antes: formatCurrency(actual.remuneracion),
      despues: formatCurrency(monto),
      cambia: cambiaRemuneracion,
    },
    {
      campo: 'Vigencia',
      antes: `${formatDate(actual.vigenteDesde)} → ${formatDate(sumarDias(vigenteDesde || fechaMinima, -1))}`,
      despues: `Desde ${formatDate(vigenteDesde)}`,
      cambia: true,
    },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase size={20} color="#2563eb" />
          <span>
            {enVistaPrevia ? 'Confirmar cambio de asignación' : 'Cambiar asignación laboral'}
          </span>
        </div>
      }
      footer={
        <div className="modal-actions-right">
          {enVistaPrevia ? (
            <>
              <Button
                variant="outline"
                onClick={() => setEnVistaPrevia(false)}
                disabled={guardando}
              >
                Volver
              </Button>
              <Button variant="primary" onClick={confirmar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Confirmar cambio'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={irAVistaPrevia} disabled={errores.length > 0}>
                Ver cambios
              </Button>
            </>
          )}
        </div>
      }
    >
      <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
        <strong style={{ color: '#0f172a' }}>
          {funcionario.nombres} {funcionario.apellidos}
        </strong>{' '}
        · CI {funcionario.ci} {funcionario.ciExpedido}
      </div>

      {enVistaPrevia ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr
                style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}
              >
                <th style={{ padding: '0.5rem' }}>Dato</th>
                <th style={{ padding: '0.5rem' }}>Antes</th>
                <th />
                <th style={{ padding: '0.5rem' }}>Después</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.campo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.5rem', color: '#64748b' }}>{fila.campo}</td>
                  <td style={{ padding: '0.5rem' }}>{fila.antes}</td>
                  <td style={{ color: '#94a3b8' }}>
                    <ArrowRight size={14} />
                  </td>
                  <td
                    style={{
                      padding: '0.5rem',
                      fontWeight: fila.cambia ? 600 : 400,
                      color: fila.cambia ? '#1d4ed8' : '#0f172a',
                    }}
                  >
                    {fila.despues}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Motivo: <strong>{MOTIVOS.find((m) => m.value === motivo)?.label}</strong>. La asignación
            actual no se edita: se cierra el {formatDate(sumarDias(vigenteDesde, -1))} y queda en el
            historial.
          </p>
        </div>
      ) : (
        <form className="modal-form-ds" onSubmit={irAVistaPrevia}>
          <div className="form-grid-2">
            <Select
              label="Área"
              value={areaId}
              onChange={(e) => cambiarArea(e.target.value)}
              options={areas.map((a) => ({ value: a.id, label: a.nombre }))}
            />
            <Select
              label="Cargo"
              value={cargoId}
              onChange={(e) => setCargoId(e.target.value)}
              placeholder="Seleccione un cargo"
              options={cargos.map((c) => ({ value: c.id, label: c.nombre }))}
              helperText={
                cargoSeleccionado
                  ? `Banda salarial: ${formatCurrency(cargoSeleccionado.salarioMin)} a ${formatCurrency(cargoSeleccionado.salarioMax)}`
                  : undefined
              }
            />
            <Input
              label="Remuneración (Bs.)"
              type="number"
              min="0"
              step="0.01"
              value={remuneracion}
              onChange={(e) => setRemuneracion(e.target.value)}
            />
            <Input
              label="Rige desde"
              type="date"
              min={fechaMinima}
              value={vigenteDesde}
              onChange={(e) => setVigenteDesde(e.target.value)}
              helperText={`Debe ser posterior al ${formatDate(actual.vigenteDesde)}`}
            />
            <Select
              label="Motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as MotivoCambio)}
              options={MOTIVOS}
            />
          </div>
          {errores.length > 0 && (vigenteDesde || cambiaCargo || cambiaRemuneracion) && (
            <ul
              style={{
                margin: '0.5rem 0 0',
                paddingLeft: '1.25rem',
                color: '#b91c1c',
                fontSize: '0.85rem',
              }}
            >
              {errores.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </form>
      )}
    </Modal>
  )
}
