import { useState } from 'react'
import Panel from '../ui/Panel'
import Icono from '../ui/Icono'
import { PrioridadBadge, TagChip } from '../ui/Badge'
import EvidenciasField from './EvidenciasField'
import { useData } from '../../context/DataContext'
import { ALERTA, ESTADOS, ESTADO_LABELS, ESTADO_LIST, RECURRENCIA_LABELS } from '../../models'
import { formatearFecha, nivelAlerta, textoRelativo } from '../../utils/alerts'
import { abrirArchivo } from '../../utils/archivos'

const ESTILO_ESTADO = {
  [ESTADOS.PENDIENTE]: 'bg-white text-slate-700 shadow-sm',
  [ESTADOS.EN_PROGRESO]: 'bg-blue-600 text-white shadow-sm',
  [ESTADOS.COMPLETADA]: 'bg-green-600 text-white shadow-sm',
}

const COLOR_FECHA = {
  [ALERTA.VENCIDA]: 'text-red-600',
  [ALERTA.PROXIMA]: 'text-amber-600',
}

function Propiedad({ icono, etiqueta, children }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 text-slate-400">
        <Icono nombre={icono} className="h-4 w-4" />
      </span>
      <span className="w-24 shrink-0 text-sm text-slate-500">{etiqueta}</span>
      <span className="min-w-0 flex-1 text-sm text-slate-800">{children}</span>
    </div>
  )
}

// Todo lo de una actividad en un panel: estado (cambio rápido), propiedades,
// textos y evidencias. Editar y eliminar quedan en el pie.
export default function ActividadDetalle({ actividadId, onClose, onEditar }) {
  const { actividadesConContexto, actualizarActividad, eliminarActividad, eliminarEvidencia, leerEvidencia } = useData()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState('')
  const actividad = actividadesConContexto.find((a) => a.id === actividadId)

  if (!actividad) return null

  const accion = (fn) => async (...args) => {
    setError('')
    try {
      await fn(...args)
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo completar la acción.')
    }
  }

  const alerta = nivelAlerta(actividad)

  return (
    <Panel
      open
      onClose={onClose}
      titulo={actividad.nombre}
      subtitulo={`${actividad.trabajoNombre} › ${actividad.funcionNombre}`}
      pie={
        confirmando ? (
          <>
            <span className="flex-1 text-sm text-slate-600">¿Mover a la papelera?</span>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={accion(async () => {
                await eliminarActividad(actividad.id)
                onClose()
              })}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Eliminar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Eliminar actividad"
            >
              <Icono nombre="eliminar" />
            </button>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => onEditar(actividad)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Icono nombre="editar" className="h-4 w-4" />
              Editar
            </button>
          </>
        )
      }
    >
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Estado">
        {ESTADO_LIST.map((estado) => (
          <button
            key={estado}
            type="button"
            aria-pressed={actividad.estado === estado}
            onClick={accion(() => actualizarActividad(actividad.id, { estado }))}
            className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
              actividad.estado === estado ? ESTILO_ESTADO[estado] : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {ESTADO_LABELS[estado]}
          </button>
        ))}
      </div>

      <div className="mt-3 divide-y divide-slate-100">
        <Propiedad icono="calendario" etiqueta="Fecha límite">
          {actividad.fecha_limite ? (
            <>
              {formatearFecha(actividad.fecha_limite)}
              {actividad.estado !== ESTADOS.COMPLETADA && (
                <span className={`ml-2 text-xs ${COLOR_FECHA[alerta] || 'text-slate-400'}`}>
                  {textoRelativo(actividad.fecha_limite)}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400">Sin fecha</span>
          )}
        </Propiedad>
        <Propiedad icono="bandera" etiqueta="Prioridad">
          <PrioridadBadge prioridad={actividad.prioridad} />
        </Propiedad>
        {actividad.recurrencia && (
          <Propiedad icono="repetir" etiqueta="Se repite">
            {RECURRENCIA_LABELS[actividad.recurrencia]}
          </Propiedad>
        )}
        {actividad.tags?.length > 0 && (
          <Propiedad icono="etiqueta" etiqueta="Etiquetas">
            <span className="flex flex-wrap gap-1">
              {actividad.tags.map((t) => (
                <TagChip key={t} tag={t} />
              ))}
            </span>
          </Propiedad>
        )}
      </div>

      {actividad.descripcion && (
        <section className="mt-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Descripción</h3>
          <p className="whitespace-pre-line text-sm text-slate-700">{actividad.descripcion}</p>
        </section>
      )}

      {actividad.notas && (
        <section className="mt-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Notas</h3>
          <p className="whitespace-pre-line rounded-xl bg-amber-50/60 px-3 py-2 text-sm text-slate-700">
            {actividad.notas}
          </p>
        </section>
      )}

      <section className="mt-4">
        <EvidenciasField
          guardadas={actividad.evidencias ?? []}
          nuevas={[]}
          onAgregar={accion((archivos) => actualizarActividad(actividad.id, { archivos }))}
          onQuitarNueva={() => {}}
          onAbrir={(nombre) =>
            abrirArchivo(nombre, () => leerEvidencia(actividad.id, nombre)).catch((err) =>
              setError(err.message || 'No se pudo abrir la evidencia.'),
            )
          }
          onEliminar={accion((nombre) => eliminarEvidencia(actividad.id, nombre))}
        />
      </section>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </Panel>
  )
}
