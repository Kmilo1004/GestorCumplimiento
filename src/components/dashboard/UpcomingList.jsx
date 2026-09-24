import { AlertaBadge } from '../ui/Badge'
import { nivelAlerta, textoRelativo } from '../../utils/alerts'
import EmptyState from '../ui/EmptyState'

export default function UpcomingList({ actividades }) {
  if (actividades.length === 0) {
    return (
      <EmptyState
        title="Nada vencido ni próximo a vencer"
        description="Las actividades vencidas o a menos de 2 días de su fecha límite aparecerán aquí."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {actividades.map((actividad) => (
        <div key={actividad.id} className="flex items-start justify-between gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{actividad.nombre}</p>
            <p className="truncate text-xs text-slate-400">
              {actividad.trabajoNombre} · {actividad.funcionNombre}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">{textoRelativo(actividad.fecha_limite)}</p>
          </div>
          <AlertaBadge nivel={nivelAlerta(actividad)} />
        </div>
      ))}
    </div>
  )
}
