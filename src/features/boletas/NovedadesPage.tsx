import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Card, Input, Select } from '../../components'
import { ApiService } from '../../services/api'
import type { FuncionarioResumen } from '../../types'
import { BASE_BOLETAS, errorConfiguracion, getConceptos } from './configuracion-api'
import type { Concepto, Novedad } from './configuracion-api'
import './configuracion.css'

export function NovedadesPage() {
  const [hoy] = useState(() => new Date())
  const [anio, setAnio] = useState(String(hoy.getFullYear()))
  const [mes, setMes] = useState(String(hoy.getMonth() + 1))
  const [funcionarioId, setFuncionarioId] = useState('')
  const [conceptoId, setConceptoId] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [funcionarios, setFuncionarios] = useState<FuncionarioResumen[]>([])
  const [conceptos, setConceptos] = useState<Concepto[]>([])
  const [lista, setLista] = useState<Novedad[]>([])
  const [ocupado, setOcupado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [catalogosListos, setCatalogosListos] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [revision, setRevision] = useState(0)
  const periodoValido =
    /^\d{4}$/.test(anio) &&
    Number(anio) >= 1900 &&
    Number(anio) <= 9999 &&
    Number(mes) >= 1 &&
    Number(mes) <= 12
  useEffect(() => {
    let vigente = true
    Promise.all([getConceptos(), ApiService.getFuncionariosParaSelector()])
      .then(([c, f]) => {
        if (vigente) {
          setConceptos(c.filter((v) => v.activo && !v.automatico && !v.esSistema))
          setFuncionarios(f)
          setCatalogosListos(true)
        }
      })
      .catch((e: unknown) => {
        if (vigente) {
          setCatalogosListos(false)
          setError(errorConfiguracion(e))
        }
      })
    return () => {
      vigente = false
    }
  }, [revision])
  useEffect(() => {
    let vigente = true
    if (!periodoValido)
      return () => {
        vigente = false
      }
    const query = new URLSearchParams({ anio, mes })
    if (funcionarioId) query.set('funcionarioId', funcionarioId)
    ApiService.get<Novedad[]>(`${BASE_BOLETAS}/novedades?${query}`)
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
  }, [anio, mes, funcionarioId, periodoValido, revision])
  async function guardar(event: FormEvent) {
    event.preventDefault()
    setOcupado(true)
    setError('')
    setAviso('')
    try {
      await ApiService.post(`${BASE_BOLETAS}/novedades`, {
        anio: Number(anio),
        mes: Number(mes),
        funcionarioId,
        conceptoId,
        monto: Number(monto),
        descripcion: descripcion || null,
      })
      setMonto('')
      setDescripcion('')
      setAviso('Novedad registrada para el funcionario y período seleccionados.')
      setCargando(true)
      setRevision((v) => v + 1)
    } catch (e) {
      setError(errorConfiguracion(e))
    } finally {
      setOcupado(false)
    }
  }
  function cambiarPeriodo(campo: 'anio' | 'mes', valor: string) {
    if (campo === 'anio') setAnio(valor)
    else setMes(valor)
    setLista([])
    setCargando(true)
    setError('')
    setAviso('')
  }
  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Boletas · RRHH</p>
          <h1 className="page-title-ds">Novedades del período</h1>
          <p className="page-subtitle-ds">
            Registre bonos o descuentos individuales con un importe explícito.
          </p>
        </div>
      </header>
      {error && (
        <p role="alert" className="config-error">
          {error}
        </p>
      )}
      {aviso && <p role="status">{aviso}</p>}
      <Card title="Período y funcionario">
        <div className="config-filter">
          <Input
            label="Año"
            type="number"
            min="1900"
            max="9999"
            value={anio}
            disabled={ocupado}
            onChange={(e) => cambiarPeriodo('anio', e.target.value)}
          />
          <Select
            label="Mes"
            value={mes}
            disabled={ocupado}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: String(i + 1),
              label: String(i + 1).padStart(2, '0'),
            }))}
            onChange={(e) => cambiarPeriodo('mes', e.target.value)}
          />
          <Select
            label="Funcionario"
            placeholder="Todos (seleccione uno para registrar)"
            value={funcionarioId}
            disabled={ocupado || !catalogosListos}
            options={funcionarios.map((f) => ({
              value: f.id,
              label: `${f.nombreCompleto} · CI ${f.ci}`,
            }))}
            onChange={(e) => {
              setFuncionarioId(e.target.value)
              setLista([])
              setCargando(true)
              setAviso('')
              setError('')
            }}
          />
        </div>
        <Button
          variant="outline"
          disabled={ocupado}
          onClick={() => {
            setError('')
            setCargando(true)
            setRevision((v) => v + 1)
          }}
        >
          Actualizar catálogos y novedades
        </Button>
      </Card>
      <Card title="Registrar novedad">
        <form onSubmit={(e) => void guardar(e)}>
          <fieldset
            className="config-form"
            disabled={ocupado || !catalogosListos || !funcionarioId || !periodoValido || cargando}
          >
            <Select
              label="Concepto no automático"
              required
              placeholder="Seleccione un concepto"
              value={conceptoId}
              options={conceptos.map((c) => ({
                value: c.id,
                label: `${c.codigo} · ${c.nombre} (${c.tipo})`,
              }))}
              onChange={(e) => setConceptoId(e.target.value)}
            />
            <Input
              label="Monto de la novedad (Bs)"
              type="number"
              step="0.01"
              min="0.01"
              max="9999999999.99"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
            <Input
              label="Descripción (opcional)"
              maxLength={200}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            <p>
              Este importe corresponde solo a este funcionario y período. No se calcula ni se emite
              una planilla al guardarlo.
            </p>
            <Button type="submit">Registrar novedad</Button>
          </fieldset>
          {!conceptos.length && catalogosListos && (
            <p>Primero cree un concepto activo que no sea automático.</p>
          )}
        </form>
      </Card>
      <Card title="Novedades registradas">
        {!periodoValido ? (
          <p>Ingrese un año y mes válidos.</p>
        ) : cargando ? (
          <p role="status">Cargando novedades…</p>
        ) : (
          <div className="config-table-wrap">
            <table className="config-table">
              <thead>
                <tr>
                  <th>Funcionario</th>
                  <th>Concepto</th>
                  <th>Monto (Bs)</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((n) => (
                  <tr key={n.id}>
                    <td>
                      {funcionarios.find((f) => f.id === n.funcionarioId)?.nombreCompleto ??
                        n.funcionarioId}
                    </td>
                    <td>
                      {n.concepto.codigo} · {n.concepto.nombre}
                    </td>
                    <td>{n.monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                    <td>{n.descripcion ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!lista.length && <p>No hay novedades para este filtro.</p>}
          </div>
        )}
      </Card>
    </div>
  )
}
