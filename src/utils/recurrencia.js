// Cálculo de periodos para actividades recurrentes.
// Funciones puras sobre fechas 'YYYY-MM-DD'; no dependen del almacenamiento.
//
// Cada periodo es una nota distinta: "Informe mensual 2026-10.md" y, al
// completarla, "Informe mensual 2026-11.md". Así cada periodo conserva sus
// notas y evidencias para los informes de gestión.

import { RECURRENCIAS } from '../models'

function aPartes(fecha) {
  const [y, m, d] = fecha.split('-').map(Number)
  return { y, m, d }
}

function aTexto(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function diasDelMes(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

function sumarDias(fecha, dias) {
  const { y, m, d } = aPartes(fecha)
  const t = new Date(Date.UTC(y, m - 1, d + dias))
  return aTexto(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate())
}

// Suma meses respetando el fin de mes: 31-ene + 1 = 28/29-feb, y si la fecha
// era el último día del mes, el resultado también lo es (30-abr -> 31-may),
// que es lo habitual en informes "a fin de mes".
function sumarMeses(fecha, meses) {
  const { y, m, d } = aPartes(fecha)
  const total = y * 12 + (m - 1) + meses
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  const finDeMes = d === diasDelMes(y, m)
  const nd = finDeMes ? diasDelMes(ny, nm) : Math.min(d, diasDelMes(ny, nm))
  return aTexto(ny, nm, nd)
}

const MESES = {
  [RECURRENCIAS.MENSUAL]: 1,
  [RECURRENCIAS.BIMESTRAL]: 2,
  [RECURRENCIAS.TRIMESTRAL]: 3,
  [RECURRENCIAS.SEMESTRAL]: 6,
  [RECURRENCIAS.ANUAL]: 12,
}

export function esFechaValida(fecha) {
  return typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)
}

// Fecha límite del siguiente periodo.
// Quincenal sigue el calendario colombiano: el 15 pasa a fin de mes y el fin
// de mes al 15 del siguiente; cualquier otra fecha avanza 15 días.
export function siguienteFecha(fecha, recurrencia) {
  if (!esFechaValida(fecha)) return ''
  if (recurrencia === RECURRENCIAS.SEMANAL) return sumarDias(fecha, 7)
  if (recurrencia === RECURRENCIAS.QUINCENAL) {
    const { y, m, d } = aPartes(fecha)
    if (d === 15) return aTexto(y, m, diasDelMes(y, m))
    return sumarDias(fecha, 15) // desde fin de mes cae justo en el 15
  }
  if (MESES[recurrencia]) return sumarMeses(fecha, MESES[recurrencia])
  return ''
}

// Semana ISO (lunes a domingo) del año ISO.
function semanaIso(fecha) {
  const { y, m, d } = aPartes(fecha)
  const t = new Date(Date.UTC(y, m - 1, d))
  const dia = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dia)
  const inicioAnio = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const semana = Math.ceil(((t - inicioAnio) / 86400000 + 1) / 7)
  return { anio: t.getUTCFullYear(), semana }
}

// Texto corto que identifica el periodo de una fecha según la frecuencia.
export function etiquetaPeriodo(fecha, recurrencia) {
  if (!esFechaValida(fecha)) return ''
  const { y, m } = aPartes(fecha)
  switch (recurrencia) {
    case RECURRENCIAS.SEMANAL: {
      const { anio, semana } = semanaIso(fecha)
      return `${anio}-S${String(semana).padStart(2, '0')}`
    }
    case RECURRENCIAS.QUINCENAL:
      return fecha
    case RECURRENCIAS.MENSUAL:
    case RECURRENCIAS.BIMESTRAL:
      return `${y}-${String(m).padStart(2, '0')}`
    case RECURRENCIAS.TRIMESTRAL:
      return `${y}-T${Math.ceil(m / 3)}`
    case RECURRENCIAS.SEMESTRAL:
      return `${y}-S${m <= 6 ? 1 : 2}`
    case RECURRENCIAS.ANUAL:
      return `${y}`
    default:
      return ''
  }
}

// Nombre de la nota de un periodo: "Informe mensual 2026-10".
export function nombreDePeriodo(serie, fecha, recurrencia) {
  const periodo = etiquetaPeriodo(fecha, recurrencia)
  return periodo ? `${serie} ${periodo}` : serie
}

// Serie de una actividad recurrente. Si falta (nota escrita a mano en
// Obsidian), se deduce del nombre quitándole el periodo, para no duplicarlo:
// "Informe mensual 2026-10" -> "Informe mensual".
export function serieDe({ serie, nombre = '', fecha_limite, recurrencia }) {
  if (serie) return serie.trim()
  const periodo = etiquetaPeriodo(fecha_limite, recurrencia)
  const limpio = nombre.trim()
  return periodo && limpio.endsWith(` ${periodo}`) ? limpio.slice(0, -periodo.length - 1) : limpio
}
