import ProgressBar from '../ui/ProgressBar'
import { ESTADOS, ESTADO_LABELS } from '../../models'

const ESTADO_DOT = {
  [ESTADOS.PENDIENTE]: 'bg-slate-400',
  [ESTADOS.EN_PROGRESO]: 'bg-blue-500',
  [ESTADOS.COMPLETADA]: 'bg-green-500',
}

export default function SummaryCards({ resumen }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Cumplimiento general</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{resumen.progresoGlobal}%</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold text-slate-800">{resumen.totalTrabajos}</p>
              <p className="text-[11px] text-slate-400">Trabajos</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{resumen.totalFunciones}</p>
              <p className="text-[11px] text-slate-400">Funciones</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{resumen.totalActividades}</p>
              <p className="text-[11px] text-slate-400">Actividades</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={resumen.progresoGlobal} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-slate-500">Actividades por estado</p>
        <div className="space-y-2">
          {Object.entries(resumen.porEstado).map(([estado, cantidad]) => (
            <div key={estado} className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${ESTADO_DOT[estado]}`} />
              <span className="flex-1 text-slate-600">{ESTADO_LABELS[estado]}</span>
              <span className="font-semibold text-slate-800">{cantidad}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
