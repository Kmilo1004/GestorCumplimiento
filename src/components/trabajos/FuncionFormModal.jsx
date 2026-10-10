import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { Field, TextInput, TextArea } from '../ui/Field'
import CamposPersonalizadosInputs from '../configuracion/CamposPersonalizadosInputs'
import { useData } from '../../context/DataContext'

const VACIO = { nombre: '', descripcion: '', camposPersonalizados: {} }

// `trabajoId`: trabajo al que pertenece (o pertenecerá) la función.
export default function FuncionFormModal({ open, funcion, trabajoId, onClose, onSubmit }) {
  const { avisoLargoRuta } = useData()
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const esEdicion = Boolean(funcion)

  useEffect(() => {
    if (open) {
      setForm(
        funcion
          ? {
              nombre: funcion.nombre,
              descripcion: funcion.descripcion,
              camposPersonalizados: funcion.camposPersonalizados ?? {},
            }
          : VACIO,
      )
      setError('')
    }
  }, [open, funcion])

  const avisoLargo = form.nombre.trim()
    ? avisoLargoRuta('funcion', { id: funcion?.id, trabajoId: funcion?.trabajoId ?? trabajoId, nombre: form.nombre })
    : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || avisoLargo) return
    setGuardando(true)
    setError('')
    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo guardar la función.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal open={open} title={esEdicion ? 'Editar función' : 'Nueva función'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Nombre" required>
          <TextInput
            autoFocus
            required
            placeholder="Ej: Gestión de cartera vencida"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            aria-invalid={Boolean(avisoLargo)}
          />
          {avisoLargo && <span className="mt-1 block text-xs text-red-600">{avisoLargo}</span>}
        </Field>
        <Field label="Descripción">
          <TextArea
            rows={3}
            placeholder="Opcional"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </Field>
        <CamposPersonalizadosInputs
          entidad="funcion"
          valores={form.camposPersonalizados}
          onChange={(camposPersonalizados) => setForm((f) => ({ ...f, camposPersonalizados }))}
        />
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || !form.nombre.trim() || Boolean(avisoLargo)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {esEdicion ? 'Guardar cambios' : 'Crear función'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
