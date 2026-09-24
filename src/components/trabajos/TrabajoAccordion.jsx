import { useState } from 'react'
import ProgressBar from '../ui/ProgressBar'
import FuncionAccordion from './FuncionAccordion'

export default function TrabajoAccordion({
  trabajo,
  funcionesAbiertas,
  onToggleFuncion,
  onEditarTrabajo,
  onEliminarTrabajo,
  onNuevaFuncion,
  onEditarFuncion,
  onEliminarFuncion,
  onNuevaActividad,
  onEditarActividad,
  onEliminarActividad,
  onToggleActividadCompletada,
}) {
  const [abierto, setAbierto] = useState(true)
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3">
        <button type="button" onClick={() => setAbierto((v) => !v)} className="flex flex-1 items-center gap-2.5 text-left">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${abierto ? 'rotate-90' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-slate-900">{trabajo.nombre}</p>
            {trabajo.descripcion && <p className="truncate text-xs text-slate-400">{trabajo.descripcion}</p>}
            <div className="mt-1.5">
              <ProgressBar value={trabajo.progreso} />
            </div>
          </div>
        </button>

        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => onEditarTrabajo(trabajo)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Editar trabajo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.86 4.49 2.65 2.65a1 1 0 0 1 0 1.41L8.57 19.49l-4.24.94.94-4.24L16.15 4.24a1 1 0 0 1 .7-.29c.27 0 .53.1.7.29z" />
            </svg>
          </button>
          {confirmando ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onEliminarTrabajo(trabajo.id)
                  setConfirmando(false)
                }}
                className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white"
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
              aria-label="Eliminar trabajo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9M4.5 6h15m-1.5 0v13.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6m3-2.5h4a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {abierto && (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 p-2.5">
          {trabajo.funciones.length === 0 ? (
            <p className="px-2 py-2 text-xs text-slate-400">Sin funciones todavía.</p>
          ) : (
            trabajo.funciones.map((funcion) => (
              <FuncionAccordion
                key={funcion.id}
                funcion={funcion}
                abierta={Boolean(funcionesAbiertas[funcion.id])}
                onToggle={() => onToggleFuncion(funcion.id)}
                onEditar={onEditarFuncion}
                onEliminar={onEliminarFuncion}
                onNuevaActividad={onNuevaActividad}
                onEditarActividad={onEditarActividad}
                onEliminarActividad={onEliminarActividad}
                onToggleActividadCompletada={onToggleActividadCompletada}
              />
            ))
          )}
          <button
            type="button"
            onClick={() => onNuevaFuncion(trabajo)}
            className="flex w-full items-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-brand-600 hover:bg-brand-50/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva función
          </button>
        </div>
      )}
    </div>
  )
}
