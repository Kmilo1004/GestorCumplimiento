import Header, { BotonPrincipal } from '../layout/Header'
import ProgressBar from '../ui/ProgressBar'
import MenuAcciones from '../ui/MenuAcciones'
import EmptyState from '../ui/EmptyState'
import ResumenAlertas from './ResumenAlertas'
import { useData } from '../../context/DataContext'
import { contarPorUrgencia } from '../../utils/alerts'

// Lista de trabajos como tarjetas: nombre, progreso y qué requiere atención.
// Tocar una tarjeta abre el trabajo.
export default function TrabajosLista({ onAbrir, onNuevo, onEditar, onEliminar }) {
  const { arbol, actividadesPorTrabajo } = useData()

  return (
    <>
      <Header
        title="Trabajos"
        subtitle="Tus cargos, roles o procesos y sus funciones"
        acciones={<BotonPrincipal onClick={onNuevo}>Nuevo trabajo</BotonPrincipal>}
      />
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        {arbol.length === 0 ? (
          <EmptyState
            title="Registra tu primer trabajo"
            description="Un trabajo puede ser tu cargo, un comité o un proceso. Dentro de él organizarás funciones y actividades."
            action={
              <button
                type="button"
                onClick={onNuevo}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Crear trabajo
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {arbol.map((t) => {
              const actividades = actividadesPorTrabajo.get(t.id) ?? []
              const conteo = contarPorUrgencia(actividades)
              return (
                <article
                  key={t.id}
                  className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:border-slate-300 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => onAbrir(t.id)}
                    className="absolute inset-0 rounded-2xl"
                    aria-label={`Abrir ${t.nombre}`}
                  />
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold leading-snug text-slate-900">{t.nombre}</h2>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {t.funciones.length} {t.funciones.length === 1 ? 'función' : 'funciones'} · {actividades.length}{' '}
                        {actividades.length === 1 ? 'actividad' : 'actividades'}
                      </p>
                    </div>
                    <MenuAcciones
                      className="relative -mr-2 -mt-1"
                      etiqueta={`Acciones de ${t.nombre}`}
                      opciones={[
                        { etiqueta: 'Editar trabajo', onClick: () => onEditar(t) },
                        { etiqueta: 'Eliminar trabajo', onClick: () => onEliminar(t), peligro: true },
                      ]}
                    />
                  </div>
                  {t.descripcion && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{t.descripcion}</p>}
                  <div className="mt-auto pt-4">
                    <ProgressBar value={t.progreso} size="sm" />
                    <ResumenAlertas conteo={conteo} className="mt-2" />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
