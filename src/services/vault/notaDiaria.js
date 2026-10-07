// Nota diaria (Agenda/AAAA/MM/AAAA-MM-DD.md), compatible con el plugin
// "Daily notes" de Obsidian:
//
//   ---
//   fecha: 2026-10-07
//   tipo: nota-diaria
//   ---
//   ## Agenda
//
//   - [ ] 09:00–10:00 Comité de convivencia
//   - [x] 14:00 Llamada con Contraloría
//   - [-] 16:00 Reunión que no se realizó (tarea cancelada en Obsidian)
//   - [ ] Capacitación (todo el día)
//
//   ## Notas
//
//   Texto libre.
//
// La app solo reescribe las secciones "## Agenda" y "## Notas"; cualquier otro
// texto o sección que el usuario agregue en Obsidian se conserva tal cual.

import { separarFrontmatter, unirFrontmatter } from './markdown'

const ENCABEZADO = /^##[ \t]+(.+?)[ \t]*#*[ \t]*$/
const COMPROMISO =
  /^\s*[-*+]\s+(?:\[([ xX-])\]\s+)?(?:(\d{1,2}:\d{2})(?:\s*(?:–|—|-|a)\s*(\d{1,2}:\d{2}))?\s+)?(.*\S)\s*$/

const clave = (titulo) =>
  titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

function hora(texto) {
  if (!texto) return ''
  const [h, m] = texto.split(':').map(Number)
  if (h > 23 || m > 59) return ''
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Cuerpo -> { preambulo: string[], secciones: [{ titulo, lineas: string[] }] }
function partirSecciones(cuerpo) {
  const preambulo = []
  const secciones = []
  for (const linea of cuerpo.replace(/\r\n/g, '\n').split('\n')) {
    const m = linea.match(ENCABEZADO)
    if (m) secciones.push({ titulo: m[1], lineas: [] })
    else if (secciones.length) secciones.at(-1).lineas.push(linea)
    else preambulo.push(linea)
  }
  return { preambulo, secciones }
}

const recortar = (lineas) => lineas.join('\n').trim()

export function leerNotaDiaria(texto = '') {
  const { frontmatter, cuerpo } = separarFrontmatter(texto)
  const { preambulo, secciones } = partirSecciones(cuerpo)
  const agenda = secciones.find((s) => clave(s.titulo) === 'agenda')
  const notas = secciones.find((s) => clave(s.titulo) === 'notas')

  const compromisos = []
  const otrasLineas = [] // texto en "## Agenda" que no es un compromiso: se conserva
  for (const linea of agenda?.lineas ?? []) {
    const m = linea.match(COMPROMISO)
    if (m) {
      compromisos.push({
        hecho: m[1] === 'x' || m[1] === 'X',
        cancelado: m[1] === '-',
        inicio: hora(m[2]),
        fin: hora(m[3]),
        titulo: m[4],
      })
    } else if (linea.trim()) {
      otrasLineas.push(linea)
    }
  }

  return {
    frontmatter,
    compromisos,
    notas: notas ? recortar(notas.lineas) : '',
    // Para reescribir sin perder lo que la app no maneja.
    _crudo: { preambulo, secciones, otrasLineas },
  }
}

export function lineaCompromiso({ hecho, cancelado, inicio, fin, titulo }) {
  const horario = inicio ? (fin ? `${inicio}–${fin} ` : `${inicio} `) : ''
  const marca = cancelado ? '-' : hecho ? 'x' : ' '
  return `- [${marca}] ${horario}${titulo.trim()}`
}

// Primero los de todo el día, luego por hora de inicio.
export function ordenarCompromisos(compromisos) {
  return [...compromisos].sort((a, b) => (a.inicio || '').localeCompare(b.inicio || ''))
}

export function escribirNotaDiaria(fecha, { compromisos = [], notas = '' }, textoAnterior = '') {
  const anterior = leerNotaDiaria(textoAnterior)
  const { preambulo, secciones, otrasLineas } = anterior._crudo

  const bloqueAgenda = [...ordenarCompromisos(compromisos).map(lineaCompromiso), ...otrasLineas]
  const bloqueNotas = notas.trim() ? notas.trim().split('\n') : []

  const nuevas = secciones.map((s) => ({ ...s }))
  const reemplazar = (nombre, titulo, lineas) => {
    const existente = nuevas.find((s) => clave(s.titulo) === nombre)
    if (existente) existente.lineas = lineas
    else if (lineas.length) nuevas.push({ titulo, lineas })
  }
  reemplazar('agenda', 'Agenda', bloqueAgenda)
  reemplazar('notas', 'Notas', bloqueNotas)

  const partes = []
  const textoPreambulo = recortar(preambulo)
  if (textoPreambulo) partes.push(textoPreambulo)
  for (const s of nuevas) {
    const contenido = recortar(s.lineas)
    partes.push(contenido ? `## ${s.titulo}\n\n${contenido}` : `## ${s.titulo}`)
  }

  return unirFrontmatter(
    { ...anterior.frontmatter, fecha, tipo: 'nota-diaria' },
    partes.join('\n\n'),
  )
}
