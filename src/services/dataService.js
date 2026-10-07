// dataService: API pública de datos que usa la UI (a través de DataContext).
//
// Esta es la ÚNICA capa que la interfaz conoce. Los datos viven en una
// bóveda de carpetas con archivos Markdown (ver
// docs/adr/0001-persistencia-en-boveda-de-carpetas.md). El acceso a disco
// está detrás de la interfaz de `services/fs`, así que pasar a Tauri solo
// requiere otra implementación de esa interfaz, no cambios aquí ni en la UI.

import { crearActividad, crearFuncion, crearTrabajo } from '../models'
import { createWebFs } from './fs/webFs'
import { createVaultRepository } from './vault/vaultRepository'

// Selección de la carpeta y migración: se exponen aquí para que el Context
// no dependa de los módulos internos de services/.
export {
  carpetaGuardada,
  elegirCarpeta,
  estadoPermiso,
  guardarConfig,
  leerConfig,
  navegadorCompatible,
  pedirPermiso,
} from './vault/vaultHandle'
export { leerDatosAnteriores } from './legacyIndexedDB'

const EXPORT_VERSION = 1

let repo = null

// Conecta la bóveda (carpeta elegida por el usuario) como almacenamiento.
export function conectarBoveda(directoryHandle) {
  repo = createVaultRepository(createWebFs(directoryHandle))
}

function repositorio() {
  if (!repo) throw new Error('No hay una bóveda abierta.')
  return repo
}

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es')

// ---------- Carga completa ----------

// Trae las tres colecciones; DataContext arma el árbol. Con `recargar` vuelve
// a leer las carpetas para reflejar cambios hechos fuera de la app.
export async function cargarTodo({ recargar = false } = {}) {
  const { trabajos, funciones, actividades } = await repositorio().cargar({ recargar })
  return {
    trabajos: trabajos.sort(porNombre),
    funciones: funciones.sort(porNombre),
    actividades: actividades.sort((a, b) => (a.fecha_limite || '').localeCompare(b.fecha_limite || '')),
  }
}

async function actualizar(tipo, guardar, id, cambios, mensaje) {
  const actual = await repositorio().obtener(tipo, id)
  if (!actual) throw new Error(mensaje)
  return guardar({ ...actual, ...cambios, id, updatedAt: new Date().toISOString() })
}

// ---------- Trabajos ----------

export function crearTrabajoService(datos) {
  return repositorio().guardarTrabajo(crearTrabajo(datos))
}

export function actualizarTrabajo(id, cambios) {
  return actualizar('trabajo', repositorio().guardarTrabajo, id, cambios, 'Trabajo no encontrado')
}

export function eliminarTrabajo(id) {
  return repositorio().eliminarTrabajo(id)
}

// ---------- Funciones ----------

export function crearFuncionService(datos) {
  return repositorio().guardarFuncion(crearFuncion(datos))
}

export function actualizarFuncion(id, cambios) {
  return actualizar('funcion', repositorio().guardarFuncion, id, cambios, 'Función no encontrada')
}

export function eliminarFuncion(id) {
  return repositorio().eliminarFuncion(id)
}

// ---------- Actividades ----------

export function crearActividadService(datos) {
  return repositorio().guardarActividad(crearActividad(datos))
}

export function actualizarActividad(id, cambios) {
  return actualizar('actividad', repositorio().guardarActividad, id, cambios, 'Actividad no encontrada')
}

export function eliminarActividad(id) {
  return repositorio().eliminarActividad(id)
}

// ---------- Backup: exportar / importar JSON ----------

export async function exportarDatos() {
  const { trabajos, funciones, actividades } = await cargarTodo()
  return {
    app: 'app-cumplimiento',
    version: EXPORT_VERSION,
    exportadoEn: new Date().toISOString(),
    trabajos,
    funciones,
    actividades,
  }
}

function validarBackup(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('El archivo no tiene un formato JSON válido.')
  }
  const { trabajos, funciones, actividades } = data
  if (!Array.isArray(trabajos) || !Array.isArray(funciones) || !Array.isArray(actividades)) {
    throw new Error('El archivo no corresponde a un backup de esta app (faltan trabajos/funciones/actividades).')
  }
}

// modo: 'reemplazar' mueve todo lo existente a la papelera antes de importar.
// modo: 'combinar' agrega o actualiza por id sobre lo que ya existe.
// También sirve para migrar los datos de la versión anterior (IndexedDB).
// Devuelve cuántos elementos se omitieron por no tener a qué padre pertenecer.
export async function importarDatos(data, { modo = 'reemplazar' } = {}) {
  validarBackup(data)
  const r = repositorio()

  if (modo === 'reemplazar') await r.vaciar()

  const actual = await r.cargar()
  const trabajoIds = new Set(actual.trabajos.map((t) => t.id))
  const funcionIds = new Set(actual.funciones.map((f) => f.id))
  let omitidos = 0

  for (const t of data.trabajos) {
    await r.guardarTrabajo({ ...crearTrabajo(t), ...t })
    trabajoIds.add(t.id)
  }
  for (const f of data.funciones) {
    if (!trabajoIds.has(f.trabajoId)) {
      omitidos++
      continue
    }
    await r.guardarFuncion({ ...crearFuncion(f), ...f })
    funcionIds.add(f.id)
  }
  for (const a of data.actividades) {
    if (!funcionIds.has(a.funcionId)) {
      omitidos++
      continue
    }
    await r.guardarActividad({ ...crearActividad(a), ...a })
  }

  return { omitidos }
}
