import { useState } from 'react'
import type { FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { Button, Input, Modal, useToast } from '../../../components'
import { ApiService } from '../../../services/api'
import type { ActualizarContactoInput, FichaFuncionario } from '../../../types'

interface EditarContactoModalProps {
  funcionario: FichaFuncionario | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (fichaActualizada: FichaFuncionario) => void
}

// HU-10 CA-07: Datos de contacto sin historial. El CI no se edita.
export function EditarContactoModal({
  funcionario,
  isOpen,
  onClose,
  onSuccess,
}: EditarContactoModalProps) {
  const toast = useToast()
  const [correo, setCorreo] = useState(funcionario?.correo ?? '')
  const [telefono, setTelefono] = useState(funcionario?.telefono ?? '')
  const [direccion, setDireccion] = useState(funcionario?.direccion ?? '')
  const [guardando, setGuardando] = useState(false)

  if (!funcionario) return null

  // Solo se envían los campos que cambiaron; un campo vaciado se borra con null
  const cambios: ActualizarContactoInput = {}
  const valor = (texto: string) => texto.trim() || null
  if (valor(correo) !== funcionario.correo) cambios.correo = valor(correo)
  if (valor(telefono) !== funcionario.telefono) cambios.telefono = valor(telefono)
  if (valor(direccion) !== funcionario.direccion) cambios.direccion = valor(direccion)
  const hayCambios = Object.keys(cambios).length > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!hayCambios) return

    setGuardando(true)
    try {
      const ficha = await ApiService.actualizarContacto(funcionario.id, cambios)
      toast.success('Los datos de contacto se actualizaron.', 'Contacto actualizado')
      onSuccess(ficha)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el contacto', 'Error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mail size={20} color="#2563eb" />
          <span>Editar datos de contacto</span>
        </div>
      }
      footer={
        <div className="modal-actions-right">
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={guardando || !hayCambios}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      }
    >
      <form className="modal-form-ds" onSubmit={handleSubmit}>
        <Input
          label="CI"
          value={`${funcionario.ci} ${funcionario.ciExpedido}`}
          disabled
          helperText="El CI no se puede editar."
        />
        <Input
          label="Correo"
          type="email"
          maxLength={150}
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <Input
          label="Teléfono"
          maxLength={20}
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <Input
          label="Dirección"
          maxLength={200}
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />
      </form>
    </Modal>
  )
}
