import { PrioridadBadge, TagChip } from '../ui/Badge'
import { PRIORIDADES, RECURRENCIA_LABELS } from '../../models'

// Datos extra de una actividad (prioridad, recurrencia, evidencias, etiquetas)
// en una sola línea que se parte en varias en pantallas angostas.
export default function ActividadMeta({ actividad }) {
  const evidencias = actividad.evidencias?.length ?? 0
  const tags = actividad.tags ?? []
  const mostrarPrioridad = actividad.prioridad && actividad.prioridad !== PRIORIDADES.MEDIA

  if (!mostrarPrioridad && !actividad.recurrencia && !evidencias && !tags.length) return null

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {mostrarPrioridad && <PrioridadBadge prioridad={actividad.prioridad} />}
      {actividad.recurrencia && (
        <span className="inline-flex items-center gap-1 text-xs text-slate-500" title="Actividad recurrente">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M21 3l-4.5 4.5A8 8 0 1 0 20 12" />
          </svg>
          {RECURRENCIA_LABELS[actividad.recurrencia]}
        </span>
      )}
      {evidencias > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-slate-500" title={`${evidencias} evidencia(s)`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.4 11.1-6.9 6.9a4.5 4.5 0 0 1-6.4-6.4l7.6-7.6a3 3 0 0 1 4.2 4.2l-7.6 7.6a1.5 1.5 0 0 1-2.1-2.1l6.9-6.9" />
          </svg>
          {evidencias}
        </span>
      )}
      {tags.map((tag) => (
        <TagChip key={tag} tag={tag} />
      ))}
    </div>
  )
}
