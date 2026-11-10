import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Card, Input, Modal, Select } from '../../components'
import { ApiService } from '../../services/api'
import { BASE_BOLETAS, errorConfiguracion, getConceptos } from './configuracion-api'
import type { Concepto } from './configuracion-api'
import './configuracion.css'

interface Formulario {
  codigo: string
  nombre: string
  tipo: 'HABER' | 'DESCUENTO'
  formaCalculo: 'MONTO_FIJO' | 'PORCENTAJE'
  valor: string
  base: 'HABER_BASICO' | 'TOTAL_GANADO'
  automatico: boolean
  orden: string
}
const VACIO: Formulario = {
  codigo: '',
  nombre: '',
  tipo: 'HABER',
  formaCalculo: 'MONTO_FIJO',
  valor: '',
  base: 'HABER_BASICO',
  automatico: false,
  orden: '1',
}
export function ConceptosPage() {
  const [lista, setLista] = useState<Concepto[]>([])
  const [inactivos, setInactivos] = useState(false)
  const [revision, setRevision] = useState(0)
  const [ocupado, setOcupado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState<Concepto | null>(null)
  const [eliminando, setEliminando] = useState<Concepto | null>(null)
  const [form, setForm] = useState<Formulario>(VACIO)
  const bloqueado = ocupado || cargando
  useEffect(() => {
    let vigente = true
    getConceptos(inactivos)
      .then((items) => {
        if (vigente) setLista(items)
      })
      .catch((e: unknown) => {
        if (vigente) {
          setLista([])
          setError(errorConfiguracion(e))
        }
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [inactivos, revision])
  function recargar() {
    setCargando(true)
    setError('')
    setRevision((v) => v + 1)
  }
  function abrir(concepto: Concepto | null) {
    setEditando(concepto)
    setError('')
    setAviso('')
    setForm(
      concepto
        ? {
            codigo: concepto.codigo,
            nombre: concepto.nombre,
            tipo: concepto.tipo,
            formaCalculo: concepto.formaCalculo === 'PORCENTAJE' ? 'PORCENTAJE' : 'MONTO_FIJO',
            valor: String(concepto.valor ?? ''),
            base: concepto.base ?? 'HABER_BASICO',
            automatico: concepto.automatico,
            orden: String(concepto.orden),
          }
        : VACIO,
    )
    setAbierto(true)
  }
  async function guardar(event: FormEvent) {
    event.preventDefault()
    setOcupado(true)
    setError('')
    const datos = {
      nombre: form.nombre,
      tipo: form.tipo,
      formaCalculo: form.formaCalculo,
      valor: Number(form.valor),
      base: form.formaCalculo === 'PORCENTAJE' ? form.base : null,
      automatico: form.automatico,
      orden: Number(form.orden),
    }
    try {
      if (editando) await ApiService.patch(`${BASE_BOLETAS}/conceptos/${editando.id}`, datos)
      else await ApiService.post(`${BASE_BOLETAS}/conceptos`, { ...datos, codigo: form.codigo })
      setAbierto(false)
      setAviso('Concepto guardado. Los importes de boletas anteriores se conservan.')
      recargar()
    } catch (e) {
      setError(errorConfiguracion(e))
    } finally {
      setOcupado(false)
    }
  }
  async function estado(concepto: Concepto) {
    setOcupado(true)
    setError('')
    setAviso('')
    try {
      await ApiService.patch(`${BASE_BOLETAS}/conceptos/${concepto.id}/estado`, {
        activo: !concepto.activo,
      })
      setAviso(concepto.activo ? 'Concepto desactivado.' : 'Concepto activado.')
      recargar()
    } catch (e) {
      setError(errorConfiguracion(e))
    } finally {
      setOcupado(false)
    }
  }
  async function eliminar() {
    if (!eliminando) return
    setOcupado(true)
    setError('')
    setAviso('')
    try {
      await ApiService.delete(`${BASE_BOLETAS}/conceptos/${eliminando.id}`)
      setEliminando(null)
      setAviso('Concepto eliminado.')
      recargar()
    } catch (e) {
      setError(errorConfiguracion(e))
    } finally {
      setOcupado(false)
    }
  }
  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Boletas · RRHH</p>
          <h1 className="page-title-ds">Conceptos de haberes y descuentos</h1>
          <p className="page-subtitle-ds">
            Configure políticas para cálculos futuros y conserve el histórico emitido.
          </p>
        </div>
        <Button disabled={bloqueado} onClick={() => abrir(null)}>
          Nuevo concepto
        </Button>
      </header>
      {error && (
        <p role="alert" className="config-error">
          {error}
        </p>
      )}
      {aviso && <p role="status">{aviso}</p>}
      <Card title="Catálogo de conceptos">
        <div className="config-actions">
          <label>
            <input
              type="checkbox"
              checked={inactivos}
              disabled={ocupado}
              onChange={(e) => {
                setCargando(true)
                setError('')
                setInactivos(e.target.checked)
              }}
            />{' '}
            Mostrar inactivos
          </label>
          <Button variant="outline" disabled={bloqueado} onClick={recargar}>
            Actualizar
          </Button>
        </div>
        {cargando ? (
          <p role="status">Cargando conceptos…</p>
        ) : (
          <div className="config-table-wrap">
            <table className="config-table">
              <thead>
                <tr>
                  <th>Código / nombre</th>
                  <th>Tipo</th>
                  <th>Cálculo / base</th>
                  <th>Valor</th>
                  <th>Automático</th>
                  <th>Orden</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.codigo}</strong>
                      <br />
                      {c.nombre}
                    </td>
                    <td>{c.tipo}</td>
                    <td>
                      {c.formaCalculo}
                      <br />
                      {c.base ?? 'No aplica'}
                    </td>
                    <td>
                      {c.valor === null
                        ? 'Del sistema'
                        : `${c.valor.toLocaleString('es-BO', { maximumFractionDigits: 4 })}${c.formaCalculo === 'PORCENTAJE' ? ' %' : ' Bs'}`}
                    </td>
                    <td>{c.automatico ? 'Sí' : 'No'}</td>
                    <td>{c.orden}</td>
                    <td>{c.activo ? 'Activo' : 'Inactivo'}</td>
                    <td>
                      {c.esSistema || c.formaCalculo === 'SISTEMA' ? (
                        <span>Protegido por el sistema</span>
                      ) : (
                        <div className="config-actions">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={bloqueado}
                            onClick={() => abrir(c)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={bloqueado}
                            onClick={() => void estado(c)}
                          >
                            {c.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={bloqueado}
                            onClick={() => {
                              setError('')
                              setEliminando(c)
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!lista.length && <p>No hay conceptos para este filtro.</p>}
          </div>
        )}
      </Card>
      <Modal
        isOpen={abierto}
        onClose={() => {
          if (!ocupado) setAbierto(false)
        }}
        title={editando ? 'Editar concepto' : 'Crear concepto'}
      >
        <form onSubmit={(e) => void guardar(e)}>
          <fieldset disabled={ocupado} className="config-form">
            {error && (
              <p role="alert" className="config-error">
                {error}
              </p>
            )}
            <Input
              label="Código"
              required
              value={form.codigo}
              readOnly={Boolean(editando)}
              maxLength={20}
              pattern="[A-Za-z0-9_-]+"
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
            <Input
              label="Nombre"
              required
              value={form.nombre}
              maxLength={100}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <Select
              label="Tipo"
              value={form.tipo}
              options={[
                { value: 'HABER', label: 'Haber' },
                { value: 'DESCUENTO', label: 'Descuento' },
              ]}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as Formulario['tipo'] })}
            />
            <Select
              label="Forma de cálculo"
              value={form.formaCalculo}
              options={[
                { value: 'MONTO_FIJO', label: 'Monto fijo' },
                { value: 'PORCENTAJE', label: 'Porcentaje' },
              ]}
              onChange={(e) =>
                setForm({ ...form, formaCalculo: e.target.value as Formulario['formaCalculo'] })
              }
            />
            <Input
              label={form.formaCalculo === 'PORCENTAJE' ? 'Valor (%)' : 'Valor (Bs)'}
              type="number"
              required
              step="0.0001"
              min={form.formaCalculo === 'PORCENTAJE' ? 0 : 0.0001}
              max={form.formaCalculo === 'PORCENTAJE' ? 100 : 99999999.9999}
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
            />
            {form.formaCalculo === 'PORCENTAJE' && (
              <Select
                label="Base"
                value={form.base}
                options={[
                  { value: 'HABER_BASICO', label: 'Haber básico' },
                  { value: 'TOTAL_GANADO', label: 'Total ganado' },
                ]}
                onChange={(e) => setForm({ ...form, base: e.target.value as Formulario['base'] })}
              />
            )}
            <label>
              <input
                type="checkbox"
                checked={form.automatico}
                onChange={(e) => setForm({ ...form, automatico: e.target.checked })}
              />{' '}
              Automático para todos
            </label>
            <Input
              label="Orden en la boleta"
              type="number"
              min="0"
              max="32767"
              step="1"
              required
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: e.target.value })}
            />
            <div className="config-actions">
              <Button type="submit">Guardar</Button>
              <Button variant="outline" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
            </div>
          </fieldset>
        </form>
      </Modal>
      <Modal
        isOpen={Boolean(eliminando)}
        onClose={() => {
          if (!ocupado) setEliminando(null)
        }}
        title="Eliminar concepto"
      >
        <p>
          ¿Eliminar {eliminando?.nombre}? Solo se permite si no tiene referencias. Puede
          desactivarlo para conservarlo.
        </p>
        {error && (
          <p role="alert" className="config-error">
            {error}
          </p>
        )}
        <div className="config-actions">
          <Button variant="danger" disabled={ocupado} onClick={() => void eliminar()}>
            Confirmar eliminación
          </Button>
          <Button disabled={ocupado} variant="outline" onClick={() => setEliminando(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
