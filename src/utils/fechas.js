// Fechas de calendario como texto 'YYYY-MM-DD' en hora local (sin zonas
// horarias de por medio). Semanas de lunes a domingo, como se usa en Colombia.

const MS_DIA = 86400000

export function aISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export function desdeISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function hoyISO() {
  return aISO(new Date())
}

export function esISO(texto) {
  return typeof texto === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(texto) && aISO(desdeISO(texto)) === texto
}

export function sumarDias(iso, dias) {
  const d = desdeISO(iso)
  d.setDate(d.getDate() + dias)
  return aISO(d)
}

export function sumarMeses(iso, meses) {
  const d = desdeISO(iso)
  const destino = new Date(d.getFullYear(), d.getMonth() + meses, 1)
  const ultimo = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate()
  destino.setDate(Math.min(d.getDate(), ultimo))
  return aISO(destino)
}

// Lunes de la semana de `iso`.
export function inicioSemana(iso) {
  const d = desdeISO(iso)
  const desdeLunes = (d.getDay() + 6) % 7
  return sumarDias(iso, -desdeLunes)
}

export function diasDeSemana(iso) {
  const lunes = inicioSemana(iso)
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
}

// Semanas completas (lunes a domingo) que cubren el mes de `iso`.
export function cuadriculaMes(iso) {
  const d = desdeISO(iso)
  const primero = aISO(new Date(d.getFullYear(), d.getMonth(), 1))
  const ultimo = aISO(new Date(d.getFullYear(), d.getMonth() + 1, 0))
  const semanas = []
  for (let lunes = inicioSemana(primero); lunes <= ultimo; lunes = sumarDias(lunes, 7)) {
    semanas.push(diasDeSemana(lunes))
  }
  return semanas
}

export function mismoMes(a, b) {
  return a.slice(0, 7) === b.slice(0, 7)
}

export function diferenciaDias(desde, hasta) {
  return Math.round((desdeISO(hasta) - desdeISO(desde)) / MS_DIA)
}

// ---------- Textos ----------

const fmt = (iso, opciones) => desdeISO(iso).toLocaleDateString('es-CO', opciones).replace('.', '')
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1)

export const diaSemanaCorto = (iso) => capitalizar(fmt(iso, { weekday: 'short' })) // "Lun"
export const diaSemanaLargo = (iso) => capitalizar(fmt(iso, { weekday: 'long' })) // "Lunes"
export const mesAnio = (iso) => capitalizar(fmt(iso, { month: 'long', year: 'numeric' })) // "Octubre de 2026"
export const fechaLarga = (iso) => capitalizar(fmt(iso, { weekday: 'long', day: 'numeric', month: 'long' }))

// "12 oct" (sin el "de" que agrega es-CO, para textos compactos).
export const diaMesCorto = (iso) => fmt(iso, { day: 'numeric', month: 'short' }).replace(' de ', ' ')

// "5 – 11 oct 2026" o "28 sept – 4 oct 2026"
export function rangoSemana(iso) {
  const dias = diasDeSemana(iso)
  const [ini, fin] = [dias[0], dias[6]]
  const anio = fin.slice(0, 4)
  if (mismoMes(ini, fin)) return `${Number(ini.slice(8))} – ${diaMesCorto(fin)} ${anio}`
  return `${diaMesCorto(ini)} – ${diaMesCorto(fin)} ${anio}`
}

// ---------- Festivos de Colombia ----------

// Domingo de Pascua (algoritmo de Meeus/Jones/Butcher, calendario gregoriano).
function domingoDePascua(anio) {
  const a = anio % 19
  const b = Math.floor(anio / 100)
  const c = anio % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return aISO(new Date(anio, mes - 1, dia))
}

// Ley 51 de 1983 (Ley Emiliani): el festivo se pasa al lunes siguiente.
function alLunes(iso) {
  const desdeLunes = (desdeISO(iso).getDay() + 6) % 7
  return desdeLunes === 0 ? iso : sumarDias(iso, 7 - desdeLunes)
}

const cacheFestivos = new Map()

// Map 'YYYY-MM-DD' -> nombre del festivo.
export function festivosColombia(anio) {
  if (cacheFestivos.has(anio)) return cacheFestivos.get(anio)
  const f = (mes, dia) => `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  const pascua = domingoDePascua(anio)
  const lista = [
    [f(1, 1), 'Año Nuevo'],
    [alLunes(f(1, 6)), 'Reyes Magos'],
    [alLunes(f(3, 19)), 'San José'],
    [sumarDias(pascua, -3), 'Jueves Santo'],
    [sumarDias(pascua, -2), 'Viernes Santo'],
    [f(5, 1), 'Día del Trabajo'],
    [sumarDias(pascua, 43), 'Ascensión del Señor'],
    [sumarDias(pascua, 64), 'Corpus Christi'],
    [sumarDias(pascua, 71), 'Sagrado Corazón'],
    [alLunes(f(6, 29)), 'San Pedro y San Pablo'],
    [f(7, 20), 'Día de la Independencia'],
    [f(8, 7), 'Batalla de Boyacá'],
    [alLunes(f(8, 15)), 'Asunción de la Virgen'],
    [alLunes(f(10, 12)), 'Día de la Raza'],
    [alLunes(f(11, 1)), 'Todos los Santos'],
    [alLunes(f(11, 11)), 'Independencia de Cartagena'],
    [f(12, 8), 'Inmaculada Concepción'],
    [f(12, 25), 'Navidad'],
  ]
  const mapa = new Map(lista)
  cacheFestivos.set(anio, mapa)
  return mapa
}

export function festivo(iso) {
  return festivosColombia(Number(iso.slice(0, 4))).get(iso) ?? null
}
