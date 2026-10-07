// Lógica de alertas de vencimiento para actividades.
// Funciones puras basadas en fechas; no dependen del almacenamiento ni de React.

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

// ---------- Agrupación por urgencia (vista de lista) ----------

export const GRUPOS_URGENCIA = [
  { id: 'vencidas', titulo: 'Vencidas', tono: 'danger' },
  { id: 'hoy', titulo: 'Hoy', tono: 'warning' },
  { id: 'semana', titulo: 'Próximos 7 días', tono: 'normal' },
  { id: 'despues', titulo: 'Más adelante', tono: 'normal' },
  { id: 'sin_fecha', titulo: 'Sin fecha', tono: 'muted' },
  { id: 'completadas', titulo: 'Completadas', tono: 'muted' },
]

export function grupoUrgencia(actividad) {
  if (actividad.estado === ESTADOS.COMPLETADA) return 'completadas'
  if (!actividad.fecha_limite) return 'sin_fecha'
  const dias = diasHastaVencimiento(actividad.fecha_limite)
  if (dias < 0) return 'vencidas'
  if (dias === 0) return 'hoy'
  if (dias <= 7) return 'semana'
  return 'despues'
}

const RANGO_PRIORIDAD = { alta: 0, media: 1, baja: 2 }

// Dentro de un grupo: primero la fecha más cercana y, a igual fecha, la
// prioridad más alta. Las completadas, de la más reciente a la más antigua.
export function compararActividades(a, b) {
  const porFecha = (a.fecha_limite || '9999').localeCompare(b.fecha_limite || '9999')
  if (porFecha) return a.estado === ESTADOS.COMPLETADA ? -porFecha : porFecha
  return (RANGO_PRIORIDAD[a.prioridad] ?? 1) - (RANGO_PRIORIDAD[b.prioridad] ?? 1)
}

// [{ ...grupo, actividades }] sin los grupos vacíos, en el orden de GRUPOS_URGENCIA.
export function agruparPorUrgencia(actividades = []) {
  const porGrupo = new Map(GRUPOS_URGENCIA.map((g) => [g.id, []]))
  for (const a of actividades) porGrupo.get(grupoUrgencia(a)).push(a)
  return GRUPOS_URGENCIA.map((g) => ({ ...g, actividades: porGrupo.get(g.id).sort(compararActividades) })).filter(
    (g) => g.actividades.length,
  )
}

// Texto corto para chips de fecha: "Hoy", "Mañana", "En 3 d", "Hace 2 d", "15 oct".
export function fechaCorta(fechaLimite) {
  if (!fechaLimite) return ''
  const dias = diasHastaVencimiento(fechaLimite)
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias === -1) return 'Ayer'
  if (dias < 0 && dias >= -30) return `Hace ${-dias} d`
  if (dias > 1 && dias <= 7) return `En ${dias} d`
  const d = new Date(`${fechaLimite}T00:00:00`)
  const opciones = { day: 'numeric', month: 'short' }
  if (d.getFullYear() !== new Date().getFullYear()) opciones.year = 'numeric'
  return d.toLocaleDateString('es-CO', opciones).replace('.', '')
}

// Conteos para tarjetas y resúmenes: { vencidas, hoy, semana, abiertas, completadas }.
export function contarPorUrgencia(actividades = []) {
  const conteo = { vencidas: 0, hoy: 0, semana: 0, abiertas: 0, completadas: 0 }
  for (const a of actividades) {
    const grupo = grupoUrgencia(a)
    if (grupo === 'completadas') {
      conteo.completadas++
      continue
    }
    conteo.abiertas++
    if (conteo[grupo] !== undefined) conteo[grupo]++
  }
  return conteo
}
