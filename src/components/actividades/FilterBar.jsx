import { Select, TextInput } from '../ui/Field'
import { ESTADO_LABELS, ESTADO_LIST, PRIORIDAD_LABELS, PRIORIDAD_LIST } from '../../models'

function Campo({ etiqueta, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{etiqueta}</span>
      {children}
    </label>
  )
}

// Panel de filtros (se muestra con el botón "Filtros"). Los filtros activos
// se ven como chips encima de la lista, donde también se quitan.
export default function FilterBar({ filtros, onChange, trabajos, etiquetas = [] }) {
  const set = (cambios) => onChange({ ...filtros, ...cambios })

  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
      <Campo etiqueta="Estado">
        <Select value={filtros.estado} onChange={(e) => set({ estado: e.target.value })}>
          <option value="">Todos</option>
          {ESTADO_LIST.map((estado) => (
            <option key={estado} value={estado}>
              {ESTADO_LABELS[estado]}
            </option>
          ))}
        </Select>
      </Campo>

      <Campo etiqueta="Trabajo">
        <Select value={filtros.trabajoId} onChange={(e) => set({ trabajoId: e.target.value })}>
          <option value="">Todos</option>
          {trabajos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </Select>
      </Campo>

      <Campo etiqueta="Prioridad">
        <Select value={filtros.prioridad} onChange={(e) => set({ prioridad: e.target.value })}>
          <option value="">Todas</option>
          {PRIORIDAD_LIST.map((p) => (
            <option key={p} value={p}>
              {PRIORIDAD_LABELS[p]}
            </option>
          ))}
        </Select>
      </Campo>

      <Campo etiqueta="Etiqueta">
        <Select value={filtros.etiqueta} onChange={(e) => set({ etiqueta: e.target.value })}>
          <option value="">Todas</option>
          {etiquetas.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </Select>
      </Campo>

      <Campo etiqueta="Vence desde">
        <TextInput type="date" value={filtros.desde} onChange={(e) => set({ desde: e.target.value })} />
      </Campo>

      <Campo etiqueta="Vence hasta">
        <TextInput type="date" value={filtros.hasta} onChange={(e) => set({ hasta: e.target.value })} />
      </Campo>
    </div>
  )
}
