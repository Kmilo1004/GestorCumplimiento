// dataService: API pública de datos que usa la UI (a través de DataContext).
//
// Esta es la ÚNICA capa que la interfaz conoce. Hoy está implementada con
// IndexedDB (`indexedDB.js`). En Fase 2, cuando se agregue sincronización
// con Firebase Firestore, este archivo se puede reescribir (o convertir en
// un "router" que decida entre local/remoto) sin tocar componentes, el
// Context ni los `utils/` de cálculo, porque todos ellos solo conocen las
// firmas de las funciones exportadas aquí.

import { STORES, getAll, getByIndex, getOne, put, remove, bulkPut, clearAll } from './indexedDB'
import { crearTrabajo, crearFuncion, crearActividad } from '../models'

const EXPORT_VERSION = 1

// ---------- Trabajos ----------

export async function listarTrabajos() {
  const trabajos = await getAll(STORES.TRABAJOS)
  return trabajos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export async function obtenerTrabajo(id) {
  return getOne(STORES.TRABAJOS, id)
}

export async function crearTrabajoService(datos) {
  const trabajo = crearTrabajo(datos)
  await put(STORES.TRABAJOS, trabajo)
  return trabajo
}

export async function actualizarTrabajo(id, cambios) {
  const actual = await getOne(STORES.TRABAJOS, id)
  if (!actual) throw new Error('Trabajo no encontrado')
  const actualizado = { ...actual, ...cambios, id, updatedAt: new Date().toISOString() }
  await put(STORES.TRABAJOS, actualizado)
  return actualizado
}

export async function eliminarTrabajo(id) {
  // Cascada: elimina funciones del trabajo y actividades de esas funciones.
  const funciones = await getByIndex(STORES.FUNCIONES, 'trabajoId', id)
  for (const funcion of funciones) {
    await eliminarFuncion(funcion.id)
  }
  await remove(STORES.TRABAJOS, id)
}

// ---------- Funciones ----------

export async function listarFunciones() {
  return getAll(STORES.FUNCIONES)
}

export async function listarFuncionesPorTrabajo(trabajoId) {
  const funciones = await getByIndex(STORES.FUNCIONES, 'trabajoId', trabajoId)
  return funciones.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export async function crearFuncionService(datos) {
  const funcion = crearFuncion(datos)
  await put(STORES.FUNCIONES, funcion)
  return funcion
}

export async function actualizarFuncion(id, cambios) {
  const actual = await getOne(STORES.FUNCIONES, id)
  if (!actual) throw new Error('Función no encontrada')
  const actualizada = { ...actual, ...cambios, id, updatedAt: new Date().toISOString() }
  await put(STORES.FUNCIONES, actualizada)
  return actualizada
}

export async function eliminarFuncion(id) {
  const actividades = await getByIndex(STORES.ACTIVIDADES, 'funcionId', id)
  for (const actividad of actividades) {
    await remove(STORES.ACTIVIDADES, actividad.id)
  }
  await remove(STORES.FUNCIONES, id)
}

// ---------- Actividades ----------

export async function listarActividades() {
  return getAll(STORES.ACTIVIDADES)
}

export async function listarActividadesPorFuncion(funcionId) {
  const actividades = await getByIndex(STORES.ACTIVIDADES, 'funcionId', funcionId)
  return actividades.sort((a, b) => (a.fecha_limite || '').localeCompare(b.fecha_limite || ''))
}

export async function crearActividadService(datos) {
  const actividad = crearActividad(datos)
  await put(STORES.ACTIVIDADES, actividad)
  return actividad
}

export async function actualizarActividad(id, cambios) {
  const actual = await getOne(STORES.ACTIVIDADES, id)
  if (!actual) throw new Error('Actividad no encontrada')
  const actualizada = { ...actual, ...cambios, id, updatedAt: new Date().toISOString() }
  await put(STORES.ACTIVIDADES, actualizada)
  return actualizada
}

export async function eliminarActividad(id) {
  await remove(STORES.ACTIVIDADES, id)
}

// ---------- Carga completa ----------

// Trae las tres colecciones de una sola vez; DataContext arma el árbol.
export async function cargarTodo() {
  const [trabajos, funciones, actividades] = await Promise.all([
    listarTrabajos(),
    listarFunciones(),
    listarActividades(),
  ])
  return { trabajos, funciones, actividades }
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

// modo: 'reemplazar' borra todo lo existente antes de importar.
// modo: 'combinar' hace upsert por id sobre lo que ya existe.
export async function importarDatos(data, { modo = 'reemplazar' } = {}) {
  validarBackup(data)

  if (modo === 'reemplazar') {
    await clearAll()
  }

  await bulkPut(STORES.TRABAJOS, data.trabajos)
  await bulkPut(STORES.FUNCIONES, data.funciones)
  await bulkPut(STORES.ACTIVIDADES, data.actividades)

  return cargarTodo()
}
