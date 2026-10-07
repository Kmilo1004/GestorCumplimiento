import { Select, TextInput } from '../ui/Field'
import { ESTADO_LABELS, ESTADO_LIST, PRIORIDAD_LABELS, PRIORIDAD_LIST } from '../../models'

export default function FilterBar({ filtros, onChange, onLimpiar, trabajos, etiquetas = [] }) {
  const set = (cambios) => onChange({ ...filtros, ...cambios })

  const hayFiltrosActivos = Object.values(filtros).some(Boolean)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Select value={filtros.estado} onChange={(e) => set({ estado: e.target.value })}>
          <option value="">Todos los estados</option>
          {ESTADO_LIST.map((estado) => (
            <option key={estado} value={estado}>
              {ESTADO_LABELS[estado]}
            </option>
          ))}
        </Select>

        <Select value={filtros.trabajoId} onChange={(e) => set({ trabajoId: e.target.value })}>
          <option value="">Todos los trabajos</option>
          {trabajos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </Select>

        <Select value={filtros.prioridad} onChange={(e) => set({ prioridad: e.target.value })} aria-label="Prioridad">
          <option value="">Toda prioridad</option>
          {PRIORIDAD_LIST.map((p) => (
            <option key={p} value={p}>
              Prioridad {PRIORIDAD_LABELS[p].toLowerCase()}
            </option>
          ))}
        </Select>

        <Select value={filtros.etiqueta} onChange={(e) => set({ etiqueta: e.target.value })} aria-label="Etiqueta">
          <option value="">Todas las etiquetas</option>
          {etiquetas.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </Select>

        <TextInput
          type="date"
          value={filtros.desde}
          onChange={(e) => set({ desde: e.target.value })}
          aria-label="Desde"
        />
        <TextInput
          type="date"
          value={filtros.hasta}
          onChange={(e) => set({ hasta: e.target.value })}
          aria-label="Hasta"
        />
      </div>

      {hayFiltrosActivos && (
        <button
          type="button"
          onClick={onLimpiar}
          className="mt-2 text-xs font-medium text-brand-600 hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
