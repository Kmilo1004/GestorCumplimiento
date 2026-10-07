import { useMemo } from 'react'
import Header, { BotonPrincipal } from '../layout/Header'
import ProgressBar from '../ui/ProgressBar'
import Icono from '../ui/Icono'
import ListaAgrupada from '../actividades/ListaAgrupada'
import ResumenAlertas from '../trabajos/ResumenAlertas'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { contarPorUrgencia, grupoUrgencia } from '../../utils/alerts'

const URGENTES = new Set(['vencidas', 'hoy', 'semana'])

function Indicador({ etiqueta, valor, detalle, tono = 'normal', children }) {
  const color = { danger: 'text-red-600', warning: 'text-amber-600', success: 'text-green-600', normal: 'text-slate-900' }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{etiqueta}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${color[tono]}`}>{valor}</p>
      {detalle && <p className="text-xs text-slate-400">{detalle}</p>}
      {children}
    </div>
  )
}

function fechaDeHoy() {
  const texto = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Resumen: indicadores, lo que requiere atención esta semana y el avance de
// cada trabajo.
export default function Dashboard({ navegar }) {
  const { arbol, resumen, actividadesConContexto, actividadesPorTrabajo } = useData()
  const { nuevaActividad } = useUI()

  const conteo = useMemo(() => contarPorUrgencia(actividadesConContexto), [actividadesConContexto])
  const urgentes = useMemo(
    () => actividadesConContexto.filter((a) => URGENTES.has(grupoUrgencia(a))),
    [actividadesConContexto],
  )

  return (
    <>
      <Header
        title="Resumen"
        subtitle={fechaDeHoy()}
        acciones={
          <BotonPrincipal onClick={() => nuevaActividad()} soloPC>
            Nueva actividad
          </BotonPrincipal>
        }
      />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicador etiqueta="Cumplimiento general" valor={`${resumen.progresoGlobal}%`}>
            <div className="mt-2">
              <ProgressBar value={resumen.progresoGlobal} size="sm" showLabel={false} />
            </div>
          </Indicador>
          <Indicador
            etiqueta="Vencidas"
            valor={conteo.vencidas}
            tono={conteo.vencidas ? 'danger' : 'success'}
            detalle={conteo.vencidas ? 'Requieren atención' : 'Ninguna'}
          />
          <Indicador
            etiqueta="Próximos 7 días"
            valor={conteo.hoy + conteo.semana}
            tono={conteo.hoy ? 'warning' : 'normal'}
            detalle={conteo.hoy ? `${conteo.hoy} vence${conteo.hoy > 1 ? 'n' : ''} hoy` : 'Por vencer'}
          />
          <Indicador
            etiqueta="Completadas"
            valor={conteo.completadas}
            detalle={`de ${resumen.totalActividades} actividades`}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Requiere atención</h2>
            <ListaAgrupada
              actividades={urgentes}
              mostrarContexto
              vacio={
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
                  <span className="mb-2 text-green-500">
                    <Icono nombre="tareas" className="h-8 w-8" />
                  </span>
                  <p className="text-sm font-medium text-slate-700">Todo al día</p>
                  <p className="text-sm text-slate-400">Nada vencido ni por vencer en los próximos 7 días.</p>
                </div>
              }
            />
          </section>

          <section className="lg:col-span-2">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">Por trabajo</h2>
            {arbol.length === 0 ? (
              <button
                type="button"
                onClick={() => navegar('trabajos')}
                className="w-full rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500 hover:border-brand-300 hover:text-brand-600"
              >
                Registra tu primer trabajo
              </button>
            ) : (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {arbol.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => navegar('trabajos', t.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{t.nombre}</span>
                        <span className="mt-1 block">
                          <ProgressBar value={t.progreso} size="sm" />
                        </span>
                        <ResumenAlertas
                          conteo={contarPorUrgencia(actividadesPorTrabajo.get(t.id) ?? [])}
                          className="mt-1"
                        />
                      </span>
                      <span className="text-slate-300">
                        <Icono nombre="derecha" className="h-4 w-4" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
