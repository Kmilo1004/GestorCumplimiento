// Conversión entre entidades (Trabajo, Función, Actividad) y archivos
// Markdown con frontmatter YAML, compatibles con Obsidian.
//
//   ---
//   id: 3f2a…
//   tipo: actividad
//   estado: pendiente
//   fecha_limite: 2026-10-15
//   createdAt: …
//   updatedAt: …
//   ---
//   Descripción libre de la actividad.
//
//   ## Notas
//
//   Notas libres.
//
// El nombre NO va en el archivo: es el nombre del archivo o de la carpeta.

import { parse, stringify } from 'yaml'
import {
  ESTADO_LIST,
  ESTADOS,
  PRIORIDAD_LIST,
  PRIORIDADES,
  RECURRENCIA_LIST,
  normalizarTags,
} from '../../models'

// El bloque puede estar vacío ('---\n---'), como lo deja Obsidian al quitar propiedades.
const FRONTMATTER = /^---\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/
const ENCABEZADO_NOTAS = /^##[ \t]+Notas[ \t]*$/im
// Si la descripción contiene su propio "## Notas" se escapa como "\## Notas"
// (Markdown lo muestra como texto) para no confundirlo con la sección.
const NOTAS_EN_DESCRIPCION = /^(##[ \t]+Notas[ \t]*)$/gim
const NOTAS_ESCAPADO = /^\\(##[ \t]+Notas[ \t]*)$/gim

// Separa un archivo en { frontmatter (objeto), cuerpo (texto) }.
// Un frontmatter inválido no rompe la lectura: se trata como vacío.
export function separarFrontmatter(texto = '') {
  const limpio = texto.replace(/^\uFEFF/, '')
  const match = limpio.match(FRONTMATTER)
  if (!match) return { frontmatter: {}, cuerpo: limpio }
  let frontmatter = {}
  try {
    const datos = parse(match[1] ?? '')
    if (datos && typeof datos === 'object' && !Array.isArray(datos)) frontmatter = datos
  } catch {
    // YAML mal formado (editado a mano): se ignora el bloque.
  }
  return { frontmatter, cuerpo: limpio.slice(match[0].length) }
}

export function unirFrontmatter(frontmatter, cuerpo = '') {
  const yaml = stringify(frontmatter, { lineWidth: 0 }).trimEnd()
  const texto = cuerpo.replace(/^\s*\n/, '')
  return `---\n${yaml}\n---\n${texto ? `${texto.trimEnd()}\n` : ''}`
}

// Reemplaza solo el frontmatter conservando el cuerpo tal cual y las claves
// que la app no conoce (tags, aliases… que el usuario agregue en Obsidian).
export function actualizarFrontmatter(texto, cambios) {
  const { frontmatter, cuerpo } = separarFrontmatter(texto)
  return unirFrontmatter({ ...frontmatter, ...cambios }, cuerpo)
}

function texto(valor) {
  if (valor === null || valor === undefined) return ''
  if (valor instanceof Date) return valor.toISOString()
  return String(valor)
}

function fecha(valor) {
  if (valor instanceof Date) return valor.toISOString().slice(0, 10)
  const t = texto(valor).trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : ''
}

// ---------- Trabajo / Función: el cuerpo es la descripción ----------

export function leerContenedor(textoArchivo) {
  const { frontmatter, cuerpo } = separarFrontmatter(textoArchivo)
  return {
    frontmatter,
    datos: {
      id: texto(frontmatter.id),
      descripcion: cuerpo.trim(),
      createdAt: texto(frontmatter.createdAt),
      updatedAt: texto(frontmatter.updatedAt),
    },
  }
}

export function escribirContenedor(tipo, entidad, textoAnterior = '') {
  const { frontmatter } = separarFrontmatter(textoAnterior)
  return unirFrontmatter(
    {
      ...frontmatter,
      id: entidad.id,
      tipo,
      createdAt: entidad.createdAt,
      updatedAt: entidad.updatedAt,
    },
    entidad.descripcion || '',
  )
}

// ---------- Actividad: descripción + sección "## Notas" ----------

export function leerActividad(textoArchivo) {
  const { frontmatter, cuerpo } = separarFrontmatter(textoArchivo)
  const match = cuerpo.match(ENCABEZADO_NOTAS)
  const descripcion = match ? cuerpo.slice(0, match.index) : cuerpo
  const notas = match ? cuerpo.slice(match.index + match[0].length) : ''
  const estado = ESTADO_LIST.includes(frontmatter.estado) ? frontmatter.estado : ESTADOS.PENDIENTE
  const prioridad = PRIORIDAD_LIST.includes(frontmatter.prioridad) ? frontmatter.prioridad : PRIORIDADES.MEDIA
  const recurrencia = RECURRENCIA_LIST.includes(frontmatter.recurrencia) ? frontmatter.recurrencia : ''
  return {
    frontmatter,
    datos: {
      id: texto(frontmatter.id),
      descripcion: descripcion.replace(NOTAS_ESCAPADO, '$1').trim(),
      fecha_limite: fecha(frontmatter.fecha_limite),
      estado,
      notas: notas.trim(),
      prioridad,
      // Obsidian acepta `tags` como lista o como texto ("a, b"); también "tag".
      tags: normalizarTags(frontmatter.tags ?? frontmatter.tag ?? []),
      recurrencia,
      serie: recurrencia ? texto(frontmatter.serie).trim() : '',
      createdAt: texto(frontmatter.createdAt),
      updatedAt: texto(frontmatter.updatedAt),
    },
  }
}

export function escribirActividad(actividad, textoAnterior = '') {
  const { frontmatter } = separarFrontmatter(textoAnterior)
  const partes = []
  if (actividad.descripcion) partes.push(actividad.descripcion.trim().replace(NOTAS_EN_DESCRIPCION, '\\$1'))
  partes.push(`## Notas${actividad.notas ? `\n\n${actividad.notas.trim()}` : ''}`)
  const tags = normalizarTags(actividad.tags)
  const { tag: _tagAntiguo, ...resto } = frontmatter
  // Las claves opcionales vacías se quitan (undefined no se escribe en YAML):
  // si el usuario borra las etiquetas en la app, también desaparecen del archivo.
  return unirFrontmatter(
    {
      ...resto,
      id: actividad.id,
      tipo: 'actividad',
      estado: actividad.estado,
      prioridad: actividad.prioridad || PRIORIDADES.MEDIA,
      fecha_limite: actividad.fecha_limite || '',
      tags: tags.length ? tags : undefined,
      recurrencia: actividad.recurrencia || undefined,
      serie: actividad.recurrencia && actividad.serie ? actividad.serie : undefined,
      createdAt: actividad.createdAt,
      updatedAt: actividad.updatedAt,
    },
    partes.join('\n\n'),
  )
}
