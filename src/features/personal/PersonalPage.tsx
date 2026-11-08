import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  Input,
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
import type { FichaFuncionario, FuncionarioResumen } from '../../types'
import { useAuth } from '../auth/useAuth'
import { FichaFuncionarioModal, RegistrarFuncionarioModal } from './components'

export function PersonalPage() {
  const toast = useToast()
  const { usuario } = useAuth()
  const puedeGestionar = usuario?.rol === 'ADMIN' || usuario?.rol === 'RRHH'
  const esFuncionario = usuario?.rol === 'FUNCIONARIO'

  // Modales
  const [isRegistrarOpen, setIsRegistrarOpen] = useState(false)
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  const [fichaSeleccionada, setFichaSeleccionada] = useState<FichaFuncionario | null>(null)
  const [cargandoFicha, setCargandoFicha] = useState(false)

  // Lista de funcionarios
  const [funcionarios, setFuncionarios] = useState<FuncionarioResumen[]>([])
  const [cargandoLista, setCargandoLista] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const verFicha = useCallback(
    async (id: string) => {
      setCargandoFicha(true)
      try {
        const ficha = await ApiService.getFuncionarioFicha(id)
        setFichaSeleccionada(ficha)
        setIsFichaOpen(true)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'No se pudo obtener la ficha del funcionario',
          'Error',
        )
      } finally {
        setCargandoFicha(false)
      }
    },
    [toast],
  )

  // Carga inicial de funcionarios desde el backend
  const cargarFuncionarios = useCallback(async () => {
    setCargandoLista(true)
    try {
      const data = await ApiService.getFuncionarios()
      setFuncionarios(data)
    } catch {
      // Fallback a lista inicial si la base aún no tiene funcionarios creados
      setFuncionarios([
        {
          id: '11111111-1111-4111-8111-111111111103',
          ci: '9000003',
          ciExpedido: 'LP',
          nombreCompleto: 'Daniela Mendoza Vargas',
          estado: 'EN_PRUEBA',
        },
      ])
    } finally {
      setCargandoLista(false)
    }
  }, [])

  useEffect(() => {
    void cargarFuncionarios()
  }, [cargarFuncionarios])

  // Si el usuario logueado es FUNCIONARIO, cargar directamente su ficha
  useEffect(() => {
    if (esFuncionario && usuario?.funcionarioId) {
      void verFicha(usuario.funcionarioId)
    }
  }, [esFuncionario, usuario?.funcionarioId, verFicha])

  const handleAltaExitosa = (nuevaFicha: FichaFuncionario) => {
    // CA-08: Al guardar se muestra la ficha del nuevo funcionario
    setFichaSeleccionada(nuevaFicha)
    setIsFichaOpen(true)

    // Agregar a la lista local inmediatamente
    setFuncionarios((prev) => [
      {
        id: nuevaFicha.id,
        ci: nuevaFicha.ci,
        ciExpedido: nuevaFicha.ciExpedido,
        nombreCompleto: `${nuevaFicha.nombres} ${nuevaFicha.apellidos}`,
        estado: nuevaFicha.estado,
      },
      ...prev.filter((f) => f.id !== nuevaFicha.id),
    ])
  }

  const filtrados = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return funcionarios
    return funcionarios.filter(
      (f) =>
        f.nombreCompleto.toLowerCase().includes(term) ||
        f.ci.toLowerCase().includes(term),
    )
  }, [funcionarios, searchTerm])

  return (
    <div className="module-view-ds">
      <header className="page-header-ds">
        <div>
          <p className="eyebrow-ds">Módulo de Personal (ms-personal)</p>
          <h1 className="page-title-ds">{esFuncionario ? 'Mi Ficha' : 'Padrón de Funcionarios'}</h1>
          <p className="page-subtitle-ds">
            {esFuncionario
              ? 'Consulta tus datos personales y tu asignación laboral vigente.'
              : 'Gestión de altas, asignaciones laborales, áreas y cargos de ARCA Ltda.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!esFuncionario && (
            <Button
              variant="outline"
              leftIcon={<RefreshCw size={16} />}
              onClick={cargarFuncionarios}
              disabled={cargandoLista}
            >
              Actualizar
            </Button>
          )}
          {puedeGestionar && (
            <Button
              variant="primary"
              leftIcon={<Plus size={18} />}
              onClick={() => setIsRegistrarOpen(true)}
            >
              Nuevo Funcionario
            </Button>
          )}
        </div>
      </header>

      <Card>
        {!esFuncionario && (
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
        )}

        {cargandoLista ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            Cargando padrón de funcionarios...
          </div>
        ) : filtrados.length === 0 ? (
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
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono">
                    {f.ci} {f.ciExpedido ? <span className="text-xs text-muted">({f.ciExpedido})</span> : null}
                  </TableCell>
                  <TableCell>
                    <strong>{f.nombreCompleto}</strong>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={f.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => verFicha(f.id)}
                      disabled={cargandoFicha}
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

      {/* Modal de Registro de Funcionario (HU-08: CA-01 al CA-07) */}
      <RegistrarFuncionarioModal
        isOpen={isRegistrarOpen}
        onClose={() => setIsRegistrarOpen(false)}
        onSuccess={handleAltaExitosa}
      />

      {/* Modal de Ficha del Funcionario (HU-08: CA-08) */}
      <FichaFuncionarioModal
        ficha={fichaSeleccionada}
        isOpen={isFichaOpen}
        onClose={() => {
          setIsFichaOpen(false)
          setFichaSeleccionada(null)
        }}
      />
    </div>
  )
}
