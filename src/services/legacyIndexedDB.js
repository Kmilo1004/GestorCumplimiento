// Lectura de los datos de la versión anterior de la app, que guardaba todo
// en IndexedDB dentro del navegador. Solo se usa para migrarlos a la bóveda
// de carpetas; la app ya no escribe aquí.

import { openDB } from 'idb'

const DB_NAME = 'cumplimiento-db'
const STORES = ['trabajos', 'funciones', 'actividades']

async function existeBaseAnterior() {
  // indexedDB.databases() evita crear una base vacía solo por preguntar.
  if (typeof indexedDB === 'undefined' || !indexedDB.databases) return false
  const bases = await indexedDB.databases()
  return bases.some((b) => b.name === DB_NAME)
}

// Devuelve { trabajos, funciones, actividades } o null si no hay nada.
export async function leerDatosAnteriores() {
  if (!(await existeBaseAnterior())) return null
  const db = await openDB(DB_NAME)
  try {
    const presentes = STORES.filter((s) => db.objectStoreNames.contains(s))
    if (presentes.length < STORES.length) return null
    const [trabajos, funciones, actividades] = await Promise.all(STORES.map((s) => db.getAll(s)))
    if (!trabajos.length && !funciones.length && !actividades.length) return null
    return { trabajos, funciones, actividades }
  } finally {
    db.close()
  }
}
