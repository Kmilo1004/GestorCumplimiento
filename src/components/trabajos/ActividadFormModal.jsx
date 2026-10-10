import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Icono from '../ui/Icono'
import { Field, TextInput, TextArea, Select } from '../ui/Field'
import TagInput from '../ui/TagInput'
import EvidenciasField from '../actividades/EvidenciasField'
import CamposPersonalizadosInputs from '../configuracion/CamposPersonalizadosInputs'
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
  funcionId: '',
  descripcion: '',
  fecha_limite: '',
  estado: ESTADOS.PENDIENTE,
  notas: '',
  prioridad: PRIORIDADES.MEDIA,
  tags: [],
  recurrencia: '',
  camposPersonalizados: {},
}

// Formulario de actividad. Al crear muestra solo lo esencial (nombre,
// función, fecha, prioridad); el resto se despliega con "Más opciones".
// `funcionId` es la función preseleccionada al crear.
export default function ActividadFormModal({
  open,
  actividad,
  funcionId,
  valoresIniciales,
  onClose,
  onSubmit,
  onIrATrabajos,
}) {
  const { arbol, etiquetas, leerEvidencia, eliminarEvidencia, camposPersonalizados, avisoLargoRuta } = useData()
  const [form, setForm] = useState(VACIO)
  const [masOpciones, setMasOpciones] = useState(false)
  const [archivos, setArchivos] = useState([]) // File[] por adjuntar al guardar
  const [evidencias, setEvidencias] = useState([]) // nombres ya guardados en la bóveda
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const esEdicion = Boolean(actividad)
  const hayFunciones = arbol.some((t) => t.funciones.length)

  useEffect(() => {
    if (!open) return
    setForm(
      actividad
        ? {
            // En una recurrente se edita la serie; el periodo se agrega solo.
            nombre: actividad.recurrencia ? serieDe(actividad) : actividad.nombre,
            funcionId: actividad.funcionId,
            descripcion: actividad.descripcion,
            fecha_limite: actividad.fecha_limite || '',
            estado: actividad.estado,
            notas: actividad.notas || '',
            prioridad: actividad.prioridad || PRIORIDADES.MEDIA,
            tags: actividad.tags ?? [],
            recurrencia: actividad.recurrencia || '',
            camposPersonalizados: actividad.camposPersonalizados ?? {},
          }
        : { ...VACIO, ...valoresIniciales, funcionId: funcionId || '' },
    )
    setMasOpciones(Boolean(actividad))
    setArchivos([])
    setEvidencias(actividad?.evidencias ?? [])
    setError('')
    // `arbol` no va en las dependencias: cambia en cada guardado y borraría
    // lo que el usuario está escribiendo. La función por defecto la decide
    // quien abre el formulario (UIContext).
  }, [open, actividad, funcionId, valoresIniciales])

  const set = (cambios) => setForm((f) => ({ ...f, ...cambios }))
  // Si la función preseleccionada ya no existe (URL vieja, cambio hecho en
  // Obsidian), se usa la primera disponible: lo que se ve es lo que se guarda.
  const existeFuncion = arbol.some((t) => t.funciones.some((f) => f.id === form.funcionId))
  const funcionElegida = existeFuncion ? form.funcionId : (arbol.find((t) => t.funciones.length)?.funciones[0]?.id ?? '')
  const faltaFecha = Boolean(form.recurrencia) && !form.fecha_limite
  const nombreFinal =
    form.recurrencia && form.fecha_limite && form.nombre.trim()
      ? nombreDePeriodo(form.nombre.trim(), form.fecha_limite, form.recurrencia)
      : ''
  // Se revisa con el nombre que tendrá el archivo (en una recurrente, con el periodo).
  const avisoLargo =
    form.nombre.trim() && funcionElegida
      ? avisoLargoRuta('actividad', {
          id: actividad?.id,
          funcionId: funcionElegida,
          nombre: nombreFinal || form.nombre.trim(),
        })
      : ''
  const hayCamposPersonalizados = camposPersonalizados.some((c) => c.aplicaA.includes('actividad'))
  const camposConValor = Object.values(form.camposPersonalizados).filter((v) => String(v ?? '').trim()).length
  const extrasUsados =
    [form.recurrencia, form.tags.length, form.descripcion, form.notas, archivos.length].filter(Boolean).length +
    camposConValor

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !funcionElegida || avisoLargo) return
    if (faltaFecha) {
      setMasOpciones(true)
      setError('Indica la fecha límite: la necesita una actividad que se repite.')
      return
    }
    setGuardando(true)
    setError('')
    try {
      await onSubmit({
        ...form,
        funcionId: funcionElegida,
        serie: form.recurrencia ? form.nombre.trim() : '',
        archivos,
      })
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo guardar la actividad.')
    } finally {
      setGuardando(false)
    }
  }

  const quitarEvidencia = async (nombre) => {
    try {
      const actualizada = await eliminarEvidencia(actividad.id, nombre)
      setEvidencias(actualizada.evidencias)
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la evidencia.')
    }
  }

  if (open && !hayFunciones) {
    return (
      <Modal open title="Nueva actividad" onClose={onClose}>
        <p className="text-sm text-slate-600">
          Las actividades se organizan dentro de un trabajo y una función. Crea primero un trabajo y agrégale una
          función (por ejemplo, “Secretaría de Hacienda” → “Gestión presupuestal”).
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onClose()
              onIrATrabajos?.()
            }}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Ir a Trabajos
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} title={esEdicion ? 'Editar actividad' : 'Nueva actividad'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <Field label={form.recurrencia ? 'Nombre (se le agrega el periodo)' : '¿Qué hay que hacer?'} required>
          <TextInput
            autoFocus
            required
            placeholder="Revisar solicitudes de CDP"
            value={form.nombre}
            onChange={(e) => set({ nombre: e.target.value })}
            aria-invalid={Boolean(avisoLargo)}
          />
          {avisoLargo && <span className="mt-1 block text-xs text-red-600">{avisoLargo}</span>}
          {nombreFinal && (
            <span className="mt-1 block text-xs text-slate-400">
              Se guardará como <span className="font-medium text-slate-600">{nombreFinal}</span>
            </span>
          )}
        </Field>

        <Field label="Función" required>
          <Select value={funcionElegida} onChange={(e) => set({ funcionId: e.target.value })} required>
            {arbol
              .filter((t) => t.funciones.length)
              .map((t) => (
                <optgroup key={t.id} label={t.nombre}>
                  {t.funciones.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </optgroup>
              ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha límite" required={Boolean(form.recurrencia)}>
            <TextInput type="date" value={form.fecha_limite} onChange={(e) => set({ fecha_limite: e.target.value })} />
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
        </div>

        <button
          type="button"
          onClick={() => setMasOpciones((v) => !v)}
          aria-expanded={masOpciones}
          className="mb-3 flex w-full items-center gap-2 rounded-lg py-2 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <span className={`transition-transform ${masOpciones ? '' : '-rotate-90'}`}>
            <Icono nombre="abajo" className="h-4 w-4" />
          </span>
          Más opciones
          {!masOpciones && extrasUsados > 0 && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{extrasUsados}</span>
          )}
          {!masOpciones && (
            <span className="min-w-0 truncate font-normal text-slate-400">
              {hayCamposPersonalizados ? 'tus campos, ' : ''}estado, repetición, etiquetas, notas, evidencias
            </span>
          )}
        </button>

        {masOpciones && (
          <div className="mb-1 border-l-2 border-slate-100 pl-3">
            <CamposPersonalizadosInputs
              entidad="actividad"
              valores={form.camposPersonalizados}
              onChange={(campos) => set({ camposPersonalizados: campos })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Estado">
                <Select value={form.estado} onChange={(e) => set({ estado: e.target.value })}>
                  {ESTADO_LIST.map((estado) => (
                    <option key={estado} value={estado}>
                      {ESTADO_LABELS[estado]}
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
                placeholder="Qué incluye o para qué sirve"
                value={form.descripcion}
                onChange={(e) => set({ descripcion: e.target.value })}
              />
            </Field>

            <Field label="Notas">
              <TextArea
                rows={2}
                placeholder="Avances, radicados, pendientes"
                value={form.notas}
                onChange={(e) => set({ notas: e.target.value })}
              />
            </Field>

            <EvidenciasField
              guardadas={evidencias}
              nuevas={archivos}
              onAgregar={(nuevos) => setArchivos((a) => [...a, ...nuevos])}
              onQuitarNueva={(i) => setArchivos((a) => a.filter((_, j) => j !== i))}
              onAbrir={(nombre) =>
                abrirArchivo(nombre, () => leerEvidencia(actividad.id, nombre)).catch((err) =>
                  setError(err.message || 'No se pudo abrir la evidencia.'),
                )
              }
              onEliminar={quitarEvidencia}
            />
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || !form.nombre.trim() || !funcionElegida || Boolean(avisoLargo)}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Agregar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
