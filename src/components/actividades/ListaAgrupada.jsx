import { useState } from 'react'
import ActividadFila from './ActividadFila'
import Icono from '../ui/Icono'
import { agruparPorUrgencia } from '../../utils/alerts'

const COLOR_TITULO = {
  danger: 'text-red-600',
  warning: 'text-amber-600',
  normal: 'text-slate-500',
  muted: 'text-slate-400',
}

// Actividades agrupadas por urgencia: Vencidas, Hoy, Próximos 7 días, Más
// adelante, Sin fecha y Completadas (plegada al inicio).
export default function ListaAgrupada({ actividades, mostrarContexto = false, onAgregar, vacio = null }) {
  const [abiertos, setAbiertos] = useState({ completadas: false })
  const grupos = agruparPorUrgencia(actividades)

  if (!grupos.length && !onAgregar) return vacio

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {!grupos.length && vacio}
      {grupos.map((grupo) => {
        const abierto = abiertos[grupo.id] ?? true
        return (
          <section key={grupo.id} className="border-b border-slate-100 last:border-b-0">
            <button
              type="button"
              onClick={() => setAbiertos((a) => ({ ...a, [grupo.id]: !abierto }))}
              className="flex w-full items-center gap-2 px-4 pb-1.5 pt-3 text-left"
              aria-expanded={abierto}
            >
              <span className={`text-xs font-semibold uppercase tracking-wide ${COLOR_TITULO[grupo.tono]}`}>
                {grupo.titulo}
              </span>
              <span className="text-xs text-slate-400">{grupo.actividades.length}</span>
              <span className={`ml-auto text-slate-300 transition-transform ${abierto ? '' : '-rotate-90'}`}>
                <Icono nombre="abajo" className="h-4 w-4" />
              </span>
            </button>
            {abierto && (
              <ul className="pb-1">
                {grupo.actividades.map((a) => (
                  <ActividadFila key={a.id} actividad={a} mostrarContexto={mostrarContexto} />
                ))}
              </ul>
            )}
          </section>
        )
      })}
      {onAgregar && (
        <button
          type="button"
          onClick={onAgregar}
          className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm text-slate-500 hover:bg-slate-50 hover:text-brand-600"
        >
          <Icono nombre="mas" className="h-5 w-5" />
          Agregar actividad
        </button>
      )}
    </div>
  )
}
