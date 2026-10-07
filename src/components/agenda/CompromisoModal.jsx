import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { Field, TextInput } from '../ui/Field'

const VACIO = { titulo: '', fecha: '', inicio: '', fin: '', hecho: false }

// Crear o editar un compromiso (reunión, cita, comité…). Se guarda en la nota
// diaria del día elegido; cambiar la fecha lo mueve a otra nota.
export default function CompromisoModal({ abierto, inicial, onClose, onGuardar, onEliminar }) {
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const esEdicion = Boolean(inicial?.compromiso)

  useEffect(() => {
    if (!abierto) return
    setForm({ ...VACIO, ...inicial?.compromiso, fecha: inicial?.fecha ?? '' })
    setError('')
  }, [abierto, inicial])

  const set = (c) => setForm((f) => ({ ...f, ...c }))

  const enviar = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.fecha) return
    if (form.fin && !form.inicio) return setError('Indica la hora de inicio o deja vacía la de fin.')
    if (form.fin && form.fin <= form.inicio) return setError('La hora de fin debe ser posterior a la de inicio.')
    setGuardando(true)
    try {
      await onGuardar({
        fecha: form.fecha,
        compromiso: { titulo: form.titulo.trim(), inicio: form.inicio, fin: form.fin, hecho: form.hecho },
      })
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo guardar el compromiso.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal open={abierto} title={esEdicion ? 'Editar compromiso' : 'Nuevo compromiso'} onClose={onClose}>
      <form onSubmit={enviar}>
        <Field label="¿Qué es?" required>
          <TextInput
            autoFocus
            required
            placeholder="Comité de convivencia"
            value={form.titulo}
            onChange={(e) => set({ titulo: e.target.value })}
          />
        </Field>
        <Field label="Día" required>
          <TextInput type="date" required value={form.fecha} onChange={(e) => set({ fecha: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Desde">
            <TextInput type="time" value={form.inicio} onChange={(e) => set({ inicio: e.target.value })} />
          </Field>
          <Field label="Hasta">
            <TextInput type="time" value={form.fin} onChange={(e) => set({ fin: e.target.value })} />
          </Field>
        </div>
        <p className="-mt-1 mb-3 text-xs text-slate-400">Sin hora = todo el día.</p>

        {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-2 flex items-center gap-2">
          {esEdicion && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await onEliminar()
                  onClose()
                } catch (err) {
                  setError(err.message || 'No se pudo eliminar.')
                }
              }}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar
            </button>
          )}
          <span className="flex-1" />
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || !form.titulo.trim() || !form.fecha}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar' : 'Agregar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
