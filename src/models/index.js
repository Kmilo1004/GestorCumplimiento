// Modelo de datos de la app de cumplimiento.
// Jerarquía: Trabajo -> Función -> Actividad
//
// Estas fábricas definen la "forma" de cada entidad. No dependen de
// IndexedDB ni de ninguna capa de persistencia: son puro JS, para que
// tanto services/ (Fase 1: IndexedDB, Fase 2: Firestore) como la UI
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

function generarId() {
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
    createdAt: ahora,
    updatedAt: ahora,
  }
}
