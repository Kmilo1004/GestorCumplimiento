import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { Field, TextInput, TextArea } from '../ui/Field'

const VACIO = { nombre: '', descripcion: '' }

export default function FuncionFormModal({ open, funcion, onClose, onSubmit }) {
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const esEdicion = Boolean(funcion)

  useEffect(() => {
    if (open) {
      setForm(funcion ? { nombre: funcion.nombre, descripcion: funcion.descripcion } : VACIO)
    }
  }, [open, funcion])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setGuardando(true)
    try {
      await onSubmit(form)
      onClose()
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
          />
        </Field>
        <Field label="Descripción">
          <TextArea
            rows={3}
            placeholder="Opcional"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || !form.nombre.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {esEdicion ? 'Guardar cambios' : 'Crear función'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
