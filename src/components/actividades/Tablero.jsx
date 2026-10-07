import { useState } from 'react'
import { CasillaCompletar, IndicadoresActividad } from './ActividadFila'
import Icono from '../ui/Icono'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { ESTADOS, ESTADO_LABELS, ESTADO_LIST } from '../../models'
import { compararActividades } from '../../utils/alerts'

const PUNTO = {
  [ESTADOS.PENDIENTE]: 'bg-slate-400',
  [ESTADOS.EN_PROGRESO]: 'bg-blue-500',
  [ESTADOS.COMPLETADA]: 'bg-green-500',
}

// Tablero por estado. En PC las tarjetas se arrastran entre columnas; en el
// celular las columnas se apilan y el estado se cambia desde el detalle.
export default function Tablero({ actividades, mostrarContexto = false, onAgregar }) {
  const { actualizarActividad } = useData()
  const { abrirDetalle } = useUI()
  const [sobre, setSobre] = useState(null)

  const soltar = (estado) => (e) => {
    e.preventDefault()
    setSobre(null)
    const id = e.dataTransfer.getData('text/plain')
    const actividad = actividades.find((a) => a.id === id)
    if (actividad && actividad.estado !== estado) actualizarActividad(id, { estado })
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {ESTADO_LIST.map((estado) => {
        const columna = actividades.filter((a) => a.estado === estado).sort(compararActividades)
        return (
          <section
            key={estado}
            onDragOver={(e) => {
              e.preventDefault()
              setSobre(estado)
            }}
            onDragLeave={() => setSobre((s) => (s === estado ? null : s))}
            onDrop={soltar(estado)}
            className={`flex min-h-[8rem] flex-col rounded-2xl border p-2 transition-colors ${
              sobre === estado ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-100/60'
            }`}
          >
            <h3 className="flex items-center gap-2 px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className={`h-2 w-2 rounded-full ${PUNTO[estado]}`} />
              {ESTADO_LABELS[estado]}
              <span className="font-normal text-slate-400">{columna.length}</span>
            </h3>
            <ul className="flex flex-1 flex-col gap-2">
              {columna.map((a) => (
                <li
                  key={a.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', a.id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => abrirDetalle(a.id)}
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      abrirDetalle(a.id)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Abrir ${a.nombre}`}
                  className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300"
                >
                  <div className="flex items-start gap-2.5">
                    <CasillaCompletar actividad={a} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug ${
                          estado === ESTADOS.COMPLETADA ? 'text-slate-400 line-through' : 'text-slate-800'
                        }`}
                      >
                        {a.nombre}
                      </p>
                      {mostrarContexto && <p className="mt-0.5 truncate text-xs text-slate-400">{a.funcionNombre}</p>}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <IndicadoresActividad actividad={a} />
                  </div>
                </li>
              ))}
              {!columna.length && (
                <li className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-400">
                  Arrastra aquí
                </li>
              )}
            </ul>
            {estado === ESTADOS.PENDIENTE && onAgregar && (
              <button
                type="button"
                onClick={onAgregar}
                className="mt-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-500 hover:bg-white hover:text-brand-600"
              >
                <Icono nombre="mas" className="h-4 w-4" />
                Agregar actividad
              </button>
            )}
          </section>
        )
      })}
    </div>
  )
}
