import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { Field, TextInput, TextArea, Select } from '../ui/Field'
import { ESTADOS, ESTADO_LABELS, ESTADO_LIST } from '../../models'

const VACIO = {
  nombre: '',
  descripcion: '',
  fecha_limite: '',
  estado: ESTADOS.PENDIENTE,
  notas: '',
}

export default function ActividadFormModal({ open, actividad, onClose, onSubmit }) {
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const esEdicion = Boolean(actividad)

  useEffect(() => {
    if (open) {
      setForm(
        actividad
          ? {
              nombre: actividad.nombre,
              descripcion: actividad.descripcion,
              fecha_limite: actividad.fecha_limite || '',
              estado: actividad.estado,
              notas: actividad.notas || '',
            }
          : VACIO,
      )
    }
  }, [open, actividad])

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
    <Modal open={open} title={esEdicion ? 'Editar actividad' : 'Nueva actividad'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Nombre" required>
          <TextInput
            autoFocus
            required
            placeholder="Ej: Conciliar cartera del mes"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha límite">
            <TextInput
              type="date"
              value={form.fecha_limite}
              onChange={(e) => setForm((f) => ({ ...f, fecha_limite: e.target.value }))}
            />
          </Field>
          <Field label="Estado">
            <Select value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
              {ESTADO_LIST.map((estado) => (
                <option key={estado} value={estado}>
                  {ESTADO_LABELS[estado]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Descripción">
          <TextArea
            rows={2}
            placeholder="Opcional"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </Field>

        <Field label="Notas">
          <TextArea
            rows={2}
            placeholder="Notas de seguimiento (opcional)"
            value={form.notas}
            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
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
            {esEdicion ? 'Guardar cambios' : 'Crear actividad'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
