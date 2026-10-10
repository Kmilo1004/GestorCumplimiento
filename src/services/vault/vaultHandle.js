// Recuerda qué carpeta eligió el usuario como bóveda.
//
// La File System Access API entrega un FileSystemDirectoryHandle que se puede
// guardar en IndexedDB (no en localStorage). Al volver a abrir la app el
// navegador conserva el handle, pero pide confirmar el permiso con un clic.

import { openDB } from 'idb'

const DB_NAME = 'cumplimiento-config'
const STORE = 'kv'
const CLAVE_BOVEDA = 'boveda'

let dbPromise = null
function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE)
      },
    })
  }
  return dbPromise
}

export async function leerConfig(clave) {
  return (await getDB()).get(STORE, clave)
}

export async function guardarConfig(clave, valor) {
  await (await getDB()).put(STORE, valor, clave)
}

export function navegadorCompatible() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

// Abre el selector de carpetas. Debe llamarse desde un clic del usuario.
export async function elegirCarpeta() {
  const handle = await window.showDirectoryPicker({ id: 'boveda-cumplimiento', mode: 'readwrite' })
  await guardarConfig(CLAVE_BOVEDA, handle)
  return handle
}

export async function carpetaGuardada() {
  return (await leerConfig(CLAVE_BOVEDA)) ?? null
}

// ---------- Carpeta de destino de las copias de respaldo ----------

const CLAVE_RESPALDO = 'respaldoDestino'

// Abre el selector. No guarda nada: quien llama valida la carpeta primero.
// Debe llamarse desde un clic del usuario.
export function elegirCarpetaRespaldo() {
  return window.showDirectoryPicker({ id: 'respaldo-cumplimiento', mode: 'readwrite' })
}

export async function guardarCarpetaRespaldo(handle) {
  await guardarConfig(CLAVE_RESPALDO, handle)
}

export async function carpetaRespaldoGuardada() {
  return (await leerConfig(CLAVE_RESPALDO)) ?? null
}

// ¿Una carpeta está dentro de la otra (o es la misma)?
export async function carpetasSeCruzan(a, b) {
  if (await a.isSameEntry(b)) return true
  return (await a.resolve(b)) !== null || (await b.resolve(a)) !== null
}

// 'granted' | 'prompt' | 'denied'
export async function estadoPermiso(handle) {
  return handle.queryPermission({ mode: 'readwrite' })
}

// Debe llamarse desde un clic del usuario.
export async function pedirPermiso(handle) {
  return handle.requestPermission({ mode: 'readwrite' })
}
