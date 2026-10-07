// Modelo de datos de la app de cumplimiento.
// Jerarquía: Trabajo -> Función -> Actividad
//
// Estas fábricas definen la "forma" de cada entidad. No dependen de
// ninguna capa de persistencia: son puro JS, para que
// tanto services/ (la bóveda de archivos Markdown) como la UI
// compartan siempre la misma forma de objeto.

export const ESTADOS = {
  PENDIENTE: 'pendiente',
  EN_PROGRESO: 'en_progreso',
  COMPLETADA: 'completada',
}

export const ESTADO_LABELS = {
  [ESTADOS.PENDIENTE]: 'Pendiente',
  [ESTADOS.EN_PROGRESO]: 'En progreso',
  [ESTADOS.COMPLETADA]: 'Completada',
}

export const ESTADO_LIST = [ESTADOS.PENDIENTE, ESTADOS.EN_PROGRESO, ESTADOS.COMPLETADA]

// Progreso "propio" de una actividad según su estado (0-100).
export const PROGRESO_POR_ESTADO = {
  [ESTADOS.PENDIENTE]: 0,
  [ESTADOS.EN_PROGRESO]: 50,
  [ESTADOS.COMPLETADA]: 100,
}

export const ALERTA = {
  VENCIDA: 'vencida',
  PROXIMA: 'proxima',
  OK: 'ok',
  COMPLETADA: 'completada',
}

export const PRIORIDADES = {
  ALTA: 'alta',
  MEDIA: 'media',
  BAJA: 'baja',
}

export const PRIORIDAD_LABELS = {
  [PRIORIDADES.ALTA]: 'Alta',
  [PRIORIDADES.MEDIA]: 'Media',
  [PRIORIDADES.BAJA]: 'Baja',
}

// De mayor a menor: sirve también para ordenar.
export const PRIORIDAD_LIST = [PRIORIDADES.ALTA, PRIORIDADES.MEDIA, PRIORIDADES.BAJA]

// Frecuencias de una actividad recurrente. '' = no se repite.
export const RECURRENCIAS = {
  SEMANAL: 'semanal',
  QUINCENAL: 'quincenal',
  MENSUAL: 'mensual',
  BIMESTRAL: 'bimestral',
  TRIMESTRAL: 'trimestral',
  SEMESTRAL: 'semestral',
  ANUAL: 'anual',
}

export const RECURRENCIA_LABELS = {
  [RECURRENCIAS.SEMANAL]: 'Semanal',
  [RECURRENCIAS.QUINCENAL]: 'Quincenal',
  [RECURRENCIAS.MENSUAL]: 'Mensual',
  [RECURRENCIAS.BIMESTRAL]: 'Bimestral',
  [RECURRENCIAS.TRIMESTRAL]: 'Trimestral',
  [RECURRENCIAS.SEMESTRAL]: 'Semestral',
  [RECURRENCIAS.ANUAL]: 'Anual',
}

export const RECURRENCIA_LIST = Object.values(RECURRENCIAS)

// Etiquetas al estilo Obsidian: sin '#', sin espacios ni comas. Se respetan
// las mayúsculas que escribió el usuario, pero "Informe" e "informe" cuentan
// como la misma (Obsidian tampoco las distingue).
// Acepta un arreglo o un texto separado por comas/espacios ("#Informe, pqrs").
export function normalizarTags(valor) {
  const lista = Array.isArray(valor) ? valor : String(valor ?? '').split(/[,\s]+/)
  const tags = lista
    .map((t) =>
      String(t ?? '')
        .trim()
        .replace(/^#+/, '')
        .replace(/[\s,#]+/g, '-'),
    )
    .filter(Boolean)
  return unicasSinMayusculas(tags)
}

export function unicasSinMayusculas(lista) {
  const vistas = new Set()
  return lista.filter((t) => {
    const clave = t.toLocaleLowerCase('es')
    if (vistas.has(clave)) return false
    vistas.add(clave)
    return true
  })
}

export function generarId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback simple por si el navegador no soporta randomUUID
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function crearTrabajo({ nombre = '', descripcion = '' } = {}) {
  const ahora = new Date().toISOString()
  return {
    id: generarId(),
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    createdAt: ahora,
    updatedAt: ahora,
  }
}

export function crearFuncion({ trabajoId, nombre = '', descripcion = '' } = {}) {
  const ahora = new Date().toISOString()
  return {
    id: generarId(),
    trabajoId,
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    createdAt: ahora,
    updatedAt: ahora,
  }
}

export function crearActividad({
  funcionId,
  nombre = '',
  descripcion = '',
  fecha_limite = '',
  estado = ESTADOS.PENDIENTE,
  notas = '',
  prioridad = PRIORIDADES.MEDIA,
  tags = [],
  recurrencia = '',
  serie = '',
} = {}) {
  const ahora = new Date().toISOString()
  return {
    id: generarId(),
    funcionId,
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    fecha_limite: fecha_limite || '',
    estado,
    notas: notas.trim(),
    prioridad: PRIORIDAD_LIST.includes(prioridad) ? prioridad : PRIORIDADES.MEDIA,
    tags: normalizarTags(tags),
    // Si es recurrente, `serie` es el nombre sin el periodo ("Informe mensual")
    // y `nombre` lo incluye ("Informe mensual 2026-10"). Ver utils/recurrencia.js.
    recurrencia: RECURRENCIA_LIST.includes(recurrencia) ? recurrencia : '',
    serie: serie.trim(),
    // Nombres de los archivos en <Función>/Evidencias/<Actividad>/. Se leen de
    // la carpeta; no se guardan en el frontmatter.
    evidencias: [],
    createdAt: ahora,
    updatedAt: ahora,
  }
}
