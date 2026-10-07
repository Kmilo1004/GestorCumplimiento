// Operaciones compuestas que funcionan sobre cualquier implementación de la
// interfaz de sistema de archivos (ver memoryFs.js).

import { joinPath } from './paths'

// Mueve (o renombra) un archivo o una carpeta completa. La File System Access
// API no tiene un "move" de carpetas confiable, así que se copia y luego se
// borra el original. Copia con copyFile para no dañar adjuntos binarios.
export async function moveEntry(fs, origen, destino) {
  if (joinPath(origen) === joinPath(destino)) return
  // En Windows "acta.md" y "Acta.md" son el mismo archivo: copiar y borrar
  // eliminaría el contenido. Se pasa primero por un nombre temporal.
  if (mismaRuta(origen, destino)) {
    const temporal = `${joinPath(destino)}.tmp-${Date.now()}`
    await moveEntry(fs, origen, temporal)
    await moveEntry(fs, temporal, destino)
    return
  }
  const entradas = await fs.listDir(origen)
  if (entradas === null) {
    await fs.copyFile(origen, destino)
  } else {
    await copiarCarpeta(fs, origen, destino, entradas)
  }
  await fs.remove(origen)
}

async function copiarCarpeta(fs, origen, destino, entradas) {
  await fs.mkdir(destino)
  for (const { name, kind } of entradas) {
    const o = joinPath(origen, name)
    const d = joinPath(destino, name)
    if (kind === 'directory') {
      await copiarCarpeta(fs, o, d, await fs.listDir(o))
    } else {
      await fs.copyFile(o, d)
    }
  }
}

// Compara rutas sin distinguir mayúsculas (como lo hace Windows).
export function mismaRuta(a, b) {
  return joinPath(a).toLocaleLowerCase('es') === joinPath(b).toLocaleLowerCase('es')
}

// Devuelve una ruta libre: "Base", "Base (2)", "Base (3)"…
// `extension` incluye el punto (".md") o es '' para carpetas.
export async function rutaDisponible(fs, carpeta, base, extension = '', ignorar = null) {
  for (let n = 1; ; n++) {
    const nombre = n === 1 ? `${base}${extension}` : `${base} (${n})${extension}`
    const ruta = joinPath(carpeta, nombre)
    if ((ignorar && mismaRuta(ruta, ignorar)) || !(await fs.exists(ruta))) return ruta
  }
}
