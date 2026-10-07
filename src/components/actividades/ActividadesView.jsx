import { useMemo, useState } from 'react'
import Header, { BotonPrincipal } from '../layout/Header'
import Icono from '../ui/Icono'
import EmptyState from '../ui/EmptyState'
import FilterBar from './FilterBar'
import VistaActividades, { CLAVE_VISTA, SelectorVista } from './VistaActividades'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { usePreferencia } from '../../hooks/usePreferencia'
import { ESTADOS, ESTADO_LABELS, PRIORIDAD_LABELS } from '../../models'
import { formatearFecha } from '../../utils/alerts'

const FILTROS_INICIALES = { estado: '', trabajoId: '', prioridad: '', etiqueta: '', desde: '', hasta: '' }

// Para buscar sin importar mayúsculas ni tildes ("informacion" encuentra "Información").
const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const igualSinMayusculas = (a, b) => a.toLocaleLowerCase('es') === b.toLocaleLowerCase('es')

export default function ActividadesView() {
  const data = useData()
  const { nuevaActividad } = useUI()
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [busqueda, setBusqueda] = useState('')
  const [verFiltros, setVerFiltros] = useState(false)
  const [vista, setVista] = usePreferencia(CLAVE_VISTA, 'lista')

  const visibles = useMemo(() => {
    const termino = normalizar(busqueda.trim())
    return data.actividadesConContexto.filter((a) => {
      if (filtros.estado && a.estado !== filtros.estado) return false
      if (filtros.trabajoId && a.trabajoId !== filtros.trabajoId) return false
      if (filtros.prioridad && a.prioridad !== filtros.prioridad) return false
      if (filtros.etiqueta && !(a.tags ?? []).some((t) => igualSinMayusculas(t, filtros.etiqueta))) return false
      if (filtros.desde && (a.fecha_limite || '') < filtros.desde) return false
      if (filtros.hasta && (!a.fecha_limite || a.fecha_limite > filtros.hasta)) return false
      if (!termino) return true
      return normalizar(
        [a.nombre, a.descripcion, a.notas, a.trabajoNombre, a.funcionNombre, ...(a.tags ?? [])].join(' '),
      ).includes(termino)
    })
  }, [data.actividadesConContexto, filtros, busqueda])

  // Chips de los filtros activos, cada uno con su forma de quitarlo.
  const nombreTrabajo = (id) => data.trabajos.find((t) => t.id === id)?.nombre ?? 'Trabajo'
  const activos = [
    filtros.estado && { clave: 'estado', texto: ESTADO_LABELS[filtros.estado] },
    filtros.trabajoId && { clave: 'trabajoId', texto: nombreTrabajo(filtros.trabajoId) },
    filtros.prioridad && { clave: 'prioridad', texto: `Prioridad ${PRIORIDAD_LABELS[filtros.prioridad].toLowerCase()}` },
    filtros.etiqueta && { clave: 'etiqueta', texto: `#${filtros.etiqueta}` },
    filtros.desde && { clave: 'desde', texto: `Desde ${formatearFecha(filtros.desde)}` },
    filtros.hasta && { clave: 'hasta', texto: `Hasta ${formatearFecha(filtros.hasta)}` },
  ].filter(Boolean)

  const abiertas = data.actividadesConContexto.filter((a) => a.estado !== ESTADOS.COMPLETADA).length

  return (
    <>
      <Header
        title="Actividades"
        subtitle={`${abiertas} abiertas de ${data.actividadesConContexto.length}`}
        acciones={
          <BotonPrincipal onClick={() => nuevaActividad()} soloPC>
            Nueva actividad
          </BotonPrincipal>
        }
      />
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icono nombre="buscar" className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar actividades, notas, etiquetas…"
              aria-label="Buscar"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <button
            type="button"
            onClick={() => setVerFiltros((v) => !v)}
            aria-expanded={verFiltros}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
              verFiltros || activos.length
                ? 'border-brand-200 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icono nombre="filtro" className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activos.length > 0 && (
              <span className="rounded-full bg-brand-600 px-1.5 text-[11px] text-white">{activos.length}</span>
            )}
          </button>
          <SelectorVista vista={vista} onChange={setVista} />
        </div>

        {verFiltros && (
          <FilterBar
            filtros={filtros}
            onChange={setFiltros}
            trabajos={data.trabajos}
            etiquetas={data.etiquetas}
          />
        )}

        {activos.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activos.map((f) => (
              <button
                key={f.clave}
                type="button"
                onClick={() => setFiltros((x) => ({ ...x, [f.clave]: '' }))}
                className="flex items-center gap-1 rounded-full bg-slate-900 py-1 pl-3 pr-2 text-xs font-medium text-white hover:bg-slate-700"
                aria-label={`Quitar filtro ${f.texto}`}
              >
                {f.texto}
                <Icono nombre="cerrar" className="h-3.5 w-3.5" grosor={2.2} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFiltros(FILTROS_INICIALES)}
              className="px-2 text-xs font-medium text-slate-500 hover:text-brand-600"
            >
              Quitar todos
            </button>
          </div>
        )}

        {data.actividadesConContexto.length === 0 ? (
          <EmptyState
            title="Agrega tu primera actividad"
            description="Las actividades son las tareas concretas de cada función, con su fecha límite y evidencias."
            action={
              <button
                type="button"
                onClick={() => nuevaActividad()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Nueva actividad
              </button>
            }
          />
        ) : visibles.length === 0 ? (
          <EmptyState
            title="Nada coincide con la búsqueda"
            description="Prueba con otras palabras o quita algún filtro."
          />
        ) : (
          <VistaActividades vista={vista} actividades={visibles} mostrarContexto />
        )}
      </div>
    </>
  )
}
