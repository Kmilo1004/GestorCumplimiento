import { ActividadItem, CompromisoItem, ZonaDia } from './ElementosAgenda'
import { ALERTA } from '../../models'
import { cuadriculaMes, diasDeSemana, diaSemanaCorto, festivo, hoyISO, mismoMes } from '../../utils/fechas'
import { nivelAlerta } from '../../utils/alerts'

const MAX_PC = 3

const PUNTO_ACTIVIDAD = {
  [ALERTA.VENCIDA]: 'bg-red-500',
  [ALERTA.PROXIMA]: 'bg-amber-500',
  [ALERTA.OK]: 'bg-slate-400',
  [ALERTA.COMPLETADA]: 'bg-green-500',
}

// Cuadrícula del mes. PC: hasta 3 elementos por día y "+N más". Celular:
// puntos de colores (azul = compromiso; actividades según su alerta).
// Tocar un día abre su vista de día.
export default function VistaMes({ fecha, itemsDe, acciones }) {
  const hoy = hoyISO()
  const semanas = cuadriculaMes(fecha)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {diasDeSemana(fecha).map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase text-slate-500">
            <span className="sm:hidden">{diaSemanaCorto(d).charAt(0)}</span>
            <span className="hidden sm:inline">{diaSemanaCorto(d)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-100">
        {semanas.flat().map((dia) => {
          const { compromisos, actividades } = itemsDe(dia)
          const delMes = mismoMes(dia, fecha)
          const nombreFestivo = festivo(dia)
          const total = compromisos.length + actividades.length
          return (
            <ZonaDia
              key={dia}
              fecha={dia}
              onSoltar={acciones.reprogramar}
              role="button"
              tabIndex={0}
              aria-label={`${dia}${nombreFestivo ? `, ${nombreFestivo}` : ''}, ${total} elementos`}
              onClick={() => acciones.abrirDia(dia)}
              onKeyDown={(e) => {
                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  acciones.abrirDia(dia)
                }
              }}
              className={`flex min-h-[4.25rem] cursor-pointer flex-col gap-1 p-1 text-left hover:bg-slate-50 sm:min-h-[5.5rem] lg:min-h-[7.5rem] lg:p-1.5 ${
                delMes ? 'bg-white' : 'bg-slate-50/80'
              }`}
            >
              <span
                title={nombreFestivo ?? undefined}
                className={`flex h-6 w-6 items-center justify-center self-center rounded-full text-xs font-semibold tabular-nums lg:self-start ${
                  dia === hoy
                    ? 'bg-brand-600 text-white'
                    : nombreFestivo
                      ? 'text-red-600'
                      : delMes
                        ? 'text-slate-700'
                        : 'text-slate-300'
                }`}
              >
                {Number(dia.slice(8))}
              </span>

              {/* Celular: puntos */}
              {total > 0 && (
                <span className="flex flex-wrap justify-center gap-0.5 lg:hidden">
                  {compromisos.slice(0, 3).map((_, i) => (
                    <span key={`c${i}`} className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  ))}
                  {actividades.slice(0, 3).map((a) => (
                    <span key={a.id} className={`h-1.5 w-1.5 rounded-full ${PUNTO_ACTIVIDAD[nivelAlerta(a)]}`} />
                  ))}
                </span>
              )}

              {/* PC: elementos */}
              <div className="hidden space-y-1 lg:block" onClick={(e) => e.stopPropagation()}>
                {compromisos.slice(0, MAX_PC).map((c, i) => (
                  <CompromisoItem
                    key={`c${i}`}
                    compromiso={c}
                    compacto
                    unaLinea
                    onToggle={() => acciones.alternarCompromiso(dia, c)}
                    onEditar={() => acciones.editarCompromiso(dia, c)}
                  />
                ))}
                {actividades.slice(0, Math.max(0, MAX_PC - compromisos.length)).map((a) => (
                  <ActividadItem key={a.id} actividad={a} compacto unaLinea />
                ))}
                {total > MAX_PC && (
                  <button
                    type="button"
                    onClick={() => acciones.abrirDia(dia)}
                    className="w-full rounded px-1.5 text-left text-xs font-medium text-slate-500 hover:text-brand-600"
                  >
                    +{total - MAX_PC} más
                  </button>
                )}
              </div>
            </ZonaDia>
          )
        })}
      </div>
    </div>
  )
}
