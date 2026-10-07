import Header, { BotonPrincipal } from '../layout/Header'
import ProgressBar from '../ui/ProgressBar'
import MenuAcciones from '../ui/MenuAcciones'
import EmptyState from '../ui/EmptyState'
import Icono from '../ui/Icono'
import ResumenAlertas from './ResumenAlertas'
import VistaActividades, { CLAVE_VISTA, SelectorVista } from '../actividades/VistaActividades'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { usePreferencia } from '../../hooks/usePreferencia'
import { contarPorUrgencia } from '../../utils/alerts'

function Pestana({ activa, onClick, children, cantidad }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        activa
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
      }`}
    >
      {children}
      <span className={`text-xs tabular-nums ${activa ? 'text-slate-300' : 'text-slate-400'}`}>{cantidad}</span>
    </button>
  )
}

// Página de un trabajo: cabecera con progreso, pestañas por función y las
// actividades (lista o tablero) de la función elegida o de todas.
export default function TrabajoDetalle({
  trabajoId,
  funcionId,
  onVolver,
  onElegirFuncion,
  onEditarTrabajo,
  onEliminarTrabajo,
  onNuevaFuncion,
  onEditarFuncion,
  onEliminarFuncion,
}) {
  const { arbol, actividadesPorTrabajo } = useData()
  const { nuevaActividad } = useUI()
  const [vista, setVista] = usePreferencia(CLAVE_VISTA, 'lista')

  const trabajo = arbol.find((t) => t.id === trabajoId)
  if (!trabajo) {
    return (
      <>
        <Header title="Trabajo no encontrado" volver={{ etiqueta: 'Trabajos', onClick: onVolver }} />
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <EmptyState title="Este trabajo ya no existe" description="Puede que se haya eliminado o renombrado." />
        </div>
      </>
    )
  }

  const funcion = trabajo.funciones.find((f) => f.id === funcionId) ?? null
  const delTrabajo = actividadesPorTrabajo.get(trabajo.id) ?? []
  const visibles = funcion ? delTrabajo.filter((a) => a.funcionId === funcion.id) : delTrabajo
  const agregar = () => nuevaActividad(funcion?.id ?? trabajo.funciones[0]?.id)

  return (
    <>
      <Header
        title={trabajo.nombre}
        subtitle={trabajo.descripcion}
        volver={{ etiqueta: 'Trabajos', onClick: onVolver }}
        acciones={
          <>
            {trabajo.funciones.length > 0 && (
              <BotonPrincipal onClick={agregar} soloPC>
                Nueva actividad
              </BotonPrincipal>
            )}
            <MenuAcciones
              etiqueta="Acciones del trabajo"
              opciones={[
                { etiqueta: 'Nueva función', onClick: () => onNuevaFuncion(trabajo) },
                { etiqueta: 'Editar trabajo', onClick: () => onEditarTrabajo(trabajo) },
                { etiqueta: 'Eliminar trabajo', onClick: () => onEliminarTrabajo(trabajo), peligro: true },
              ]}
            />
          </>
        }
      />

      <div className="mx-auto max-w-5xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <div className="sm:w-64">
            <ProgressBar value={trabajo.progreso} size="sm" />
          </div>
          <ResumenAlertas conteo={contarPorUrgencia(delTrabajo)} />
        </div>

        {trabajo.funciones.length === 0 ? (
          <EmptyState
            title="Agrega la primera función"
            description="Las funciones agrupan las actividades de este trabajo (por ejemplo, “Gestión presupuestal” o “Atención al ciudadano”)."
            action={
              <button
                type="button"
                onClick={() => onNuevaFuncion(trabajo)}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Nueva función
              </button>
            }
          />
        ) : (
          <>
            {/* Pestañas: en el celular se desplazan de lado dentro de su fila. */}
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
              <Pestana activa={!funcion} onClick={() => onElegirFuncion(null)} cantidad={delTrabajo.length}>
                Todas
              </Pestana>
              {trabajo.funciones.map((f) => (
                <Pestana
                  key={f.id}
                  activa={funcion?.id === f.id}
                  onClick={() => onElegirFuncion(f.id)}
                  cantidad={f.actividades.length}
                >
                  {f.nombre}
                </Pestana>
              ))}
              <button
                type="button"
                onClick={() => onNuevaFuncion(trabajo)}
                className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600"
              >
                <Icono nombre="mas" className="h-4 w-4" />
                Función
              </button>
            </div>

            <div className="flex items-center gap-3">
              {funcion ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="min-w-0 flex-1">
                    {funcion.descripcion && <p className="truncate text-sm text-slate-500">{funcion.descripcion}</p>}
                    <div className="max-w-xs">
                      <ProgressBar value={funcion.progreso} size="sm" />
                    </div>
                  </div>
                  <MenuAcciones
                    etiqueta={`Acciones de ${funcion.nombre}`}
                    opciones={[
                      { etiqueta: 'Editar función', onClick: () => onEditarFuncion(funcion) },
                      { etiqueta: 'Eliminar función', onClick: () => onEliminarFuncion(funcion), peligro: true },
                    ]}
                  />
                </div>
              ) : (
                <p className="flex-1 text-sm text-slate-500">
                  {visibles.length} {visibles.length === 1 ? 'actividad' : 'actividades'}
                </p>
              )}
              <SelectorVista vista={vista} onChange={setVista} />
            </div>

            <VistaActividades
              vista={vista}
              actividades={visibles}
              mostrarContexto={funcion ? false : 'funcion'}
              onAgregar={agregar}
              vacio={
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Sin actividades todavía en {funcion ? 'esta función' : 'este trabajo'}.
                </p>
              }
            />
          </>
        )}
      </div>
    </>
  )
}
