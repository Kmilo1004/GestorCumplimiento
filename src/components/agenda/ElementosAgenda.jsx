import { useState } from 'react'
import Icono from '../ui/Icono'
import { useUI } from '../../context/UIContext'
import { ALERTA, ESTADOS, PRIORIDADES } from '../../models'
import { nivelAlerta } from '../../utils/alerts'
import { ESTADO_COMPROMISO, estadoCompromiso } from '../../utils/compromisos'

const CASILLA = {
  [ESTADO_COMPROMISO.PENDIENTE]: 'border-brand-300 bg-white text-transparent',
  [ESTADO_COMPROMISO.HECHO]: 'border-brand-500 bg-brand-500 text-white',
  [ESTADO_COMPROMISO.CANCELADO]: 'border-slate-300 bg-slate-200 text-slate-500',
}

const ETIQUETA_SIGUIENTE = {
  [ESTADO_COMPROMISO.PENDIENTE]: 'Marcar pendiente',
  [ESTADO_COMPROMISO.HECHO]: 'Marcar hecho',
  [ESTADO_COMPROMISO.CANCELADO]: 'Marcar como no realizado',
}

const TIPO_ARRASTRE = 'application/x-cumplimiento-actividad'

const COLOR_ACTIVIDAD = {
  [ALERTA.VENCIDA]: 'border-red-200 bg-red-50 text-red-800',
  [ALERTA.PROXIMA]: 'border-amber-200 bg-amber-50 text-amber-800',
  [ALERTA.OK]: 'border-slate-200 bg-white text-slate-700',
  [ALERTA.COMPLETADA]: 'border-slate-100 bg-slate-50 text-slate-400 line-through',
}

// Compromiso con hora (de la nota diaria). La casilla cambia su estado
// (`siguiente` lo calcula quien la usa) y el texto abre la edición.
// `compacto`: letra pequeña; `unaLinea`: corta en una línea (mes).
export function CompromisoItem({ compromiso, siguiente, onToggle, onEditar, compacto = false, unaLinea = false }) {
  const horario = compromiso.inicio ? `${compromiso.inicio}${compromiso.fin && !compacto ? `–${compromiso.fin}` : ''}` : ''
  const estado = estadoCompromiso(compromiso)
  const cancelado = estado === ESTADO_COMPROMISO.CANCELADO
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border-l-[3px] ${
        cancelado ? 'border-slate-300 bg-slate-50' : 'border-brand-400 bg-brand-50/70'
      } ${compacto ? 'px-1.5 py-1 text-xs' : 'px-2.5 py-2 text-sm'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={`${ETIQUETA_SIGUIENTE[siguiente] ?? 'Cambiar estado'}: ${compromiso.titulo}`}
        title={cancelado ? 'No se realizó' : undefined}
        className={`mt-0.5 flex shrink-0 items-center justify-center rounded border ${
          compacto ? 'h-3.5 w-3.5' : 'h-4 w-4'
        } ${CASILLA[estado]}`}
      >
        <Icono nombre={cancelado ? 'cerrar' : 'check'} className="h-2.5 w-2.5" grosor={3.5} />
      </button>
      <button type="button" onClick={onEditar} className="min-w-0 flex-1 text-left">
        <span
          className={`break-words hyphens-auto ${unaLinea ? 'block truncate' : compacto ? 'line-clamp-2' : 'block'} ${
            estado === ESTADO_COMPROMISO.PENDIENTE ? 'text-brand-900' : 'text-slate-400 line-through'
          }`}
        >
          {horario && <span className="mr-1 font-semibold tabular-nums">{horario}</span>}
          {compromiso.titulo}
        </span>
        {cancelado && !compacto && <span className="text-xs text-slate-500">No se realizó</span>}
      </button>
    </div>
  )
}

// Actividad que vence ese día. En PC se puede arrastrar a otro día para
// cambiar su fecha límite.
export function ActividadItem({ actividad, compacto = false, unaLinea = false }) {
  const { abrirDetalle } = useUI()
  const alerta = nivelAlerta(actividad)
  return (
    <button
      type="button"
      draggable={actividad.estado !== ESTADOS.COMPLETADA}
      onDragStart={(e) => {
        e.dataTransfer.setData(TIPO_ARRASTRE, actividad.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={() => abrirDetalle(actividad.id)}
      title={`${actividad.nombre} · ${actividad.funcionNombre}`}
      className={`flex w-full items-start gap-1.5 rounded-lg border text-left ${COLOR_ACTIVIDAD[alerta]} ${
        compacto ? 'px-1.5 py-1 text-xs' : 'px-2.5 py-2 text-sm'
      }`}
    >
      {actividad.prioridad === PRIORIDADES.ALTA && actividad.estado !== ESTADOS.COMPLETADA && (
        <span className="mt-px shrink-0 text-red-500">
          <Icono nombre="bandera" className="h-3.5 w-3.5" />
        </span>
      )}
      <span className={`min-w-0 flex-1 break-words hyphens-auto ${unaLinea ? 'truncate' : 'line-clamp-2'}`}>{actividad.nombre}</span>
    </button>
  )
}

// Contenedor de un día que acepta actividades soltadas (reprogramar).
export function ZonaDia({ fecha, onSoltar, className = '', children, ...props }) {
  const [encima, setEncima] = useState(false)
  return (
    <div
      {...props}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(TIPO_ARRASTRE)) return
        e.preventDefault()
        setEncima(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setEncima(false)
      }}
      onDrop={(e) => {
        const id = e.dataTransfer.getData(TIPO_ARRASTRE)
        setEncima(false)
        if (id) {
          e.preventDefault()
          onSoltar(id, fecha)
        }
      }}
      className={`${className} ${encima ? 'ring-2 ring-inset ring-brand-400' : ''}`}
    >
      {children}
    </div>
  )
}
