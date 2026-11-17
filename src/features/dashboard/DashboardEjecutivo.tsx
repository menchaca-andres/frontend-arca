import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  RefreshCw,
  UserCheck,
  UserMinus,
  XCircle,
} from 'lucide-react'
import { Badge, Button, Card } from '../../components'
import { ApiService } from '../../services/api'
import type { DashboardResponse } from '../../types'
import { formatCurrency, formatDate } from '../../utils/formatters'

export function DashboardEjecutivo() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [cargando, setCargando] = useState(true)

  const cargarDashboard = useCallback(async () => {
    setCargando(true)
    try {
      const res = await ApiService.getDashboard()
      setData(res)
    } catch {
      setData(null)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarDashboard()
  }, [cargarDashboard])

  const personal = data?.personal ?? null
  const vacaciones = data?.vacaciones ?? null
  const boletas = data?.boletas ?? null
  const servicios = data?.servicios ?? {
    personal: 'ERROR',
    vacaciones: 'ERROR',
    boletas: 'ERROR',
  }

  // Total de funcionarios activos y en prueba para calcular porcentajes por área
  const totalPersonal = (personal?.activos ?? 0) + (personal?.enPrueba ?? 0) || 1

  // Máximo para escalar las columnas del gráfico de masa salarial
  const maxMasaSalarial = Math.max(
    1,
    ...(boletas?.historialMasaSalarial?.map((h) => h.masaSalarial) ?? [1]),
  )

  const coloresArea = [
    'linear-gradient(90deg, #0d9488 0%, #14b8a6 100%)',
    'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
    'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
    'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)',
    'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
  ]

  return (
    <div className="section-block-ds">
      {/* Barra de control y estado de microservicios */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Badge variant="brand">HU-25 · Dashboard Ejecutivo</Badge>
          {data?.timestamp && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              Actualizado: {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Status Pills de los Microservicios (CA-04) */}
          <div className="service-health-pills">
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Servicios:</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                color: servicios.personal === 'OK' ? 'var(--arca-success)' : 'var(--arca-danger)',
                fontWeight: 500,
              }}
            >
              {servicios.personal === 'OK' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              Personal
            </span>
            <span style={{ color: 'var(--glass-border-dark)' }}>•</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                color: servicios.vacaciones === 'OK' ? 'var(--arca-success)' : 'var(--arca-danger)',
                fontWeight: 500,
              }}
            >
              {servicios.vacaciones === 'OK' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              Vacaciones
            </span>
            <span style={{ color: 'var(--glass-border-dark)' }}>•</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                color: servicios.boletas === 'OK' ? 'var(--arca-success)' : 'var(--arca-danger)',
                fontWeight: 500,
              }}
            >
              {servicios.boletas === 'OK' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              Boletas
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={cargarDashboard}
            disabled={cargando}
            leftIcon={<RefreshCw size={13} className={cargando ? 'animate-spin' : ''} />}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* CA-01: Tarjetas de Indicadores Clave en Grid de 4 columnas */}
      <section className="stats-grid-ds" aria-label="KPIs Ejecutivos">
        {/* Funcionarios Activos */}
        <Card className="stat-card">
          <div className="stat-icon-wrapper success">
            <UserCheck size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Funcionarios Activos</span>
            <strong className="stat-value">
              {servicios.personal === 'OK' && personal !== null ? personal.activos : 'Sin datos'}
            </strong>
            <span className="stat-footnote">
              {servicios.personal === 'OK' ? 'Personal ratificado' : 'ms-personal no disponible'}
            </span>
          </div>
        </Card>

        {/* En Prueba */}
        <Card className="stat-card">
          <div className="stat-icon-wrapper warning">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Personal en Prueba</span>
            <strong className="stat-value">
              {servicios.personal === 'OK' && personal !== null ? personal.enPrueba : 'Sin datos'}
            </strong>
            <span className="stat-footnote">
              {servicios.personal === 'OK' ? 'En evaluación laboral' : 'ms-personal no disponible'}
            </span>
          </div>
        </Card>

        {/* Bajas del Mes */}
        <Card className="stat-card">
          <div className="stat-icon-wrapper danger">
            <UserMinus size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Bajas del Mes</span>
            <strong className="stat-value">
              {servicios.personal === 'OK' && personal !== null ? personal.bajasMes : 'Sin datos'}
            </strong>
            <span className="stat-footnote">
              {servicios.personal === 'OK' ? 'Mes en curso' : 'ms-personal no disponible'}
            </span>
          </div>
        </Card>

        {/* Masa Salarial Último Período Emitido */}
        <Card className="stat-card">
          <div className="stat-icon-wrapper brand">
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Masa Salarial Emitida</span>
            <strong className="stat-value">
              {servicios.boletas === 'OK' && boletas?.masaSalarialUltimoPeriodo
                ? formatCurrency(boletas.masaSalarialUltimoPeriodo.monto)
                : 'Sin datos'}
            </strong>
            <span className="stat-footnote">
              {servicios.boletas === 'OK' && boletas?.masaSalarialUltimoPeriodo
                ? `Período ${boletas.masaSalarialUltimoPeriodo.periodoNombre} · ${boletas.masaSalarialUltimoPeriodo.totalBoletas} boletas`
                : servicios.boletas === 'OK'
                  ? 'Sin períodos emitidos'
                  : 'ms-boletas no disponible'}
            </span>
          </div>
        </Card>
      </section>

      {/* CA-02: Gráficos de Gestión (2 Columnas) */}
      <section className="dashboard-two-col">
        {/* Gráfico 1: Funcionarios por Área */}
        <Card
          title="Funcionarios por Área (CA-02)"
          subtitle="Distribución del personal activo y en prueba por área organizacional"
        >
          {servicios.personal === 'ERROR' || !personal ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-tertiary)' }}>
              <Building2 size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Sin datos de áreas
              </p>
              <p style={{ fontSize: '0.78rem' }}>ms-personal no se encuentra disponible temporalmente.</p>
            </div>
          ) : personal.funcionariosPorArea.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-tertiary)' }}>
              <p style={{ fontSize: '0.85rem' }}>No hay funcionarios asignados a áreas todavía.</p>
            </div>
          ) : (
            <div style={{ paddingTop: '8px' }}>
              {personal.funcionariosPorArea.map((item, index) => {
                const porcentaje = Math.round((item.cantidad / totalPersonal) * 100)
                const colorFondo = coloresArea[index % coloresArea.length]

                return (
                  <div key={item.area} className="area-progress-item">
                    <div className="area-progress-header">
                      <span className="area-progress-name">{item.area}</span>
                      <span className="area-progress-value">
                        {item.cantidad} {item.cantidad === 1 ? 'funcionario' : 'funcionarios'}{' '}
                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
                          ({porcentaje}%)
                        </span>
                      </span>
                    </div>
                    <div className="area-progress-track">
                      <div
                        className="area-progress-fill"
                        style={{
                          width: `${Math.max(8, porcentaje)}%`,
                          background: colorFondo,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Gráfico 2: Masa Salarial de los Últimos 6 Períodos Emitidos */}
        <Card
          title="Evolución de Masa Salarial (CA-02)"
          subtitle="Historial de remuneración bruta (Bs) de los últimos 6 períodos emitidos"
        >
          {servicios.boletas === 'ERROR' || !boletas ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-tertiary)' }}>
              <Layers size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Sin datos de masa salarial
              </p>
              <p style={{ fontSize: '0.78rem' }}>ms-boletas no se encuentra disponible temporalmente.</p>
            </div>
          ) : boletas.historialMasaSalarial.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-tertiary)' }}>
              <Calendar size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Sin períodos emitidos
              </p>
              <p style={{ fontSize: '0.78rem' }}>
                Los períodos de liquidación deben cerrarse para figurar en la masa salarial histórica.
              </p>
            </div>
          ) : (
            <div className="payroll-chart-container">
              <div className="payroll-chart-bars">
                {boletas.historialMasaSalarial.map((p) => {
                  const alturaPct = Math.max(15, Math.round((p.masaSalarial / maxMasaSalarial) * 100))

                  return (
                    <div key={p.periodoId} className="payroll-col">
                      <span className="payroll-col-amount">
                        {p.masaSalarial >= 1000
                          ? `${(p.masaSalarial / 1000).toFixed(1)}k`
                          : p.masaSalarial.toFixed(0)}
                      </span>
                      <div className="payroll-col-bar-wrap">
                        <div
                          className="payroll-col-bar"
                          style={{ height: `${alturaPct}%` }}
                          title={`Período ${p.periodoNombre}: ${formatCurrency(p.masaSalarial)} (Líq: ${formatCurrency(p.liquidoTotal)} · ${p.totalBoletas} boletas)`}
                        />
                      </div>
                      <span className="payroll-col-label">{p.periodoNombre}</span>
                    </div>
                  )
                })}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.74rem',
                  color: 'var(--text-tertiary)',
                  paddingTop: '8px',
                }}
              >
                <span>{boletas.historialMasaSalarial.length} períodos graficados</span>
                <span>Valores en Bolivianos (Bs)</span>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* CA-03: Sección de Alertas Operativas (3 Columnas) */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <AlertTriangle size={18} style={{ color: 'var(--arca-warning)' }} />
          <h3 className="section-title-ds" style={{ margin: 0 }}>
            Alertas de Gestión y Novedades (CA-03)
          </h3>
        </div>

        <div className="dashboard-three-col">
          {/* Alerta 1: Vacaciones Pendientes */}
          <Card
            title={`Vacaciones Pendientes (${servicios.vacaciones === 'OK' ? vacaciones?.solicitudesPendientes ?? 0 : '—'})`}
            subtitle="Solicitudes esperando aprobación de RRHH"
          >
            {servicios.vacaciones === 'ERROR' || !vacaciones ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--arca-danger)', padding: '12px 0' }}>
                ms-vacaciones no disponible
              </p>
            ) : vacaciones.alertas.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '12px 0' }}>
                No hay solicitudes de vacación pendientes.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                {vacaciones.alertas.slice(0, 3).map((v) => (
                  <div key={v.id} className="dashboard-alert-card">
                    <div>
                      <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                        {v.funcionarioNombre || 'Funcionario'}
                      </p>
                      <p style={{ fontSize: '0.74rem', margin: 0, color: 'var(--text-tertiary)' }}>
                        {formatDate(v.fechaInicio)} al {formatDate(v.fechaFin)}
                      </p>
                    </div>
                    <Badge variant="warning">{v.diasHabiles} días</Badge>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ marginTop: '4px', width: '100%', fontSize: '0.78rem' }}
                  onClick={() => navigate('/vacaciones')}
                >
                  Ir a Vacaciones &rarr;
                </Button>
              </div>
            )}
          </Card>

          {/* Alerta 2: Períodos de Prueba por Vencer */}
          <Card
            title={`Prueba por Vencer (${servicios.personal === 'OK' ? personal?.periodosPruebaPorVencer.length ?? 0 : '—'})`}
            subtitle="Vencimiento en los próximos 7 días"
          >
            {servicios.personal === 'ERROR' || !personal ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--arca-danger)', padding: '12px 0' }}>
                ms-personal no disponible
              </p>
            ) : personal.periodosPruebaPorVencer.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '12px 0' }}>
                Ningún período de prueba por vencer esta semana.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                {personal.periodosPruebaPorVencer.slice(0, 3).map((p) => {
                  const concluido = p.diasRestantes <= 0

                  return (
                    <div key={p.id} className="dashboard-alert-card">
                      <div>
                        <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                          {p.nombreCompleto}
                        </p>
                        <p style={{ fontSize: '0.74rem', margin: 0, color: 'var(--text-tertiary)' }}>
                          Fin: {formatDate(p.fechaVencimiento)} · CI: {p.ci}
                        </p>
                      </div>
                      <Badge variant={concluido ? 'success' : p.diasRestantes <= 2 ? 'danger' : 'warning'}>
                        {concluido ? '✓ Listo para ratificar' : `${p.diasRestantes}d restantes`}
                      </Badge>
                    </div>
                  )
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ marginTop: '4px', width: '100%', fontSize: '0.78rem' }}
                  onClick={() => navigate('/personal')}
                >
                  Ir a Padrón para Ratificar &rarr;
                </Button>
              </div>
            )}
          </Card>

          {/* Alerta 3: Cumplen Gestión Este Mes */}
          <Card
            title={`Cumplen Gestión (${servicios.personal === 'OK' ? personal?.cumplenGestionMes.length ?? 0 : '—'})`}
            subtitle="Aniversario laboral en el mes en curso"
          >
            {servicios.personal === 'ERROR' || !personal ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--arca-danger)', padding: '12px 0' }}>
                ms-personal no disponible
              </p>
            ) : personal.cumplenGestionMes.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '12px 0' }}>
                Sin aniversarios de gestión este mes.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                {personal.cumplenGestionMes.slice(0, 3).map((f) => (
                  <div key={f.id} className="dashboard-alert-card">
                    <div>
                      <p
                        style={{
                          fontWeight: 600,
                          margin: 0,
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Award size={14} style={{ color: 'var(--arca-warning)' }} />
                        {f.nombres} {f.apellidos}
                      </p>
                      <p style={{ fontSize: '0.74rem', margin: 0, color: 'var(--text-tertiary)' }}>
                        Ingreso: {formatDate(f.fechaIngreso)} · CI: {f.ci}
                      </p>
                    </div>
                    <Badge variant="brand">
                      {f.aniosCumplidos} {f.aniosCumplidos === 1 ? 'año' : 'años'}
                    </Badge>
                  </div>
                ))}
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '0.74rem',
                    color: 'var(--text-tertiary)',
                    paddingTop: '6px',
                  }}
                >
                  {personal.cumplenGestionMes.length}{' '}
                  {personal.cumplenGestionMes.length === 1
                    ? 'funcionario celebra'
                    : 'funcionarios celebran'}{' '}
                  aniversario este mes 🎉
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  )
}
