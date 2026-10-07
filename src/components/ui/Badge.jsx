import { ALERTA_ESTILOS, ALERTA_LABELS, ALERTA_DOT } from '../../utils/alerts'
import { ESTADO_LABELS, PRIORIDAD_LABELS } from '../../models'

export function AlertaBadge({ nivel }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${ALERTA_ESTILOS[nivel]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ALERTA_DOT[nivel]}`} />
      {ALERTA_LABELS[nivel]}
    </span>
  )
}

const ESTADO_ESTILOS = {
  pendiente: 'bg-slate-100 text-slate-600',
  en_progreso: 'bg-blue-100 text-blue-700',
  completada: 'bg-green-100 text-green-700',
}

export function EstadoBadge({ estado }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_ESTILOS[estado] || ESTADO_ESTILOS.pendiente}`}>
      {ESTADO_LABELS[estado] || estado}
    </span>
  )
}

const PRIORIDAD_ESTILOS = {
  alta: 'bg-red-50 text-red-700 border-red-200',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  baja: 'bg-slate-50 text-slate-500 border-slate-200',
}

export function PrioridadBadge({ prioridad }) {
  if (!PRIORIDAD_LABELS[prioridad]) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORIDAD_ESTILOS[prioridad]}`}
      title={`Prioridad ${PRIORIDAD_LABELS[prioridad].toLowerCase()}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden="true">
        <path d="M4 3a1 1 0 0 1 1 1v.3l1.7-.4a8 8 0 0 1 5.1.5l.3.2a6 6 0 0 0 4 .4l2.5-.7A1 1 0 0 1 20 5.3v8.4a1 1 0 0 1-.7 1l-2.8.8a8 8 0 0 1-5.4-.5l-.3-.1a6 6 0 0 0-3.9-.4L5 15v6a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Z" />
      </svg>
      {PRIORIDAD_LABELS[prioridad]}
    </span>
  )
}

export function TagChip({ tag }) {
  return (
    <span className="inline-flex max-w-full items-center truncate rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
      #{tag}
    </span>
  )
}
