import Icono from '../ui/Icono'
import { ActividadItem, CompromisoItem, ZonaDia } from './ElementosAgenda'
import { diaSemanaCorto, diasDeSemana, festivo, hoyISO } from '../../utils/fechas'

function NumeroDia({ fecha, hoy }) {
  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
        fecha === hoy ? 'bg-brand-600 text-white' : festivo(fecha) ? 'text-red-600' : 'text-slate-800'
      }`}
    >
      {Number(fecha.slice(8))}
    </span>
  )
}

// Semana de lunes a domingo. PC: 7 columnas (se pueden arrastrar actividades
// entre días). Celular: lista de días; los días vacíos ocupan una línea.
export default function VistaSemana({ fecha, itemsDe, acciones }) {
  const hoy = hoyISO()
  const dias = diasDeSemana(fecha)

  const contenido = (dia, compacto) => {
    const { compromisos, actividades } = itemsDe(dia)
    return (
      <>
        {compromisos.map((c, i) => (
          <CompromisoItem
            key={`c${i}`}
            compromiso={c}
            compacto={compacto}
            siguiente={acciones.siguienteDe(dia, c)}
                    onToggle={() => acciones.alternarCompromiso(dia, c)}
            onEditar={() => acciones.editarCompromiso(dia, c)}
          />
        ))}
        {actividades.map((a) => (
          <ActividadItem key={a.id} actividad={a} compacto={compacto} />
        ))}
      </>
    )
  }

  return (
    <>
      {/* PC */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 lg:grid lg:grid-cols-7 lg:gap-px">
        {dias.map((dia) => {
          const nombreFestivo = festivo(dia)
          return (
            <ZonaDia
              key={dia}
              fecha={dia}
              onSoltar={acciones.reprogramar}
              className={`group flex min-h-[26rem] flex-col gap-1.5 p-2 ${dia === hoy ? 'bg-brand-50/40' : 'bg-white'}`}
            >
              <button
                type="button"
                onClick={() => acciones.abrirDia(dia)}
                className="mb-1 flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-left hover:bg-slate-100"
              >
                <span className="text-xs font-medium uppercase text-slate-500">{diaSemanaCorto(dia)}</span>
                <NumeroDia fecha={dia} hoy={hoy} />
              </button>
              {nombreFestivo && <p className="-mt-1 truncate px-1 text-[11px] text-red-500">{nombreFestivo}</p>}
              {contenido(dia, true)}
              <button
                type="button"
                onClick={() => acciones.nuevoCompromiso(dia)}
                className="mt-auto flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs text-slate-400 opacity-0 hover:bg-slate-100 hover:text-brand-600 focus:opacity-100 group-hover:opacity-100"
                aria-label={`Agregar compromiso el ${dia}`}
              >
                <Icono nombre="mas" className="h-3.5 w-3.5" />
                Compromiso
              </button>
            </ZonaDia>
          )
        })}
      </div>

      {/* Celular y tablet */}
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:hidden">
        {dias.map((dia) => {
          const { compromisos, actividades } = itemsDe(dia)
          const vacio = !compromisos.length && !actividades.length
          const nombreFestivo = festivo(dia)
          return (
            <li key={dia} className={`flex gap-3 px-3 ${vacio ? 'py-2' : 'py-3'} ${dia === hoy ? 'bg-brand-50/40' : ''}`}>
              <button
                type="button"
                onClick={() => acciones.abrirDia(dia)}
                className="flex w-11 shrink-0 flex-col items-center"
                aria-label={`Ver el día ${dia}`}
              >
                <span className="text-[11px] font-medium uppercase text-slate-500">{diaSemanaCorto(dia)}</span>
                <NumeroDia fecha={dia} hoy={hoy} />
              </button>
              <div className="min-w-0 flex-1 space-y-1.5 self-center">
                {nombreFestivo && <p className="text-xs text-red-500">{nombreFestivo}</p>}
                {vacio ? (
                  <button
                    type="button"
                    onClick={() => acciones.nuevoCompromiso(dia)}
                    className="text-sm text-slate-300 hover:text-brand-600"
                  >
                    Sin pendientes
                  </button>
                ) : (
                  contenido(dia, false)
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
