import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import MenuAcciones from '../ui/MenuAcciones'
import { Field, Select, TextArea, TextInput } from '../ui/Field'
import { useData } from '../../context/DataContext'
import {
  ENTIDADES,
  ENTIDAD_LABELS,
  TIPOS_CAMPO,
  TIPO_CAMPO_LABELS,
  TIPO_CAMPO_LIST,
  claveDeCampo,
  esClaveReservada,
} from '../../models'

const CAMPO_VACIO = { etiqueta: '', tipo: TIPOS_CAMPO.TEXTO, aplicaA: ['actividad'], opciones: '' }

function fechaLegible(iso) {
  if (!iso) return '—'
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime())
    ? '—'
    : fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Formulario para crear o editar la definición de un campo. Al editar, la
// clave no cambia: es el nombre con el que ya están guardados los valores.
function FormularioCampo({ inicial, claveFija, clavesUsadas, guardando, onCancelar, onGuardar }) {
  const [form, setForm] = useState(inicial)
  const [error, setError] = useState('')
  const set = (cambios) => setForm((f) => ({ ...f, ...cambios }))
  const clave = claveFija || claveDeCampo(form.etiqueta)

  const alternarEntidad = (entidad) =>
    set({
      aplicaA: form.aplicaA.includes(entidad) ? form.aplicaA.filter((e) => e !== entidad) : [...form.aplicaA, entidad],
    })

  const handleSubmit = (e) => {
    e.preventDefault()
    const opciones = form.opciones
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean)
    if (!form.etiqueta.trim() || !clave) return setError('Escribe un nombre para el campo (con letras o números).')
    if (!claveFija && esClaveReservada(clave)) return setError('Ese nombre lo usa la app internamente. Elige otro.')
    if (!claveFija && clavesUsadas.includes(clave)) return setError('Ya existe un campo con ese nombre.')
    if (!form.aplicaA.length) return setError('Elige al menos dónde se usa el campo.')
    if (form.tipo === TIPOS_CAMPO.LISTA && !opciones.length) return setError('Escribe al menos una opción para la lista.')
    setError('')
    onGuardar({ clave, etiqueta: form.etiqueta.trim(), tipo: form.tipo, aplicaA: form.aplicaA, opciones })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
      <Field label="Nombre del campo" required>
        <TextInput
          autoFocus
          placeholder="Ej: Radicado, Normativa, Código de contrato"
          value={form.etiqueta}
          onChange={(e) => set({ etiqueta: e.target.value })}
        />
        {clave && (
          <span className="mt-1 block break-all text-xs text-slate-400">
            En tus archivos se guarda como <span className="font-mono text-slate-600">{clave}:</span>
            {claveFija && ' (no cambia al renombrar, para no perder lo guardado)'}
          </span>
        )}
      </Field>

      <Field label="Tipo">
        <Select value={form.tipo} onChange={(e) => set({ tipo: e.target.value })}>
          {TIPO_CAMPO_LIST.map((t) => (
            <option key={t} value={t}>
              {TIPO_CAMPO_LABELS[t]}
            </option>
          ))}
        </Select>
      </Field>

      {form.tipo === TIPOS_CAMPO.LISTA && (
        <Field label="Opciones (una por línea)" required>
          <TextArea
            rows={3}
            placeholder={'Pendiente\nEn trámite\nFinalizado'}
            value={form.opciones}
            onChange={(e) => set({ opciones: e.target.value })}
          />
        </Field>
      )}

      <fieldset className="mb-3">
        <legend className="mb-1 text-sm font-medium text-slate-700">Se usa en</legend>
        <div className="flex flex-wrap gap-2">
          {ENTIDADES.map((entidad) => (
            <label
              key={entidad}
              className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={form.aplicaA.includes(entidad)}
                onChange={() => alternarEntidad(entidad)}
                className="h-4 w-4 accent-brand-600"
              />
              {ENTIDAD_LABELS[entidad]}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar campo'}
        </button>
      </div>
    </form>
  )
}

// Configuración de la bóveda: campos personalizados y datos de la carpeta.
export default function ConfiguracionModal({ open, onClose }) {
  const { boveda, camposPersonalizados, guardarCamposPersonalizados, leerInfoBoveda } = useData()
  const [editando, setEditando] = useState(null) // null | 'nuevo' | clave
  const [porEliminar, setPorEliminar] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState(null)

  useEffect(() => {
    if (!open) return
    setEditando(null)
    setError('')
    let activo = true
    leerInfoBoveda()
      .then((datos) => activo && setInfo(datos))
      .catch(() => activo && setInfo(null))
    return () => {
      activo = false
    }
  }, [open, leerInfoBoveda])

  const guardarLista = async (lista) => {
    setGuardando(true)
    setError('')
    try {
      await guardarCamposPersonalizados(lista)
      return true
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo guardar la configuración.')
      return false
    } finally {
      setGuardando(false)
    }
  }

  const guardarCampo = async (campo) => {
    const lista =
      editando === 'nuevo'
        ? [...camposPersonalizados, campo]
        : camposPersonalizados.map((c) => (c.clave === editando ? campo : c))
    if (await guardarLista(lista)) setEditando(null)
  }

  const eliminarCampo = async () => {
    const clave = porEliminar.clave
    setPorEliminar(null)
    await guardarLista(camposPersonalizados.filter((c) => c.clave !== clave))
  }

  const campoEnEdicion = camposPersonalizados.find((c) => c.clave === editando)

  return (
    <Modal open={open} title="Configuración" onClose={onClose} size="lg">
      <section>
        <h3 className="text-sm font-semibold text-slate-800">Campos personalizados</h3>
        <p className="mt-1 text-sm text-slate-500">
          Agrega campos para guardar más información (radicado, normativa, responsable…). Aparecen en los formularios
          y se guardan en el frontmatter de cada archivo, así también los ves en Obsidian.
        </p>

        {camposPersonalizados.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {camposPersonalizados.map((campo) =>
              editando === campo.clave ? (
                <li key={campo.clave} className="p-2">
                  <FormularioCampo
                    inicial={{ ...campo, opciones: campo.opciones.join('\n') }}
                    claveFija={campo.clave}
                    clavesUsadas={[]}
                    guardando={guardando}
                    onCancelar={() => setEditando(null)}
                    onGuardar={guardarCampo}
                  />
                </li>
              ) : (
                <li key={campo.clave} className="flex items-center gap-2 py-1 pl-3 pr-1">
                  <div className="min-w-0 flex-1 py-1.5">
                    <p className="truncate text-sm font-medium text-slate-800">{campo.etiqueta}</p>
                    <p className="truncate text-xs text-slate-400">
                      {TIPO_CAMPO_LABELS[campo.tipo]} · {campo.aplicaA.map((e) => ENTIDAD_LABELS[e]).join(', ')}
                    </p>
                  </div>
                  <MenuAcciones
                    etiqueta={`Acciones de ${campo.etiqueta}`}
                    opciones={[
                      { etiqueta: 'Editar', onClick: () => setEditando(campo.clave) },
                      { etiqueta: 'Eliminar', onClick: () => setPorEliminar(campo), peligro: true },
                    ]}
                  />
                </li>
              ),
            )}
          </ul>
        ) : (
          editando !== 'nuevo' && (
            <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
              Aún no tienes campos personalizados.
            </p>
          )
        )}

        <div className="mt-3">
          {editando === 'nuevo' ? (
            <FormularioCampo
              inicial={CAMPO_VACIO}
              clavesUsadas={camposPersonalizados.map((c) => c.clave)}
              guardando={guardando}
              onCancelar={() => setEditando(null)}
              onGuardar={guardarCampo}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditando('nuevo')}
              disabled={Boolean(campoEnEdicion)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              + Agregar campo
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
      </section>

      <section className="mt-6 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-800">Acerca de esta bóveda</h3>
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-slate-500">Carpeta</dt>
          <dd className="break-all font-medium text-slate-800">{boveda.nombre}</dd>
          <dt className="text-slate-500">Creada</dt>
          <dd className="text-slate-800">{fechaLegible(info?.creadoEn)}</dd>
          <dt className="text-slate-500">Formato</dt>
          <dd className="text-slate-800">{info?.formato ?? '—'}</dd>
        </dl>
        <p className="mt-2 text-xs text-slate-400">
          Los campos se definen en <span className="font-mono">.cumplimiento/campos.json</span>, dentro de la carpeta:
          viajan con la bóveda si la copias o respaldas.
        </p>
      </section>

      <ConfirmDialog
        open={Boolean(porEliminar)}
        title="Eliminar campo"
        message={`¿Eliminar el campo "${porEliminar?.etiqueta ?? ''}"? Los valores ya guardados en tus archivos no se borran; solo dejan de mostrarse en la app.`}
        onConfirm={eliminarCampo}
        onCancel={() => setPorEliminar(null)}
      />
    </Modal>
  )
}
