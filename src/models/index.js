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

// ---------- Campos personalizados ----------
// El usuario define campos extra (en Configuración) que se guardan en el
// frontmatter de cada archivo: `radicado: RAD-2026-001`. Las definiciones
// viven en la bóveda, en .cumplimiento/campos.json.

export const TIPOS_CAMPO = {
  TEXTO: 'texto',
  NUMERO: 'numero',
  FECHA: 'fecha',
  LISTA: 'lista',
}

export const TIPO_CAMPO_LABELS = {
  [TIPOS_CAMPO.TEXTO]: 'Texto',
  [TIPOS_CAMPO.NUMERO]: 'Número',
  [TIPOS_CAMPO.FECHA]: 'Fecha',
  [TIPOS_CAMPO.LISTA]: 'Lista de opciones',
}

export const TIPO_CAMPO_LIST = Object.values(TIPOS_CAMPO)

export const ENTIDADES = ['trabajo', 'funcion', 'actividad']

export const ENTIDAD_LABELS = {
  trabajo: 'Trabajos',
  funcion: 'Funciones',
  actividad: 'Actividades',
}

// Claves de frontmatter que ya usa la app (o Obsidian). Un campo
// personalizado con una de estas claves se perdería en cada guardado.
export const CLAVES_RESERVADAS = [
  'id',
  'tipo',
  'estado',
  'prioridad',
  'fecha_limite',
  'tags',
  'tag',
  'recurrencia',
  'serie',
  'createdat',
  'updatedat',
  'aliases',
  'alias',
  'cssclasses',
  'nombre',
  'descripcion',
  'notas',
]

export function esClaveReservada(clave) {
  return CLAVES_RESERVADAS.includes(String(clave ?? '').toLowerCase())
}

// "Código de contrato" -> "codigo_de_contrato": sirve como clave de YAML.
export function claveDeCampo(etiqueta) {
  return String(etiqueta ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// Deja una definición con forma válida (tolera campos.json editado a mano).
// Devuelve null si no se puede usar.
export function normalizarDefinicionCampo(def) {
  if (!def || typeof def !== 'object') return null
  const clave = claveDeCampo(def.clave || def.etiqueta)
  if (!clave || esClaveReservada(clave)) return null
  const tipo = TIPO_CAMPO_LIST.includes(def.tipo) ? def.tipo : TIPOS_CAMPO.TEXTO
  const aplicaA = (Array.isArray(def.aplicaA) ? def.aplicaA : []).filter((e) => ENTIDADES.includes(e))
  const opciones = Array.isArray(def.opciones)
    ? [...new Set(def.opciones.map((o) => String(o ?? '').trim()).filter(Boolean))]
    : []
  return {
    clave,
    etiqueta: String(def.etiqueta ?? '').trim() || clave,
    tipo,
    aplicaA: aplicaA.length ? aplicaA : ['actividad'],
    opciones: tipo === TIPOS_CAMPO.LISTA ? opciones : [],
  }
}

// Normaliza la lista completa y descarta claves repetidas (gana la primera).
export function normalizarDefinicionesCampos(lista) {
  const vistas = new Set()
  const resultado = []
  for (const def of Array.isArray(lista) ? lista : []) {
    const normal = normalizarDefinicionCampo(def)
    if (!normal || vistas.has(normal.clave)) continue
    vistas.add(normal.clave)
    resultado.push(normal)
  }
  return resultado
}

function copiarCampos(valores) {
  return valores && typeof valores === 'object' && !Array.isArray(valores) ? { ...valores } : {}
}

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

export function crearTrabajo({ nombre = '', descripcion = '', camposPersonalizados = {} } = {}) {
  const ahora = new Date().toISOString()
  return {
    id: generarId(),
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    camposPersonalizados: copiarCampos(camposPersonalizados),
    createdAt: ahora,
    updatedAt: ahora,
  }
}

export function crearFuncion({ trabajoId, nombre = '', descripcion = '', camposPersonalizados = {} } = {}) {
  const ahora = new Date().toISOString()
  return {
    id: generarId(),
    trabajoId,
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    camposPersonalizados: copiarCampos(camposPersonalizados),
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
  camposPersonalizados = {},
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
    // { clave: valor } de los campos definidos en Configuración.
    camposPersonalizados: copiarCampos(camposPersonalizados),
    createdAt: ahora,
    updatedAt: ahora,
  }
}
