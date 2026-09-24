// Lógica de alertas de vencimiento para actividades.
// Funciones puras basadas en fechas; no dependen de IndexedDB ni de React.

import { ALERTA, ESTADOS } from '../models'

export const UMBRAL_PROXIMA_DIAS = 2

function inicioDelDia(fecha) {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  return d
}

// Días de diferencia entre hoy y la fecha límite (negativo = ya vencida).
export function diasHastaVencimiento(fechaLimite) {
  if (!fechaLimite) return null
  const hoy = inicioDelDia(new Date())
  // fecha_limite se guarda como 'YYYY-MM-DD'; forzamos a local time.
  const limite = inicioDelDia(`${fechaLimite}T00:00:00`)
  const msPorDia = 1000 * 60 * 60 * 24
  return Math.round((limite.getTime() - hoy.getTime()) / msPorDia)
}

export function nivelAlerta(actividad, { umbralDias = UMBRAL_PROXIMA_DIAS } = {}) {
  if (!actividad) return ALERTA.OK
  if (actividad.estado === ESTADOS.COMPLETADA) return ALERTA.COMPLETADA
  if (!actividad.fecha_limite) return ALERTA.OK

  const dias = diasHastaVencimiento(actividad.fecha_limite)
  if (dias < 0) return ALERTA.VENCIDA
  if (dias <= umbralDias) return ALERTA.PROXIMA
  return ALERTA.OK
}

export const ALERTA_LABELS = {
  [ALERTA.VENCIDA]: 'Vencida',
  [ALERTA.PROXIMA]: 'Próxima a vencer',
  [ALERTA.OK]: 'A tiempo',
  [ALERTA.COMPLETADA]: 'Completada',
}

// Clases Tailwind reutilizables para pintar badges/indicadores según alerta.
export const ALERTA_ESTILOS = {
  [ALERTA.VENCIDA]: 'bg-red-100 text-red-700 border-red-200',
  [ALERTA.PROXIMA]: 'bg-amber-100 text-amber-700 border-amber-200',
  [ALERTA.OK]: 'bg-slate-100 text-slate-600 border-slate-200',
  [ALERTA.COMPLETADA]: 'bg-green-100 text-green-700 border-green-200',
}

export const ALERTA_DOT = {
  [ALERTA.VENCIDA]: 'bg-red-500',
  [ALERTA.PROXIMA]: 'bg-amber-500',
  [ALERTA.OK]: 'bg-slate-400',
  [ALERTA.COMPLETADA]: 'bg-green-500',
}

export function formatearFecha(fechaLimite) {
  if (!fechaLimite) return 'Sin fecha'
  const d = new Date(`${fechaLimite}T00:00:00`)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function textoRelativo(fechaLimite) {
  if (!fechaLimite) return 'Sin fecha límite'
  const dias = diasHastaVencimiento(fechaLimite)
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return 'Vence mañana'
  if (dias > 1) return `Vence en ${dias} días`
  if (dias === -1) return 'Venció hace 1 día'
  return `Venció hace ${Math.abs(dias)} días`
}

// Devuelve, ordenadas por urgencia, las actividades no completadas cuyo
// nivel de alerta sea "vencida" o "próxima". Útil para el Dashboard.
export function actividadesProximasAVencer(actividades = [], { umbralDias = UMBRAL_PROXIMA_DIAS } = {}) {
  return actividades
    .filter((a) => a.estado !== ESTADOS.COMPLETADA && a.fecha_limite)
    .map((a) => ({ ...a, _dias: diasHastaVencimiento(a.fecha_limite) }))
    .filter((a) => a._dias <= umbralDias)
    .sort((a, b) => a._dias - b._dias)
}
