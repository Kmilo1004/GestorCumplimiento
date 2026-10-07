import { useMemo, useState } from 'react'
import { useData } from '../../context/DataContext'
import FilterBar from './FilterBar'
import ActividadListItem from './ActividadListItem'
import ActividadFormModal from '../trabajos/ActividadFormModal'
import EmptyState from '../ui/EmptyState'
import { PRIORIDAD_LIST } from '../../models'

const FILTROS_INICIALES = { estado: '', trabajoId: '', prioridad: '', etiqueta: '', desde: '', hasta: '' }

const tieneEtiqueta = (actividad, etiqueta) => {
  const buscada = etiqueta.toLocaleLowerCase('es')
  return (actividad.tags ?? []).some((t) => t.toLocaleLowerCase('es') === buscada)
}

const porFecha = (a, b) => (a.fecha_limite || '9999').localeCompare(b.fecha_limite || '9999')
const rangoPrioridad = (a) => {
  const i = PRIORIDAD_LIST.indexOf(a.prioridad)
  return i === -1 ? 1 : i
}
const ORDENES = {
  fecha: porFecha,
  prioridad: (a, b) => rangoPrioridad(a) - rangoPrioridad(b) || porFecha(a, b),
}

export default function ActividadesView() {
  const data = useData()
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [modal, setModal] = useState({ open: false, actividad: null })
  const [orden, setOrden] = useState('fecha')

  const actividadesFiltradas = useMemo(() => {
    return data.actividadesConContexto
      .filter((a) => (filtros.estado ? a.estado === filtros.estado : true))
      .filter((a) => (filtros.trabajoId ? a.trabajoId === filtros.trabajoId : true))
      .filter((a) => (filtros.prioridad ? a.prioridad === filtros.prioridad : true))
      .filter((a) => (filtros.etiqueta ? tieneEtiqueta(a, filtros.etiqueta) : true))
      .filter((a) => (filtros.desde ? (a.fecha_limite || '') >= filtros.desde : true))
      .filter((a) => (filtros.hasta ? (a.fecha_limite || '') <= filtros.hasta : true))
      .sort(ORDENES[orden])
  }, [data.actividadesConContexto, filtros, orden])

  return (
    <div className="mx-auto max-w-2xl space-y-3 px-4 py-4 sm:px-6">
      <FilterBar
        filtros={filtros}
        onChange={setFiltros}
        onLimpiar={() => setFiltros(FILTROS_INICIALES)}
        trabajos={data.trabajos} etiquetas={data.etiquetas} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-400">
          {actividadesFiltradas.length} {actividadesFiltradas.length === 1 ? 'actividad' : 'actividades'}
        </p>
        <label className="flex items-center gap-1.5 text-sm text-slate-500">
          Ordenar por
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
          >
            <option value="fecha">Fecha</option>
            <option value="prioridad">Prioridad</option>
          </select>
        </label>
      </div>

      {actividadesFiltradas.length === 0 ? (
        <EmptyState
          title="No hay actividades con estos filtros"
          description="Prueba a limpiar los filtros o crea actividades desde la pestaña Trabajos."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {actividadesFiltradas.map((actividad) => (
            <ActividadListItem
              key={actividad.id}
              actividad={actividad}
              onEdit={(a) => setModal({ open: true, actividad: a })}
              onDelete={data.eliminarActividad}
              onToggleCompletada={(a, nuevoEstado) => data.actualizarActividad(a.id, { estado: nuevoEstado })}
            />
          ))}
        </div>
      )}

      <ActividadFormModal
        open={modal.open}
        actividad={modal.actividad}
        onClose={() => setModal({ open: false, actividad: null })}
        onSubmit={(form) => data.actualizarActividad(modal.actividad.id, form)}
      />
    </div>
  )
}
