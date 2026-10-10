// Copias de respaldo de la bóveda en otra carpeta (ver
// docs/adr/0004-copias-de-respaldo.md).
//
//   <destino>/<Bóveda>/2026-10-09 15-30/            ← una copia completa
//   <destino>/<Bóveda>/2026-10-09 15-30/.respaldo-completo.json
//
// Funciona sobre la interfaz de sistema de archivos (services/fs) tanto para
// la bóveda como para el destino, así que sirve igual en el navegador, en
// las pruebas (memoria) y en Tauri.

import { FRECUENCIAS_RESPALDO as F, RESPALDOS_A_CONSERVAR } from '../../models'
import { joinPath, nombreSeguro } from '../fs/paths'
import { rutaDisponible } from '../fs/fsUtils'

const HORAS = { [F.DOCE_HORAS]: 12, [F.DIARIA]: 24, [F.SEMANAL]: 24 * 7 }
// Margen para que la copia "diaria" no se corra unos minutos cada día.
const TOLERANCIA_MS = 5 * 60_000

export const ARCHIVO_MARCA = '.respaldo-completo.json'
// Lo eliminado no se respalda.
const EXCLUIDAS = new Set(['.papelera'])

const dos = (n) => String(n).padStart(2, '0')

// "2026-10-09 15-30" en hora local (Windows no admite ":" en nombres).
export function selloDeRespaldo(fecha) {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())} ${dos(fecha.getHours())}-${dos(
    fecha.getMinutes(),
  )}`
}

export function tocaRespaldo(ultimaFechaISO, frecuencia, ahora = new Date()) {
  const horas = HORAS[frecuencia]
  if (!horas) return false
  if (!ultimaFechaISO) return true
  const ultima = new Date(ultimaFechaISO).getTime()
  if (Number.isNaN(ultima)) return true
  return ahora.getTime() - ultima >= horas * 3_600_000 - TOLERANCIA_MS
}

async function leerMarca(destinoFs, carpeta) {
  const texto = await destinoFs.readFile(joinPath(carpeta, ARCHIVO_MARCA))
  if (texto === null) return null
  try {
    const marca = JSON.parse(texto)
    return marca && typeof marca.creadoEn === 'string' ? marca : null
  } catch {
    return null
  }
}

// Copias de la bóveda en el destino, la más reciente primero. Las que no
// tienen marca (se cortaron a la mitad) vienen con `completa: false`.
export async function listarRespaldos(destinoFs, nombreBoveda) {
  const base = nombreSeguro(nombreBoveda)
  const carpetas = ((await destinoFs.listDir(base)) ?? []).filter((e) => e.kind === 'directory')
  const respaldos = await Promise.all(
    carpetas.map(async ({ name }) => {
      const carpeta = joinPath(base, name)
      const marca = await leerMarca(destinoFs, carpeta)
      return {
        carpeta,
        nombre: name,
        completa: Boolean(marca),
        creadoEn: marca?.creadoEn ?? null,
        archivos: marca?.archivos ?? 0,
        fallidos: marca?.fallidos ?? [],
      }
    }),
  )
  return respaldos.sort((a, b) => b.nombre.localeCompare(a.nombre))
}

export async function ultimoRespaldo(destinoFs, nombreBoveda) {
  return (await listarRespaldos(destinoFs, nombreBoveda)).find((r) => r.completa) ?? null
}

// Copia recursiva. Un archivo que falla (p. ej. ruta demasiado larga) se
// anota y la copia sigue con los demás.
async function copiar(origenFs, destinoFs, ruta, carpetaDestino, resultado) {
  const entradas = (await origenFs.listDir(ruta)) ?? []
  for (const { name, kind } of entradas) {
    if (!ruta && EXCLUIDAS.has(name)) continue
    const relativa = joinPath(ruta, name)
    if (kind === 'directory') {
      await copiar(origenFs, destinoFs, relativa, carpetaDestino, resultado)
      continue
    }
    try {
      const contenido = await origenFs.readBlob(relativa)
      if (contenido === null) continue
      await destinoFs.writeFile(joinPath(carpetaDestino, relativa), contenido)
      resultado.archivos++
    } catch (err) {
      console.error(`No se pudo respaldar ${relativa}:`, err)
      resultado.fallidos.push(relativa)
    }
  }
}

// Borra las copias más viejas: quedan las `conservar` completas más
// recientes. Las incompletas (cortadas) se borran siempre.
async function podar(destinoFs, nombreBoveda, conservar, actual) {
  const respaldos = await listarRespaldos(destinoFs, nombreBoveda)
  let completas = 0
  for (const r of respaldos) {
    if (r.carpeta === actual) {
      completas++
      continue
    }
    if (r.completa && ++completas <= conservar) continue
    await destinoFs.remove(r.carpeta)
  }
}

// Hace una copia completa de la bóveda en el destino. Devuelve
// { carpeta, creadoEn, archivos, fallidos }.
export async function crearRespaldo(
  origenFs,
  destinoFs,
  { nombreBoveda, ahora = new Date(), conservar = RESPALDOS_A_CONSERVAR },
) {
  const base = nombreSeguro(nombreBoveda)
  const carpeta = await rutaDisponible(destinoFs, base, selloDeRespaldo(ahora))
  await destinoFs.mkdir(carpeta)
  const resultado = { archivos: 0, fallidos: [] }
  await copiar(origenFs, destinoFs, '', carpeta, resultado)
  const marca = { app: 'app-cumplimiento', creadoEn: ahora.toISOString(), ...resultado }
  // La marca va al final: si la copia se corta, la carpeta queda sin marca y
  // no cuenta como respaldo válido.
  await destinoFs.writeFile(joinPath(carpeta, ARCHIVO_MARCA), `${JSON.stringify(marca, null, 2)}\n`)
  await podar(destinoFs, nombreBoveda, conservar, carpeta)
  return { carpeta, creadoEn: marca.creadoEn, archivos: resultado.archivos, fallidos: resultado.fallidos }
}
