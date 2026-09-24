import { useState } from 'react'
import { AlertaBadge, EstadoBadge } from '../ui/Badge'
import { nivelAlerta, textoRelativo } from '../../utils/alerts'
import { ESTADOS } from '../../models'

export default function ActividadListItem({ actividad, onEdit, onDelete, onToggleCompletada }) {
  const [confirmando, setConfirmando] = useState(false)
  const alerta = nivelAlerta(actividad)
  const completada = actividad.estado === ESTADOS.COMPLETADA

  return (
    <div className="flex items-start gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0">
      <button
        type="button"
        onClick={() =>
          onToggleCompletada(actividad, completada ? ESTADOS.PENDIENTE : ESTADOS.COMPLETADA)
        }
        aria-label={completada ? 'Marcar como pendiente' : 'Marcar como completada'}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          completada ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 text-transparent hover:border-brand-400'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${completada ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {actividad.nombre}
        </p>
        <p className="truncate text-xs text-slate-400">
          {actividad.trabajoNombre} · {actividad.funcionNombre}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <EstadoBadge estado={actividad.estado} />
          <AlertaBadge nivel={alerta} />
          {actividad.fecha_limite && <span className="text-xs text-slate-400">{textoRelativo(actividad.fecha_limite)}</span>}
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onEdit(actividad)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Editar actividad"
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
                onDelete(actividad.id)
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
            aria-label="Eliminar actividad"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9M4.5 6h15m-1.5 0v13.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6m3-2.5h4a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
