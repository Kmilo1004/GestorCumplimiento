import { useEffect, useRef, useState } from 'react'
import Icono from '../ui/Icono'
import ActividadFila from '../actividades/ActividadFila'
import { CompromisoItem } from './ElementosAgenda'
import { useData } from '../../context/DataContext'
import { festivo, hoyISO } from '../../utils/fechas'
import { grupoUrgencia } from '../../utils/alerts'

function Tarjeta({ titulo, accion, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
        <h2 className="text-sm font-semibold text-slate-700">{titulo}</h2>
        {accion}
      </header>
      {children}
    </section>
  )
}

function BotonAgregar({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
    >
      <Icono nombre="mas" className="h-3.5 w-3.5" grosor={2.2} />
      {children}
    </button>
  )
}

// Texto libre del día. Se guarda solo (al dejar de escribir y al salir del
// campo). Si la nota cambia por fuera (Obsidian) y aquí no hay cambios sin
// guardar, se muestra la versión nueva.
function NotaDelDia({ fecha, notaGuardada }) {
  const { modificarNotaDiaria } = useData()
  const [texto, setTexto] = useState(notaGuardada)
  const [estado, setEstado] = useState('') // '' | 'pendiente' | 'guardando' | 'guardado' | 'error'
  const sucio = useRef(false)
  const temporizador = useRef(null)
  const textoRef = useRef(notaGuardada) // último texto escrito, para saber si quedó algo sin guardar

  useEffect(() => {
    if (sucio.current) return
    textoRef.current = notaGuardada
    setTexto(notaGuardada)
  }, [notaGuardada])

  const guardar = async (valor) => {
    clearTimeout(temporizador.current)
    setEstado('guardando')
    try {
      // Solo cambia las notas; los compromisos se toman del disco en el mismo paso.
      await modificarNotaDiaria(fecha, (nota) => ({ ...nota, notas: valor }))
      if (valor === textoRef.current) sucio.current = false
      setEstado('guardado')
    } catch (err) {
      console.error(err)
      setEstado('error')
    }
  }

  // Al salir del día (p. ej. con el gesto Atrás, sin perder el foco antes) se
  // guarda lo que quedó pendiente.
  const guardarRef = useRef(guardar)
  useEffect(() => {
    guardarRef.current = guardar
  })
  useEffect(
    () => () => {
      clearTimeout(temporizador.current)
      if (sucio.current) guardarRef.current(textoRef.current)
    },
    [],
  )

  return (
    <div className="px-4 pb-4">
      <textarea
        value={texto}
        onChange={(e) => {
          const valor = e.target.value
          setTexto(valor)
          textoRef.current = valor
          sucio.current = true
          setEstado('pendiente')
          clearTimeout(temporizador.current)
          temporizador.current = setTimeout(() => guardar(valor), 1200)
        }}
        onBlur={() => sucio.current && guardar(texto)}
        rows={10}
        placeholder="Apuntes del día, acuerdos, pendientes para mañana…"
        className="w-full resize-y rounded-xl border border-slate-200 bg-amber-50/30 px-3 py-2.5 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      <p className="mt-1 h-4 text-right text-xs text-slate-400" aria-live="polite">
        {{ pendiente: 'Sin guardar…', guardando: 'Guardando…', guardado: 'Guardado en la bóveda', error: 'No se pudo guardar' }[
          estado
        ] ?? ''}
      </p>
    </div>
  )
}

// Un día: compromisos, actividades que vencen y la nota diaria.
export default function VistaDia({ fecha, itemsDe, nota, cargando, acciones, actividadesVencidas }) {
  const { compromisos, actividades } = itemsDe(fecha)
  const esHoy = fecha === hoyISO()
  const nombreFestivo = festivo(fecha)
  const vencidasAnteriores = esHoy ? actividadesVencidas.filter((a) => grupoUrgencia(a) === 'vencidas') : []

  return (
    <div className="space-y-4">
      {nombreFestivo && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
          Festivo: {nombreFestivo}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Tarjeta
            titulo="Compromisos"
            accion={<BotonAgregar onClick={() => acciones.nuevoCompromiso(fecha)}>Compromiso</BotonAgregar>}
          >
            <div className="space-y-1.5 px-4 pb-4">
              {compromisos.length ? (
                compromisos.map((c, i) => (
                  <CompromisoItem
                    key={`c${i}`}
                    compromiso={c}
                    siguiente={acciones.siguienteDe(fecha, c)}
                    onToggle={() => acciones.alternarCompromiso(fecha, c)}
                    onEditar={() => acciones.editarCompromiso(fecha, c)}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-400">Sin reuniones ni citas registradas.</p>
              )}
            </div>
          </Tarjeta>

          <Tarjeta
            titulo={`Actividades que vencen${esHoy ? ' hoy' : ' este día'}`}
            accion={<BotonAgregar onClick={() => acciones.nuevaActividad(fecha)}>Actividad</BotonAgregar>}
          >
            {actividades.length ? (
              <ul className="pb-2">
                {actividades.map((a) => (
                  <ActividadFila key={a.id} actividad={a} mostrarContexto />
                ))}
              </ul>
            ) : (
              <p className="px-4 pb-4 text-sm text-slate-400">Ninguna actividad vence este día.</p>
            )}
          </Tarjeta>

          {vencidasAnteriores.length > 0 && (
            <Tarjeta titulo={`Vencidas de días anteriores (${vencidasAnteriores.length})`}>
              <ul className="pb-2">
                {vencidasAnteriores.map((a) => (
                  <ActividadFila key={a.id} actividad={a} mostrarContexto />
                ))}
              </ul>
            </Tarjeta>
          )}
        </div>

        <div className="lg:col-span-2">
          <Tarjeta titulo="Nota del día">
            {cargando ? (
              <p className="px-4 pb-4 text-sm text-slate-400">Cargando…</p>
            ) : (
              <NotaDelDia key={fecha} fecha={fecha} notaGuardada={nota?.notas ?? ''} />
            )}
          </Tarjeta>
        </div>
      </div>
    </div>
  )
}
