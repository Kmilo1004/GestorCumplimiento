import { useMemo } from 'react'
import { useData } from '../../context/DataContext'
import SummaryCards from './SummaryCards'
import UpcomingList from './UpcomingList'
import ProgressBar from '../ui/ProgressBar'
import { actividadesProximasAVencer } from '../../utils/alerts'

export default function Dashboard() {
  const { arbol, resumen, actividadesConContexto } = useData()

  const proximasAVencer = useMemo(
    () => actividadesProximasAVencer(actividadesConContexto),
    [actividadesConContexto],
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-4 sm:px-6">
      <SummaryCards resumen={resumen} />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">
          Vencidas y próximas a vencer ({proximasAVencer.length})
        </h2>
        <UpcomingList actividades={proximasAVencer} />
      </section>

      {arbol.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">Cumplimiento por trabajo</h2>
          <div className="space-y-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {arbol.map((trabajo) => (
              <div key={trabajo.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="truncate text-sm text-slate-700">{trabajo.nombre}</span>
                </div>
                <ProgressBar value={trabajo.progreso} size="sm" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
