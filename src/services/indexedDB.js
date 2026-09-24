// Capa de acceso a datos de bajo nivel (Fase 1: IndexedDB).
//
// IMPORTANTE: nada de este archivo debe importarse directamente desde
// componentes de UI. La UI habla únicamente con `dataService.js`, que en
// Fase 2 podrá reemplazar esta implementación por Firebase Firestore sin
// que el resto de la app se entere.

import { openDB } from 'idb'

export const DB_NAME = 'cumplimiento-db'
export const DB_VERSION = 1

export const STORES = {
  TRABAJOS: 'trabajos',
  FUNCIONES: 'funciones',
  ACTIVIDADES: 'actividades',
}

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.TRABAJOS)) {
          db.createObjectStore(STORES.TRABAJOS, { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains(STORES.FUNCIONES)) {
          const funciones = db.createObjectStore(STORES.FUNCIONES, { keyPath: 'id' })
          funciones.createIndex('trabajoId', 'trabajoId')
        }

        if (!db.objectStoreNames.contains(STORES.ACTIVIDADES)) {
          const actividades = db.createObjectStore(STORES.ACTIVIDADES, { keyPath: 'id' })
          actividades.createIndex('funcionId', 'funcionId')
          actividades.createIndex('estado', 'estado')
          actividades.createIndex('fecha_limite', 'fecha_limite')
        }
      },
    })
  }
  return dbPromise
}

// --- Operaciones genéricas reutilizables por cualquier store ---

export async function getAll(store) {
  const db = await getDB()
  return db.getAll(store)
}

export async function getByIndex(store, indexName, value) {
  const db = await getDB()
  return db.getAllFromIndex(store, indexName, value)
}

export async function getOne(store, id) {
  const db = await getDB()
  return db.get(store, id)
}

export async function put(store, value) {
  const db = await getDB()
  await db.put(store, value)
  return value
}

export async function bulkPut(store, values) {
  if (!values?.length) return
  const db = await getDB()
  const tx = db.transaction(store, 'readwrite')
  await Promise.all([...values.map((v) => tx.store.put(v)), tx.done])
}

export async function remove(store, id) {
  const db = await getDB()
  await db.delete(store, id)
}

export async function clearStore(store) {
  const db = await getDB()
  await db.clear(store)
}

export async function clearAll() {
  const db = await getDB()
  const tx = db.transaction(Object.values(STORES), 'readwrite')
  await Promise.all([
    ...Object.values(STORES).map((s) => tx.objectStore(s).clear()),
    tx.done,
  ])
}
