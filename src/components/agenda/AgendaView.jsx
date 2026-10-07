import { useMemo, useState } from 'react'
import Header, { BotonPrincipal } from '../layout/Header'
import Icono from '../ui/Icono'
import VistaSemana from './VistaSemana'
import VistaMes from './VistaMes'
import VistaDia from './VistaDia'
import CompromisoModal from './CompromisoModal'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { useAgenda } from '../../hooks/useAgenda'
import { usePreferencia } from '../../hooks/usePreferencia'
import { ESTADOS } from '../../models'
import { compararActividades } from '../../utils/alerts'
import {
  cuadriculaMes,
  diasDeSemana,
  esISO,
  fechaLarga,
  hoyISO,
  mesAnio,
  rangoSemana,
  sumarDias,
  sumarMeses,
} from '../../utils/fechas'

const VISTAS = [
  { id: 'dia', etiqueta: 'Día' },
  { id: 'semana', etiqueta: 'Semana' },
  { id: 'mes', etiqueta: 'Mes' },
]

const mismoCompromiso = (a, b) =>
  a.titulo === b.titulo && a.inicio === b.inicio && a.fin === b.fin && a.hecho === b.hecho

// Reemplaza (o quita, si `nuevo` es null) el primer compromiso igual a `objetivo`.
function reemplazarPrimero(lista, objetivo, nuevo) {
  let hecho = false
  return lista.flatMap((c) => {
    if (!hecho && mismoCompromiso(c, objetivo)) {
      hecho = true
      return nuevo ? [nuevo] : []
    }
    return [c]
  })
}

const porHora = (a, b) => (a.inicio || '').localeCompare(b.inicio || '')

// Agenda: #/agenda/<dia|semana|mes>/<AAAA-MM-DD>. Muestra las actividades por
// fecha límite y los compromisos de las notas diarias.
export default function AgendaView({ partes, navegar }) {
  const { actividadesConContexto, actualizarActividad, modificarNotaDiaria } = useData()
  const { nuevaActividad } = useUI()
  const [vistaPreferida, setVistaPreferida] = usePreferencia('vistaAgenda', 'semana')
  const [modal, setModal] = useState(null) // { fecha, compromiso, original? }
  const [error, setError] = useState('')

  const vista = VISTAS.some((v) => v.id === partes[1]) ? partes[1] : vistaPreferida
  const fecha = esISO(partes[2]) ? partes[2] : hoyISO()
  const ir = (nuevaVista, nuevaFecha) => {
    if (nuevaVista !== vista) setVistaPreferida(nuevaVista)
    navegar('agenda', nuevaVista, nuevaFecha)
  }

  const [desde, hasta] = useMemo(() => {
    if (vista === 'dia') return [fecha, fecha]
    if (vista === 'semana') {
      const dias = diasDeSemana(fecha)
      return [dias[0], dias[6]]
    }
    const semanas = cuadriculaMes(fecha)
    return [semanas[0][0], semanas.at(-1)[6]]
  }, [vista, fecha])

  const { notas, cargando, error: errorAgenda } = useAgenda(desde, hasta)

  const actividadesPorFecha = useMemo(() => {
    const mapa = new Map()
    for (const a of actividadesConContexto) {
      if (!a.fecha_limite) continue
      if (!mapa.has(a.fecha_limite)) mapa.set(a.fecha_limite, [])
      mapa.get(a.fecha_limite).push(a)
    }
    for (const lista of mapa.values()) {
      lista.sort((a, b) => (a.estado === ESTADOS.COMPLETADA) - (b.estado === ESTADOS.COMPLETADA) || compararActividades(a, b))
    }
    return mapa
  }, [actividadesConContexto])

  const itemsDe = (dia) => ({
    compromisos: [...(notas.get(dia)?.compromisos ?? [])].sort(porHora),
    actividades: actividadesPorFecha.get(dia) ?? [],
  })

  // Aplica el cambio sobre la versión en disco, de forma atómica.
  const modificarDia = (dia, transformar) =>
    modificarNotaDiaria(dia, (nota) => ({ ...nota, compromisos: transformar(nota.compromisos) }))

  const conError = (fn) => async (...args) => {
    setError('')
    try {
      await fn(...args)
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo actualizar la agenda.')
    }
  }

  const acciones = {
    abrirDia: (dia) => ir('dia', dia),
    nuevoCompromiso: (dia) => setModal({ fecha: dia, compromiso: null }),
    editarCompromiso: (dia, c) => setModal({ fecha: dia, compromiso: c, original: { fecha: dia, compromiso: c } }),
    alternarCompromiso: conError((dia, c) => modificarDia(dia, (l) => reemplazarPrimero(l, c, { ...c, hecho: !c.hecho }))),
    reprogramar: conError((id, dia) => actualizarActividad(id, { fecha_limite: dia })),
    nuevaActividad: (dia) => nuevaActividad(undefined, { fecha_limite: dia }),
  }

  const guardarCompromiso = async ({ fecha: dia, compromiso }) => {
    const original = modal?.original
    if (original && original.fecha === dia) {
      await modificarDia(dia, (l) => reemplazarPrimero(l, original.compromiso, compromiso))
      return
    }
    // Primero se agrega en el día nuevo y luego se quita del anterior: si algo
    // falla a mitad de camino, el compromiso queda duplicado, nunca perdido.
    await modificarDia(dia, (l) => [...l, compromiso])
    if (original) await modificarDia(original.fecha, (l) => reemplazarPrimero(l, original.compromiso, null))
  }

  const paso = (n) => {
    if (vista === 'dia') return sumarDias(fecha, n)
    if (vista === 'semana') return sumarDias(fecha, 7 * n)
    return sumarMeses(fecha, n)
  }
  const etiqueta = vista === 'dia' ? fechaLarga(fecha) : vista === 'semana' ? rangoSemana(fecha) : mesAnio(fecha)

  return (
    <>
      <Header
        title="Agenda"
        subtitle={etiqueta}
        acciones={<BotonPrincipal onClick={() => acciones.nuevoCompromiso(vista === 'dia' ? fecha : hoyISO())}>Compromiso</BotonPrincipal>}
      />
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => ir(vista, paso(-1))}
              className="rounded-l-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              aria-label="Anterior"
            >
              <Icono nombre="izquierda" className="h-4 w-4" grosor={2.2} />
            </button>
            <button
              type="button"
              onClick={() => ir(vista, hoyISO())}
              className="border-x border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => ir(vista, paso(1))}
              className="rounded-r-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              aria-label="Siguiente"
            >
              <Icono nombre="derecha" className="h-4 w-4" grosor={2.2} />
            </button>
          </div>
          <span className="flex-1" />
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Vista de la agenda">
            {VISTAS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => ir(v.id, fecha)}
                aria-pressed={vista === v.id}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  vista === v.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {(error || errorAgenda) && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error || errorAgenda}</p>
        )}

        {vista === 'semana' && <VistaSemana fecha={fecha} itemsDe={itemsDe} acciones={acciones} />}
        {vista === 'mes' && <VistaMes fecha={fecha} itemsDe={itemsDe} acciones={acciones} />}
        {vista === 'dia' && (
          <VistaDia
            fecha={fecha}
            itemsDe={itemsDe}
            nota={notas.get(fecha)}
            cargando={cargando}
            acciones={acciones}
            actividadesVencidas={actividadesConContexto}
          />
        )}

        {vista !== 'dia' && (
          <p className="hidden text-xs text-slate-400 lg:block">
            Arrastra una actividad a otro día para cambiar su fecha límite. Toca un día para ver su detalle y su nota.
          </p>
        )}
      </div>

      <CompromisoModal
        abierto={Boolean(modal)}
        inicial={modal}
        onClose={() => setModal(null)}
        onGuardar={guardarCompromiso}
        onEliminar={() => modificarDia(modal.original.fecha, (l) => reemplazarPrimero(l, modal.original.compromiso, null))}
      />
    </>
  )
}
