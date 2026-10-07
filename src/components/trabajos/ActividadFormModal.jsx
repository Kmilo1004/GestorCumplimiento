import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { Field, TextInput, TextArea, Select } from '../ui/Field'
import TagInput from '../ui/TagInput'
import EvidenciasField from '../actividades/EvidenciasField'
import { useData } from '../../context/DataContext'
import {
  ESTADOS,
  ESTADO_LABELS,
  ESTADO_LIST,
  PRIORIDADES,
  PRIORIDAD_LABELS,
  PRIORIDAD_LIST,
  RECURRENCIA_LABELS,
  RECURRENCIA_LIST,
} from '../../models'
import { nombreDePeriodo, serieDe } from '../../utils/recurrencia'
import { abrirArchivo } from '../../utils/archivos'

const VACIO = {
  nombre: '',
  descripcion: '',
  fecha_limite: '',
  estado: ESTADOS.PENDIENTE,
  notas: '',
  prioridad: PRIORIDADES.MEDIA,
  tags: [],
  recurrencia: '',
}

export default function ActividadFormModal({ open, actividad, onClose, onSubmit }) {
  const { etiquetas, leerEvidencia, eliminarEvidencia } = useData()
  const [form, setForm] = useState(VACIO)
  const [archivos, setArchivos] = useState([]) // File[] por adjuntar al guardar
  const [evidencias, setEvidencias] = useState([]) // nombres ya guardados en la bóveda
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const esEdicion = Boolean(actividad)

  useEffect(() => {
    if (open) {
      setForm(
        actividad
          ? {
              // En una recurrente se edita la serie; el periodo se agrega solo.
              nombre: actividad.recurrencia ? serieDe(actividad) : actividad.nombre,
              descripcion: actividad.descripcion,
              fecha_limite: actividad.fecha_limite || '',
              estado: actividad.estado,
              notas: actividad.notas || '',
              prioridad: actividad.prioridad || PRIORIDADES.MEDIA,
              tags: actividad.tags ?? [],
              recurrencia: actividad.recurrencia || '',
            }
          : VACIO,
      )
      setArchivos([])
      setEvidencias(actividad?.evidencias ?? [])
      setError('')
    }
  }, [open, actividad])

  const set = (cambios) => setForm((f) => ({ ...f, ...cambios }))
  const faltaFecha = Boolean(form.recurrencia) && !form.fecha_limite
  const nombreFinal =
    form.recurrencia && form.fecha_limite && form.nombre.trim()
      ? nombreDePeriodo(form.nombre.trim(), form.fecha_limite, form.recurrencia)
      : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || faltaFecha) return
    setGuardando(true)
    setError('')
    try {
      await onSubmit({ ...form, serie: form.recurrencia ? form.nombre.trim() : '', archivos })
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo guardar la actividad.')
    } finally {
      setGuardando(false)
    }
  }

  const abrirEvidencia = (nombre) =>
    abrirArchivo(nombre, () => leerEvidencia(actividad.id, nombre)).catch((err) =>
      setError(err.message || 'No se pudo abrir la evidencia.'),
    )

  const quitarEvidencia = async (nombre) => {
    try {
      const actualizada = await eliminarEvidencia(actividad.id, nombre)
      setEvidencias(actualizada.evidencias)
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la evidencia.')
    }
  }

  return (
    <Modal open={open} title={esEdicion ? 'Editar actividad' : 'Nueva actividad'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <Field label={form.recurrencia ? 'Nombre (se le agrega el periodo)' : 'Nombre'} required>
          <TextInput
            autoFocus
            required
            placeholder={form.recurrencia ? 'Ej: Informe mensual de gestión' : 'Ej: Conciliar cartera del mes'}
            value={form.nombre}
            onChange={(e) => set({ nombre: e.target.value })}
          />
          {nombreFinal && (
            <span className="mt-1 block text-xs text-slate-400">
              Se guardará como <span className="font-medium text-slate-600">{nombreFinal}</span>
            </span>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha límite" required={Boolean(form.recurrencia)}>
            <TextInput type="date" value={form.fecha_limite} onChange={(e) => set({ fecha_limite: e.target.value })} />
          </Field>
          <Field label="Estado">
            <Select value={form.estado} onChange={(e) => set({ estado: e.target.value })}>
              {ESTADO_LIST.map((estado) => (
                <option key={estado} value={estado}>
                  {ESTADO_LABELS[estado]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridad">
            <Select value={form.prioridad} onChange={(e) => set({ prioridad: e.target.value })}>
              {PRIORIDAD_LIST.map((p) => (
                <option key={p} value={p}>
                  {PRIORIDAD_LABELS[p]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Se repite">
            <Select value={form.recurrencia} onChange={(e) => set({ recurrencia: e.target.value })}>
              <option value="">No se repite</option>
              {RECURRENCIA_LIST.map((r) => (
                <option key={r} value={r}>
                  {RECURRENCIA_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {form.recurrencia && (
          <p className={`-mt-1 mb-3 text-xs ${faltaFecha ? 'text-amber-600' : 'text-slate-400'}`}>
            {faltaFecha
              ? 'Indica la fecha límite para calcular los periodos.'
              : 'Al completarla se creará automáticamente la del siguiente periodo.'}
          </p>
        )}

        <div className="mb-3">
          <span className="mb-1 block text-sm font-medium text-slate-700">Etiquetas</span>
          <TagInput value={form.tags} onChange={(tags) => set({ tags })} sugerencias={etiquetas} />
        </div>

        <Field label="Descripción">
          <TextArea
            rows={2}
            placeholder="Opcional"
            value={form.descripcion}
            onChange={(e) => set({ descripcion: e.target.value })}
          />
        </Field>

        <Field label="Notas">
          <TextArea
            rows={2}
            placeholder="Notas de seguimiento (opcional)"
            value={form.notas}
            onChange={(e) => set({ notas: e.target.value })}
          />
        </Field>

        <EvidenciasField
          guardadas={evidencias}
          nuevas={archivos}
          onAgregar={(nuevos) => setArchivos((a) => [...a, ...nuevos])}
          onQuitarNueva={(i) => setArchivos((a) => a.filter((_, j) => j !== i))}
          onAbrir={abrirEvidencia}
          onEliminar={quitarEvidencia}
        />

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || !form.nombre.trim() || faltaFecha}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear actividad'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
