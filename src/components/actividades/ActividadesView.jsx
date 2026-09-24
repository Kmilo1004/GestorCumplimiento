import { useMemo, useState } from 'react'
import { useData } from '../../context/DataContext'
import FilterBar from './FilterBar'
import ActividadListItem from './ActividadListItem'
import ActividadFormModal from '../trabajos/ActividadFormModal'
import EmptyState from '../ui/EmptyState'

const FILTROS_INICIALES = { estado: '', trabajoId: '', desde: '', hasta: '' }

export default function ActividadesView() {
  const data = useData()
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [modal, setModal] = useState({ open: false, actividad: null })

  const actividadesFiltradas = useMemo(() => {
    return data.actividadesConContexto
      .filter((a) => (filtros.estado ? a.estado === filtros.estado : true))
      .filter((a) => (filtros.trabajoId ? a.trabajoId === filtros.trabajoId : true))
      .filter((a) => (filtros.desde ? (a.fecha_limite || '') >= filtros.desde : true))
      .filter((a) => (filtros.hasta ? (a.fecha_limite || '') <= filtros.hasta : true))
      .sort((a, b) => (a.fecha_limite || '9999').localeCompare(b.fecha_limite || '9999'))
  }, [data.actividadesConContexto, filtros])

  return (
    <div className="mx-auto max-w-2xl space-y-3 px-4 py-4 sm:px-6">
      <FilterBar filtros={filtros} onChange={setFiltros} trabajos={data.trabajos} />

      <p className="text-sm text-slate-400">
        {actividadesFiltradas.length} {actividadesFiltradas.length === 1 ? 'actividad' : 'actividades'}
      </p>

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
