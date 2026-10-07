// Reglas de los compromisos de la agenda (reuniones, citas…). Puras: sin
// almacenamiento ni React.
//
// Estados: pendiente, hecho (`- [x]`) o no se realizó (`- [-]`, cancelado).

import { aISO } from './fechas'

export const ESTADO_COMPROMISO = {
  PENDIENTE: 'pendiente',
  HECHO: 'hecho',
  CANCELADO: 'cancelado',
}

export function estadoCompromiso(c) {
  if (c.cancelado) return ESTADO_COMPROMISO.CANCELADO
  if (c.hecho) return ESTADO_COMPROMISO.HECHO
  return ESTADO_COMPROMISO.PENDIENTE
}

export function conEstado(c, estado) {
  return { ...c, hecho: estado === ESTADO_COMPROMISO.HECHO, cancelado: estado === ESTADO_COMPROMISO.CANCELADO }
}

const horaDe = (fecha) => `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`

// ¿Ya pasó? Cuenta la hora de fin; si no tiene, la de inicio; si no tiene
// hora (todo el día), pasa cuando termina el día.
export function yaPaso(fecha, compromiso, ahora = new Date()) {
  const hoy = aISO(ahora)
  if (fecha < hoy) return true
  if (fecha > hoy) return false
  const limite = compromiso.fin || compromiso.inicio
  return Boolean(limite) && limite <= horaDe(ahora)
}

// Marca como hechos los compromisos pendientes que ya pasaron. Los que el
// usuario marcó "No se realizó" no se tocan. Devuelve la lista y si cambió.
export function marcarPasados(fecha, compromisos, ahora = new Date()) {
  let cambio = false
  const lista = compromisos.map((c) => {
    if (c.hecho || c.cancelado || !yaPaso(fecha, c, ahora)) return c
    cambio = true
    return { ...c, hecho: true }
  })
  return { compromisos: lista, cambio }
}

// Siguiente estado al tocar la casilla. En uno que ya pasó, desmarcarlo
// significa "no se realizó" (si volviera a pendiente, se marcaría solo otra vez).
export function siguienteEstado(fecha, compromiso, ahora = new Date()) {
  const estado = estadoCompromiso(compromiso)
  if (estado === ESTADO_COMPROMISO.PENDIENTE) return ESTADO_COMPROMISO.HECHO
  if (estado === ESTADO_COMPROMISO.CANCELADO) return ESTADO_COMPROMISO.HECHO
  return yaPaso(fecha, compromiso, ahora) ? ESTADO_COMPROMISO.CANCELADO : ESTADO_COMPROMISO.PENDIENTE
}
