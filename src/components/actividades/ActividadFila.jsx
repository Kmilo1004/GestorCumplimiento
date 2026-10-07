import Icono from '../ui/Icono'
import { useUI } from '../../context/UIContext'
import { useData } from '../../context/DataContext'
import { ALERTA, ESTADOS, PRIORIDADES } from '../../models'
import { fechaCorta, nivelAlerta } from '../../utils/alerts'

const CHIP_FECHA = {
  [ALERTA.VENCIDA]: 'bg-red-50 text-red-700',
  [ALERTA.PROXIMA]: 'bg-amber-50 text-amber-700',
  [ALERTA.OK]: 'bg-slate-100 text-slate-600',
  [ALERTA.COMPLETADA]: 'text-slate-400',
}

// Casilla redonda para completar/reabrir sin abrir el detalle.
export function CasillaCompletar({ actividad }) {
  const { actualizarActividad } = useData()
  const completada = actividad.estado === ESTADOS.COMPLETADA
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        actualizarActividad(actividad.id, { estado: completada ? ESTADOS.PENDIENTE : ESTADOS.COMPLETADA })
      }}
      aria-label={completada ? `Reabrir ${actividad.nombre}` : `Completar ${actividad.nombre}`}
      className="-m-1.5 shrink-0 rounded-full p-1.5"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
          completada
            ? 'border-green-500 bg-green-500 text-white'
            : actividad.estado === ESTADOS.EN_PROGRESO
              ? 'border-blue-400 text-transparent hover:text-blue-300'
              : 'border-slate-300 text-transparent hover:border-brand-400 hover:text-brand-300'
        }`}
      >
        <Icono nombre="check" className="h-3 w-3" grosor={3} />
      </span>
    </button>
  )
}

// Indicadores mínimos: solo lo que ayuda a decidir qué hacer primero.
export function IndicadoresActividad({ actividad }) {
  const alerta = nivelAlerta(actividad)
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-slate-400">
      {actividad.prioridad === PRIORIDADES.ALTA && (
        <span title="Prioridad alta" className="text-red-500">
          <Icono nombre="bandera" className="h-4 w-4" />
        </span>
      )}
      {actividad.recurrencia && (
        <span title="Se repite">
          <Icono nombre="repetir" className="h-3.5 w-3.5" />
        </span>
      )}
      {actividad.evidencias?.length > 0 && (
        <span title={`${actividad.evidencias.length} evidencia(s)`}>
          <Icono nombre="clip" className="h-3.5 w-3.5" />
        </span>
      )}
      {actividad.fecha_limite && (
        <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums ${CHIP_FECHA[alerta]}`}>
          {fechaCorta(actividad.fecha_limite)}
        </span>
      )}
    </span>
  )
}

// Una actividad en una sola línea. Tocarla abre el panel de detalle.
// mostrarContexto: false | true ("Trabajo · Función") | 'funcion' (solo la función).
export default function ActividadFila({ actividad, mostrarContexto = false }) {
  const { abrirDetalle } = useUI()
  const completada = actividad.estado === ESTADOS.COMPLETADA

  return (
    <li className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
      <CasillaCompletar actividad={actividad} />
      <button
        type="button"
        onClick={() => abrirDetalle(actividad.id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm ${completada ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {actividad.nombre}
          </span>
          {mostrarContexto && (
            <span className="block truncate text-xs text-slate-400">
              {mostrarContexto === 'funcion'
                ? actividad.funcionNombre
                : `${actividad.trabajoNombre} · ${actividad.funcionNombre}`}
            </span>
          )}
        </span>
        <IndicadoresActividad actividad={actividad} />
      </button>
    </li>
  )
}
