import { ALERTA_ESTILOS, ALERTA_LABELS, ALERTA_DOT } from '../../utils/alerts'
import { ESTADO_LABELS } from '../../models'

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
