import Icono from '../ui/Icono'
import { useData } from '../../context/DataContext'
import { ESTADOS } from '../../models'

const SECCIONES = [
  { id: 'resumen', etiqueta: 'Resumen', icono: 'inicio' },
  { id: 'agenda', etiqueta: 'Agenda', icono: 'calendario' },
  { id: 'trabajos', etiqueta: 'Trabajos', icono: 'maletin' },
  { id: 'actividades', etiqueta: 'Actividades', icono: 'tareas' },
  { id: 'boveda', etiqueta: 'Bóveda', icono: 'carpeta' },
]

// Menú lateral fijo (solo PC). Bajo "Trabajos" lista cada trabajo para
// saltar directo a él.
export function MenuLateral({ seccion, trabajoId, navegar }) {
  const { arbol, boveda, actividadesPorTrabajo } = useData()
  const abiertas = (trabajoId) =>
    (actividadesPorTrabajo.get(trabajoId) ?? []).filter((a) => a.estado !== ESTADOS.COMPLETADA).length

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Icono nombre="tareas" className="h-5 w-5" grosor={2} />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900">Cumplimiento</p>
          <p className="text-xs text-slate-400">Funciones y actividades</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Secciones">
        {SECCIONES.map((s) => {
          const activa = seccion === s.id && !(s.id === 'trabajos' && trabajoId)
          return (
            <div key={s.id}>
              <button
                type="button"
                onClick={() => navegar(s.id)}
                aria-current={seccion === s.id ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activa ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icono nombre={s.icono} className="h-5 w-5" />
                {s.etiqueta}
              </button>
              {s.id === 'trabajos' && arbol.length > 0 && (
                <div className="mb-1 ml-5 mt-0.5 space-y-0.5 border-l border-slate-100 pl-3">
                  {arbol.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => navegar('trabajos', t.id)}
                      aria-current={trabajoId === t.id ? 'page' : undefined}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] ${
                        trabajoId === t.id
                          ? 'bg-brand-50 font-medium text-brand-700'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">{t.nombre}</span>
                      {abiertas(t.id) > 0 && (
                        <span className="text-xs tabular-nums text-slate-400" title="Actividades abiertas">
                          {abiertas(t.id)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
        <p className="flex items-center gap-1.5 truncate" title="Carpeta de la bóveda">
          <Icono nombre="carpeta" className="h-4 w-4 shrink-0" />
          <span className="truncate">{boveda.nombre}</span>
        </p>
      </div>
    </aside>
  )
}

// Barra inferior (solo celular y tablet).
export function MenuInferior({ seccion, navegar }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur safe-bottom lg:hidden"
      aria-label="Secciones"
    >
      <div className="mx-auto flex max-w-xl">
        {SECCIONES.map((s) => {
          const activa = seccion === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => navegar(s.id)}
              aria-current={activa ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                activa ? 'text-brand-600' : 'text-slate-400'
              }`}
            >
              <Icono nombre={s.icono} className="h-6 w-6" grosor={activa ? 2.1 : 1.7} />
              {s.etiqueta}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// Botón flotante "+" para agregar una actividad (solo celular; en PC el
// botón está en la cabecera de cada página).
export function BotonFlotante({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Nueva actividad"
      className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 active:scale-95 lg:hidden"
    >
      <Icono nombre="mas" className="h-7 w-7" grosor={2.2} />
    </button>
  )
}
